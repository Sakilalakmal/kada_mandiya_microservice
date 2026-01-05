import type { NextFunction, Request, Response } from "express";

export function requireInternalAuth(req: Request, res: Response, next: NextFunction) {
  const expected = process.env.INTERNAL_API_KEY;
  if (!expected) return next();

  const provided = req.header("x-internal-key");
  if (!provided || provided !== expected) {
    return res.status(401).json({
      ok: false,
      error: { code: "UNAUTHORIZED", message: "Missing or invalid internal key." },
    });
  }

  return next();
}

