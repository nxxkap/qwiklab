import { component$ } from "@builder.io/qwik";
import { formatMetric } from "../internal/showcase-state";

export interface LibraryMetricProps {
  label: string;
  value: string | number;
  testId?: string;
}

export const LibraryMetric = component$<LibraryMetricProps>(
  ({ label, value, testId = "library-metric" }) => {
    return (
      <p class="poc-showcase__metric" data-testid={testId}>
        <span>{label}</span>
        <strong>{formatMetric(label, value)}</strong>
      </p>
    );
  },
);
