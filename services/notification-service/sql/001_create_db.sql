-- Documentation only: DB is already created in the environment.
IF DB_ID('KadaMandiyaNotification') IS NULL
BEGIN
  CREATE DATABASE KadaMandiyaNotification;
END;
GO

