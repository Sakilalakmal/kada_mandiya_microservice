import { Router } from "express";
import { requireInternalAuth } from "../middleware/internalAuth";
import { getStockByProductIds, releaseStock, reserveStock } from "../repositories/stock.repo";

const router = Router();

router.use(requireInternalAuth);

function isUuid(value: unknown): value is string {
  if (typeof value !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function parseProductIds(body: unknown): string[] | null {
  if (!body || typeof body !== "object") return null;
  const ids = (body as any).productIds;
  if (!Array.isArray(ids) || ids.length > 200) return null;
  if (ids.some((id) => !isUuid(id))) return null;
  return ids as string[];
}

function parseStockItems(body: unknown): { productId: string; qty: number }[] | null {
  if (!body || typeof body !== "object") return null;
  const items = (body as any).items;
  if (!Array.isArray(items) || items.length > 200) return null;

  const parsed: { productId: string; qty: number }[] = [];
  for (const item of items) {
    if (!item || typeof item !== "object") return null;
    const productId = (item as any).productId;
    const qtyRaw = (item as any).qty;
    const qty = Math.floor(Number(qtyRaw));
    if (!isUuid(productId) || !Number.isFinite(qty) || qty < 1 || qty > 1000) return null;
    parsed.push({ productId, qty });
  }

  return parsed;
}

function aggregateItems(items: { productId: string; qty: number }[]) {
  const map = new Map<string, number>();
  for (const item of items) {
    const prev = map.get(item.productId) ?? 0;
    map.set(item.productId, prev + Math.max(0, Math.floor(Number(item.qty))));
  }
  return Array.from(map.entries()).map(([productId, qty]) => ({ productId, qty }));
}

router.post("/stock/check", async (req, res) => {
  const productIds = parseProductIds(req.body ?? {});
  if (!productIds) {
    return res.status(400).json({
      ok: false,
      error: { code: "VALIDATION_ERROR", message: "Invalid stock check payload." },
    });
  }

  try {
    const rows = await getStockByProductIds(productIds);
    return res.json({ ok: true, items: rows });
  } catch (err) {
    console.error("internal stock check error:", err);
    return res.status(500).json({ ok: false, error: { code: "SERVER_ERROR", message: "Server error" } });
  }
});

router.post("/stock/reserve", async (req, res) => {
  const itemsRaw = parseStockItems(req.body ?? {});
  if (!itemsRaw) {
    return res.status(400).json({
      ok: false,
      error: { code: "VALIDATION_ERROR", message: "Invalid stock reserve payload." },
    });
  }

  try {
    const items = aggregateItems(itemsRaw);
    const rows = await reserveStock(items);
    return res.json({ ok: true, items: rows });
  } catch (err: any) {
    if (err?.message === "OUT_OF_STOCK") {
      return res.status(409).json({
        ok: false,
        error: { code: "OUT_OF_STOCK", message: "Not enough stock for one or more items.", productId: err.productId },
      });
    }
    console.error("internal stock reserve error:", err);
    return res.status(500).json({ ok: false, error: { code: "SERVER_ERROR", message: "Server error" } });
  }
});

router.post("/stock/release", async (req, res) => {
  const itemsRaw = parseStockItems(req.body ?? {});
  if (!itemsRaw) {
    return res.status(400).json({
      ok: false,
      error: { code: "VALIDATION_ERROR", message: "Invalid stock release payload." },
    });
  }

  try {
    const items = aggregateItems(itemsRaw);
    const rows = await releaseStock(items);
    return res.json({ ok: true, items: rows });
  } catch (err) {
    console.error("internal stock release error:", err);
    return res.status(500).json({ ok: false, error: { code: "SERVER_ERROR", message: "Server error" } });
  }
});

export default router;
