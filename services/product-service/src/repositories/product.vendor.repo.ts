import { getPool, sql } from "../db/pool";

export type CreateProductInput = {
  name: string;
  description?: string;
  category?: string;
  price: number;
  currency?: string; // default LKR
  stockQty?: number;
  images?: string[]; // multiple image URLs
};

export type UpdateProductInput = {
  name?: string;
  description?: string;
  category?: string;
  price?: number;
  currency?: string;
  stockQty?: number;
  isActive?: boolean;

  // optional: replace all images in one go
  images?: string[];
};


const trimOrNull = (v: any, max: number) => {
  if (typeof v !== "string") return null;
  const t = v.trim();
  if (!t) return null;
  return t.slice(0, max);
};

export async function createProductForVendor(params: {
  vendorUserId: string;
  vendorEmail: string | null;
  input: CreateProductInput;
}): Promise<{ productId: string }> {
  const pool = await getPool();

  const name = trimOrNull(params.input.name, 160);
  if (!name) throw new Error("name is required");

  const description = trimOrNull(params.input.description, 1200);
  const category = trimOrNull(params.input.category, 80);

  const price = Number(params.input.price);
  if (!Number.isFinite(price) || price <= 0) throw new Error("price must be > 0");

  const currency = trimOrNull(params.input.currency ?? "LKR", 10) ?? "LKR";

  const stockQtyRaw = params.input.stockQty ?? 0;
  const stockQty = Math.max(0, Math.floor(Number(stockQtyRaw)));
  if (!Number.isFinite(stockQty)) throw new Error("stockQty is invalid");

  const images = Array.isArray(params.input.images) ? params.input.images : [];
  const cleanImages = images
    .map((u) => trimOrNull(u, 500))
    .filter((u): u is string => !!u)
    .slice(0, 8); // limit to 8 images for sanity

  // Use a transaction so product + images are consistent
  const tx = new sql.Transaction(pool);
  await tx.begin();

  try {
    // Insert product and capture id
    const productInsert = await new sql.Request(tx)
      .input("vendorUserId", sql.UniqueIdentifier, params.vendorUserId)
      .input("vendorEmail", sql.NVarChar(255), params.vendorEmail ?? null)
      .input("name", sql.NVarChar(160), name)
      .input("description", sql.NVarChar(1200), description)
      .input("category", sql.NVarChar(80), category)
      .input("price", sql.Decimal(18, 2), price)
      .input("currency", sql.NVarChar(10), currency)
      .input("stockQty", sql.Int, stockQty)
      .query(`
        DECLARE @newId UNIQUEIDENTIFIER = NEWID();

        INSERT INTO products (
          id, vendor_user_id, vendor_email,
          name, description, category,
          price, currency, stock_qty,
          is_active, created_at, updated_at
        )
        VALUES (
          @newId, @vendorUserId, @vendorEmail,
          @name, @description, @category,
          @price, @currency, @stockQty,
          1, GETUTCDATE(), GETUTCDATE()
        );

        SELECT CONVERT(varchar(36), @newId) AS productId;
      `);

    const productId = productInsert.recordset?.[0]?.productId as string;

    // Insert images (if any)
    for (let i = 0; i < cleanImages.length; i++) {
      await new sql.Request(tx)
        .input("productId", sql.UniqueIdentifier, productId)
        .input("url", sql.NVarChar(500), cleanImages[i])
        .input("order", sql.Int, i)
        .query(`
          INSERT INTO product_images (product_id, image_url, sort_order)
          VALUES (@productId, @url, @order);
        `);
    }

    await tx.commit();
    return { productId };
  } catch (e) {
    await tx.rollback();
    throw e;
  }
}

export async function listMyProducts(vendorUserId: string) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("vendorUserId", sql.UniqueIdentifier, vendorUserId)
    .query(`
      SELECT
        CONVERT(varchar(36), p.id) AS id,
        p.name,
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
      WHERE p.vendor_user_id = @vendorUserId
      ORDER BY p.created_at DESC;
    `);

  return (result.recordset ?? []).map((r: any) => ({
    id: r.id,
    name: r.name,
    category: r.category ?? null,
    price: Number(r.price),
    currency: r.currency,
    stockQty: Number(r.stockQty),
    isActive: Boolean(r.isActive),
    thumbnailImageUrl: r.thumbnailImageUrl ?? null,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));
}


