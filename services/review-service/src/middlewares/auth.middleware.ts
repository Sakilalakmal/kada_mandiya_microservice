import type { Request, Response, NextFunction } from "express";

export type AuthUser = { userId: string };

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function auth(req: Request, res: Response, next: NextFunction) {
  const userId = req.header("x-user-id");
  if (!userId) {
    return res.status(401).json({
      ok: false,
      error: { code: "UNAUTHORIZED", message: "Missing x-user-id (gateway required)." },
    });
  }
  req.user = { userId };
  return next();
}

