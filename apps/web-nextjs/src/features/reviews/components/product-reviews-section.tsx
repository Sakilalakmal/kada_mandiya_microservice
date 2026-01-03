"use client";

import Link from "next/link";
import * as React from "react";
import { MessageCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

import { useProductRatingQuery } from "../queries";
import { RatingSummaryCard } from "./rating-summary-card";
import { ReviewList } from "./review-list";
import { WriteReviewDialog } from "./write-review-dialog";
import { YourReviews } from "./your-reviews";

type ProductReviewsSectionProps = {
  productId: string;
  className?: string;
};

export function ProductReviewsSection({ productId, className }: ProductReviewsSectionProps) {
  const { token } = useAuth();
  const ratingQuery = useProductRatingQuery(productId);

  const [page, setPage] = React.useState(1);
  const pageSize = 10;

  React.useEffect(() => {
    setPage(1);
  }, [productId]);

  return (
    <section className={cn("space-y-6", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border bg-background">
              <MessageCircle className="h-4 w-4" />
            </div>
            <h2 className="text-xl font-semibold tracking-tight text-foreground">Ratings & reviews</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            See what others are saying and share your experience.
          </p>
        </div>

        {token ? (
          <WriteReviewDialog productId={productId} onCreated={() => setPage(1)} />
        ) : (
          <Button asChild variant="outline" className="active:scale-95">
            <Link href="/login">Login to review</Link>
          </Button>
        )}
      </div>

      <RatingSummaryCard
        avgRating={ratingQuery.data?.avgRating ?? 0}
        reviewCount={ratingQuery.data?.reviewCount ?? 0}
        isLoading={ratingQuery.isLoading}
      />

      {token ? (
        <>
          <YourReviews productId={productId} />
          <Separator />
        </>
      ) : null}

      <ReviewList productId={productId} page={page} pageSize={pageSize} onPageChange={setPage} />
    </section>
  );
}

