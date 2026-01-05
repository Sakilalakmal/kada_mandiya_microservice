-- Documentation only: DB is already created in the environment.
USE KadaMandiyaPayment;
GO

IF NOT EXISTS (
  SELECT 1 FROM sys.indexes WHERE name = 'UX_payments_order_id' AND object_id = OBJECT_ID('dbo.payments')
)
BEGIN
  CREATE UNIQUE INDEX UX_payments_order_id ON dbo.payments(order_id);
END;
GO

IF NOT EXISTS (
  SELECT 1 FROM sys.indexes WHERE name = 'IX_payments_user_id' AND object_id = OBJECT_ID('dbo.payments')
)
BEGIN
  CREATE INDEX IX_payments_user_id ON dbo.payments(user_id);
END;
GO

IF NOT EXISTS (
  SELECT 1 FROM sys.indexes WHERE name = 'IX_payments_status' AND object_id = OBJECT_ID('dbo.payments')
)
BEGIN
  CREATE INDEX IX_payments_status ON dbo.payments(status);
END;
GO

