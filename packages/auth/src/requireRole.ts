import type { Request, Response, NextFunction } from "express";

export function requireRole(role: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user?.role) {
      return res.status(403).json({
        error: { code: "FORBIDDEN", message: "No role on token." }
      });
    }

    if (req.user.role !== role) {
      return res.status(403).json({
        error: { code: "FORBIDDEN", message: "Insufficient permissions." }
      });
    }

    return next();
  };
}
