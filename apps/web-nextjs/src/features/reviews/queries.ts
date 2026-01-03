"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { ApiError } from "@/lib/api";
import {
  createReview,
  deleteReview,
  getMyReviews,
  getProductRating,
  getProductReviews,
  updateReview,
  type MyReview,
  type ProductRatingResponse,
  type ProductReview,
  type ProductReviewsResponse,
} from "@/api/reviews";
import { toastApiError } from "@/components/ui/feedback";
import { useAuth } from "@/hooks/use-auth";

export const reviewsKeys = {
  product: (productId: string, page: number, pageSize: number) =>
    ["reviews", "product", productId, page, pageSize] as const,
  rating: (productId: string) => ["reviews", "rating", productId] as const,
  me: (includeDeleted: boolean) => ["reviews", "me", includeDeleted] as const,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readErrorCode(payload: unknown): string | null {
  if (!payload) return null;
  if (!isRecord(payload)) return null;
  const err = payload.error;
  if (!isRecord(err)) return null;
  const code = err.code;
  return typeof code === "string" ? code : null;
}

function isNotPurchasedError(err: unknown) {
  const apiErr = err as ApiError | undefined;
  return apiErr?.status === 403 && readErrorCode(apiErr?.payload) === "NOT_PURCHASED";
}

function findReviewRatingInCaches(
  productQueries: Array<[unknown, ProductReviewsResponse | undefined]>,
  meQueries: Array<[unknown, MyReview[] | undefined]>,
  reviewId: string
): number | null {
  for (const [, data] of productQueries) {
    const hit = data?.reviews?.find((r) => r.reviewId === reviewId);
    if (hit) return Number(hit.rating);
  }
  for (const [, data] of meQueries) {
    const hit = data?.find((r) => r.reviewId === reviewId);
    if (hit) return Number(hit.rating);
  }
  return null;
}

function optimisticApplyReviewUpdate(
  data: ProductReviewsResponse,
  reviewId: string,
  patch: Partial<Pick<ProductReview, "rating" | "comment">>
) {
  const now = new Date().toISOString();
  const reviews = (data.reviews ?? []).map((r) => {
    if (r.reviewId !== reviewId) return r;
    return {
      ...r,
      rating: patch.rating ?? r.rating,
      comment: patch.comment ?? r.comment,
      updatedAt: now,
    };
  });
  return { ...data, reviews };
}

function optimisticRemoveReview(data: ProductReviewsResponse, reviewId: string) {
  const reviews = (data.reviews ?? []).filter((r) => r.reviewId !== reviewId);
  const removed = reviews.length !== (data.reviews ?? []).length;
  const total = removed ? Math.max(0, Number(data.total ?? 0) - 1) : Number(data.total ?? 0);
  return { ...data, reviews, total };
}

function optimisticUpdateMeReview(
  data: MyReview[],
  reviewId: string,
  patch: Partial<Pick<MyReview, "rating" | "comment" | "isDeleted">>
) {
  const now = new Date().toISOString();
  return (data ?? []).map((r) => {
    if (r.reviewId !== reviewId) return r;
    return {
      ...r,
      rating: patch.rating ?? r.rating,
      comment: patch.comment ?? r.comment,
      isDeleted: patch.isDeleted ?? r.isDeleted,
      updatedAt: now,
    };
  });
}

function optimisticRemoveMeReview(data: MyReview[], reviewId: string) {
  return (data ?? []).filter((r) => r.reviewId !== reviewId);
}

export function useProductReviewsQuery(productId: string, page: number, pageSize: number) {
  return useQuery<ProductReviewsResponse>({
    queryKey: reviewsKeys.product(productId, page, pageSize),
    queryFn: () => getProductReviews(productId, page, pageSize),
    enabled: Boolean(productId),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
}

export function useProductRatingQuery(productId: string) {
  return useQuery<ProductRatingResponse>({
    queryKey: reviewsKeys.rating(productId),
    queryFn: () => getProductRating(productId),
    enabled: Boolean(productId),
    staleTime: 60_000,
    gcTime: 10 * 60_000,
  });
}

export function useMyReviewsQuery(includeDeleted = false) {
  const { token } = useAuth();
  return useQuery<MyReview[]>({
    queryKey: reviewsKeys.me(includeDeleted),
    queryFn: () => getMyReviews(includeDeleted),
    enabled: Boolean(token),
    staleTime: 30_000,
    gcTime: 10 * 60_000,
  });
}

export function useCreateReviewMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createReview,
    onSuccess: async (_data, vars) => {
      await queryClient.invalidateQueries({ queryKey: ["reviews", "product", vars.productId] });
      await queryClient.invalidateQueries({ queryKey: reviewsKeys.rating(vars.productId) });
      await queryClient.invalidateQueries({ queryKey: ["reviews", "me"] });
      toast.success("Review created");
    },
    onError: (err) => {
      if (isNotPurchasedError(err)) {
        return toast.error("You can only review products you purchased.");
      }
      toastApiError(err, "Failed to create review");
    },
  });
}

