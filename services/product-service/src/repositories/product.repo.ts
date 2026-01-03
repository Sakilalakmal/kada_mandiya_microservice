import { getPool, sql } from "../db/pool";

export type ProductListItem = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  price: number;
  currency: string;
  stockQty: number;
  isActive: boolean;
  thumbnailImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ListProductsQuery = {
  page: number;
  limit: number;
  search?: string;
  category?: string;
};

export type ListProductsResult = {
  items: ProductListItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type ProductDetail = {
  id: string;
  vendorUserId: string;
  name: string;
  description: string | null;
  category: string | null;
  price: number;
  currency: string;
  stockQty: number;
  isActive: boolean;
  images: { id: string; imageUrl: string; sortOrder: number }[];
  createdAt: string;
  updatedAt: string;
};

export async function listProducts(
  query: ListProductsQuery
): Promise<ListProductsResult> {
  const pool = await getPool();

  const page = Math.max(1, Number(query.page || 1));
  const limit = Math.min(50, Math.max(1, Number(query.limit || 12)));
  const offset = (page - 1) * limit;

  const search = query.search?.trim() || null;
  const category = query.category?.trim() || null;

  // WHERE filter for public list: only active products
  // plus optional category/search
  const whereSql = `
    WHERE p.is_active = 1
      AND (@category IS NULL OR p.category = @category)
      AND (
        @search IS NULL
        OR p.name LIKE '%' + @search + '%'
        OR p.description LIKE '%' + @search + '%'
      )
  `;

  // 1) total count
  const countResult = await pool
    .request()
    .input("category", sql.NVarChar(80), category)
    .input("search", sql.NVarChar(160), search)
    .query(`
      SELECT COUNT(1) AS total
      FROM products p
      ${whereSql}
    `);

  const total = Number(countResult.recordset?.[0]?.total ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / limit));

  // 2) items with thumbnail (first image by sort_order)
  const itemsResult = await pool
    .request()
    .input("category", sql.NVarChar(80), category)
    .input("search", sql.NVarChar(160), search)
    .input("limit", sql.Int, limit)
    .input("offset", sql.Int, offset)
    .query(`
      SELECT
        CONVERT(varchar(36), p.id) AS id,
        p.name,
        p.description,
        p.category,
        p.price,
        p.currency,
        p.stock_qty AS stockQty,
        p.is_active AS isActive,
        img.thumbnailImageUrl,
        CONVERT(varchar(33), p.created_at, 127) AS createdAt,
        CONVERT(varchar(33), p.updated_at, 127) AS updatedAt
      FROM products p
      OUTER APPLY (
        SELECT TOP 1 image_url AS thumbnailImageUrl
        FROM product_images
        WHERE product_id = p.id
        ORDER BY sort_order ASC, created_at ASC
      ) img
      ${whereSql}
      ORDER BY p.created_at DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;
    `);

  const items = (itemsResult.recordset ?? []).map((r: any) => ({
    id: r.id,
    name: r.name,
    description: r.description ?? null,
    category: r.category ?? null,
    price: Number(r.price),
    currency: r.currency,
    stockQty: Number(r.stockQty),
    isActive: Boolean(r.isActive),
    thumbnailImageUrl: r.thumbnailImageUrl ?? null,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));

  return { items, page, limit, total, totalPages };
}

export async function getProductById(id: string): Promise<ProductDetail | null> {
  const pool = await getPool();

  // 1) product row
  const productResult = await pool
    .request()
    .input("id", sql.UniqueIdentifier, id)
    .query(`
      SELECT TOP 1
        CONVERT(varchar(36), id) AS id,
        CONVERT(varchar(36), vendor_user_id) AS vendorUserId,
        name,
        description,
        category,
        price,
        currency,
        stock_qty AS stockQty,
        is_active AS isActive,
        CONVERT(varchar(33), created_at, 127) AS createdAt,
        CONVERT(varchar(33), updated_at, 127) AS updatedAt
      FROM products
      WHERE id = @id
        AND is_active = 1
    `);

  const p = productResult.recordset?.[0];
  if (!p) return null;

  // 2) images
  const imagesResult = await pool
    .request()
    .input("id", sql.UniqueIdentifier, id)
    .query(`
      SELECT
        CONVERT(varchar(36), id) AS id,
        image_url AS imageUrl,
        sort_order AS sortOrder
      FROM product_images
      WHERE product_id = @id
      ORDER BY sort_order ASC, created_at ASC
    `);

  const images = (imagesResult.recordset ?? []).map((r: any) => ({
    id: r.id,
    imageUrl: r.imageUrl,
    sortOrder: Number(r.sortOrder),
  }));

  return {
    id: p.id,
    vendorUserId: p.vendorUserId,
    name: p.name,
    description: p.description ?? null,
    category: p.category ?? null,
    price: Number(p.price),
    currency: p.currency,
    stockQty: Number(p.stockQty),
    isActive: Boolean(p.isActive),
    images,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}