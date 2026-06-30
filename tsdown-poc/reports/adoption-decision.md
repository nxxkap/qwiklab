# Adoption Decision

Date: 2026-06-30

## Decision

`tsdown` is conditionally adoptable for JavaScript bundling in this Qwik component library PoC. It is not a drop-in replacement for the documented Qwik Vite library build.

Recommended default for production right now: keep the Vite library build unless the project explicitly accepts the added constraints below.

If adopting tsdown, prefer direct `tsdown` over Vite+ for this narrow package. It is simpler and produced the same package shape without adding another tool layer. Vite+ `vp pack` is viable, but it did not provide a functional advantage in this PoC.

## Conditions for adopting tsdown

- Keep Qwik's required publish shape: `qwik`, `.qwik.mjs`, `exports`, and `types`.
- Do not pass `qwikVite()` directly to tsdown; the attempted direct plugin path failed with `Qwik plugin has not been initialized`.
- Externalize `@builder.io/qwik` so the library does not bundle a private Qwik runtime copy.
- Use `unbundle`/preserved modules and custom output extensions to emit `.qwik.mjs` and `.qwik.cjs`.
- Keep a separate `tsc` declaration step plus post-processing for `.d.cts` and Node16 ESM-compatible `.d.ts` import specifiers.
- Require packed-consumer verification in CI.
- Cover package validation, tarball install, consumer typecheck, client build, and SSR preview build.
- Cover SSR marker and browser click checks for each packed consumer mode.

## Why not unconditional adoption

- Qwik's official library path is Vite library mode with `qwikVite()`: <https://qwik.dev/docs/advanced/library/>
- direct tsdown cannot currently use `qwikVite()` in the same straightforward way. That makes the approach depend on package shape plus the consumer app's Qwik optimizer behavior.
- tsdown dts generation was not used for the final valid package shape; a `tsc` post-step remains necessary.
- Vite+ works but adds a young wrapper dependency and emitted warnings from the Qwik/Vite plugin stack. It did not improve correctness over direct tsdown in this fixture.
- This PoC covers one minimal component and one lazy handler. More complex QRL patterns, styles, multiple entries, secondary exports, and real package publishing still need confirmation.

## Vite vs direct tsdown vs Vite+

| Criterion | Vite library baseline | direct tsdown | Vite+ pack |
| --- | --- | --- | --- |
| Official Qwik alignment | Strongest | Partial | Partial |
| Build success | Pass | Pass | Pass |
| Package validation | Pass | Pass | Pass |
| Packed consumer SSR | Pass | Pass | Pass |
| Packed browser click | Pass | Pass | Pass |
| Qwik optimizer plugin in build tool | Works through `qwikVite()` | Direct use failed | Config loads Vite plugins, but pack output still uses tsdown-style config |
| Type declarations | `tsc` post-step | `tsc` post-step | `tsc` post-step |
| Main advantage | Documented and least surprising | Fast, explicit, minimal wrapper | Vite-config-centered tsdown wrapper |
| Main drawback | Slightly more conventional Rollup/Vite path | Not officially documented for Qwik library build | Extra abstraction with no PoC-specific correctness gain |

## Additional checks before main development

- Confirm the direct tsdown approach with multiple components, public subpath exports, styles/assets, context/provider usage, and slot projection.
- Confirm server-only code boundaries and more complex `$` closures.
- Confirm behavior when the library and consumer use different compatible Qwik minor versions.
- Decide whether internal preserved files in the tarball are acceptable, or whether the build should bundle internals while preserving only public entries.
- Re-check `tsdown` and Vite+ release notes before adoption; both are moving targets.
- Add a CI job for `bun run verify:packed:all`, which now includes SSR marker and browser click checks for every packed mode.

## Primary sources

- Qwik library mode: <https://qwik.dev/docs/advanced/library/>
- Qwik resumability: <https://qwik.dev/docs/concepts/resumable/>
- Qwik QRL: <https://qwik.dev/docs/advanced/qrl/>
- Qwik events: <https://qwik.dev/docs/core/events/>
- Vite library mode: <https://vite.dev/guide/build.html#library-mode>
- tsdown home/options: <https://tsdown.dev/>
- tsdown declaration generation: <https://tsdown.dev/options/dts>
- tsdown output format: <https://tsdown.dev/options/output-format>
- tsdown package validation: <https://tsdown.dev/options/lint>
- Vite+ pack: <https://viteplus.dev/guide/pack>
