import { getPool } from "./pool";

let ensurePromise: Promise<void> | null = null;

export function ensureDbSchema(): Promise<void> {
  if (!ensurePromise) ensurePromise = ensureDbSchemaInternal();
  return ensurePromise;
}

async function ensureDbSchemaInternal(): Promise<void> {
  const pool = await getPool();

  await pool.request().batch(`
    IF OBJECT_ID('dbo.notifications', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.notifications (
        notification_id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_notifications PRIMARY KEY DEFAULT NEWID(),
        recipient_type VARCHAR(10) NOT NULL,
        recipient_id VARCHAR(100) NOT NULL,
        type VARCHAR(50) NOT NULL,
        title NVARCHAR(120) NOT NULL,
        message NVARCHAR(500) NOT NULL,
        link NVARCHAR(200) NULL,
        data_json NVARCHAR(MAX) NULL,
        is_read BIT NOT NULL CONSTRAINT DF_notifications_is_read DEFAULT 0,
        read_at DATETIME2 NULL,
        created_at DATETIME2 NOT NULL CONSTRAINT DF_notifications_created_at DEFAULT SYSUTCDATETIME(),
        CONSTRAINT CK_notifications_recipient_type CHECK (recipient_type IN ('USER','VENDOR'))
      );
    END;

    IF OBJECT_ID('dbo.processed_events', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.processed_events (
        event_id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_processed_events PRIMARY KEY,
        processed_at DATETIME2 NOT NULL CONSTRAINT DF_processed_events_processed_at DEFAULT SYSUTCDATETIME()
      );
    END;

    IF NOT EXISTS (
      SELECT 1 FROM sys.indexes WHERE name = 'IX_notifications_recipient_unread' AND object_id = OBJECT_ID('dbo.notifications')
    )
    BEGIN
      CREATE INDEX IX_notifications_recipient_unread
      ON dbo.notifications(recipient_type, recipient_id, is_read, created_at DESC);
    END;

    IF NOT EXISTS (
      SELECT 1 FROM sys.indexes WHERE name = 'IX_notifications_recipient_created' AND object_id = OBJECT_ID('dbo.notifications')
    )
    BEGIN
      CREATE INDEX IX_notifications_recipient_created
      ON dbo.notifications(recipient_type, recipient_id, created_at DESC);
    END;
  `);
}

