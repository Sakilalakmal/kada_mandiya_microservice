import { randomUUID } from "crypto";
import type { Request, Response, NextFunction } from "express";

export function correlationId(req: Request, res: Response, next: NextFunction) {
  const incoming = req.header("x-correlation-id");
  const id = incoming ?? randomUUID();
  res.setHeader("x-correlation-id", id);
  (req as any).correlationId = id;
  next();
}
