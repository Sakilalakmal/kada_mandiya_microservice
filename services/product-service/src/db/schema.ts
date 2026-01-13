import { getPool } from "./pool";

let ensurePromise: Promise<void> | null = null;

export function ensureDbSchema(): Promise<void> {
  if (!ensurePromise) ensurePromise = ensureDbSchemaInternal();
  return ensurePromise;
}

async function ensureDbSchemaInternal(): Promise<void> {
  const pool = await getPool();

  await pool.request().batch(`
    IF OBJECT_ID('dbo.processed_events', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.processed_events (
        event_id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_processed_events PRIMARY KEY,
        processed_at DATETIME2 NOT NULL CONSTRAINT DF_processed_events_processed_at DEFAULT SYSUTCDATETIME()
      );
    END;
  `);
}

