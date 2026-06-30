# Consumer Verification

Date: 2026-06-30

## Fixture

- Library: `@poc/qwik-lib`
  - Public export: `LazyCounter` and `LazyCounterProps`
  - Qwik lazy event: `button onClick$`
  - Internal implementation: `src/internal/counter-state.ts`
- Consumer: Qwik City app importing `LazyCounter` from `@poc/qwik-lib`
  - SSR route renders `Count: 2`
  - Click increments by `step: 3`, so success state is `Count: 5`

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

`bun run test:ssr` runs the SSR marker check with `bun:test`. It verifies all of:

- Rendered library label: `Library counter`
- Initial state: `Count: 2`
- Qwik container marker: `q:container`
- Qwik base marker: `q:base`
- Lazy click listener marker: `on:click`

## Browser interaction

Each packed consumer is served from `/private/tmp/qwik-tsdown-packed-consumer-<mode>`.
`bun run test:browser` ensures Playwright Chromium is installed and then runs the Playwright Test browser spec.

The browser interaction assertion verifies all of:

- Initial state before click: `Count: 2`
- Button has a Qwik `on:click` QRL containing a chunk/symbol separator
- State after click: `Count: 5`
- No browser console warnings/errors
- No uncaught page exceptions

Observed before click:

| Mode | Initial count | Qwik markers | QRL listener |
| --- | --- | --- | --- |
| Vite library baseline | `Count: 2` | `q:base`, `q:container` | Present |
| direct tsdown | `Count: 2` | `q:base`, `q:container` | Present |
| Vite+ pack | `Count: 2` | `q:base`, `q:container` | Present |

Observed after click:

| Mode | Count after click | Console warnings/errors |
| --- | --- | --- |
| Vite library baseline | `Count: 5` | None |
| direct tsdown | `Count: 5` | None |
| Vite+ pack | `Count: 5` | None |

The `on:click` value points to a Qwik build chunk and symbol, which is the QRL/lazy execution shape described by Qwik's docs.

## Public surface check

From the packed Vite+ consumer:

```text
bun -e "import('@poc/qwik-lib/internal/counter-state')..."
ERR_PACKAGE_PATH_NOT_EXPORTED
```

The package tarball contains preserved internal modules, but the public package surface exposes only `"."`.

## Source-backed interpretation

- Qwik resumability requires server-rendered state and listener metadata rather than eager hydration: <https://qwik.dev/docs/concepts/resumable/>
- Qwik QRLs encode chunk and symbol references for lazy loading: <https://qwik.dev/docs/advanced/qrl/>
- Qwik event handlers such as `onClick$` participate in lazy execution: <https://qwik.dev/docs/core/events/>
- Package exports and type-shape validation were checked with tsdown's documented validation tools, `publint` and Are the Types Wrong: <https://tsdown.dev/options/lint>
