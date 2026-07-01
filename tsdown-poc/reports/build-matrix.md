# Build Matrix

Date: 2026-07-01

## Compared build modes

| Mode | Command | Result | JS output | Types | Validation | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Vite library baseline | `bun run --cwd packages/qwik-lib build:vite` | Pass | `lib/**/*.qwik.mjs` and `lib/**/*.qwik.cjs` for root plus public subpaths | `tsc` emits `lib-types`; post-process adds `.d.cts` and ESM `.js` specifiers | `publint` all good; `attw` no problems | Matches Qwik's documented `qwikVite()` + Vite library mode shape and now covers CSS inline imports plus SVG assets. |
| direct tsdown | `bun run --cwd packages/qwik-lib build:tsdown` | Pass with constraints | Same public filenames as baseline; preserved module internals; emitted SVG asset | `tsc` post-step, not tsdown dts | `publint` all good; `attw` no problems | Directly adding `qwikVite()` to tsdown failed with `Qwik plugin has not been initialized`; final config externalizes Qwik, preserves Qwik package shape, and uses a small inline loader for `?inline` CSS/SVG. |
| Vite+ pack | `bun run --cwd packages/qwik-lib build:vp` | Pass with constraints | Same public filenames as direct tsdown; emitted SVG asset | `tsc` post-step, not tsdown dts | `publint` all good; `attw` no problems | `vp pack` reads the Vite config `pack` block and emits the same package shape; it warns about Qwik plugin `esbuild` config and `vite-tsconfig-paths`. |

## Package shape

The tested package exposes the root entrypoint plus three public subpaths:

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
    },
    "./components": {
      "import": {
        "types": "./lib-types/components.d.ts",
        "default": "./lib/components.qwik.mjs"
      },
      "require": {
        "types": "./lib-types/components.d.cts",
        "default": "./lib/components.qwik.cjs"
      }
    },
    "./context": {
      "import": {
        "types": "./lib-types/context.d.ts",
        "default": "./lib/context.qwik.mjs"
      },
      "require": {
        "types": "./lib-types/context.d.cts",
        "default": "./lib/context.qwik.cjs"
      }
    },
    "./server": {
      "import": {
        "types": "./lib-types/server.d.ts",
        "default": "./lib/server.qwik.mjs"
      },
      "require": {
        "types": "./lib-types/server.d.cts",
        "default": "./lib/server.qwik.cjs"
      }
    }
  },
  "files": ["lib", "lib-types"]
}
```

This keeps the Qwik-required `qwik` field and `.qwik.mjs` root entry while making TypeScript's ESM/CJS condition resolution pass `publint` and `attw` for each public subpath. `typesVersions` is present for `components`, `context`, and `server` so the Node10 compatibility mode in `attw` also resolves the subpath declarations.

## Observed output

All successful modes produced these public entry files:

```text
lib/index.qwik.mjs
lib/index.qwik.cjs
lib/components.qwik.mjs
lib/components.qwik.cjs
lib/context.qwik.mjs
lib/context.qwik.cjs
lib/server.qwik.mjs
lib/server.qwik.cjs
lib-types/index.d.ts
lib-types/index.d.cts
lib-types/components.d.ts
lib-types/components.d.cts
lib-types/context.d.ts
lib-types/context.d.cts
lib-types/server.d.ts
lib-types/server.d.cts
```

The preserved module output now also includes the richer fixture implementation:

```text
lib/components/lazy-counter.qwik.mjs
lib/components/lazy-counter.qwik.cjs
lib/components/library-showcase.qwik.mjs
lib/components/library-showcase.qwik.cjs
lib/components/projected-panel.qwik.mjs
lib/components/projected-panel.qwik.cjs
lib/components/asset-badge.qwik.mjs
lib/components/asset-badge.qwik.cjs
lib/components/library-metric.qwik.mjs
lib/components/library-metric.qwik.cjs
lib/components/complex-action-button.qwik.mjs
lib/components/complex-action-button.qwik.cjs
lib/context/library-provider.qwik.mjs
lib/context/library-provider.qwik.cjs
lib/internal/counter-state.qwik.mjs
lib/internal/counter-state.qwik.cjs
lib/internal/showcase-state.qwik.mjs
lib/internal/showcase-state.qwik.cjs
lib/styles/showcase.qwik.mjs
lib/styles/showcase.qwik.cjs
lib/assets/library-badge-TGQ8ZYYB.svg
```

The internal files are present in the tarball because the build preserves modules, but they are not exported by `package.json`. A packed consumer deep import of `@poc/qwik-lib/internal/counter-state` fails with `ERR_PACKAGE_PATH_NOT_EXPORTED`. The server entrypoint is exported separately as `@poc/qwik-lib/server`; browser-facing entries do not import it.

## Source-backed interpretation

- Qwik library mode requires the optimizer-recognized package shape, including `qwik` and `.qwik.mjs`: <https://qwik.dev/docs/advanced/library/>
- Qwik runtime behavior depends on resumability and QRL-based lazy event execution, so consumer SSR and click behavior are part of the build decision: <https://qwik.dev/docs/concepts/resumable/> and <https://qwik.dev/docs/advanced/qrl/>
- Vite library mode is the official browser library baseline, while Vite documents tsdown/Rolldown as options for advanced flows: <https://vite.dev/guide/build.html#library-mode>
- tsdown provides library bundling, output formats, dts, package validation integrations, and experimental CSS handling through `@tsdown/css`.
- This PoC did not find a working direct `qwikVite()` integration inside tsdown: <https://tsdown.dev/> and <https://tsdown.dev/options/lint>
<!-- textlint-disable terminology -->
- CSS imported with `?inline` must remain a JavaScript string for `useStyles$`; tsdown documents `?inline` CSS as string output when CSS support is enabled: <https://tsdown.dev/options/css>
<!-- textlint-enable terminology -->
- Vite+ `vp pack` is a tsdown-based packaging command configured through Vite's `pack` block: <https://viteplus.dev/guide/pack>
