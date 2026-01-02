import { getPool, sql } from "../db/pool";

export async function getRolesByUserId(userId: string): Promise<string[]> {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("userId", sql.UniqueIdentifier, userId)
    .query(`
      SELECT role
      FROM user_roles
      WHERE user_id = @userId
      ORDER BY role
    `);

  return result.recordset.map((r: any) => r.role);
}

export async function grantRoleToUser(userId: string, role: string): Promise<void> {
  const pool = await getPool();

  await pool
    .request()
    .input("userId", sql.UniqueIdentifier, userId)
    .input("role", sql.NVarChar(50), role)
    .query(`
      IF NOT EXISTS (
        SELECT 1 FROM user_roles WHERE user_id = @userId AND role = @role
      )
      INSERT INTO user_roles (user_id, role)
      VALUES (@userId, @role)
    `);
}
