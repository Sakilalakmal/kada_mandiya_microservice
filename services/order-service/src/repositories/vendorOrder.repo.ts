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
  vendorSubtotal: number;
  createdAt: string;
  itemsForThisVendor: VendorOrderItem[];
};

export type VendorOrderDetailItem = {
  productId: string;
  title: string;
  imageUrl: string | null;
  unitPrice: number;
  qty: number;
  lineTotal: number;
};

export type VendorOrderDetail = {
  orderId: string;
  status: OrderStatus;
  createdAt: string;
  deliveryAddress?: string;
  items: VendorOrderDetailItem[];
  vendorSubtotal: number;
};

export async function getVendorOrderById(input: {
  vendorId: string;
  orderId: string;
}): Promise<
  | { state: "found"; order: VendorOrderDetail }
  | { state: "not_found" }
  | { state: "forbidden" }
> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("vendorId", sql.VarChar(100), input.vendorId)
    .input("orderId", sql.UniqueIdentifier, input.orderId).query(`
      SELECT
        CONVERT(varchar(36), o.order_id) AS orderId,
        o.status AS status,
        CONVERT(varchar(33), o.created_at, 127) AS createdAt,
        SUM(i.line_total) OVER () AS vendorSubtotal,
        i.product_id AS productId,
        i.title AS title,
        i.image_url AS imageUrl,
        i.unit_price AS unitPrice,
        i.qty AS qty,
        i.line_total AS lineTotal
      FROM dbo.orders o
      INNER JOIN dbo.order_items i ON i.order_id = o.order_id
      WHERE o.order_id = @orderId AND i.vendor_id = @vendorId
      ORDER BY i.created_at ASC;
    `);

  const rows = result.recordset as any[];
  if (rows.length === 0) {
    const exists = await pool
      .request()
      .input("orderId", sql.UniqueIdentifier, input.orderId).query(`
        SELECT TOP 1 CONVERT(varchar(36), order_id) AS orderId
        FROM dbo.orders
        WHERE order_id = @orderId;
      `);

    const found = (exists.recordset as any[])?.[0]?.orderId;
    if (!found) return { state: "not_found" };
    return { state: "forbidden" };
  }

  const first = rows[0] ?? {};
  const order: VendorOrderDetail = {
    orderId: String(first.orderId ?? ""),
    status: first.status as OrderStatus,
    createdAt: String(first.createdAt ?? ""),
    items: rows.map((row) => ({
      productId: String(row.productId ?? ""),
      title: String(row.title ?? ""),
      imageUrl: row.imageUrl === null || row.imageUrl === undefined ? null : String(row.imageUrl),
      unitPrice: Number(row.unitPrice ?? 0),
      qty: Number(row.qty ?? 0),
      lineTotal: Number(row.lineTotal ?? 0),
    })),
    vendorSubtotal: Number(first.vendorSubtotal ?? 0),
  };

  return { state: "found", order };
}

export async function listOrdersForVendor(vendorId: string): Promise<VendorOrderListItem[]> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("vendorId", sql.VarChar(100), vendorId).query(`
      SELECT
        CONVERT(varchar(36), o.order_id) AS orderId,
        o.status AS status,
        o.subtotal AS subtotal,
        SUM(i.line_total) OVER (PARTITION BY o.order_id) AS vendorSubtotal,
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
      vendorSubtotal: Number(row.vendorSubtotal ?? row.subtotal),
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
}): Promise<
  | { state: "updated"; previousStatus: OrderStatus; newStatus: OrderStatus; occurredAt: string; userId: string }
  | { state: "not_found" }
  | { state: "forbidden" }
> {
  const pool = await getPool();

  const updated = await pool
    .request()
    .input("vendorId", sql.VarChar(100), input.vendorId)
    .input("orderId", sql.UniqueIdentifier, input.orderId)
    .input("status", sql.VarChar(30), input.status).query(`
      UPDATE o
      SET status = @status, updated_at = SYSUTCDATETIME()
      OUTPUT
        deleted.status AS previousStatus,
        inserted.status AS newStatus,
        inserted.user_id AS userId,
        CONVERT(varchar(33), inserted.updated_at, 127) AS occurredAt
      FROM dbo.orders o
      WHERE o.order_id = @orderId
        AND EXISTS (
          SELECT 1 FROM dbo.order_items i
          WHERE i.order_id = o.order_id AND i.vendor_id = @vendorId
        );
    `);

  const affected = updated.rowsAffected?.[0] ?? 0;
  if (affected > 0) {
    const row = (updated.recordset as any[])?.[0] ?? {};
    return {
      state: "updated",
      previousStatus: row.previousStatus as OrderStatus,
      newStatus: row.newStatus as OrderStatus,
      occurredAt: String(row.occurredAt ?? new Date().toISOString()),
      userId: String(row.userId ?? ""),
    };
  }

  const exists = await pool
    .request()
    .input("orderId", sql.UniqueIdentifier, input.orderId).query(`
      SELECT TOP 1 CONVERT(varchar(36), order_id) AS orderId
      FROM dbo.orders
      WHERE order_id = @orderId;
    `);

  const found = (exists.recordset as any[])?.[0]?.orderId;
  if (!found) return { state: "not_found" };
  return { state: "forbidden" };
}

