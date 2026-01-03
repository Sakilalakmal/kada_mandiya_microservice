"use client";

import * as React from "react";
import { CalendarDays } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { StarRating } from "./star-rating";

type ReviewCardProps = {
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt?: string;
  className?: string;
  actions?: React.ReactNode;
  meta?: React.ReactNode;
};

function formatDate(input: string) {
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return input;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function ReviewCard({
  rating,
  comment,
  createdAt,
  updatedAt,
  className,
  actions,
  meta,
}: ReviewCardProps) {
  const createdLabel = formatDate(createdAt);
  const updatedLabel = updatedAt && updatedAt !== createdAt ? formatDate(updatedAt) : null;

  return (
    <Card className={cn("border bg-card transition-colors hover:bg-card/80", className)}>
      <CardContent className="space-y-3 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <StarRating value={rating} readOnly ariaLabel={`Rating ${rating} out of 5`} />
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" />
                {createdLabel}
              </span>
              {updatedLabel ? <span className="text-muted-foreground/70">(edited {updatedLabel})</span> : null}
              {meta}
            </div>
          </div>
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </div>

        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
          {comment}
        </p>
      </CardContent>
    </Card>
  );
}

