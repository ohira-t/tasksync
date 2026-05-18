"use client";

import { useState } from "react";
import { Screenshot } from "@/lib/types";

export function ScreenshotCarousel({
  screenshots,
}: {
  screenshots: Screenshot[];
}) {
  const [current, setCurrent] = useState(0);

  if (screenshots.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg bg-muted text-muted-foreground text-sm">
        スクリーンショットなし
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="overflow-hidden rounded-lg bg-muted">
        <img
          src={screenshots[current].url}
          alt={screenshots[current].caption || `Screenshot ${current + 1}`}
          className="h-64 w-full object-contain"
        />
      </div>
      {screenshots[current].caption && (
        <p className="mt-1 text-xs text-muted-foreground text-center">
          {screenshots[current].caption}
        </p>
      )}
      {screenshots.length > 1 && (
        <div className="mt-2 flex items-center justify-center gap-2">
          <button
            onClick={() =>
              setCurrent((c) =>
                c === 0 ? screenshots.length - 1 : c - 1
              )
            }
            className="rounded-full bg-background border px-2 py-0.5 text-sm hover:bg-muted"
          >
            ←
          </button>
          <span className="text-xs text-muted-foreground">
            {current + 1} / {screenshots.length}
          </span>
          <button
            onClick={() =>
              setCurrent((c) =>
                c === screenshots.length - 1 ? 0 : c + 1
              )
            }
            className="rounded-full bg-background border px-2 py-0.5 text-sm hover:bg-muted"
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}
