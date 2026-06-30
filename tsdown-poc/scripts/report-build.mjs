import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const libRoot = join(root, "packages/qwik-lib");
const reportPath = join(root, "reports/generated/file-tree.md");

async function listFiles(dir, base = dir) {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
  const rows = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      rows.push(...(await listFiles(full, base)));
    } else {
      const size = (await stat(full)).size;
      rows.push({ path: relative(base, full), size });
    }
  }
  return rows.sort((a, b) => a.path.localeCompare(b.path));
}

const pkg = JSON.parse(await readFile(join(libRoot, "package.json"), "utf8"));
const files = await listFiles(join(libRoot, "lib"));
const types = await listFiles(join(libRoot, "lib-types"));

const body = [
  "# Generated Build File Tree",
  "",
  `Package: ${pkg.name}@${pkg.version}`,
  "",
  "## package.json fields",
  "",
  "```json",
  JSON.stringify(
    {
      main: pkg.main,
      qwik: pkg.qwik,
      types: pkg.types,
      exports: pkg.exports,
      files: pkg.files
    },
    null,
    2
  ),
  "```",
  "",
  "## lib",
  "",
  ...files.map((file) => `- ${file.path} (${file.size} bytes)`),
  "",
  "## lib-types",
  "",
  ...types.map((file) => `- ${file.path} (${file.size} bytes)`),
  ""
].join("\n");

await mkdir(join(root, "reports/generated"), { recursive: true });
await writeFile(reportPath, body);
