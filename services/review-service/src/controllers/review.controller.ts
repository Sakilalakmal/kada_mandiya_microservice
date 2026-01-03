import type { Request, Response as ExpressResponse } from "express";
import { z } from "zod";
import {
  createReview,
  getProductRatingAggregate,
  listReviewsByProductId,
  listReviewsByUserId,
  softDeleteReviewByIdForUser,
  updateReviewByIdForUser,
} from "../repositories/review.repo";

function requireUserId(req: Request, res: ExpressResponse): string | null {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({
      ok: false,
      error: { code: "UNAUTHORIZED", message: "Missing authenticated user." },
    });
    return null;
  }
  return userId;
}

function orderServiceBaseUrl() {
  return process.env.ORDER_SERVICE_URL ?? "http://localhost:4006";
}

function buildOrderUrl(pathname: string) {
  const base = orderServiceBaseUrl();
  const normalizedBase = base.endsWith("/") ? base : `${base}/`;
  const relative = pathname.replace(/^\/+/, "");
  return new URL(relative, normalizedBase).toString();
}

type OrderItem = { productId: string };
type OrderDetails = { items?: OrderItem[] };
type OrderServiceResponse = { ok: boolean; order?: OrderDetails };

async function fetchOrderForUser(userId: string, orderId: string) {
  const tryUrls = [buildOrderUrl(`/orders/${orderId}`), buildOrderUrl(`/${orderId}`)];

  let last: globalThis.Response | null = null;
  for (const url of tryUrls) {
    const r = await fetch(url, { method: "GET", headers: { "x-user-id": userId } }).catch(
      () => null
    );
    if (!r) continue;
    last = r;
    if (r.status === 404 && url.includes("/orders/")) continue;
    return r;
  }
  return last;
}

const CreateReviewSchema = z
  .object({
    productId: z.string().min(1),
    orderId: z.string().min(1),
    rating: z.number().int().min(1).max(5),
    comment: z.string().min(1).max(1000),
  })
  .strict();

const ReviewIdSchema = z.string().uuid();

const UpdateReviewSchema = z
  .object({
    rating: z.number().int().min(1).max(5).optional(),
    comment: z.string().min(1).max(1000).optional(),
  })
  .strict()
  .refine((v) => Object.keys(v).length > 0, {
    message: "At least one field must be provided.",
  });

const ProductIdSchema = z.string().min(1);

export async function createNewReview(req: Request, res: ExpressResponse) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const parsed = CreateReviewSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return res.status(400).json({
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid review payload.",
          details: parsed.error.flatten(),
        },
      });
    }

    const orderResp = await fetchOrderForUser(userId, parsed.data.orderId);
    if (!orderResp) {
      return res.status(502).json({
        ok: false,
        error: { code: "BAD_GATEWAY", message: "order-service unreachable." },
      });
    }

    if (orderResp.status === 400) {
      return res.status(400).json({
        ok: false,
        error: { code: "VALIDATION_ERROR", message: "Invalid orderId." },
      });
    }

    if (orderResp.status === 404 || orderResp.status === 403) {
      return res.status(403).json({
        ok: false,
        error: {
          code: "NOT_PURCHASED",
          message: "You can only review products you've purchased.",
        },
      });
    }

    if (!orderResp.ok) {
      const text = await orderResp.text().catch(() => "");
      console.error("order-service error:", orderResp.status, text);
      return res.status(502).json({
        ok: false,
        error: { code: "BAD_GATEWAY", message: "order-service error." },
      });
    }

    const data = (await orderResp.json().catch(() => null)) as OrderServiceResponse | null;
    if (!data?.ok || !data.order) {
      return res.status(502).json({
        ok: false,
        error: { code: "BAD_GATEWAY", message: "order-service returned invalid response." },
      });
    }

    const items = data.order.items ?? [];
    const hasProduct = items.some((it) => String(it.productId) === parsed.data.productId);
    if (!hasProduct) {
      return res.status(403).json({
        ok: false,
        error: {
          code: "NOT_PURCHASED",
          message: "You can only review products you've purchased.",
        },
      });
    }

    try {
      const reviewId = await createReview({
        userId,
        productId: parsed.data.productId,
        orderId: parsed.data.orderId,
        rating: parsed.data.rating,
        comment: parsed.data.comment,
      });

      return res.status(201).json({ ok: true, message: "Review created", reviewId });
    } catch (err: any) {
      if (err?.number === 2627 || err?.number === 2601) {
        return res.status(409).json({
          ok: false,
          error: {
            code: "REVIEW_ALREADY_EXISTS",
            message: "You already reviewed this purchase.",
          },
        });
      }
      throw err;
    }
  } catch (err) {
    console.error("createNewReview error:", err);
    return res.status(500).json({ ok: false, error: { code: "SERVER_ERROR", message: "Server error" } });
  }
}

