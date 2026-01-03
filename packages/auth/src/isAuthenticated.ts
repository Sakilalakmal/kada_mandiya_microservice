import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "./jwt";
import { AuthUser } from "./types/types";

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export type AuthMiddlewareOptions = {
  secret: string;
};

export function isAuthenticated(opts: AuthMiddlewareOptions) {
  return (req: Request, res: Response, next: NextFunction) => {
    const auth = req.headers.authorization;

    if (!auth?.startsWith("Bearer ")) {
      return res.status(401).json({
        error: { code: "UNAUTHORIZED", message: "Missing Bearer token." }
      });
    }

    const token = auth.slice("Bearer ".length);

    try {
      const claims = verifyAccessToken(token, { secret: opts.secret });
      const roles = Array.isArray(claims.roles)
        ? claims.roles.filter((role): role is string => typeof role === "string")
        : claims.role
          ? [claims.role]
          : [];

      req.user = {
        id: claims.sub,
        email: claims.email,
        role: claims.role ?? roles[0],
        roles,
      };

      return next();
    } catch {
      return res.status(401).json({
        error: { code: "UNAUTHORIZED", message: "Invalid or expired token." }
      });
    }
  };
}
