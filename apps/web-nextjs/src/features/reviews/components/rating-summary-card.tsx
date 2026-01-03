"use client";

import * as React from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { StarRating } from "./star-rating";

type RatingSummaryCardProps = {
  avgRating: number;
  reviewCount: number;
  isLoading?: boolean;
  className?: string;
};

export function RatingSummaryCard({
  avgRating,
  reviewCount,
  isLoading,
  className,
}: RatingSummaryCardProps) {
  const safeAvg = Number.isFinite(avgRating) ? avgRating : 0;
  const safeCount = Number.isFinite(reviewCount) ? reviewCount : 0;

  return (
    <Card className={cn("border bg-card/60", className)}>
      <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">Customer reviews</p>
          {isLoading ? (
            <Skeleton className="h-7 w-32" />
          ) : (
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-semibold tracking-tight">{safeAvg.toFixed(1)}</p>
              <p className="text-sm text-muted-foreground">
                ({safeCount} review{safeCount === 1 ? "" : "s"})
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {isLoading ? (
            <Skeleton className="h-5 w-28" />
          ) : (
            <StarRating value={safeAvg} readOnly ariaLabel={`Average rating ${safeAvg.toFixed(1)} out of 5`} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

