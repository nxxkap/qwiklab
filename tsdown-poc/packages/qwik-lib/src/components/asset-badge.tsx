import { component$ } from "@builder.io/qwik";
import badgeUrl from "../assets/library-badge.svg";
import badgeSvg from "../assets/library-badge.svg?inline";

export interface AssetBadgeProps {
  alt?: string;
}

export const AssetBadge = component$<AssetBadgeProps>(
  ({ alt = "Qwik library badge" }) => {
    const badgeDataUrl = badgeSvg.startsWith("data:")
      ? badgeSvg
      : `data:image/svg+xml,${encodeURIComponent(badgeSvg)}`;

    return (
      <img
        alt={alt}
        data-asset-url={badgeUrl}
        data-testid="library-asset"
        height={32}
        src={badgeDataUrl}
        width={32}
      />
    );
  },
);
