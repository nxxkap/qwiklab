import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";

const root = process.cwd();
const typesRoot = join(root, "lib-types");

async function listDtsFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
  const files = [];

  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listDtsFiles(full)));
    } else if (entry.name.endsWith(".d.ts")) {
      files.push(full);
    }
  }

  return files;
}

for (const file of await listDtsFiles(typesRoot)) {
  const source = await readFile(file, "utf8");
  const esmSource = source.replace(
    /(from\s+["'])(\.{1,2}\/[^"']+?)(["'])/g,
    (match, prefix, specifier, suffix) => {
      if (/\.(c|m)?js$|\.json$/.test(specifier)) {
        return match;
      }
      return `${prefix}${specifier}.js${suffix}`;
    },
  );
  const target = file.replace(/\.d\.ts$/, ".d.cts");
  await mkdir(dirname(target), { recursive: true });
  await writeFile(file, esmSource);
  await writeFile(target, source);
  console.log(`wrote ${relative(root, target)}`);
}
