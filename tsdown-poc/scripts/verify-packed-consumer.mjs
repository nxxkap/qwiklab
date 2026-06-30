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

await mkdir(tarballDir, { recursive: true });

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
      tarballPath,
      packedConsumerRoot: packedRoot,
      result: "ok",
    },
    null,
    2,
  ),
);
