import type sql from "mssql";
import { sql as mssql } from "../db/pool";

function isUniqueConstraintError(err: any): boolean {
  const number = err?.number ?? err?.originalError?.number;
  return number === 2627 || number === 2601;
}

export async function insertProcessedEvent(
  tx: sql.Transaction,
  eventId: string
): Promise<"inserted" | "duplicate"> {
  try {
    await tx
      .request()
      .input("eventId", mssql.UniqueIdentifier, eventId)
      .query(`
        INSERT INTO dbo.processed_events (event_id)
        VALUES (@eventId);
      `);
    return "inserted";
  } catch (err) {
    if (isUniqueConstraintError(err)) return "duplicate";
    throw err;
  }
}

