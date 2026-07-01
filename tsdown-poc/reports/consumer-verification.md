# Consumer Verification

Date: 2026-07-01

## Fixture

- Library: `@poc/qwik-lib`
  - Root public exports: `LazyCounter`, `LibraryShowcase`, and their props types
  - Public component subpath: `LibraryShowcase`, `ProjectedPanel`, `AssetBadge`, `LibraryMetric`, `ComplexActionButton`, and their public types
  - Public context subpath: `LibraryProvider`, `LibraryThemeContext`, `LibraryThemeState`, and `LibraryProviderProps`
  - Public server subpath: `getLibraryServerBoundaryInfo()`
  - Qwik lazy events: `LazyCounter` button `onClick$` and `ComplexActionButton` multi-capture `$` handler
  - Internal implementations: `src/internal/counter-state.ts` and `src/internal/showcase-state.ts`
- Consumer: Qwik City app importing from root, `@poc/qwik-lib/components`, and `@poc/qwik-lib/context`
  - SSR route renders `Count: 2`
  - Click increments by `step: 3`, so success state is `Count: 5`
  - The route renders `LibraryProvider` + `LibraryShowcase` with consumer-projected named and default slot content
  - The route never imports `@poc/qwik-lib/server`; the server subpath is imported only by the Node/SSR test

## Packed consumer checks

`bun run verify:packed:all` builds each library mode, validates the package, and packs it.

It installs the tarball into an isolated consumer under `/private/tmp` and runs:

```text
bun install
bun run check
bun run build
bun run build.preview
bun run test:ssr
bun run test:browser
```

Results:

| Mode | Tarball install | Typecheck | Client build | SSR preview build | SSR markers | Browser click |
| --- | --- | --- | --- | --- | --- | --- |
| Vite library baseline | Pass | Pass | Pass | Pass | Pass | Pass |
| direct tsdown | Pass | Pass | Pass | Pass | Pass | Pass |
| Vite+ pack | Pass | Pass | Pass | Pass | Pass | Pass |

`QWIK_CONSUMER_VERSION=1.19.2 bun run verify:packed:mismatch:all` repeats the same packed checks while overriding the copied consumer's `@builder.io/qwik` and `@builder.io/qwik-city` versions. The mismatch runner rejects missing versions, same-minor versions, and versions outside the library peer range before running the packed checks.

Results:

| Mode | Qwik consumer version | Tarball install | Typecheck | Client build | SSR preview build | SSR markers | Browser click |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Vite library baseline | `1.19.2` | Pass | Pass | Pass | Pass | Pass | Pass |
| direct tsdown | `1.19.2` | Pass | Pass | Pass | Pass | Pass | Pass |
| Vite+ pack | `1.19.2` | Pass | Pass | Pass | Pass | Pass | Pass |

`bun run test:ssr` runs the SSR marker check with `bun:test`. It verifies all of:

- Rendered library label: `Library counter`
- Initial state: `Count: 2`
- Qwik container marker: `q:container`
- Qwik base marker: `q:base`
- Lazy click listener markers: at least two `on:click` attributes
- Showcase label: `Production library showcase`
- Named slot projection: `Consumer supplied summary`
- Default slot projection: `Consumer projected details`
- Context values: `Tone: focus` and `Score: 7`
- Rendered SVG asset `src`
- Successful Node-side import of `@poc/qwik-lib/server`

## Browser interaction

Each packed consumer is served from `/private/tmp/qwik-tsdown-packed-consumer-<mode>`.
`bun run test:browser` ensures Playwright Chromium is installed and then runs the Playwright Test browser spec.

The browser interaction assertion verifies all of:

- Initial state before click: `Count: 2`
- Button has a Qwik `on:click` QRL containing a chunk/symbol separator
- State after click: `Count: 5`
- Showcase context tone is rendered as `data-tone="focus"`
- Showcase CSS is active through computed `border-left-color: rgb(15, 118, 110)`
- Consumer-projected named and default slot content is rendered
- The SVG asset resolves and has positive `naturalWidth`
- Complex action starts at `Score: 7`
- Complex action has a Qwik `on:click` QRL and at least two click QRL attributes remain present on the page
- Complex action click updates the provider store to `Score: 12` and records `Clicks: 1`
- No browser console warnings/errors
- No uncaught page exceptions

Observed before click:

| Mode | Initial count | Showcase score | Qwik markers | QRL listeners | CSS/asset |
| --- | --- | --- | --- | --- | --- |
| Vite library baseline | `Count: 2` | `Score: 7` | `q:base`, `q:container` | At least 2 | Pass |
| direct tsdown | `Count: 2` | `Score: 7` | `q:base`, `q:container` | At least 2 | Pass |
| Vite+ pack | `Count: 2` | `Score: 7` | `q:base`, `q:container` | At least 2 | Pass |

Observed after click:

| Mode | Count after lazy counter click | Score after complex action click | Console warnings/errors |
| --- | --- | --- | --- |
| Vite library baseline | `Count: 5` | `Score: 12` | None |
| direct tsdown | `Count: 5` | `Score: 12` | None |
| Vite+ pack | `Count: 5` | `Score: 12` | None |

The `on:click` value points to a Qwik build chunk and symbol, which is the QRL/lazy execution shape described by Qwik's docs.

## Public surface check

Package validation imports and requires each public specifier:

```text
@poc/qwik-lib
@poc/qwik-lib/components
@poc/qwik-lib/context
@poc/qwik-lib/server
```

It also checks that an internal deep import remains blocked:

```text
import("@poc/qwik-lib/internal/counter-state")
ERR_PACKAGE_PATH_NOT_EXPORTED
```

The package tarball contains preserved internal modules, but the public package surface exposes only `"."`, `"./components"`, `"./context"`, and `"./server"`.

## Source-backed interpretation

- Qwik resumability requires server-rendered state and listener metadata rather than eager hydration: <https://qwik.dev/docs/concepts/resumable/>
- Qwik QRLs encode chunk and symbol references for lazy loading: <https://qwik.dev/docs/advanced/qrl/>
- Qwik event handlers such as `onClick$` participate in lazy execution: <https://qwik.dev/docs/core/events/>
- Package exports and type-shape validation were checked with tsdown's documented validation tools, `publint` and Are the Types Wrong: <https://tsdown.dev/options/lint>
