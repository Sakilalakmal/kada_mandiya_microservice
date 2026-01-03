import { getPool, sql } from "../db/pool";

export type CreateReviewInput = {
  userId: string;
  productId: string;
  orderId: string;
  rating: number;
  comment: string;
};

export async function createReview(input: CreateReviewInput): Promise<string> {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("userId", sql.VarChar(100), input.userId)
    .input("productId", sql.VarChar(100), input.productId)
    .input("orderId", sql.VarChar(100), input.orderId)
    .input("rating", sql.Int, input.rating)
    .input("comment", sql.NVarChar(1000), input.comment)
    .query(`
      DECLARE @out TABLE (review_id UNIQUEIDENTIFIER);

      -- If the user previously deleted the review for this purchase, restore it.
      UPDATE dbo.reviews
      SET
        is_deleted = 0,
        deleted_at = NULL,
        created_at = SYSUTCDATETIME(),
        rating = @rating,
        comment = @comment,
        updated_at = SYSUTCDATETIME()
      OUTPUT inserted.review_id INTO @out(review_id)
      WHERE user_id = @userId AND product_id = @productId AND order_id = @orderId AND is_deleted = 1;

      IF NOT EXISTS (SELECT 1 FROM @out)
      BEGIN
        INSERT INTO dbo.reviews (user_id, product_id, order_id, rating, comment, is_deleted)
        OUTPUT inserted.review_id INTO @out(review_id)
        VALUES (@userId, @productId, @orderId, @rating, @comment, 0);
      END

      SELECT CONVERT(varchar(36), review_id) AS reviewId FROM @out;
    `);

  const reviewId = (result.recordset as any[])?.[0]?.reviewId;
  if (!reviewId) throw new Error("Failed to create review");
  return String(reviewId);
}

export type ReviewOwnerState = "not_found" | "deleted" | "active";

export async function getReviewOwnerState(
  userId: string,
  reviewId: string
): Promise<ReviewOwnerState> {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("userId", sql.VarChar(100), userId)
    .input("reviewId", sql.UniqueIdentifier, reviewId)
    .query(`
      SELECT TOP 1 is_deleted AS isDeleted
      FROM dbo.reviews
      WHERE user_id = @userId AND review_id = @reviewId;
    `);

  const row = (result.recordset as any[])?.[0];
  if (!row) return "not_found";
  return row.isDeleted ? "deleted" : "active";
}

export type UpdateReviewPatch = {
  rating?: number;
  comment?: string;
};

export async function updateReviewByIdForUser(
  userId: string,
  reviewId: string,
  patch: UpdateReviewPatch
): Promise<ReviewOwnerState> {
  const state = await getReviewOwnerState(userId, reviewId);
  if (state !== "active") return state;

  const pool = await getPool();
  const rating = patch.rating === undefined ? null : patch.rating;
  const comment = patch.comment === undefined ? null : patch.comment;

  const updated = await pool
    .request()
    .input("userId", sql.VarChar(100), userId)
    .input("reviewId", sql.UniqueIdentifier, reviewId)
    .input("rating", sql.Int, rating)
    .input("comment", sql.NVarChar(1000), comment)
    .query(`
      UPDATE dbo.reviews
      SET
        rating = COALESCE(@rating, rating),
        comment = COALESCE(@comment, comment),
        updated_at = SYSUTCDATETIME()
      WHERE user_id = @userId AND review_id = @reviewId AND is_deleted = 0;
    `);

  const affected = updated.rowsAffected?.[0] ?? 0;
  if (affected > 0) return "active";

  // Handle rare races where a review changes state between reads.
  return getReviewOwnerState(userId, reviewId);
}

export type SoftDeleteResult = "not_found" | "already_deleted" | "deleted";

export async function softDeleteReviewByIdForUser(
  userId: string,
  reviewId: string
): Promise<SoftDeleteResult> {
  const state = await getReviewOwnerState(userId, reviewId);
  if (state === "not_found") return "not_found";
  if (state === "deleted") return "already_deleted";

  const pool = await getPool();
  await pool
    .request()
    .input("userId", sql.VarChar(100), userId)
    .input("reviewId", sql.UniqueIdentifier, reviewId)
    .query(`
      UPDATE dbo.reviews
      SET
        is_deleted = 1,
        deleted_at = SYSUTCDATETIME(),
        updated_at = SYSUTCDATETIME()
      WHERE user_id = @userId AND review_id = @reviewId AND is_deleted = 0;
    `);

  return "deleted";
}

export type ProductReview = {
  reviewId: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
};

export async function listReviewsByProductId(
  productId: string,
  page: number,
  pageSize: number
): Promise<{ total: number; reviews: ProductReview[] }> {
  const pool = await getPool();
  const offset = (page - 1) * pageSize;

  const result = await pool
    .request()
    .input("productId", sql.VarChar(100), productId)
    .input("offset", sql.Int, offset)
    .input("pageSize", sql.Int, pageSize)
    .query(`
      SELECT
        CONVERT(varchar(36), review_id) AS reviewId,
        user_id AS userId,
        rating,
        comment,
        CONVERT(varchar(33), created_at, 127) AS createdAt,
        CONVERT(varchar(33), updated_at, 127) AS updatedAt,
        COUNT(1) OVER() AS total
      FROM dbo.reviews
      WHERE product_id = @productId AND is_deleted = 0
      ORDER BY created_at DESC
      OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY;
    `);

  const rows = result.recordset as any[];
  const total = rows.length > 0 ? Number(rows[0].total) : 0;
  const reviews = rows.map((row) => ({
    reviewId: String(row.reviewId),
    userId: String(row.userId),
    rating: Number(row.rating),
    comment: String(row.comment),
    createdAt: String(row.createdAt),
    updatedAt: String(row.updatedAt),
  }));

  return { total, reviews };
}

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

export async function listReviewsByUserId(
  userId: string,
  includeDeleted: boolean
): Promise<MyReview[]> {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("userId", sql.VarChar(100), userId)
    .input("includeDeleted", sql.Bit, includeDeleted ? 1 : 0)
    .query(`
      SELECT
        CONVERT(varchar(36), review_id) AS reviewId,
        product_id AS productId,
        order_id AS orderId,
        rating,
        comment,
        is_deleted AS isDeleted,
        CONVERT(varchar(33), created_at, 127) AS createdAt,
        CONVERT(varchar(33), updated_at, 127) AS updatedAt
      FROM dbo.reviews
      WHERE user_id = @userId AND (@includeDeleted = 1 OR is_deleted = 0)
      ORDER BY created_at DESC;
    `);

  return (result.recordset as any[]).map((row) => ({
    reviewId: String(row.reviewId),
    productId: String(row.productId),
    orderId: String(row.orderId),
    rating: Number(row.rating),
    comment: String(row.comment),
    isDeleted: Boolean(row.isDeleted),
    createdAt: String(row.createdAt),
    updatedAt: String(row.updatedAt),
  }));
}

export async function getProductRatingAggregate(productId: string): Promise<{
  avgRating: number;
  reviewCount: number;
}> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("productId", sql.VarChar(100), productId)
    .query(`
      SELECT
        COALESCE(AVG(CAST(rating AS float)), 0) AS avgRating,
        COUNT(1) AS reviewCount
      FROM dbo.reviews
      WHERE product_id = @productId AND is_deleted = 0;
    `);

  const row = (result.recordset as any[])?.[0] ?? {};
  return { avgRating: Number(row.avgRating ?? 0), reviewCount: Number(row.reviewCount ?? 0) };
}
