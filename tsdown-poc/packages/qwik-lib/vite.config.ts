import { qwikVite } from "@builder.io/qwik/optimizer";
import { defineConfig } from "vite-plus";
import tsconfigPaths from "vite-tsconfig-paths";
import pkg from "./package.json";

const { dependencies = {}, peerDependencies = {} } = pkg as {
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
};

const makeRegex = (dep: string) => new RegExp(`^${dep}(/.*)?$`);
const excludeAll = (deps: Record<string, string>) => Object.keys(deps).map(makeRegex);

export default defineConfig(() => {
  return {
    build: {
      target: "es2020",
      lib: {
        entry: "./src/index.ts",
        formats: ["es", "cjs"],
        fileName: (format, entryName) =>
          `${entryName}.qwik.${format === "es" ? "mjs" : "cjs"}`,
      },
      rollupOptions: {
        output: {
          preserveModules: true,
          preserveModulesRoot: "src",
        },
        external: [
          /^node:.*/,
          ...excludeAll(dependencies),
          ...excludeAll(peerDependencies),
        ],
      },
    },
    pack: {
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
    },
    plugins: [qwikVite(), tsconfigPaths({ root: "." })],
  };
});
