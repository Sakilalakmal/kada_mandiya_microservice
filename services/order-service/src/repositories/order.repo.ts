import { getPool, sql } from "../db/pool";

export type OrderStatus = "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";

export type CreateOrderItemInput = {
  productId: string;
  vendorId: string | null;
  title: string;
  imageUrl: string | null;
  unitPrice: number;
  qty: number;
  lineTotal: number;
};

export type CreateOrderInput = {
  userId: string;
  deliveryAddress: string;
  mobile: string | null;
  paymentMethod: string;
  subtotal: number;
  items: CreateOrderItemInput[];
};

export async function createOrderWithItems(input: CreateOrderInput) {
  const pool = await getPool();
  const tx = new sql.Transaction(pool);

  await tx.begin();
  try {
    const orderInserted = await tx
      .request()
      .input("userId", sql.VarChar(100), input.userId)
      .input("status", sql.VarChar(30), "PENDING")
      .input("paymentMethod", sql.VarChar(30), input.paymentMethod)
      .input("deliveryAddress", sql.NVarChar(300), input.deliveryAddress)
      .input("mobile", sql.VarChar(30), input.mobile)
      .input("subtotal", sql.Decimal(18, 2), input.subtotal).query(`
        INSERT INTO dbo.orders (user_id, status, payment_method, delivery_address, mobile, subtotal)
        OUTPUT
          CONVERT(varchar(36), inserted.order_id) AS orderId,
          CONVERT(varchar(33), inserted.created_at, 127) AS createdAt
        VALUES (@userId, @status, @paymentMethod, @deliveryAddress, @mobile, @subtotal);
      `);

    const insertedRow = (orderInserted.recordset as any[])?.[0] ?? {};
    const orderId = String(insertedRow.orderId ?? "");
    const createdAt = String(insertedRow.createdAt ?? "");
    if (!orderId) throw new Error("Failed to create order");
    if (!createdAt) throw new Error("Failed to read order createdAt");

    for (const item of input.items) {
      await tx
        .request()
        .input("orderId", sql.UniqueIdentifier, orderId)
        .input("productId", sql.VarChar(100), item.productId)
        .input("vendorId", sql.VarChar(100), item.vendorId)
        .input("title", sql.NVarChar(200), item.title)
        .input("imageUrl", sql.NVarChar(500), item.imageUrl)
        .input("unitPrice", sql.Decimal(18, 2), item.unitPrice)
        .input("qty", sql.Int, item.qty)
        .input("lineTotal", sql.Decimal(18, 2), item.lineTotal).query(`
          INSERT INTO dbo.order_items
            (order_id, product_id, vendor_id, title, image_url, unit_price, qty, line_total)
          VALUES
            (@orderId, @productId, @vendorId, @title, @imageUrl, @unitPrice, @qty, @lineTotal);
        `);
    }

    await tx.commit();
    return { orderId, createdAt };
  } catch (err) {
    await tx.rollback().catch(() => {});
    throw err;
  }
}

export type OrderListItem = {
  orderId: string;
  status: OrderStatus;
  subtotal: number;
  createdAt: string;
};

export async function listOrdersByUserId(userId: string): Promise<OrderListItem[]> {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("userId", sql.VarChar(100), userId).query(`
      SELECT
        CONVERT(varchar(36), order_id) AS orderId,
        status,
        subtotal,
        CONVERT(varchar(33), created_at, 127) AS createdAt
      FROM dbo.orders
      WHERE user_id = @userId
      ORDER BY created_at DESC;
    `);

  return (result.recordset as any[]).map((row) => ({
    orderId: String(row.orderId),
    status: row.status as OrderStatus,
    subtotal: Number(row.subtotal),
    createdAt: String(row.createdAt),
  }));
}

export type OrderItem = {
  itemId: string;
  productId: string;
  vendorId: string | null;
  title: string;
  imageUrl: string | null;
  unitPrice: number;
  qty: number;
  lineTotal: number;
  createdAt: string;
};

export type OrderDetails = {
  orderId: string;
  userId: string;
  status: OrderStatus;
  paymentMethod: string;
  deliveryAddress: string;
  mobile: string | null;
  subtotal: number;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
};

