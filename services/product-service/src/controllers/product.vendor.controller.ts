import { createProductForVendor, deactivateProductForVendor, listMyProducts, updateProductForVendor } from "../repositories/product.vendor.repo";

export const createProduct = async (req: any, res: any) => {
  try {
    const vendorUserId = req.header("x-user-id");
    const vendorEmail = req.header("x-user-email") ?? null;

    if (!vendorUserId) {
      return res.status(401).json({ ok: false, message: "Missing x-user-id" });
    }

    const { productId } = await createProductForVendor({
      vendorUserId,
      vendorEmail,
      input: req.body,
    });

    return res.status(201).json({ ok: true, productId });
  } catch (err: any) {
    console.error("createProduct error:", err);
    return res.status(400).json({ ok: false, message: err?.message ?? "Bad request" });
  }
};

export const getMyProducts = async (req: any, res: any) => {
  try {
    const vendorUserId = req.header("x-user-id");
    if (!vendorUserId) {
      return res.status(401).json({ ok: false, message: "Missing x-user-id" });
    }

    const items = await listMyProducts(vendorUserId);
    return res.json({ ok: true, items });
  } catch (err) {
    console.error("getMyProducts error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};


export const updateProduct = async (req: any, res: any) => {
  try {
    const vendorUserId = req.header("x-user-id");
    if (!vendorUserId) {
      return res.status(401).json({ ok: false, message: "Missing x-user-id" });
    }

    const productId = req.params.id;

    await updateProductForVendor({
      vendorUserId,
      productId,
      patch: req.body,
    });

    return res.json({ ok: true, message: "Product updated" });
  } catch (err: any) {
    console.error("updateProduct error:", err);
    return res.status(400).json({ ok: false, message: err?.message ?? "Bad request" });
  }
};

export const deactivateProduct = async (req: any, res: any) => {
  try {
    const vendorUserId = req.header("x-user-id");
    if (!vendorUserId) {
      return res.status(401).json({ ok: false, message: "Missing x-user-id" });
    }

    await deactivateProductForVendor({
      vendorUserId,
      productId: req.params.id,
    });

    return res.json({ ok: true, message: "Product deactivated" });
  } catch (err: any) {
    console.error("deactivateProduct error:", err);
    return res
      .status(400)
      .json({ ok: false, message: err?.message ?? "Bad request" });
  }
};