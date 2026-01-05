import { getPool, sql } from "../db/pool";

export type StockRow = { productId: string; stockQty: number };

function normalizeQty(value: unknown) {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n) || n < 0) return 0;
  return n;
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

