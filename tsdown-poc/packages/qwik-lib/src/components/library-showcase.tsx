import { Slot, component$, useContext, useStyles$ } from "@builder.io/qwik";
import { LibraryThemeContext } from "../context/library-provider";
import showcaseStyles from "../styles/showcase.css?inline";
import { AssetBadge } from "./asset-badge";
import { ComplexActionButton } from "./complex-action-button";
import { LibraryMetric } from "./library-metric";
import { ProjectedPanel } from "./projected-panel";

export interface LibraryShowcaseProps {
  label?: string;
  actionLabel?: string;
}

export const LibraryShowcase = component$<LibraryShowcaseProps>(
  ({ label = "Production library showcase", actionLabel }) => {
    useStyles$(showcaseStyles);

    const theme = useContext(LibraryThemeContext);

    return (
      <article
        class="poc-showcase"
        data-testid="library-showcase"
        data-tone={theme.tone}
        style={{ "--poc-accent": theme.accent }}
      >
        <header class="poc-showcase__header">
          <AssetBadge />
          <h2 class="poc-showcase__title" data-testid="showcase-label">
            {label}
          </h2>
        </header>
        <div class="poc-showcase__metrics">
          <LibraryMetric label="Tone" testId="library-tone" value={theme.tone} />
          <LibraryMetric
            label="Score"
            testId="library-score"
            value={theme.score}
          />
        </div>
        <ProjectedPanel tone={theme.tone}>
          <span q:slot="summary">
            <Slot name="summary" />
          </span>
          <Slot />
        </ProjectedPanel>
        <ComplexActionButton label={actionLabel} />
      </article>
    );
  },
);
