# Build Matrix

Date: 2026-06-30

## Compared build modes

| Mode | Command | Result | JS output | Types | Validation | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Vite library baseline | `bun run --cwd packages/qwik-lib build:vite` | Pass | `lib/**/*.qwik.mjs` and `lib/**/*.qwik.cjs` | `tsc` emits `lib-types`; post-process adds `.d.cts` and ESM `.js` specifiers | `publint` all good; `attw` no problems | Matches Qwik's documented `qwikVite()` + Vite library mode shape. |
| direct tsdown | `bun run --cwd packages/qwik-lib build:tsdown` | Pass with constraints | Same public filenames as baseline | `tsc` post-step, not tsdown dts | `publint` all good; `attw` no problems | Directly adding `qwikVite()` to tsdown failed with `Qwik plugin has not been initialized`; final config externalizes Qwik and relies on the consumer optimizer. |
| Vite+ pack | `bun run --cwd packages/qwik-lib build:vp` | Pass with constraints | Same public filenames as direct tsdown | `tsc` post-step, not tsdown dts | `publint` all good; `attw` no problems | `vp pack` reads the Vite config `pack` block and emits the same package shape; it warns about Qwik plugin `esbuild` config and `vite-tsconfig-paths`. |

## Package shape

The tested package exposes only the root entrypoint:

```json
{
  "main": "./lib/index.qwik.mjs",
  "qwik": "./lib/index.qwik.mjs",
  "types": "./lib-types/index.d.ts",
  "exports": {
    ".": {
      "import": {
        "types": "./lib-types/index.d.ts",
        "default": "./lib/index.qwik.mjs"
      },
      "require": {
        "types": "./lib-types/index.d.cts",
        "default": "./lib/index.qwik.cjs"
      }
    }
  },
  "files": ["lib", "lib-types"]
}
```

This keeps the Qwik-required `qwik` field and `.qwik.mjs` entry while making TypeScript's ESM/CJS condition resolution pass `publint` and `attw`.

## Observed output

All successful modes produced these publish files:

```text
lib/index.qwik.mjs
lib/index.qwik.cjs
lib/components/lazy-counter.qwik.mjs
lib/components/lazy-counter.qwik.cjs
lib/internal/counter-state.qwik.mjs
lib/internal/counter-state.qwik.cjs
lib-types/index.d.ts
lib-types/index.d.cts
lib-types/components/lazy-counter.d.ts
lib-types/components/lazy-counter.d.cts
lib-types/internal/counter-state.d.ts
lib-types/internal/counter-state.d.cts
```

The internal files are present in the tarball because the build preserves modules, but they are not exported by `package.json`. A packed consumer deep import of `@poc/qwik-lib/internal/counter-state` fails with `ERR_PACKAGE_PATH_NOT_EXPORTED`.

## Source-backed interpretation

- Qwik library mode requires the optimizer-recognized package shape, including `qwik` and `.qwik.mjs`: <https://qwik.dev/docs/advanced/library/>
- Qwik runtime behavior depends on resumability and QRL-based lazy event execution, so consumer SSR and click behavior are part of the build decision: <https://qwik.dev/docs/concepts/resumable/> and <https://qwik.dev/docs/advanced/qrl/>
- Vite library mode is the official browser library baseline, while Vite documents tsdown/Rolldown as options for advanced flows: <https://vite.dev/guide/build.html#library-mode>
- tsdown provides library bundling, output formats, dts, and package validation integrations.
- This PoC did not find a working direct `qwikVite()` integration inside tsdown: <https://tsdown.dev/> and <https://tsdown.dev/options/lint>
- Vite+ `vp pack` is a tsdown-based packaging command configured through Vite's `pack` block: <https://viteplus.dev/guide/pack>
