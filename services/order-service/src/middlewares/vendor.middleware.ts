import type { Request, Response, NextFunction } from "express";

export type VendorUser = { vendorId: string };

declare global {
  namespace Express {
    interface Request {
      vendor?: VendorUser;
    }
  }
}

export function vendor(req: Request, res: Response, next: NextFunction) {
  const vendorId = req.header("x-vendor-id");
  if (!vendorId) {
    return res.status(403).json({
      ok: false,
      error: {
        code: "FORBIDDEN",
        message: "Missing x-vendor-id (gateway must inject for vendor users).",
      },
    });
  }
  req.vendor = { vendorId };
  return next();
}

