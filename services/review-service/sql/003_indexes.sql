USE KadaMandiyaReview;
GO

IF NOT EXISTS (
  SELECT 1 FROM sys.indexes WHERE name = N'UX_reviews_user_product_order' AND object_id = OBJECT_ID(N'dbo.reviews')
)
BEGIN
  CREATE UNIQUE INDEX UX_reviews_user_product_order ON dbo.reviews(user_id, product_id, order_id);
END
GO

IF NOT EXISTS (
  SELECT 1 FROM sys.indexes WHERE name = N'IX_reviews_product_id' AND object_id = OBJECT_ID(N'dbo.reviews')
)
BEGIN
  CREATE INDEX IX_reviews_product_id ON dbo.reviews(product_id);
END
GO

IF NOT EXISTS (
  SELECT 1 FROM sys.indexes WHERE name = N'IX_reviews_user_id' AND object_id = OBJECT_ID(N'dbo.reviews')
)
BEGIN
  CREATE INDEX IX_reviews_user_id ON dbo.reviews(user_id);
END
GO

IF NOT EXISTS (
  SELECT 1 FROM sys.indexes WHERE name = N'IX_reviews_product_not_deleted' AND object_id = OBJECT_ID(N'dbo.reviews')
)
BEGIN
  CREATE INDEX IX_reviews_product_not_deleted ON dbo.reviews(product_id, is_deleted);
END
GO

