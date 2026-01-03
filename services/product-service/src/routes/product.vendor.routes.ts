import { Router } from "express";
import {
  createProduct,
  deactivateProduct,
  getMyProducts,
  updateProduct,
} from "../controllers/product.vendor.controller";

const ProductVendorRouter = Router();

// Protected (gateway will enforce auth + vendor role later)
ProductVendorRouter.post("/", createProduct);
ProductVendorRouter.get("/mine", getMyProducts);
ProductVendorRouter.put("/:id", updateProduct);

ProductVendorRouter.patch("/:id/deactivate", deactivateProduct); 

export default ProductVendorRouter;
