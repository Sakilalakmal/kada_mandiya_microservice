-- Documentation only: DB is already created in the environment.
IF DB_ID('KadaMandiyaPayment') IS NULL
BEGIN
  CREATE DATABASE KadaMandiyaPayment;
END;
GO

