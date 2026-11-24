import { useEffect, useState } from "react";
import { ImageOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { usableCoverImageUrl } from "@/lib/eventCoverImage";

interface EventCoverImageProps {
  src: string | null | undefined;
  /** Event title, used as the image's alt text. */
  title: string;
  className?: string;
  lazy?: boolean;
}

/**
 * Event cover with a stable box. Missing, unusable or broken (404/expired) images
 * show a quiet placeholder instead of a broken-image icon; the error handler only
 * flips state once, so a dead URL is requested once and never loops.
 */
export function EventCoverImage({ src, title, className = "w-full h-full object-cover", lazy }: EventCoverImageProps) {
  const { t } = useTranslation();
  // http(s) covers, or the app's own bundled fallback asset (same-origin path).
  const url = usableCoverImageUrl(src) ?? (src?.startsWith("/") && !src.startsWith("//") ? src : undefined);
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [url]);

  if (!url || failed) {
    return (
      <div
        role="img"
        aria-label={t("events.noCoverImage", { title })}
        className="w-full h-full flex flex-col items-center justify-center gap-1 text-muted-foreground"
      >
        <ImageOff className="h-8 w-8" aria-hidden="true" />
        <span className="text-xs">{t("events.noCoverImageShort")}</span>
      </div>
    );
  }
  return (
    <img
      src={url}
      alt={title}
      className={className}
      loading={lazy ? "lazy" : undefined}
      onError={() => setFailed(true)}
    />
  );
}
