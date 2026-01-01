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

export async function findProfileByUserId(userId: string): Promise<UserProfile | null> {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("userId", sql.UniqueIdentifier, userId)
    .query(`
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
    .input("email", sql.NVarChar(255), email)
    .query(`
      INSERT INTO user_profiles (user_id, email)
      VALUES (@userId, @email)
    `);

  return findProfileByUserId(userId);
}
