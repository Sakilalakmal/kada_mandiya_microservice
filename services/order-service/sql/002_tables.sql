USE KadaMandiyaOrder;
GO

IF OBJECT_ID(N'dbo.orders', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.orders (
    order_id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_orders PRIMARY KEY DEFAULT NEWID(),
    user_id VARCHAR(100) NOT NULL,
    status VARCHAR(30) NOT NULL,
    payment_method VARCHAR(30) NOT NULL CONSTRAINT DF_orders_payment_method DEFAULT 'COD',
    payment_status VARCHAR(30) NOT NULL CONSTRAINT DF_orders_payment_status DEFAULT 'NOT_REQUIRED',
    delivery_address NVARCHAR(300) NOT NULL,
    mobile VARCHAR(30) NULL,
    subtotal DECIMAL(18,2) NOT NULL,
    created_at DATETIME2 NOT NULL CONSTRAINT DF_orders_created_at DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NOT NULL CONSTRAINT DF_orders_updated_at DEFAULT SYSUTCDATETIME(),
    CONSTRAINT CK_orders_status CHECK (status IN ('PENDING','PROCESSING','SHIPPED','DELIVERED','CANCELLED')),
    CONSTRAINT CK_orders_payment_method CHECK (payment_method IN ('COD','ONLINE')),
    CONSTRAINT CK_orders_payment_status CHECK (payment_status IN ('NOT_REQUIRED','PENDING','COMPLETED','FAILED','CANCELLED')),
    CONSTRAINT CK_orders_subtotal CHECK (subtotal >= 0)
  );
END
GO

IF COL_LENGTH('dbo.orders', 'payment_status') IS NULL
BEGIN
  ALTER TABLE dbo.orders
    ADD payment_status VARCHAR(30) NOT NULL CONSTRAINT DF_orders_payment_status DEFAULT 'NOT_REQUIRED';
END
GO

IF NOT EXISTS (
  SELECT 1 FROM sys.check_constraints WHERE name = 'CK_orders_payment_method' AND parent_object_id = OBJECT_ID('dbo.orders')
)
BEGIN
  ALTER TABLE dbo.orders
    ADD CONSTRAINT CK_orders_payment_method CHECK (payment_method IN ('COD','ONLINE'));
END
GO

IF NOT EXISTS (
  SELECT 1 FROM sys.check_constraints WHERE name = 'CK_orders_payment_status' AND parent_object_id = OBJECT_ID('dbo.orders')
)
BEGIN
  ALTER TABLE dbo.orders
    ADD CONSTRAINT CK_orders_payment_status CHECK (payment_status IN ('NOT_REQUIRED','PENDING','COMPLETED','FAILED','CANCELLED'));
END
GO

IF OBJECT_ID(N'dbo.order_items', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.order_items (
    item_id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_order_items PRIMARY KEY DEFAULT NEWID(),
    order_id UNIQUEIDENTIFIER NOT NULL,
    product_id VARCHAR(100) NOT NULL,
    vendor_id VARCHAR(100) NULL,
    title NVARCHAR(200) NOT NULL,
    image_url NVARCHAR(500) NULL,
    unit_price DECIMAL(18,2) NOT NULL,
    qty INT NOT NULL,
    line_total DECIMAL(18,2) NOT NULL,
    created_at DATETIME2 NOT NULL CONSTRAINT DF_order_items_created_at DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_order_items_orders FOREIGN KEY (order_id) REFERENCES dbo.orders(order_id) ON DELETE CASCADE,
    CONSTRAINT CK_order_items_unit_price CHECK (unit_price >= 0),
    CONSTRAINT CK_order_items_qty CHECK (qty >= 1),
    CONSTRAINT CK_order_items_line_total CHECK (line_total >= 0)
  );
END
GO

