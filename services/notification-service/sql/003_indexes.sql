-- Documentation only: DB is already created in the environment.
USE KadaMandiyaNotification;
GO

IF NOT EXISTS (
  SELECT 1 FROM sys.indexes WHERE name = 'IX_notifications_recipient_unread' AND object_id = OBJECT_ID('dbo.notifications')
)
BEGIN
  CREATE INDEX IX_notifications_recipient_unread
  ON dbo.notifications(recipient_type, recipient_id, is_read, created_at DESC);
END;
GO

IF NOT EXISTS (
  SELECT 1 FROM sys.indexes WHERE name = 'IX_notifications_recipient_created' AND object_id = OBJECT_ID('dbo.notifications')
)
BEGIN
  CREATE INDEX IX_notifications_recipient_created
  ON dbo.notifications(recipient_type, recipient_id, created_at DESC);
END;
GO

