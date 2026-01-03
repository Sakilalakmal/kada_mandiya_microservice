"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, MessageSquare } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { useProductReviewsQuery } from "../queries";
import { ReviewCard } from "./review-card";

type ReviewListProps = {
  productId: string;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  className?: string;
};

export function ReviewList({ productId, page, pageSize, onPageChange, className }: ReviewListProps) {
  const query = useProductReviewsQuery(productId, page, pageSize);
  const reviews = query.data?.reviews ?? [];
  const total = Number(query.data?.total ?? 0);
  const canPrev = page > 1;
  const canNext = page * pageSize < total;

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <p className="text-sm font-medium text-foreground">Reviews</p>
          <p className="text-xs text-muted-foreground">
            {total > 0 ? `Showing ${Math.min(total, (page - 1) * pageSize + 1)}-${Math.min(total, page * pageSize)} of ${total}` : "No reviews yet"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1 active:scale-95"
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={!canPrev || query.isFetching}
          >
            <ChevronLeft className="h-4 w-4" />
            Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1 active:scale-95"
            onClick={() => onPageChange(page + 1)}
            disabled={!canNext || query.isFetching}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {query.isLoading ? (
        <div className="grid gap-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <Card key={idx} className="border bg-card">
              <CardContent className="space-y-3 p-5">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : query.isError ? (
        <Card className="border bg-card">
          <CardContent className="space-y-3 p-5">
            <p className="text-sm font-medium text-foreground">Failed to load reviews</p>
            <p className="text-sm text-muted-foreground">
              Please try again.
            </p>
            <Button variant="outline" size="sm" onClick={() => query.refetch()} className="active:scale-95">
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : total === 0 ? (
        <Empty className="rounded-xl border bg-card/50">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <MessageSquare className="h-5 w-5" />
            </EmptyMedia>
            <EmptyTitle>No reviews yet</EmptyTitle>
            <EmptyDescription>Be the first to share how this product was.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent />
        </Empty>
      ) : (
        <div className="grid gap-3">
          {reviews.map((r) => (
            <ReviewCard
              key={r.reviewId}
              rating={r.rating}
              comment={r.comment}
              createdAt={r.createdAt}
              updatedAt={r.updatedAt}
            />
          ))}
        </div>
      )}

      {query.isFetching && !query.isLoading ? (
        <p className="text-xs text-muted-foreground">Updating…</p>
      ) : null}
    </div>
  );
}

