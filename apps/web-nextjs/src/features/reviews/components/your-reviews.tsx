"use client";

import * as React from "react";
import { BadgeCheck } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { useMyReviewsQuery } from "../queries";
import { DeleteReviewAlert } from "./delete-review-alert";
import { EditReviewDialog } from "./edit-review-dialog";
import { ReviewCard } from "./review-card";

type YourReviewsProps = {
  productId: string;
  className?: string;
};

export function YourReviews({ productId, className }: YourReviewsProps) {
  const meQuery = useMyReviewsQuery(false);

  const yourReviews = React.useMemo(() => {
    const all = meQuery.data ?? [];
    return all.filter((r) => r.productId === productId);
  }, [meQuery.data, productId]);

  if (meQuery.isLoading) {
    return (
      <div className={cn("space-y-3", className)}>
        <p className="text-sm font-medium text-foreground">Your review</p>
        <Card className="border bg-card">
          <CardContent className="space-y-3 p-5">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (meQuery.isError) {
    return (
      <div className={cn("space-y-3", className)}>
        <p className="text-sm font-medium text-foreground">Your review</p>
        <Card className="border bg-card">
          <CardContent className="space-y-2 p-5">
            <p className="text-sm text-foreground">Couldn&apos;t load your reviews.</p>
            <p className="text-sm text-muted-foreground">Please try again.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (yourReviews.length === 0) {
    return (
      <div className={cn("space-y-3", className)}>
        <p className="text-sm font-medium text-foreground">Your review</p>
        <Card className="border bg-card/60">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-background">
              <BadgeCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">No review from you yet</p>
              <p className="text-sm text-muted-foreground">
                If you purchased this product, you can write a review above.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <p className="text-sm font-medium text-foreground">
        Your review{yourReviews.length === 1 ? "" : "s"}
      </p>
      <div className="grid gap-3">
        {yourReviews.map((r) => (
          <ReviewCard
            key={r.reviewId}
            rating={r.rating}
            comment={r.comment}
            createdAt={r.createdAt}
            updatedAt={r.updatedAt}
            meta={
              <span className="text-muted-foreground/70">
                Order <span className="font-mono">{r.orderId}</span>
              </span>
            }
            actions={
              <div className="flex items-center gap-2">
                <EditReviewDialog
                  reviewId={r.reviewId}
                  productId={productId}
                  rating={r.rating}
                  comment={r.comment}
                />
                <DeleteReviewAlert reviewId={r.reviewId} productId={productId} />
              </div>
            }
          />
        ))}
      </div>
    </div>
  );
}

