"use client";

import Link from "next/link";
import * as React from "react";
import { ArrowLeft, LogIn, NotebookText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/use-auth";

import { useMyReviewsQuery } from "@/features/reviews/queries";
import { ReviewCard } from "@/features/reviews/components/review-card";
import { EditReviewDialog } from "@/features/reviews/components/edit-review-dialog";
import { DeleteReviewAlert } from "@/features/reviews/components/delete-review-alert";

export default function MyReviewsPage() {
  const { token } = useAuth();
  const [includeDeleted, setIncludeDeleted] = React.useState(false);
  const query = useMyReviewsQuery(includeDeleted);

  if (!token) {
    return (
      <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-6 py-10 sm:px-10">
        <div className="flex items-center justify-between gap-3">
          <Button asChild variant="ghost" className="gap-2 pl-0">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              Home
            </Link>
          </Button>
        </div>
        <Card className="border bg-card">
          <CardHeader>
            <CardTitle className="text-xl">My reviews</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">Login to see and manage your reviews.</p>
            <Button asChild className="gap-2 active:scale-95">
              <Link href="/login">
                <LogIn className="h-4 w-4" />
                Login
              </Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const reviews = query.data ?? [];

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-6 py-10 sm:px-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" className="gap-2 pl-0">
              <Link href="/products">
                <ArrowLeft className="h-4 w-4" />
                Products
              </Link>
            </Button>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">My reviews</h1>
          <p className="text-sm text-muted-foreground">Manage the reviews you&apos;ve written.</p>
        </div>

        <div className="flex items-center gap-3 rounded-xl border bg-card/60 px-4 py-3">
          <div className="space-y-0.5">
            <Label className="text-sm font-medium" htmlFor="includeDeleted">
              Include deleted
            </Label>
            <p className="text-xs text-muted-foreground">Show reviews you&apos;ve removed from public view.</p>
          </div>
          <Switch
            id="includeDeleted"
            checked={includeDeleted}
            onCheckedChange={(v) => setIncludeDeleted(Boolean(v))}
          />
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
            <p className="text-sm font-medium text-foreground">Failed to load your reviews</p>
            <p className="text-sm text-muted-foreground">Please try again.</p>
            <Button variant="outline" size="sm" onClick={() => query.refetch()} className="active:scale-95">
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : reviews.length === 0 ? (
        <Empty className="rounded-xl border bg-card/50">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <NotebookText className="h-5 w-5" />
            </EmptyMedia>
            <EmptyTitle>No reviews yet</EmptyTitle>
            <EmptyDescription>
              Your reviews will show up here after you rate a purchased product.
            </EmptyDescription>
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
              meta={
                <span className="text-muted-foreground/70">
                  <Link
                    href={`/products/${encodeURIComponent(r.productId)}`}
                    className="underline underline-offset-4 hover:text-foreground"
                  >
                    Product
                  </Link>{" "}
                  <span className="font-mono">{r.productId}</span> · Order{" "}
                  <span className="font-mono">{r.orderId}</span>
                  {r.isDeleted ? <span className="ml-2">(deleted)</span> : null}
                </span>
              }
              actions={
                r.isDeleted ? null : (
                  <div className="flex items-center gap-2">
                    <EditReviewDialog
                      reviewId={r.reviewId}
                      productId={r.productId}
                      rating={r.rating}
                      comment={r.comment}
                    />
                    <DeleteReviewAlert reviewId={r.reviewId} productId={r.productId} />
                  </div>
                )
              }
            />
          ))}
        </div>
      )}
    </main>
  );
}

