import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import {
  LazyCounter,
  LibraryShowcase,
  type LazyCounterProps,
} from "@poc/qwik-lib";
import type { LibraryShowcaseProps } from "@poc/qwik-lib/components";
import { LibraryProvider } from "@poc/qwik-lib/context";

const counterProps: LazyCounterProps = {
  initial: 2,
  step: 3,
  label: "Library counter",
};

const showcaseProps: LibraryShowcaseProps = {
  label: "Production library showcase",
  actionLabel: "Apply production boost",
};

export default component$(() => {
  return (
    <main>
      <h1>Qwik library consumer</h1>
      <LazyCounter {...counterProps} />
      <LibraryProvider accent="#0f766e" initialScore={7} tone="focus">
        <LibraryShowcase {...showcaseProps}>
          <span q:slot="summary">Consumer supplied summary</span>
          <p>Consumer projected details</p>
        </LibraryShowcase>
      </LibraryProvider>
    </main>
  );
});

export const head: DocumentHead = {
  title: "Qwik tsdown PoC consumer",
  meta: [
    {
      name: "description",
      content: "Consumer app for Qwik library tsdown PoC",
    },
  ],
};
