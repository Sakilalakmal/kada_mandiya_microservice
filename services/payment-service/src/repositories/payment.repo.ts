import { getPool, sql } from "../db/pool";

export type PaymentMethod = "COD" | "ONLINE";
export type PaymentStatus = "NOT_REQUIRED" | "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED";

export type Payment = {
  paymentId: string;
  orderId: string;
  userId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  provider: string;
  providerRef: string | null;
  correlationId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PaymentListItem = {
  orderId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  provider: string;
  createdAt: string;
  updatedAt: string;
};

export async function findPaymentByOrderId(orderId: string): Promise<Payment | null> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("orderId", sql.VarChar(100), orderId).query(`
      SELECT TOP 1
        CONVERT(varchar(36), payment_id) AS paymentId,
        order_id AS orderId,
        user_id AS userId,
        amount,
        currency,
        method,
        status,
        provider,
        provider_ref AS providerRef,
        correlation_id AS correlationId,
        CONVERT(varchar(33), created_at, 127) AS createdAt,
        CONVERT(varchar(33), updated_at, 127) AS updatedAt
      FROM dbo.payments
      WHERE order_id = @orderId;
    `);

  const row = (result.recordset as any[])?.[0];
  if (!row) return null;

  return {
    paymentId: String(row.paymentId),
    orderId: String(row.orderId),
    userId: String(row.userId),
    amount: Number(row.amount),
    currency: String(row.currency),
    method: row.method as PaymentMethod,
    status: row.status as PaymentStatus,
    provider: String(row.provider),
    providerRef: row.providerRef === null || row.providerRef === undefined ? null : String(row.providerRef),
    correlationId: row.correlationId === null || row.correlationId === undefined ? null : String(row.correlationId),
    createdAt: String(row.createdAt),
    updatedAt: String(row.updatedAt),
  };
}

export async function listPaymentsByUserId(userId: string): Promise<PaymentListItem[]> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("userId", sql.VarChar(100), userId).query(`
      SELECT
        order_id AS orderId,
        amount,
        currency,
        method,
        status,
        provider,
        CONVERT(varchar(33), created_at, 127) AS createdAt,
        CONVERT(varchar(33), updated_at, 127) AS updatedAt
      FROM dbo.payments
      WHERE user_id = @userId
      ORDER BY created_at DESC;
    `);

  return (result.recordset as any[]).map((row) => ({
    orderId: String(row.orderId),
    amount: Number(row.amount),
    currency: String(row.currency),
    method: row.method as PaymentMethod,
    status: row.status as PaymentStatus,
    provider: String(row.provider),
    createdAt: String(row.createdAt),
    updatedAt: String(row.updatedAt),
  }));
}

function isUniqueConstraintError(err: any): boolean {
  const number = err?.number ?? err?.originalError?.number;
  return number === 2627 || number === 2601;
}

export async function createNotRequiredPayment(input: {
  orderId: string;
  userId: string;
  amount: number;
  currency: string;
  correlationId: string | null;
}): Promise<"created" | "duplicate"> {
  const pool = await getPool();
  try {
    await pool
      .request()
      .input("orderId", sql.VarChar(100), input.orderId)
      .input("userId", sql.VarChar(100), input.userId)
      .input("amount", sql.Decimal(18, 2), input.amount)
      .input("currency", sql.VarChar(10), input.currency)
      .input("method", sql.VarChar(30), "COD")
      .input("status", sql.VarChar(30), "NOT_REQUIRED")
      .input("provider", sql.VarChar(30), "NONE")
      .input("providerRef", sql.VarChar(200), null)
      .input("correlationId", sql.VarChar(100), input.correlationId).query(`
        INSERT INTO dbo.payments
          (order_id, user_id, amount, currency, method, status, provider, provider_ref, correlation_id)
        VALUES
          (@orderId, @userId, @amount, @currency, @method, @status, @provider, @providerRef, @correlationId);
      `);

    return "created";
  } catch (err) {
    if (isUniqueConstraintError(err)) return "duplicate";
    throw err;
  }
}

export async function updatePaymentStatus(orderId: string, status: PaymentStatus): Promise<Payment | null> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("orderId", sql.VarChar(100), orderId)
    .input("status", sql.VarChar(30), status).query(`
      UPDATE dbo.payments
      SET status = @status, updated_at = SYSUTCDATETIME()
      OUTPUT
        CONVERT(varchar(36), inserted.payment_id) AS paymentId,
        inserted.order_id AS orderId,
        inserted.user_id AS userId,
        inserted.amount AS amount,
        inserted.currency AS currency,
        inserted.method AS method,
        inserted.status AS status,
        inserted.provider AS provider,
        inserted.provider_ref AS providerRef,
        inserted.correlation_id AS correlationId,
        CONVERT(varchar(33), inserted.created_at, 127) AS createdAt,
        CONVERT(varchar(33), inserted.updated_at, 127) AS updatedAt
      WHERE order_id = @orderId;
    `);

  const row = (result.recordset as any[])?.[0];
  if (!row) return null;

  return {
    paymentId: String(row.paymentId),
    orderId: String(row.orderId),
    userId: String(row.userId),
    amount: Number(row.amount),
    currency: String(row.currency),
    method: row.method as PaymentMethod,
    status: row.status as PaymentStatus,
    provider: String(row.provider),
    providerRef: row.providerRef === null || row.providerRef === undefined ? null : String(row.providerRef),
    correlationId: row.correlationId === null || row.correlationId === undefined ? null : String(row.correlationId),
    createdAt: String(row.createdAt),
    updatedAt: String(row.updatedAt),
  };
}

