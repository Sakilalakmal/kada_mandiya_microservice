import jwt from "jsonwebtoken";
import { getRolesByUserId } from "../repositories/roles.repo";
import { signAccessToken } from "../utils/jwt"; // your util

export async function refresh(req: any, res: any) {
  const auth = req.header("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ ok: false, message: "Missing token" });

  let payload: any;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET ?? "dev-secret-change-me");
  } catch {
    return res.status(401).json({ ok: false, message: "Invalid token" });
  }

  const userId = payload.sub;
  const roles = await getRolesByUserId(userId);

  const newToken = signAccessToken({ id: userId, email: payload.email, roles });

  return res.json({ ok: true, accessToken: newToken, tokenType: "Bearer" });
}
