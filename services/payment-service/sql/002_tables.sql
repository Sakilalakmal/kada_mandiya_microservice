-- Documentation only: DB is already created in the environment.
USE KadaMandiyaPayment;
GO

IF OBJECT_ID('dbo.payments', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.payments (
    payment_id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_payments PRIMARY KEY DEFAULT NEWID(),
    order_id VARCHAR(100) NOT NULL,
    user_id VARCHAR(100) NOT NULL,
    amount DECIMAL(18,2) NOT NULL,
    currency VARCHAR(10) NOT NULL CONSTRAINT DF_payments_currency DEFAULT 'LKR',
    method VARCHAR(30) NOT NULL,
    status VARCHAR(30) NOT NULL,
    provider VARCHAR(30) NOT NULL CONSTRAINT DF_payments_provider DEFAULT 'NONE',
    provider_ref VARCHAR(200) NULL,
    correlation_id VARCHAR(100) NULL,
    created_at DATETIME2 NOT NULL CONSTRAINT DF_payments_created_at DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NOT NULL CONSTRAINT DF_payments_updated_at DEFAULT SYSUTCDATETIME(),
    CONSTRAINT CK_payments_method CHECK (method IN ('COD','ONLINE')),
    CONSTRAINT CK_payments_status CHECK (status IN ('NOT_REQUIRED','PENDING','COMPLETED','FAILED','CANCELLED'))
  );
END;
GO

