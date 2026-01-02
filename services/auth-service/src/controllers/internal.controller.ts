import { grantRoleToUser } from "../repositories/roles.repo";

export async function internalGrantRole(req: any, res: any) {
  const key = req.header("x-internal-key");
  if (!key || key !== process.env.INTERNAL_SERVICE_KEY) {
    return res.status(403).json({ ok: false, message: "Forbidden" });
  }

  const { userId, role } = req.body;
  if (!userId || !role) {
    return res
      .status(400)
      .json({ ok: false, message: "userId and role required" });
  }

  await grantRoleToUser(userId, role);
  return res.json({ ok: true, message: "Role granted" });
}
