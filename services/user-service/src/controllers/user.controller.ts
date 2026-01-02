import type { Request, Response } from "express";
import { z } from "zod";
import { createProfile, findProfileByUserId, updateProfileByUserId } from "../repositories/user.repo";

const UUID_V4ISH_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function requireUserId(req: Request, res: Response): string | null {
  const userId = req.header("x-user-id");
  if (!userId) {
    res.status(401).json({
      error: { code: "UNAUTHORIZED", message: "Missing x-user-id (gateway required)." },
    });
    return null;
  }
  if (!UUID_V4ISH_RE.test(userId)) {
    res.status(400).json({
      error: { code: "INVALID_USER_ID", message: "Invalid x-user-id." },
    });
    return null;
  }
  return userId;
}

const UpdateProfileSchema = z
  .object({
    firstName: z.string().max(100).optional(),
    lastName: z.string().max(100).optional(),
    phone: z.string().max(20).optional(),
    address: z.string().max(255).optional(),
    shippingAddress: z.string().max(255).optional(),
    profileImageUrl: z
      .string()
      .max(500)
      .optional()
      .refine((v) => !v || /^https?:\/\//i.test(v), {
        message: "Must be a valid URL",
      }),
  })
  .strict()
  .refine((v) => Object.keys(v).length > 0, {
    message: "At least one field must be provided.",
  });

async function ensureProfile(userId: string, email: string) {
  let profile = await findProfileByUserId(userId);
  if (profile) return profile;
  profile = await createProfile(userId, email);
  return profile;
}

export async function getMe(req: Request, res: Response) {
  const userId = requireUserId(req, res);
  if (!userId) return;
  const email = req.header("x-user-email");

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
  if (!created) {
    return res.status(500).json({
      error: { code: "CREATE_FAILED", message: "Failed to create profile." },
    });
  }
  return res.status(201).json(created);
}


export const updateMe = async (req: Request, res: Response) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const email = req.header("x-user-email") ?? "";

    // ensure profile exists
    const profile = await ensureProfile(userId, email);
    if (!profile) {
      return res.status(500).json({ ok: false, message: "Failed to create profile" });
    }

    const parsed = UpdateProfileSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid profile update payload.",
          details: parsed.error.flatten(),
        },
      });
    }

    const updated = await updateProfileByUserId(userId, parsed.data);

    return res.json({
      ok: true,
      message: "Profile saved",
      profile: updated,
    });
  } catch (err) {
    console.error("updateMe error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};
