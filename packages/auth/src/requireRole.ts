import type { Request, Response, NextFunction } from "express";

export function requireRole(role: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const roles = Array.isArray(req.user?.roles)
      ? req.user?.roles
      : req.user?.role
        ? [req.user.role]
        : [];

    if (roles.length === 0) {
      return res.status(403).json({
        error: { code: "FORBIDDEN", message: "No role on token." }
      });
    }

    if (!roles.includes(role)) {
      return res.status(403).json({
        error: { code: "FORBIDDEN", message: "Insufficient permissions." }
      });
    }

    return next();
  };
}
