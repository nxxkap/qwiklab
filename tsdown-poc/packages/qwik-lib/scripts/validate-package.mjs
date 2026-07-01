import { mkdir, readFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const tarballDir = join(root, "../../tmp/tarballs");
const packageJson = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
const qwikPeerRange = packageJson.peerDependencies?.["@builder.io/qwik"];
const publicExports = [
  ["root", "@poc/qwik-lib", ["LazyCounter", "LibraryShowcase"]],
  [
    "components",
    "@poc/qwik-lib/components",
    [
      "AssetBadge",
      "ComplexActionButton",
      "LibraryMetric",
      "LibraryShowcase",
      "ProjectedPanel",
    ],
  ],
  ["context", "@poc/qwik-lib/context", ["LibraryProvider", "LibraryThemeContext"]],
  ["server", "@poc/qwik-lib/server", ["getLibraryServerBoundaryInfo"]],
];

if (typeof qwikPeerRange !== "string" || qwikPeerRange.length === 0) {
  throw new Error("package.json must declare @builder.io/qwik as a peerDependency");
}

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

function checkPublicExport([label, specifier, expectedNames]) {
  run("node", [
    "--input-type=module",
    "-e",
    `
      const mod = await import(${JSON.stringify(specifier)});
      const missing = ${JSON.stringify(expectedNames)}.filter((name) => !(name in mod));
      if (missing.length > 0) {
        throw new Error(${JSON.stringify(label)} + " export is missing: " + missing.join(", "));
      }
    `,
  ]);

  run("node", [
    "-e",
    `
      const mod = require(${JSON.stringify(specifier)});
      const missing = ${JSON.stringify(expectedNames)}.filter((name) => !(name in mod));
      if (missing.length > 0) {
        throw new Error(${JSON.stringify(label)} + " require export is missing: " + missing.join(", "));
      }
    `,
  ]);
}

await mkdir(tarballDir, { recursive: true });

run("publint", []);

for (const publicExport of publicExports) {
  checkPublicExport(publicExport);
}

run("node", [
  "--input-type=module",
  "-e",
  `
    await import("@poc/qwik-lib/internal/counter-state")
      .then(() => {
        throw new Error("internal import unexpectedly resolved");
      })
      .catch((error) => {
        if (error?.code !== "ERR_PACKAGE_PATH_NOT_EXPORTED") {
          throw error;
        }
      });
  `,
]);

const pack = run("bun", ["pm", "pack", "--destination", tarballDir, "--quiet"]);
const tarballName = pack.stdout
  .trim()
  .split(/\r?\n/)
  .map((line) => line.trim())
  .find((line) => line.endsWith(".tgz"));

if (!tarballName) {
  throw new Error("bun pm pack did not report a tarball path");
}

const tarballPath = join(tarballDir, basename(tarballName));
run("attw", [tarballPath, "--format", "table"]);
