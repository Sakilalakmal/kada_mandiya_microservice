import { getPool, sql } from "../db/pool";

export type CartItemRow = {
  itemId: string;
  productId: string;
  vendorId: string | null;
  title: string;
  imageUrl: string | null;
  unitPrice: number;
  qty: number;
};

export type CartRow = {
  cartId: string;
  userId: string;
  items: CartItemRow[];
};

export async function getCartByUserId(userId: string): Promise<CartRow | null> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("userId", sql.VarChar(100), userId)
    .query(`
      SELECT
        c.cart_id AS cartId,
        c.user_id AS userId,
        ci.item_id AS itemId,
        ci.product_id AS productId,
        ci.vendor_id AS vendorId,
        ci.title AS title,
        ci.image_url AS imageUrl,
        ci.unit_price AS unitPrice,
        ci.qty AS qty
      FROM dbo.carts c
      LEFT JOIN dbo.cart_items ci ON ci.cart_id = c.cart_id
      WHERE c.user_id = @userId
      ORDER BY ci.created_at ASC;
    `);

  const rows = result.recordset as any[];
  if (rows.length === 0) return null;

  const first = rows[0];
  const cart: CartRow = {
    cartId: String(first.cartId),
    userId: String(first.userId),
    items: [],
  };

  for (const row of rows) {
    if (!row.itemId) continue;
    cart.items.push({
      itemId: String(row.itemId),
      productId: String(row.productId),
      vendorId: row.vendorId === null || row.vendorId === undefined ? null : String(row.vendorId),
      title: String(row.title),
      imageUrl: row.imageUrl === null || row.imageUrl === undefined ? null : String(row.imageUrl),
      unitPrice: Number(row.unitPrice),
      qty: Number(row.qty),
    });
  }

  return cart;
}

export async function getOrCreateCartId(userId: string): Promise<string> {
  const pool = await getPool();

  const existing = await pool
    .request()
    .input("userId", sql.VarChar(100), userId)
    .query(`SELECT cart_id AS cartId FROM dbo.carts WHERE user_id = @userId;`);

  const existingId = (existing.recordset as any[])?.[0]?.cartId;
  if (existingId) return String(existingId);

  try {
    const created = await pool
      .request()
      .input("userId", sql.VarChar(100), userId)
      .query(`INSERT INTO dbo.carts (user_id) OUTPUT inserted.cart_id AS cartId VALUES (@userId);`);
    return String((created.recordset as any[])?.[0]?.cartId);
  } catch (err: any) {
    if (err?.number === 2627 || err?.number === 2601) {
      const again = await pool
        .request()
        .input("userId", sql.VarChar(100), userId)
        .query(`SELECT cart_id AS cartId FROM dbo.carts WHERE user_id = @userId;`);
      const id = (again.recordset as any[])?.[0]?.cartId;
      if (id) return String(id);
    }
    throw err;
  }
}

export type AddItemPayload = {
  productId: string;
  qty: number;
  unitPrice: number;
  title: string;
  imageUrl?: string;
  vendorId?: string;
};

export async function addItem(userId: string, payload: AddItemPayload): Promise<void> {
  const pool = await getPool();
  const cartId = await getOrCreateCartId(userId);

  await pool
    .request()
    .input("cartId", sql.UniqueIdentifier, cartId)
    .input("productId", sql.VarChar(100), payload.productId)
    .input("vendorId", sql.VarChar(100), payload.vendorId ?? null)
    .input("title", sql.NVarChar(200), payload.title)
    .input("imageUrl", sql.NVarChar(500), payload.imageUrl ?? null)
    .input("unitPrice", sql.Decimal(18, 2), payload.unitPrice)
    .input("qty", sql.Int, payload.qty)
    .query(`
      MERGE dbo.cart_items AS target
      USING (SELECT @cartId AS cart_id, @productId AS product_id) AS source
        ON target.cart_id = source.cart_id AND target.product_id = source.product_id
      WHEN MATCHED THEN
        UPDATE SET
          qty = target.qty + @qty,
          vendor_id = @vendorId,
          title = @title,
          image_url = @imageUrl,
          unit_price = @unitPrice,
          updated_at = SYSUTCDATETIME()
      WHEN NOT MATCHED THEN
        INSERT (cart_id, product_id, vendor_id, title, image_url, unit_price, qty)
        VALUES (@cartId, @productId, @vendorId, @title, @imageUrl, @unitPrice, @qty);
    `);
}

export async function updateQty(userId: string, itemId: string, qty: number): Promise<boolean> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("userId", sql.VarChar(100), userId)
    .input("itemId", sql.UniqueIdentifier, itemId)
    .input("qty", sql.Int, qty)
    .query(`
      UPDATE ci
      SET qty = @qty, updated_at = SYSUTCDATETIME()
      FROM dbo.cart_items ci
      INNER JOIN dbo.carts c ON c.cart_id = ci.cart_id
      WHERE ci.item_id = @itemId AND c.user_id = @userId;
    `);

  const affected = result.rowsAffected?.[0] ?? 0;
  return affected > 0;
}

export async function removeItem(userId: string, itemId: string): Promise<boolean> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("userId", sql.VarChar(100), userId)
    .input("itemId", sql.UniqueIdentifier, itemId)
    .query(`
      DELETE ci
      FROM dbo.cart_items ci
      INNER JOIN dbo.carts c ON c.cart_id = ci.cart_id
      WHERE ci.item_id = @itemId AND c.user_id = @userId;
    `);

  const affected = result.rowsAffected?.[0] ?? 0;
  return affected > 0;
}

export async function clearCart(userId: string): Promise<void> {
  const pool = await getPool();
  const existing = await pool
    .request()
    .input("userId", sql.VarChar(100), userId)
    .query(`SELECT cart_id AS cartId FROM dbo.carts WHERE user_id = @userId;`);

  const cartId = (existing.recordset as any[])?.[0]?.cartId;
  if (!cartId) return;

  await pool
    .request()
    .input("cartId", sql.UniqueIdentifier, String(cartId))
    .query(`DELETE FROM dbo.cart_items WHERE cart_id = @cartId;`);
}

