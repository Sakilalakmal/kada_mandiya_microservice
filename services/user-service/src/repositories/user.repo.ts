import { getPool, sql } from "../db/pool";

export type UserProfile = {
  userId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  address: string | null;
  shippingAddress: string | null;
  profileImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function findProfileByUserId(
  userId: string
): Promise<UserProfile | null> {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("userId", sql.UniqueIdentifier, userId).query(`
      SELECT TOP 1
        CONVERT(varchar(36), user_id) AS userId,
        email,
        first_name AS firstName,
        last_name AS lastName,
        phone,
        address,
        shipping_address AS shippingAddress,
        profile_image_url AS profileImageUrl,
        CONVERT(varchar(33), created_at, 127) AS createdAt,
        CONVERT(varchar(33), updated_at, 127) AS updatedAt
      FROM user_profiles
      WHERE user_id = @userId
    `);

  return result.recordset[0] ?? null;
}

export async function createProfile(userId: string, email: string) {
  const pool = await getPool();

  await pool
    .request()
    .input("userId", sql.UniqueIdentifier, userId)
    .input("email", sql.NVarChar(255), email).query(`
      IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE user_id = @userId)
      BEGIN
        INSERT INTO user_profiles (user_id, email)
        VALUES (@userId, @email)
      END
    `);

  return findProfileByUserId(userId);
}

const trimOrNull = (v: any, max: number) => {
  if (typeof v !== "string") return null;
  const t = v.trim();
  if (!t) return null;
  return t.slice(0, max);
};

export type UpdateUserProfileInput = {
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  shippingAddress?: string;
  profileImageUrl?: string;
};

export async function updateProfileByUserId(
  userId: string,
  patch: UpdateUserProfileInput
): Promise<UserProfile | null> {
  const pool = await getPool();

  // sanitize
  const firstName = trimOrNull(patch.firstName, 100);
  const lastName = trimOrNull(patch.lastName, 100);
  const phone = trimOrNull(patch.phone, 20);
  const address = trimOrNull(patch.address, 255);
  const shippingAddress = trimOrNull(patch.shippingAddress, 255);
  const profileImageUrl = trimOrNull(patch.profileImageUrl, 500);

  await pool
    .request()
    .input("userId", sql.UniqueIdentifier, userId)
    .input("firstName", sql.NVarChar(100), firstName)
    .input("lastName", sql.NVarChar(100), lastName)
    .input("phone", sql.NVarChar(20), phone)
    .input("address", sql.NVarChar(255), address)
    .input("shippingAddress", sql.NVarChar(255), shippingAddress)
    .input("profileImageUrl", sql.NVarChar(500), profileImageUrl).query(`
      UPDATE user_profiles
      SET
        first_name = COALESCE(@firstName, first_name),
        last_name = COALESCE(@lastName, last_name),
        phone = COALESCE(@phone, phone),
        address = COALESCE(@address, address),
        shipping_address = COALESCE(@shippingAddress, shipping_address),
        profile_image_url = COALESCE(@profileImageUrl, profile_image_url),
        updated_at = GETUTCDATE()
      WHERE user_id = @userId
    `);

  return findProfileByUserId(userId);
}
