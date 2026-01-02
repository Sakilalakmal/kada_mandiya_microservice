import type { Request, Response } from "express";

import * as authService from "../service/auth.service";
import { LoginSchema, RegisterSchema } from "../schema/auth.schema";
import { signAccessToken, verifyAccessToken } from "../utils/jwt";

export async function register(req: Request, res: Response) {
  const input = RegisterSchema.parse(req.body);
  const user = await authService.register(input);
  return res.status(201).json(user);
}

export async function login(req: Request, res: Response) {
  const input = LoginSchema.parse(req.body);
  const user = await authService.login(input);
  const accessToken = signAccessToken(user);
  return res.json({ accessToken, tokenType: "Bearer" });
}

export function me(req: Request, res: Response) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    return res.status(401).json({
      error: { code: "UNAUTHORIZED", message: "Missing Bearer token." },
    });
  }

  try {
    const payload = verifyAccessToken(auth.slice(7));
    return res.json({ payload });
  } catch {
    return res.status(401).json({
      error: { code: "UNAUTHORIZED", message: "Invalid or expired token." },
    });
  }
}

