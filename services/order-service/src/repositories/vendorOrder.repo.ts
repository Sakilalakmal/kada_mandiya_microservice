import { getPool, sql } from "../db/pool";
import type { OrderStatus } from "./order.repo";

export type VendorOrderItem = {
  itemId: string;
  productId: string;
  title: string;
  imageUrl: string | null;
  unitPrice: number;
  qty: number;
  lineTotal: number;
  createdAt: string;
};

export type VendorOrderListItem = {
  orderId: string;
  status: OrderStatus;
  subtotal: number;
  createdAt: string;
  itemsForThisVendor: VendorOrderItem[];
};

export async function listOrdersForVendor(vendorId: string): Promise<VendorOrderListItem[]> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("vendorId", sql.VarChar(100), vendorId).query(`
      SELECT
        CONVERT(varchar(36), o.order_id) AS orderId,
        o.status AS status,
        o.subtotal AS subtotal,
        CONVERT(varchar(33), o.created_at, 127) AS createdAt,
        CONVERT(varchar(36), i.item_id) AS itemId,
        i.product_id AS productId,
        i.title AS title,
        i.image_url AS imageUrl,
        i.unit_price AS unitPrice,
        i.qty AS qty,
        i.line_total AS lineTotal,
        CONVERT(varchar(33), i.created_at, 127) AS itemCreatedAt
      FROM dbo.orders o
      INNER JOIN dbo.order_items i ON i.order_id = o.order_id
      WHERE i.vendor_id = @vendorId
      ORDER BY o.created_at DESC, i.created_at ASC;
    `);

  const rows = result.recordset as any[];
  const byOrderId = new Map<string, VendorOrderListItem>();

  for (const row of rows) {
    const orderId = String(row.orderId);
    const existing = byOrderId.get(orderId);
    const item: VendorOrderItem = {
      itemId: String(row.itemId),
      productId: String(row.productId),
      title: String(row.title),
      imageUrl: row.imageUrl === null || row.imageUrl === undefined ? null : String(row.imageUrl),
      unitPrice: Number(row.unitPrice),
      qty: Number(row.qty),
      lineTotal: Number(row.lineTotal),
      createdAt: String(row.itemCreatedAt),
    };

    if (existing) {
      existing.itemsForThisVendor.push(item);
      continue;
    }

    byOrderId.set(orderId, {
      orderId,
      status: row.status as OrderStatus,
      subtotal: Number(row.subtotal),
      createdAt: String(row.createdAt),
      itemsForThisVendor: [item],
    });
  }

  return Array.from(byOrderId.values());
}

export type VendorUpdateStatusResult = "updated" | "not_found" | "forbidden";

export async function updateOrderStatusForVendor(input: {
  vendorId: string;
  orderId: string;
  status: "PROCESSING" | "SHIPPED" | "DELIVERED";
}): Promise<VendorUpdateStatusResult> {
  const pool = await getPool();

  const updated = await pool
    .request()
    .input("vendorId", sql.VarChar(100), input.vendorId)
    .input("orderId", sql.UniqueIdentifier, input.orderId)
    .input("status", sql.VarChar(30), input.status).query(`
      UPDATE o
      SET status = @status, updated_at = SYSUTCDATETIME()
      FROM dbo.orders o
      WHERE o.order_id = @orderId
        AND EXISTS (
          SELECT 1 FROM dbo.order_items i
          WHERE i.order_id = o.order_id AND i.vendor_id = @vendorId
        );
    `);

  const affected = updated.rowsAffected?.[0] ?? 0;
  if (affected > 0) return "updated";

  const exists = await pool
    .request()
    .input("orderId", sql.UniqueIdentifier, input.orderId).query(`
      SELECT TOP 1 CONVERT(varchar(36), order_id) AS orderId
      FROM dbo.orders
      WHERE order_id = @orderId;
    `);

  const found = (exists.recordset as any[])?.[0]?.orderId;
  if (!found) return "not_found";
  return "forbidden";
}

