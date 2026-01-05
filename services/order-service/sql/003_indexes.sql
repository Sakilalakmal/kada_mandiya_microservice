USE KadaMandiyaOrder;
GO

IF NOT EXISTS (
  SELECT 1 FROM sys.indexes WHERE name = N'IX_orders_user_id' AND object_id = OBJECT_ID(N'dbo.orders')
)
BEGIN
  CREATE INDEX IX_orders_user_id ON dbo.orders(user_id);
END
GO

IF NOT EXISTS (
  SELECT 1 FROM sys.indexes WHERE name = N'IX_orders_payment_status' AND object_id = OBJECT_ID(N'dbo.orders')
)
BEGIN
  CREATE INDEX IX_orders_payment_status ON dbo.orders(payment_status);
END
GO

IF NOT EXISTS (
  SELECT 1 FROM sys.indexes WHERE name = N'IX_order_items_order_id' AND object_id = OBJECT_ID(N'dbo.order_items')
)
BEGIN
  CREATE INDEX IX_order_items_order_id ON dbo.order_items(order_id);
END
GO

IF NOT EXISTS (
  SELECT 1 FROM sys.indexes WHERE name = N'IX_order_items_vendor_id' AND object_id = OBJECT_ID(N'dbo.order_items')
)
BEGIN
  CREATE INDEX IX_order_items_vendor_id ON dbo.order_items(vendor_id);
END
GO

IF NOT EXISTS (
  SELECT 1 FROM sys.indexes WHERE name = N'IX_order_items_vendor_order' AND object_id = OBJECT_ID(N'dbo.order_items')
)
BEGIN
  CREATE INDEX IX_order_items_vendor_order ON dbo.order_items(vendor_id, order_id);
END
GO
