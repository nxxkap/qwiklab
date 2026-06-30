import { mkdir } from "node:fs/promises";
import { basename, join } from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const tarballDir = join(root, "../../tmp/tarballs");

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

run("publint", []);

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
