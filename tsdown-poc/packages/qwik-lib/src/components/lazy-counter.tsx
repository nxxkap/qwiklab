import { component$, useSignal } from "@builder.io/qwik";
import { formatCountLabel, nextCount } from "../internal/counter-state";

export interface LazyCounterProps {
  initial?: number;
  step?: number;
  label?: string;
}

export const LazyCounter = component$<LazyCounterProps>(
  ({ initial = 0, step = 1, label = "PoC counter" }) => {
    const count = useSignal(initial);

    return (
      <section data-testid="poc-counter" data-initial={initial}>
        <h2>{label}</h2>
        <p data-testid="poc-count">{formatCountLabel(count.value)}</p>
        <button
          data-testid="poc-increment"
          type="button"
          onClick$={() => {
            count.value = nextCount(count.value, step);
          }}
        >
          Increment
        </button>
      </section>
    );
  },
);

