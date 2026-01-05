import type { NextFunction, Request, Response } from "express";

function splitUrl(url: string) {
  const idx = url.indexOf("?");
  if (idx === -1) return { path: url, query: "" };
  return { path: url.slice(0, idx), query: url.slice(idx) };
}

export function normalizePath(req: Request, _res: Response, next: NextFunction) {
  const { path, query } = splitUrl(req.url);
  let normalized = path;

  // Prevent accidental double-prefixing from clients (e.g. /api/api/orders).
  normalized = normalized.replace(/^\/api\/api(\/|$)/, "/api$1");

  // Normalize accidental extra slashes under /api (e.g. /api//orders).
  normalized = normalized.replace(/^\/api\/+/, "/api/");

  if (normalized !== path) {
    (req as any).__gatewayNormalizedFrom = req.url;
    req.url = `${normalized}${query}`;
  }

  next();
}

