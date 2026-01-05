import type { Request, Response, NextFunction } from "express";

export type AuthVendor = { vendorId: string };

declare global {
  namespace Express {
    interface Request {
      vendor?: AuthVendor;
    }
  }
}

export function authVendor(req: Request, res: Response, next: NextFunction) {
  const vendorId = req.header("x-vendor-id");
  if (!vendorId) {
    return res.status(401).json({
      error: { code: "UNAUTHORIZED", message: "Missing x-vendor-id (gateway required)." },
    });
  }
  req.vendor = { vendorId };
  return next();
}

