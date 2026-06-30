import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { LazyCounter, type LazyCounterProps } from "@poc/qwik-lib";

const counterProps: LazyCounterProps = {
  initial: 2,
  step: 3,
  label: "Library counter",
};

export default component$(() => {
  return (
    <main>
      <h1>Qwik library consumer</h1>
      <LazyCounter {...counterProps} />
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

