"use client";

import * as React from "react";
import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

type StarRatingProps = {
  value: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  className?: string;
  size?: "sm" | "md";
  ariaLabel?: string;
};

function clampRating(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(5, value));
}

function roundToHalf(value: number) {
  return Math.round(value * 2) / 2;
}

function clamp01(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function StarFill({
  fill,
  className,
}: {
  fill: number; // 0..1
  className: string;
}) {
  const pct = `${Math.round(clamp01(fill) * 100)}%`;
  return (
    <span className="relative inline-flex">
      <Star className={cn(className, "text-muted-foreground/40")} aria-hidden="true" />
      <span className="absolute inset-0 overflow-hidden" style={{ width: pct }}>
        <Star className={cn(className, "text-foreground")} fill="currentColor" aria-hidden="true" />
      </span>
    </span>
  );
}

export function StarRating({
  value,
  onChange,
  readOnly = false,
  className,
  size = "md",
  ariaLabel = "Rating",
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = React.useState<number | null>(null);

  const effective = clampRating(readOnly ? roundToHalf(value) : hoverValue ?? value);
  const interactive = !readOnly && typeof onChange === "function";
  const iconSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  const setRating = (next: number) => {
    if (!interactive) return;
    onChange?.(Math.max(1, Math.min(5, next)));
  };

  return (
    <div
      role={interactive ? "radiogroup" : "img"}
      aria-label={ariaLabel}
      tabIndex={interactive ? 0 : -1}
      onKeyDown={(e) => {
        if (!interactive) return;
        const current = clampRating(value) || 0;
        if (e.key === "ArrowRight" || e.key === "ArrowUp") {
          e.preventDefault();
          return setRating(Math.min(5, Math.max(1, current + 1)));
        }
        if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
          e.preventDefault();
          return setRating(Math.max(1, current - 1));
        }
        if (e.key === "Home") {
          e.preventDefault();
          return setRating(1);
        }
        if (e.key === "End") {
          e.preventDefault();
          return setRating(5);
        }
      }}
      className={cn(
        "inline-flex items-center gap-1 rounded-md outline-none",
        interactive && "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
      onMouseLeave={() => {
        if (!interactive) return;
        setHoverValue(null);
      }}
    >
      {Array.from({ length: 5 }).map((_, idx) => {
        const starIndex = idx + 1;
        const fill = clamp01(effective - (starIndex - 1));
        const common = cn(iconSize, "transition-colors duration-150");

        if (!interactive) {
          return <StarFill key={starIndex} fill={fill} className={common} />;
        }

        return (
          <button
            key={starIndex}
            type="button"
            role="radio"
            aria-checked={Math.round(clampRating(value)) === starIndex}
            aria-label={`${starIndex} star${starIndex === 1 ? "" : "s"}`}
            onMouseEnter={() => setHoverValue(starIndex)}
            onFocus={() => setHoverValue(starIndex)}
            onBlur={() => setHoverValue(null)}
            onClick={() => setRating(starIndex)}
            className={cn(
              "group inline-flex items-center justify-center rounded-sm p-0.5",
              "transition-transform duration-150 hover:scale-[1.06] active:scale-[0.96]"
            )}
          >
            <StarFill fill={fill} className={common} />
          </button>
        );
      })}
    </div>
  );
}
