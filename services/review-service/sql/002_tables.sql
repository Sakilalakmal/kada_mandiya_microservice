USE KadaMandiyaReview;
GO

IF OBJECT_ID(N'dbo.reviews', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.reviews (
    review_id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_reviews PRIMARY KEY DEFAULT NEWID(),
    user_id VARCHAR(100) NOT NULL,
    product_id VARCHAR(100) NOT NULL,
    order_id VARCHAR(100) NOT NULL,
    rating INT NOT NULL,
    comment NVARCHAR(1000) NOT NULL,
    created_at DATETIME2 NOT NULL CONSTRAINT DF_reviews_created_at DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NOT NULL CONSTRAINT DF_reviews_updated_at DEFAULT SYSUTCDATETIME(),
    is_deleted BIT NOT NULL CONSTRAINT DF_reviews_is_deleted DEFAULT 0,
    deleted_at DATETIME2 NULL,
    CONSTRAINT CK_reviews_rating CHECK (rating BETWEEN 1 AND 5)
  );
END
GO

