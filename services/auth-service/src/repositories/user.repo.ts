import { getPool, sql } from "../db/pool";

const USERS_TABLE = "[dbo].[users]";

export type DbUser = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
};

export async function findUserByEmail(email: string): Promise<DbUser | null> {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("email", sql.NVarChar(255), email)
    .query(`
      SELECT TOP 1
        CONVERT(varchar(36), id) AS id,
        name,
        email,
        password_hash AS passwordHash
      FROM ${USERS_TABLE}
      WHERE email = @email
    `);

  return result.recordset[0] ?? null;
}

export async function insertUser(user: { id: string; name: string; email: string; passwordHash: string }) {
  const pool = await getPool();

  await pool
    .request()
    .input("id", sql.UniqueIdentifier, user.id)
    .input("name", sql.NVarChar(255), user.name)
    .input("email", sql.NVarChar(255), user.email)
    .input("passwordHash", sql.NVarChar(255), user.passwordHash)
    .query(`
      INSERT INTO ${USERS_TABLE} (id, name, email, password_hash)
      VALUES (@id, @name, @email, @passwordHash)
    `);

  return { id: user.id, name: user.name, email: user.email };
}
