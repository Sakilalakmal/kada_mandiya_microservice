import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "@npmkadamandiya/auth";

type RequireRoleOptions = {
  secret: string;
};

function resolveRoles(input: unknown): string[] {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input.filter((role): role is string => typeof role === "string");
  }
  if (typeof input === "string") return [input];
  return [];
}

export function requireRole(role: string, opts: RequireRoleOptions) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    const rolesFromUser = resolveRoles(user?.roles ?? user?.role);

    if (rolesFromUser.includes(role)) {
      return next();
    }

    const auth = req.headers.authorization;
    if (!auth?.startsWith("Bearer ")) {
      return res.status(401).json({ ok: false, message: "Missing Bearer token" });
    }

    try {
      const claims = verifyAccessToken(auth.slice("Bearer ".length), {
        secret: opts.secret,
      }) as Record<string, unknown>;

      const roles = resolveRoles(
        (claims as Record<string, unknown>).roles ?? claims.role
      );

      if (!roles.includes(role)) {
        return res.status(403).json({ ok: false, message: `Requires role: ${role}` });
      }

      (req as any).user = {
        ...user,
        role: user?.role ?? roles[0],
        roles,
      };

      return next();
    } catch {
      return res.status(401).json({ ok: false, message: "Invalid or expired token" });
    }
  };
}