export function useUpdateReviewMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vars: { reviewId: string; productId: string; patch: { rating?: number; comment?: string } }) =>
      updateReview(vars.reviewId, vars.patch),
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey: ["reviews"] });

      const productQueries = queryClient.getQueriesData<ProductReviewsResponse>({
        queryKey: ["reviews", "product", vars.productId],
      });
      const meQueries = queryClient.getQueriesData<MyReview[]>({ queryKey: ["reviews", "me"] });
      const previousRating = queryClient.getQueryData<ProductRatingResponse>(reviewsKeys.rating(vars.productId));

      const oldRating = findReviewRatingInCaches(productQueries, meQueries, vars.reviewId);

      queryClient.setQueriesData<ProductReviewsResponse>(
        { queryKey: ["reviews", "product", vars.productId] },
        (old) => (old ? optimisticApplyReviewUpdate(old, vars.reviewId, vars.patch) : old)
      );

      queryClient.setQueriesData<MyReview[]>(
        { queryKey: ["reviews", "me"] },
        (old) => (old ? optimisticUpdateMeReview(old, vars.reviewId, vars.patch) : old)
      );

      if (vars.patch.rating !== undefined && previousRating && oldRating !== null) {
        const count = Number(previousRating.reviewCount ?? 0);
        const avg = Number(previousRating.avgRating ?? 0);
        if (count > 0) {
          const nextAvg = (avg * count - oldRating + vars.patch.rating) / count;
          queryClient.setQueryData<ProductRatingResponse>(reviewsKeys.rating(vars.productId), {
            ...previousRating,
            avgRating: Number(nextAvg.toFixed(2)),
          });
        }
      }

      return { productQueries, meQueries, previousRating };
    },
    onSuccess: () => {
      toast.success("Review updated");
    },
    onError: (err, vars, ctx) => {
      for (const [key, data] of ctx?.productQueries ?? []) queryClient.setQueryData(key, data);
      for (const [key, data] of ctx?.meQueries ?? []) queryClient.setQueryData(key, data);
      if (ctx?.previousRating) queryClient.setQueryData(reviewsKeys.rating(vars.productId), ctx.previousRating);
      toastApiError(err, "Failed to update review");
    },
    onSettled: async (_data, _err, vars) => {
      await queryClient.invalidateQueries({ queryKey: ["reviews", "product", vars.productId] });
      await queryClient.invalidateQueries({ queryKey: reviewsKeys.rating(vars.productId) });
      await queryClient.invalidateQueries({ queryKey: ["reviews", "me"] });
    },
  });
}

export function useDeleteReviewMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vars: { reviewId: string; productId: string }) => deleteReview(vars.reviewId),
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey: ["reviews"] });

      const productQueries = queryClient.getQueriesData<ProductReviewsResponse>({
        queryKey: ["reviews", "product", vars.productId],
      });
      const meQueries = queryClient.getQueriesData<MyReview[]>({ queryKey: ["reviews", "me"] });
      const previousRating = queryClient.getQueryData<ProductRatingResponse>(reviewsKeys.rating(vars.productId));

      const oldRating = findReviewRatingInCaches(productQueries, meQueries, vars.reviewId);

      queryClient.setQueriesData<ProductReviewsResponse>(
        { queryKey: ["reviews", "product", vars.productId] },
        (old) => (old ? optimisticRemoveReview(old, vars.reviewId) : old)
      );

      queryClient.setQueryData<MyReview[]>(reviewsKeys.me(false), (old) =>
        old ? optimisticRemoveMeReview(old, vars.reviewId) : old
      );
      queryClient.setQueryData<MyReview[]>(reviewsKeys.me(true), (old) =>
        old ? optimisticUpdateMeReview(old, vars.reviewId, { isDeleted: true }) : old
      );

      if (previousRating && oldRating !== null) {
        const count = Number(previousRating.reviewCount ?? 0);
        const avg = Number(previousRating.avgRating ?? 0);
        const nextCount = Math.max(0, count - 1);
        const nextAvg = nextCount > 0 ? (avg * count - oldRating) / nextCount : 0;
        queryClient.setQueryData<ProductRatingResponse>(reviewsKeys.rating(vars.productId), {
          ...previousRating,
          reviewCount: nextCount,
          avgRating: Number(nextAvg.toFixed(2)),
        });
      }

      return { productQueries, meQueries, previousRating };
    },
    onSuccess: () => {
      toast.success("Review deleted");
    },
    onError: (err, vars, ctx) => {
      for (const [key, data] of ctx?.productQueries ?? []) queryClient.setQueryData(key, data);
      for (const [key, data] of ctx?.meQueries ?? []) queryClient.setQueryData(key, data);
      if (ctx?.previousRating) queryClient.setQueryData(reviewsKeys.rating(vars.productId), ctx.previousRating);
      toastApiError(err, "Failed to delete review");
    },
    onSettled: async (_data, _err, vars) => {
      await queryClient.invalidateQueries({ queryKey: ["reviews", "product", vars.productId] });
      await queryClient.invalidateQueries({ queryKey: reviewsKeys.rating(vars.productId) });
      await queryClient.invalidateQueries({ queryKey: ["reviews", "me"] });
    },
  });
}
