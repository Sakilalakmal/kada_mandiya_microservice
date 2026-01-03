import { Router } from "express";
import {
  createProduct,
  deactivateProduct,
  getMyProducts,
  reactivateProduct,
  updateProduct,
} from "../controllers/product.vendor.controller";

const ProductVendorRouter = Router();

// Protected (gateway will enforce auth + vendor role later)
ProductVendorRouter.post("/", createProduct);
ProductVendorRouter.get("/mine", getMyProducts);
ProductVendorRouter.put("/:id", updateProduct);

ProductVendorRouter.patch("/:id/deactivate", deactivateProduct); 
ProductVendorRouter.patch("/:id/reactivate", reactivateProduct);

export default ProductVendorRouter;