export async function updateProductForVendor(params: {
  vendorUserId: string;
  productId: string;
  patch: UpdateProductInput;
}): Promise<void> {
  const pool = await getPool();

  const name = trimOrNull(params.patch.name, 160);
  const description = trimOrNull(params.patch.description, 1200);
  const category = trimOrNull(params.patch.category, 80);

  const price =
    params.patch.price === undefined ? null : Number(params.patch.price);
  if (price !== null && (!Number.isFinite(price) || price <= 0)) {
    throw new Error("price must be > 0");
  }

  const currency =
    params.patch.currency === undefined
      ? null
      : trimOrNull(params.patch.currency, 10);

  const stockQty =
    params.patch.stockQty === undefined
      ? null
      : Math.max(0, Math.floor(Number(params.patch.stockQty)));
  if (stockQty !== null && !Number.isFinite(stockQty)) {
    throw new Error("stockQty is invalid");
  }

  const isActive =
    params.patch.isActive === undefined ? null : Boolean(params.patch.isActive);

  const images = Array.isArray(params.patch.images) ? params.patch.images : null;
  const cleanImages =
    images === null
      ? null
      : images
          .map((u) => trimOrNull(u, 500))
          .filter((u): u is string => !!u)
          .slice(0, 8);

  const tx = new sql.Transaction(pool);
  await tx.begin();

  try {
    // Ownership check + update product
    const updateResult = await new sql.Request(tx)
      .input("productId", sql.UniqueIdentifier, params.productId)
      .input("vendorUserId", sql.UniqueIdentifier, params.vendorUserId)
      .input("name", sql.NVarChar(160), name)
      .input("description", sql.NVarChar(1200), description)
      .input("category", sql.NVarChar(80), category)
      .input("price", sql.Decimal(18, 2), price)
      .input("currency", sql.NVarChar(10), currency)
      .input("stockQty", sql.Int, stockQty)
      .input("isActive", sql.Bit, isActive)
      .query(`
        UPDATE products
        SET
          name = COALESCE(@name, name),
          description = COALESCE(@description, description),
          category = COALESCE(@category, category),
          price = COALESCE(@price, price),
          currency = COALESCE(@currency, currency),
          stock_qty = COALESCE(@stockQty, stock_qty),
          is_active = COALESCE(@isActive, is_active),
          updated_at = GETUTCDATE()
        WHERE id = @productId
          AND vendor_user_id = @vendorUserId;

        SELECT @@ROWCOUNT AS affected;
      `);

    const affected = Number(updateResult.recordset?.[0]?.affected ?? 0);
    if (affected === 0) {
      throw new Error("Product not found or not owned by vendor");
    }

    // Replace images if provided
    if (cleanImages !== null) {
      await new sql.Request(tx)
        .input("productId", sql.UniqueIdentifier, params.productId)
        .query(`DELETE FROM product_images WHERE product_id = @productId;`);

      for (let i = 0; i < cleanImages.length; i++) {
        await new sql.Request(tx)
          .input("productId", sql.UniqueIdentifier, params.productId)
          .input("url", sql.NVarChar(500), cleanImages[i])
          .input("order", sql.Int, i)
          .query(`
            INSERT INTO product_images (product_id, image_url, sort_order)
            VALUES (@productId, @url, @order);
          `);
      }
    }

    await tx.commit();
  } catch (e) {
    await tx.rollback();
    throw e;
  }
}

export async function deactivateProductForVendor(params: {
  vendorUserId: string;
  productId: string;
}): Promise<void> {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("productId", sql.UniqueIdentifier, params.productId)
    .input("vendorUserId", sql.UniqueIdentifier, params.vendorUserId)
    .query(`
      UPDATE products
      SET is_active = 0, updated_at = GETUTCDATE()
      WHERE id = @productId
        AND vendor_user_id = @vendorUserId;

      SELECT @@ROWCOUNT AS affected;
    `);

  const affected = Number(result.recordset?.[0]?.affected ?? 0);
  if (affected === 0) {
    throw new Error("Product not found or not owned by vendor");
  }
}
