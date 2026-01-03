import type { Request, Response, NextFunction } from "express";

export function requireRole(role: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    const roles: string[] = Array.isArray(user?.roles) ? user.roles : [];
    if (!roles.includes(role)) {
      return res.status(403).json({ ok: false, message: `Requires role: ${role}` });
    }
    next();
  };
}
