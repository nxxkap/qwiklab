import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { spawnSync } from "node:child_process";

const mode = process.argv[2];
const allowedModes = new Set(["vite", "tsdown", "vp"]);

if (!allowedModes.has(mode)) {
  throw new Error(
    `Usage: bun run scripts/verify-packed-consumer.mjs <${[...allowedModes].join("|")}>`,
  );
}

const root = new URL("..", import.meta.url).pathname;
const libRoot = join(root, "packages/qwik-lib");
const sourceConsumerRoot = join(root, "apps/consumer");
const sourceBaseTsconfig = join(root, "tsconfig.base.json");
const tarballDir = join(root, "tmp/tarballs");
const packedRoot = join("/private/tmp", `qwik-tsdown-packed-consumer-${mode}`);
const verifyMismatch = process.env.VERIFY_QWIK_MISMATCH === "1";
const mismatchVersion = verifyMismatch ? process.env.QWIK_CONSUMER_VERSION : undefined;

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    stdio: "pipe",
    ...options,
  });

  if (result.stdout) {
    process.stdout.write(result.stdout);
  }
  if (result.stderr) {
    process.stderr.write(result.stderr);
  }

  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed with ${result.status}`);
  }

  return result;
}

function parseVersion(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/.exec(version);
  if (!match) {
    throw new Error(`Invalid semver version: ${version}`);
  }
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
}

function compareVersions(left, right) {
  return left.major - right.major || left.minor - right.minor || left.patch - right.patch;
}

function assertCompatibleMismatch(packageJson) {
  if (!verifyMismatch) {
    return;
  }
  if (!mismatchVersion) {
    throw new Error("QWIK_CONSUMER_VERSION is required for mismatch verification");
  }

  const currentVersion = packageJson.devDependencies?.["@builder.io/qwik"];
  const peerRange = packageJson.peerDependencies?.["@builder.io/qwik"];

  if (typeof currentVersion !== "string") {
    throw new Error("Library package must declare @builder.io/qwik as a devDependency");
  }
  if (typeof peerRange !== "string" || !peerRange.startsWith("^")) {
    throw new Error("Mismatch verification currently supports caret Qwik peer ranges only");
  }

  const current = parseVersion(currentVersion);
  const candidate = parseVersion(mismatchVersion);
  const peerBase = parseVersion(peerRange.slice(1));

  if (candidate.major === current.major && candidate.minor === current.minor) {
    throw new Error(
      `QWIK_CONSUMER_VERSION must use a different minor than ${currentVersion}`,
    );
  }
  if (
    candidate.major !== peerBase.major ||
    compareVersions(candidate, peerBase) < 0
  ) {
    throw new Error(
      `QWIK_CONSUMER_VERSION ${mismatchVersion} is outside peer range ${peerRange}`,
    );
  }
}

await mkdir(tarballDir, { recursive: true });

const libPackage = JSON.parse(await readFile(join(libRoot, "package.json"), "utf8"));
assertCompatibleMismatch(libPackage);

run("bun", ["run", "--cwd", libRoot, `build:${mode}`]);
run("bun", ["run", "--cwd", libRoot, "validate"]);

const pack = run("bun", ["pm", "pack", "--destination", tarballDir, "--quiet"], {
  cwd: libRoot,
});
const tarballName = pack.stdout
  .trim()
  .split(/\r?\n/)
  .map((line) => line.trim())
  .find((line) => line.endsWith(".tgz"));

if (!tarballName) {
  throw new Error("bun pm pack did not report a tarball path");
}

const tarballPath = join(tarballDir, basename(tarballName));

await rm(packedRoot, { recursive: true, force: true });
await mkdir(packedRoot, { recursive: true });
await cp(sourceConsumerRoot, packedRoot, {
  recursive: true,
  filter(source) {
    return ![
      "node_modules",
      "dist",
      "server",
      ".tsbuildinfo",
    ].some((part) => source.split("/").includes(part));
  },
});
await cp(sourceBaseTsconfig, join(packedRoot, "tsconfig.base.json"));

const consumerTsconfigPath = join(packedRoot, "tsconfig.json");
const consumerTsconfig = JSON.parse(await readFile(consumerTsconfigPath, "utf8"));
consumerTsconfig.extends = "./tsconfig.base.json";
await writeFile(consumerTsconfigPath, `${JSON.stringify(consumerTsconfig, null, 2)}\n`);

const consumerPackagePath = join(packedRoot, "package.json");
const consumerPackage = JSON.parse(await readFile(consumerPackagePath, "utf8"));
consumerPackage.name = `@poc/packed-consumer-${mode}`;
consumerPackage.packageManager = "bun@1.3.14";
consumerPackage.dependencies = {
  ...consumerPackage.dependencies,
  "@poc/qwik-lib": `file:${tarballPath}`,
};
if (mismatchVersion) {
  consumerPackage.devDependencies = {
    ...consumerPackage.devDependencies,
    "@builder.io/qwik": mismatchVersion,
    "@builder.io/qwik-city": mismatchVersion,
  };
}
consumerPackage.trustedDependencies = [
  "@parcel/watcher",
  "esbuild",
  "playwright",
  "sharp",
];
await writeFile(consumerPackagePath, `${JSON.stringify(consumerPackage, null, 2)}\n`);

run("bun", ["install"], { cwd: packedRoot });
run("bun", ["run", "check"], { cwd: packedRoot });
run("bun", ["run", "build"], { cwd: packedRoot });
run("bun", ["run", "build.preview"], { cwd: packedRoot });
run("bun", ["run", "test:ssr"], { cwd: packedRoot });
run("bun", ["run", "test:browser"], { cwd: packedRoot });

console.log(
  JSON.stringify(
    {
      mode,
      qwikConsumerVersion:
        mismatchVersion ?? consumerPackage.devDependencies?.["@builder.io/qwik"],
      tarballPath,
      packedConsumerRoot: packedRoot,
      result: "ok",
    },
    null,
    2,
  ),
);