export async function getOrderByIdForUser(userId: string, orderId: string): Promise<OrderDetails | null> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("userId", sql.VarChar(100), userId)
    .input("orderId", sql.UniqueIdentifier, orderId).query(`
      SELECT
        CONVERT(varchar(36), o.order_id) AS orderId,
        o.user_id AS userId,
        o.status AS status,
        o.payment_method AS paymentMethod,
        o.delivery_address AS deliveryAddress,
        o.mobile AS mobile,
        o.subtotal AS subtotal,
        CONVERT(varchar(33), o.created_at, 127) AS createdAt,
        CONVERT(varchar(33), o.updated_at, 127) AS updatedAt,
        CONVERT(varchar(36), i.item_id) AS itemId,
        i.product_id AS productId,
        i.vendor_id AS vendorId,
        i.title AS title,
        i.image_url AS imageUrl,
        i.unit_price AS unitPrice,
        i.qty AS qty,
        i.line_total AS lineTotal,
        CONVERT(varchar(33), i.created_at, 127) AS itemCreatedAt
      FROM dbo.orders o
      LEFT JOIN dbo.order_items i ON i.order_id = o.order_id
      WHERE o.user_id = @userId AND o.order_id = @orderId
      ORDER BY i.created_at ASC;
    `);

  const rows = result.recordset as any[];
  if (rows.length === 0) return null;

  const first = rows[0];
  const order: OrderDetails = {
    orderId: String(first.orderId),
    userId: String(first.userId),
    status: first.status as OrderStatus,
    paymentMethod: String(first.paymentMethod),
    deliveryAddress: String(first.deliveryAddress),
    mobile: first.mobile === null || first.mobile === undefined ? null : String(first.mobile),
    subtotal: Number(first.subtotal),
    createdAt: String(first.createdAt),
    updatedAt: String(first.updatedAt),
    items: [],
  };

  for (const row of rows) {
    if (!row.itemId) continue;
    order.items.push({
      itemId: String(row.itemId),
      productId: String(row.productId),
      vendorId: row.vendorId === null || row.vendorId === undefined ? null : String(row.vendorId),
      title: String(row.title),
      imageUrl: row.imageUrl === null || row.imageUrl === undefined ? null : String(row.imageUrl),
      unitPrice: Number(row.unitPrice),
      qty: Number(row.qty),
      lineTotal: Number(row.lineTotal),
      createdAt: String(row.itemCreatedAt),
    });
  }

  return order;
}

export type CancelOrderResult =
  | { state: "cancelled"; previousStatus: OrderStatus; newStatus: OrderStatus; occurredAt: string }
  | { state: "not_found" }
  | { state: "not_pending" };

export async function cancelPendingOrder(userId: string, orderId: string): Promise<CancelOrderResult> {
  const pool = await getPool();

  const updated = await pool
    .request()
    .input("userId", sql.VarChar(100), userId)
    .input("orderId", sql.UniqueIdentifier, orderId).query(`
      UPDATE dbo.orders
      SET status = 'CANCELLED', updated_at = SYSUTCDATETIME()
      OUTPUT
        deleted.status AS previousStatus,
        inserted.status AS newStatus,
        CONVERT(varchar(33), inserted.updated_at, 127) AS occurredAt
      WHERE user_id = @userId AND order_id = @orderId AND status = 'PENDING';
    `);

  const affected = updated.rowsAffected?.[0] ?? 0;
  if (affected > 0) {
    const row = (updated.recordset as any[])?.[0] ?? {};
    return {
      state: "cancelled",
      previousStatus: row.previousStatus as OrderStatus,
      newStatus: row.newStatus as OrderStatus,
      occurredAt: String(row.occurredAt ?? new Date().toISOString()),
    };
  }

  const exists = await pool
    .request()
    .input("userId", sql.VarChar(100), userId)
    .input("orderId", sql.UniqueIdentifier, orderId).query(`
      SELECT TOP 1 status
      FROM dbo.orders
      WHERE user_id = @userId AND order_id = @orderId;
    `);

  const row = (exists.recordset as any[])?.[0];
  if (!row) return { state: "not_found" };
  return { state: "not_pending" };
}

