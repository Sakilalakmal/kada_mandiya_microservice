import { apiFetch } from "@/lib/api";

export type ProductReview = {
  reviewId: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
};

export type ProductReviewsResponse = {
  ok: true;
  page: number;
  pageSize: number;
  total: number;
  reviews: ProductReview[];
};

export type ProductRatingResponse = {
  ok: true;
  productId: string;
  avgRating: number;
  reviewCount: number;
};

export type CreateReviewPayload = {
  productId: string;
  orderId: string;
  rating: number;
  comment: string;
};

export type CreateReviewResponse = {
  ok: true;
  message: string;
  reviewId: string;
};

export type UpdateReviewPayload = {
  rating?: number;
  comment?: string;
};

export type MyReview = {
  reviewId: string;
  productId: string;
  orderId: string;
  rating: number;
  comment: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
};

export async function getProductReviews(productId: string, page = 1, pageSize = 10) {
  const query = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  }).toString();

  return apiFetch<ProductReviewsResponse>(`/api/products/${encodeURIComponent(productId)}/reviews?${query}`, {
    method: "GET",
    auth: "none",
  });
}

export async function getProductRating(productId: string) {
  return apiFetch<ProductRatingResponse>(`/api/products/${encodeURIComponent(productId)}/rating`, {
    method: "GET",
    auth: "none",
  });
}

export async function createReview(payload: CreateReviewPayload) {
  return apiFetch<CreateReviewResponse>("/api/reviews", {
    method: "POST",
    body: payload,
    auth: "required",
  });
}

export async function updateReview(reviewId: string, payload: UpdateReviewPayload) {
  return apiFetch<{ ok: true }>(`/api/reviews/${encodeURIComponent(reviewId)}`, {
    method: "PATCH",
    body: payload,
    auth: "required",
  });
}

export async function deleteReview(reviewId: string) {
  return apiFetch<{ ok: true; message?: string }>(`/api/reviews/${encodeURIComponent(reviewId)}`, {
    method: "DELETE",
    auth: "required",
  });
}

export async function getMyReviews(includeDeleted = false) {
  const query = includeDeleted ? "?includeDeleted=true" : "";
  const data = await apiFetch<{ ok: true; reviews: MyReview[] }>(`/api/reviews/me${query}`, {
    method: "GET",
    auth: "required",
  });
  return data.reviews ?? [];
}

