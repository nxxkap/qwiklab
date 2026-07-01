import { createRequire } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { defineConfig } from "tsdown/config";

const require = createRequire(import.meta.url);
const pkg = require("./package.json");

const { dependencies = {}, peerDependencies = {} } = pkg as {
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
};

const makeRegex = (dep: string) => new RegExp(`^${dep}(/.*)?$`);
const excludeAll = (deps: Record<string, string>) => Object.keys(deps).map(makeRegex);
const publicEntries = {
  components: "./src/components.ts",
  context: "./src/context.ts",
  index: "./src/index.ts",
  server: "./src/server.ts",
};
const inlineModulePrefix = "\0poc-inline:";
const inlineModuleMarker = "poc-inline:";
const inlineExtensions = [".css", ".svg"];
const inlineModuleFiles = new Map<string, string>();
const inlineModuleKeys = new Map<string, string>();

function getInlineModuleId(path: string): string {
  let key = inlineModuleKeys.get(path);
  if (!key) {
    key = String(inlineModuleKeys.size);
    inlineModuleKeys.set(path, key);
    inlineModuleFiles.set(key, path);
  }
  return `${inlineModulePrefix}${key}`;
}

function inlineCssPlugin() {
  return {
    name: "poc-inline-css",
    resolveId(source: string, importer?: string) {
      if (!inlineExtensions.some((extension) => source.endsWith(`${extension}?inline`))) {
        return null;
      }

      const cleanSource = source.slice(0, -"?inline".length);
      const importerPath = importer?.split("?")[0];
      const resolved = importerPath
        ? resolve(dirname(importerPath), cleanSource)
        : resolve(cleanSource);

      return existsSync(resolved) ? getInlineModuleId(resolved) : null;
    },
    load(id: string) {
      const markerIndex = id.indexOf(inlineModuleMarker);
      if (markerIndex === -1) {
        return null;
      }

      const key = id.slice(markerIndex + inlineModuleMarker.length);
      const sourcePath = inlineModuleFiles.get(key);
      if (!sourcePath) {
        throw new Error(`Unknown inline module: ${id}`);
      }
      return `export default ${JSON.stringify(readFileSync(sourcePath, "utf8"))};`;
    },
  };
}

export default defineConfig({
  entry: publicEntries,
  root: "src",
  outDir: "lib",
  clean: ["lib", "lib-types"],
  target: "es2020",
  platform: "browser",
  format: ["esm", "cjs"],
  unbundle: true,
  dts: false,
  deps: {
    neverBundle: [
      /^node:.*/,
      /^@builder\.io\/qwik(\/.*)?$/,
      ...excludeAll(dependencies),
      ...excludeAll(peerDependencies),
    ],
    onlyBundle: false,
  },
  loader: {
    ".svg": "asset",
  },
  plugins: [inlineCssPlugin()],
  outExtensions({ format }) {
    return {
      js: format === "cjs" ? ".qwik.cjs" : ".qwik.mjs",
    };
  },
  outputOptions: {
    preserveModules: true,
    preserveModulesRoot: "src",
  },
});
