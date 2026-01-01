import type { Request, Response } from "express";
import { createProfile, findProfileByUserId } from "../repositories/user.repo";

export async function getMe(req: Request, res: Response) {
  const userId = req.header("x-user-id");
  const email = req.header("x-user-email");

  if (!userId) {
    return res.status(401).json({
      error: { code: "UNAUTHORIZED", message: "Missing x-user-id (gateway required)." }
    });
  }

  // 1) try find
  const existing = await findProfileByUserId(userId);
  if (existing) return res.json(existing);

  // 2) create if missing (simple approach)
  if (!email) {
    return res.status(400).json({
      error: { code: "MISSING_EMAIL", message: "Profile not found and x-user-email missing." }
    });
  }

  const created = await createProfile(userId, email);
  return res.status(201).json(created);
}
