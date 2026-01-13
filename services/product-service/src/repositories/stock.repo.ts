import { getPool, sql } from "../db/pool";

export type StockRow = { productId: string; stockQty: number };

function normalizeQty(value: unknown) {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n) || n < 0) return 0;
  return n;
}

export async function adjustStock(
  tx: sql.Transaction,
  params: { productId: string; deltaQty: number; reason: string }
): Promise<StockRow | null> {
  const delta = Math.trunc(Number(params.deltaQty));
  if (!Number.isFinite(delta) || delta === 0) return null;

  const result = await tx
    .request()
    .input("id", sql.UniqueIdentifier, params.productId)
    .input("delta", sql.Int, delta)
    .query(`
      UPDATE products
      SET stock_qty = stock_qty + @delta,
          updated_at = SYSUTCDATETIME()
      OUTPUT
        CONVERT(varchar(36), inserted.id) AS productId,
        inserted.stock_qty AS stockQty
      WHERE id = @id;
    `);

  const row = (result.recordset as any[])?.[0];
  if (!row) return null;
  return { productId: String(row.productId), stockQty: normalizeQty(row.stockQty) };
}

export async function adjustStockBulk(
  tx: sql.Transaction,
  params: { items: { productId: string; deltaQty: number }[]; reason: string }
): Promise<StockRow[]> {
  const normalized = params.items
    .map((item) => ({
      productId: String(item.productId ?? "").trim(),
      deltaQty: Math.trunc(Number(item.deltaQty)),
    }))
    .filter((item) => item.productId.length > 0 && Number.isFinite(item.deltaQty) && item.deltaQty !== 0);

  if (normalized.length === 0) return [];

  const itemsJson = JSON.stringify(normalized);

  const result = await tx
    .request()
    .input("itemsJson", sql.NVarChar(sql.MAX), itemsJson)
    .query(`
      DECLARE @items TABLE (
        product_id UNIQUEIDENTIFIER NOT NULL,
        delta_qty INT NOT NULL
      );

      INSERT INTO @items (product_id, delta_qty)
      SELECT
        productId,
        deltaQty
      FROM OPENJSON(@itemsJson)
      WITH (
        productId UNIQUEIDENTIFIER '$.productId',
        deltaQty INT '$.deltaQty'
      );

      UPDATE p
      SET
        stock_qty = p.stock_qty + i.delta_qty,
        updated_at = SYSUTCDATETIME()
      OUTPUT
        CONVERT(varchar(36), inserted.id) AS productId,
        inserted.stock_qty AS stockQty
      FROM products p
      INNER JOIN @items i ON i.product_id = p.id;
    `);

  return (result.recordset as any[]).map((r) => ({
    productId: String(r.productId),
    stockQty: normalizeQty(r.stockQty),
  }));
}

export async function getStockByProductIds(productIds: string[]): Promise<StockRow[]> {
  const unique = Array.from(new Set(productIds.filter((id) => typeof id === "string" && id.trim().length > 0)));
  if (unique.length === 0) return [];

  const pool = await getPool();
  const request = pool.request();

  const placeholders: string[] = [];
  unique.forEach((id, idx) => {
    const key = `id${idx}`;
    placeholders.push(`@${key}`);
    request.input(key, sql.UniqueIdentifier, id);
  });

  const result = await request.query(`
    SELECT
      CONVERT(varchar(36), id) AS productId,
      CASE WHEN is_active = 1 THEN stock_qty ELSE 0 END AS stockQty
    FROM products
    WHERE id IN (${placeholders.join(", ")});
  `);

  return (result.recordset ?? []).map((r: any) => ({
    productId: String(r.productId),
    stockQty: normalizeQty(r.stockQty),
  }));
}

export async function reserveStock(items: { productId: string; qty: number }[]): Promise<StockRow[]> {
  const pool = await getPool();
  const tx = new sql.Transaction(pool);
  await tx.begin();

  try {
    const updated: StockRow[] = [];

    for (const item of items) {
      const qty = normalizeQty(item.qty);
      if (qty <= 0) continue;

      const result = await tx
        .request()
        .input("id", sql.UniqueIdentifier, item.productId)
        .input("qty", sql.Int, qty)
        .query(`
          UPDATE products
          SET stock_qty = stock_qty - @qty,
              updated_at = SYSUTCDATETIME()
          OUTPUT
            CONVERT(varchar(36), inserted.id) AS productId,
            inserted.stock_qty AS stockQty
          WHERE id = @id AND is_active = 1 AND stock_qty >= @qty;
        `);

      const row = (result.recordset as any[])?.[0];
      if (!row) {
        const err = new Error("OUT_OF_STOCK");
        (err as any).productId = item.productId;
        throw err;
      }

      updated.push({ productId: String(row.productId), stockQty: normalizeQty(row.stockQty) });
    }

    await tx.commit();
    return updated;
  } catch (err) {
    await tx.rollback().catch(() => {});
    throw err;
  }
}

export async function releaseStock(items: { productId: string; qty: number }[]): Promise<StockRow[]> {
  const pool = await getPool();
  const tx = new sql.Transaction(pool);
  await tx.begin();

  try {
    const updated: StockRow[] = [];

    for (const item of items) {
      const qty = normalizeQty(item.qty);
      if (qty <= 0) continue;

      const result = await tx
        .request()
        .input("id", sql.UniqueIdentifier, item.productId)
        .input("qty", sql.Int, qty)
        .query(`
          UPDATE products
          SET stock_qty = stock_qty + @qty,
              updated_at = SYSUTCDATETIME()
          OUTPUT
            CONVERT(varchar(36), inserted.id) AS productId,
            inserted.stock_qty AS stockQty
          WHERE id = @id;
        `);

      const row = (result.recordset as any[])?.[0];
      if (row) updated.push({ productId: String(row.productId), stockQty: normalizeQty(row.stockQty) });
    }

    await tx.commit();
    return updated;
  } catch (err) {
    await tx.rollback().catch(() => {});
    throw err;
  }
}

