import {
  Slot,
  component$,
  createContextId,
  useContextProvider,
  useStore,
} from "@builder.io/qwik";

export interface LibraryThemeState {
  tone: "focus" | "calm";
  accent: string;
  score: number;
  actions: string[];
}

export interface LibraryProviderProps {
  tone?: LibraryThemeState["tone"];
  accent?: string;
  initialScore?: number;
}

export const LibraryThemeContext = createContextId<LibraryThemeState>(
  "poc.library-theme",
);

export const LibraryProvider = component$<LibraryProviderProps>(
  ({ tone = "focus", accent = "#0f766e", initialScore = 7 }) => {
    const theme = useStore<LibraryThemeState>({
      tone,
      accent,
      score: initialScore,
      actions: [],
    });

    useContextProvider(LibraryThemeContext, theme);

    return (
      <section data-testid="library-provider" data-tone={theme.tone}>
        <Slot />
      </section>
    );
  },
);
