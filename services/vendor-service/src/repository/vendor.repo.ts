import { getPool, sql } from "../db/pool";

export type VendorProfile = {
  id: string;
  userId: string;
  email: string | null;
  storeName: string;
  description: string | null;
  phone: string | null;
  address: string | null;
  shopImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BecomeVendorInput = {
  storeName: string;
  description?: string;
  phone?: string;
  address?: string;
  shopImageUrl?: string;
};

const trimOrNull = (v: any, max: number) => {
  if (typeof v !== "string") return null;
  const t = v.trim();
  if (!t) return null;
  return t.slice(0, max);
};

export async function findVendorByUserId(
  userId: string
): Promise<VendorProfile | null> {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("userId", sql.UniqueIdentifier, userId).query(`
      SELECT TOP 1
        CONVERT(varchar(36), id) AS id,
        CONVERT(varchar(36), user_id) AS userId,
        email,
        store_name AS storeName,
        description,
        phone,
        address,
        shop_image_url AS shopImageUrl,
        CONVERT(varchar(33), created_at, 127) AS createdAt,
        CONVERT(varchar(33), updated_at, 127) AS updatedAt
      FROM vendors
      WHERE user_id = @userId
    `);

  return result.recordset[0] ?? null;
}

export async function upsertVendor(
  userId: string,
  email: string | null,
  input: BecomeVendorInput
): Promise<VendorProfile | null> {
  const pool = await getPool();

  const storeName = trimOrNull(input.storeName, 120);
  if (!storeName) throw new Error("storeName is required");

  const description = trimOrNull(input.description, 800);
  const phone = trimOrNull(input.phone, 20);
  const address = trimOrNull(input.address, 255);
  const shopImageUrl = trimOrNull(input.shopImageUrl, 500);

  await pool
    .request()
    .input("userId", sql.UniqueIdentifier, userId)
    .input("email", sql.NVarChar(255), email ?? null)
    .input("storeName", sql.NVarChar(120), storeName)
    .input("description", sql.NVarChar(800), description)
    .input("phone", sql.NVarChar(20), phone)
    .input("address", sql.NVarChar(255), address)
    .input("shopImageUrl", sql.NVarChar(500), shopImageUrl).query(`
      MERGE vendors AS target
      USING (SELECT @userId AS user_id) AS source
      ON target.user_id = source.user_id
      WHEN MATCHED THEN
        UPDATE SET
          email = COALESCE(@email, target.email),
          store_name = @storeName,
          description = @description,
          phone = @phone,
          address = @address,
          shop_image_url = @shopImageUrl,
          updated_at = GETUTCDATE()
      WHEN NOT MATCHED THEN
        INSERT (user_id, email, store_name, description, phone, address, shop_image_url, created_at, updated_at)
        VALUES (@userId, @email, @storeName, @description, @phone, @address, @shopImageUrl, GETUTCDATE(), GETUTCDATE());
    `);

  return findVendorByUserId(userId);
}
