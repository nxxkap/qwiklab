import { createRequire } from "node:module";
import { defineConfig } from "tsdown/config";

const require = createRequire(import.meta.url);
const pkg = require("./package.json");

const { dependencies = {}, peerDependencies = {} } = pkg as {
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
};

const makeRegex = (dep: string) => new RegExp(`^${dep}(/.*)?$`);
const excludeAll = (deps: Record<string, string>) => Object.keys(deps).map(makeRegex);

export default defineConfig({
  entry: {
    index: "./src/index.ts",
  },
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
