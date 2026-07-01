# Source Review

This PoC uses primary sources as the decision baseline. Secondary sources are not required for the initial scope.

## Qwik library package shape

- Qwik documents component libraries as Vite library mode builds with `qwikVite()` from `@builder.io/qwik/optimizer`.
- The documented publish shape includes `main`, `qwik`, `types`, `exports`, `files`, and `"type": "module"` in `package.json`.
- The `qwik` field points at the optimizer entry and the file must use the `.qwik.mjs` extension, otherwise the Qwik Optimizer will not recognize the library.
- Source: <https://qwik.dev/docs/advanced/library/>

## Qwik resumability and lazy execution

- Qwik's runtime model resumes from server-rendered state instead of hydrating by replaying all component logic.
- SSR output must serialize listener, component boundary, and state information so the browser can resume without eagerly downloading all component code.
- Event attributes include the chunk URL and symbol name that Qwikloader resolves lazily.
- Sources:
  - <https://qwik.dev/docs/concepts/resumable/>
  - <https://qwik.dev/docs/advanced/qrl/>
  - <https://qwik.dev/docs/core/events/>

## Vite library mode baseline

- Vite's library mode is the documented build path for browser-oriented libraries through `build.lib`.
- The Vite docs also point advanced library authors toward lower-level Rolldown or tsdown usage for more direct build flows.
- Source: <https://vite.dev/guide/build.html#library-mode>

## tsdown capabilities and limits to verify

- tsdown is a Rolldown-powered library bundler.
- It supports declaration file generation, multiple output formats, and optional package validation through publint and Are the Types Wrong.
- It supports CSS handling through `@tsdown/css`; `?inline` CSS imports are expected to become JavaScript strings, which is the shape Qwik `useStyles$` needs.
- It supports plugins and Rolldown options, but its public documentation does not state Qwik Optimizer package-shape compatibility as a built-in guarantee.
- Sources:
  - <https://tsdown.dev/>
  <!-- textlint-disable terminology -->
  - <https://tsdown.dev/options/css>
  <!-- textlint-enable terminology -->
  - <https://tsdown.dev/options/dts>
  - <https://tsdown.dev/options/output-format>
  - <https://tsdown.dev/options/lint>
  - <https://tsdown.dev/advanced/plugins>

## Vite+ pack

- `vp pack` builds libraries and standalone executables with tsdown.
- Vite+ recommends placing packaging configuration in the `pack` block of `vite.config.ts` and not using `tsdown.config.ts` with Vite+.
- Source: <https://viteplus.dev/guide/pack>

## PoC pass/fail criteria

The direct `tsdown` or Vite+ result is adoptable only if it satisfies all of the following against a packed consumer install:

- Normal package import works from the consumer app.
- Public subpath imports work for `@poc/qwik-lib/components`, `@poc/qwik-lib/context`, and `@poc/qwik-lib/server`.
- SSR succeeds and renders the library component.
- The SSR HTML contains Qwik listener and state markers needed for resumability.
- The consumer route exercises more than one component, context/provider state, named and default slot projection, inline styles, and an imported asset.
- A client interaction invokes lazy `$` handlers and updates state without runtime errors.
- At least one `$` handler captures props, context store, local signal state, local configuration, DOM event data, and an imported helper.
- The server-only public subpath imports successfully in Node/SSR tests and is not imported by the browser route.
- Package metadata and output files match the Qwik Optimizer expectations, including `qwik` and `.qwik.mjs`.
- Type declarations resolve from the root package entry and public subpaths.
- Internal implementation is not exported through `exports` or declarations.
- Package validation does not report publish-shape or declaration-shape errors.
- A compatible different-minor Qwik consumer install passes the same packed verification, and the mismatch runner rejects same-minor or out-of-range versions.
- Compared with the Vite library baseline, the build has a clear advantage in configuration, maintenance, or speed.
