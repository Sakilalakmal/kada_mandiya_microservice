import { getProductById, listProducts } from "../repositories/product.repo";

export const getProducts = async (req: any, res: any) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 12);
    const search =
      typeof req.query.search === "string" ? req.query.search : undefined;
    const category =
      typeof req.query.category === "string" ? req.query.category : undefined;

    const result = await listProducts({ page, limit, search, category });

    return res.json({ ok: true, ...result });
  } catch (err) {
    console.error("getProducts error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};

export const getProductDetail = async (req: any, res: any) => {
  try {
    const id = req.params.id;

    const product = await getProductById(id);
    if (!product) {
      return res.status(404).json({ ok: false, message: "Product not found" });
    }

    return res.json({ ok: true, product });
  } catch (err) {
    console.error("getProductDetail error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};
