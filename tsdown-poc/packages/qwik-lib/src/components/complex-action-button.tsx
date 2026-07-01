import { $, component$, useContext, useSignal } from "@builder.io/qwik";
import { LibraryThemeContext } from "../context/library-provider";
import { calculateScoreDelta } from "../internal/showcase-state";

export interface ComplexActionButtonProps {
  label?: string;
  step?: number;
  multiplier?: number;
}

export const ComplexActionButton = component$<ComplexActionButtonProps>(
  ({ label = "Apply library boost", step = 4, multiplier = 1 }) => {
    const theme = useContext(LibraryThemeContext);
    const clicks = useSignal(0);
    const actionConfig = {
      action: "boost",
      multiplier,
      step,
    };

    const applyScoreChange = $((event: MouseEvent, element: HTMLButtonElement) => {
      const clickCount = clicks.value + 1;
      const delta = calculateScoreDelta({
        action: element.dataset.action ?? actionConfig.action,
        clickCount,
        multiplier: actionConfig.multiplier,
        step: actionConfig.step,
      });

      clicks.value = clickCount;
      theme.score += delta;
      theme.actions = [
        ...theme.actions,
        `${event.type}:${element.dataset.action}:${delta}`,
      ];
    });

    return (
      <button
        class="poc-showcase__action"
        data-action={actionConfig.action}
        data-testid="poc-complex-action"
        onClick$={applyScoreChange}
        type="button"
      >
        {label} <span data-testid="complex-clicks">Clicks: {clicks.value}</span>
      </button>
    );
  },
);