export async function patchReview(req: Request, res: ExpressResponse) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const idParsed = ReviewIdSchema.safeParse(req.params.reviewId);
    if (!idParsed.success) {
      return res.status(400).json({
        ok: false,
        error: { code: "VALIDATION_ERROR", message: "Invalid reviewId." },
      });
    }

    const parsed = UpdateReviewSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return res.status(400).json({
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid review update payload.",
          details: parsed.error.flatten(),
        },
      });
    }

    const state = await updateReviewByIdForUser(userId, idParsed.data, parsed.data);
    if (state === "not_found") {
      return res.status(404).json({
        ok: false,
        error: { code: "NOT_FOUND", message: "Review not found." },
      });
    }
    if (state === "deleted") {
      return res.status(400).json({
        ok: false,
        error: { code: "REVIEW_DELETED", message: "Cannot edit a deleted review." },
      });
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error("patchReview error:", err);
    return res.status(500).json({ ok: false, error: { code: "SERVER_ERROR", message: "Server error" } });
  }
}

export async function deleteReview(req: Request, res: ExpressResponse) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const idParsed = ReviewIdSchema.safeParse(req.params.reviewId);
    if (!idParsed.success) {
      return res.status(400).json({
        ok: false,
        error: { code: "VALIDATION_ERROR", message: "Invalid reviewId." },
      });
    }

    const result = await softDeleteReviewByIdForUser(userId, idParsed.data);
    if (result === "not_found") {
      return res.status(404).json({
        ok: false,
        error: { code: "NOT_FOUND", message: "Review not found." },
      });
    }

    if (result === "already_deleted") {
      return res.json({ ok: true, message: "Already deleted" });
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error("deleteReview error:", err);
    return res.status(500).json({ ok: false, error: { code: "SERVER_ERROR", message: "Server error" } });
  }
}

const PaginationSchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(50).default(10),
  })
  .strict();

export async function getProductReviews(req: Request, res: ExpressResponse) {
  try {
    const productParsed = ProductIdSchema.safeParse(req.params.productId);
    if (!productParsed.success) {
      return res.status(400).json({
        ok: false,
        error: { code: "VALIDATION_ERROR", message: "Invalid productId." },
      });
    }

    const pageParsed = PaginationSchema.safeParse(req.query ?? {});
    if (!pageParsed.success) {
      return res.status(400).json({
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid pagination params.",
          details: pageParsed.error.flatten(),
        },
      });
    }

    const { total, reviews } = await listReviewsByProductId(
      productParsed.data,
      pageParsed.data.page,
      pageParsed.data.pageSize
    );

    return res.json({
      ok: true,
      page: pageParsed.data.page,
      pageSize: pageParsed.data.pageSize,
      total,
      reviews,
    });
  } catch (err) {
    console.error("getProductReviews error:", err);
    return res.status(500).json({ ok: false, error: { code: "SERVER_ERROR", message: "Server error" } });
  }
}

export async function getMyReviews(req: Request, res: ExpressResponse) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const includeDeleted =
      String((req.query as any)?.includeDeleted ?? "false").toLowerCase() === "true";

    const reviews = await listReviewsByUserId(userId, includeDeleted);
    return res.json({ ok: true, reviews });
  } catch (err) {
    console.error("getMyReviews error:", err);
    return res.status(500).json({ ok: false, error: { code: "SERVER_ERROR", message: "Server error" } });
  }
}

export async function getProductRating(req: Request, res: ExpressResponse) {
  try {
    const productParsed = ProductIdSchema.safeParse(req.params.productId);
    if (!productParsed.success) {
      return res.status(400).json({
        ok: false,
        error: { code: "VALIDATION_ERROR", message: "Invalid productId." },
      });
    }

    const { avgRating, reviewCount } = await getProductRatingAggregate(productParsed.data);
    return res.json({ ok: true, productId: productParsed.data, avgRating, reviewCount });
  } catch (err) {
    console.error("getProductRating error:", err);
    return res.status(500).json({ ok: false, error: { code: "SERVER_ERROR", message: "Server error" } });
  }
}
