import { findVendorByUserId, upsertVendor } from "../repository/vendor.repo";

const AUTH_SERVICE_URL =
  process.env.AUTH_SERVICE_URL ?? "http://localhost:4000";
const INTERNAL_SERVICE_KEY = process.env.INTERNAL_SERVICE_KEY ?? "";

export const becomeVendor = async (req: any, res: any) => {
  try {
    const userId = req.header("x-user-id");
    const email = req.header("x-user-email") ?? null;

    if (!userId) {
      return res.status(401).json({ ok: false, message: "Missing x-user-id" });
    }

    const { storeName, description, phone, address, shopImageUrl } = req.body;

    const vendor = await upsertVendor(userId, email, {
      storeName,
      description,
      phone,
      address,
      shopImageUrl,
    });

    // Grant "vendor" role in auth-service (internal call)
    // AUTH_SERVICE_URL points directly to auth-service, so use /internal/grant-role (no /auth prefix)
    const r = await fetch(`${AUTH_SERVICE_URL}/internal/grant-role`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-internal-key": INTERNAL_SERVICE_KEY,
      },
      body: JSON.stringify({ userId, role: "vendor" }),
    });

    if (!r.ok) {
      const text = await r.text().catch(() => "");
      console.error("grant-role failed:", r.status, text);
      return res.status(502).json({
        ok: false,
        message: "Vendor created but role upgrade failed",
      });
    }

    return res.json({
      ok: true,
      message: "You are now a vendor",
      vendor,
    });
  } catch (err: any) {
    console.error("becomeVendor error:", err);
    return res.status(400).json({
      ok: false,
      message: err?.message ?? "Bad request",
    });
  }
};

export const getMyVendor = async (req: any, res: any) => {
  try {
    const userId = req.header("x-user-id");
    if (!userId) {
      return res.status(401).json({ ok: false, message: "Missing x-user-id" });
    }

    const vendor = await findVendorByUserId(userId);

    return res.json({
      ok: true,
      vendor,
    });
  } catch (err) {
    console.error("getMyVendor error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};
