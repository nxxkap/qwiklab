import { Slot, component$ } from "@builder.io/qwik";

export interface ProjectedPanelProps {
  tone?: string;
}

export const ProjectedPanel = component$<ProjectedPanelProps>(
  ({ tone = "neutral" }) => {
    return (
      <section
        class="poc-showcase__panel"
        data-testid="projected-panel"
        data-tone={tone}
      >
        <div class="poc-showcase__slot-summary" data-testid="projected-summary">
          <Slot name="summary" />
        </div>
        <div data-testid="projected-default">
          <Slot />
        </div>
      </section>
    );
  },
);
