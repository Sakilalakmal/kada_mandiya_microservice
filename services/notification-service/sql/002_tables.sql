-- Documentation only: DB is already created in the environment.
USE KadaMandiyaNotification;
GO

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
GO

IF OBJECT_ID('dbo.processed_events', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.processed_events (
    event_id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_processed_events PRIMARY KEY,
    processed_at DATETIME2 NOT NULL CONSTRAINT DF_processed_events_processed_at DEFAULT SYSUTCDATETIME()
  );
END;
GO

