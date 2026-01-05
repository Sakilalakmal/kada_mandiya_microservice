import type sql from "mssql";
import { getPool, sql as mssql } from "../db/pool";
import type { RecipientType } from "../domain/notificationTypes";

export type NotificationListItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
};

export async function listNotifications(input: {
  recipientType: RecipientType;
  recipientId: string;
  unreadOnly: boolean;
  page: number;
  pageSize: number;
}): Promise<{ total: number; unreadCount: number; notifications: NotificationListItem[] }> {
  const pool = await getPool();
  const offset = (input.page - 1) * input.pageSize;

  const countsResult = await pool
    .request()
    .input("recipientType", mssql.VarChar(10), input.recipientType)
    .input("recipientId", mssql.VarChar(100), input.recipientId)
    .query(`
      SELECT
        COUNT(1) AS totalAll,
        SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) AS unreadCount
      FROM dbo.notifications
      WHERE recipient_type = @recipientType AND recipient_id = @recipientId;
    `);

  const countsRow = (countsResult.recordset as any[])?.[0] ?? {};
  const unreadCount = Number(countsRow.unreadCount ?? 0);
  const totalAll = Number(countsRow.totalAll ?? 0);
  const total = input.unreadOnly ? unreadCount : totalAll;

  const listResult = await pool
    .request()
    .input("recipientType", mssql.VarChar(10), input.recipientType)
    .input("recipientId", mssql.VarChar(100), input.recipientId)
    .input("unreadOnly", mssql.Bit, input.unreadOnly ? 1 : 0)
    .input("offset", mssql.Int, offset)
    .input("pageSize", mssql.Int, input.pageSize)
    .query(`
      SELECT
        CONVERT(varchar(36), notification_id) AS id,
        type,
        title,
        message,
        link,
        is_read AS isRead,
        CONVERT(varchar(33), created_at, 127) + 'Z' AS createdAt
      FROM dbo.notifications
      WHERE
        recipient_type = @recipientType
        AND recipient_id = @recipientId
        AND (@unreadOnly = 0 OR is_read = 0)
      ORDER BY created_at DESC
      OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY;
    `);

  const notifications = (listResult.recordset as any[]).map((row) => ({
    id: String(row.id),
    type: String(row.type),
    title: String(row.title),
    message: String(row.message),
    link: row.link === null || row.link === undefined ? null : String(row.link),
    isRead: Boolean(row.isRead),
    createdAt: String(row.createdAt),
  }));

  return { total, unreadCount, notifications };
}

export async function markNotificationRead(input: {
  recipientType: RecipientType;
  recipientId: string;
  notificationId: string;
}): Promise<"updated" | "not_found"> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("recipientType", mssql.VarChar(10), input.recipientType)
    .input("recipientId", mssql.VarChar(100), input.recipientId)
    .input("notificationId", mssql.UniqueIdentifier, input.notificationId)
    .query(`
      UPDATE dbo.notifications
      SET is_read = 1, read_at = SYSUTCDATETIME()
      WHERE
        notification_id = @notificationId
        AND recipient_type = @recipientType
        AND recipient_id = @recipientId;
    `);

  const updated = Number(result.rowsAffected?.[0] ?? 0);
  return updated > 0 ? "updated" : "not_found";
}

export async function markAllNotificationsRead(input: {
  recipientType: RecipientType;
  recipientId: string;
}): Promise<number> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("recipientType", mssql.VarChar(10), input.recipientType)
    .input("recipientId", mssql.VarChar(100), input.recipientId)
    .query(`
      UPDATE dbo.notifications
      SET is_read = 1, read_at = SYSUTCDATETIME()
      WHERE
        recipient_type = @recipientType
        AND recipient_id = @recipientId
        AND is_read = 0;
    `);

  return Number(result.rowsAffected?.[0] ?? 0);
}

export type NotificationInsert = {
  recipientType: RecipientType;
  recipientId: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  dataJson: string | null;
};

export async function insertNotifications(tx: sql.Transaction, rows: NotificationInsert[]): Promise<void> {
  for (const row of rows) {
    await tx
      .request()
      .input("recipientType", mssql.VarChar(10), row.recipientType)
      .input("recipientId", mssql.VarChar(100), row.recipientId)
      .input("type", mssql.VarChar(50), row.type)
      .input("title", mssql.NVarChar(120), row.title)
      .input("message", mssql.NVarChar(500), row.message)
      .input("link", mssql.NVarChar(200), row.link)
      .input("dataJson", mssql.NVarChar(mssql.MAX), row.dataJson)
      .query(`
        INSERT INTO dbo.notifications
          (recipient_type, recipient_id, type, title, message, link, data_json)
        VALUES
          (@recipientType, @recipientId, @type, @title, @message, @link, @dataJson);
      `);
  }
}

