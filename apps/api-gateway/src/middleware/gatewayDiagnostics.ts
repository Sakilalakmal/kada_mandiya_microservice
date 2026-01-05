import type { NextFunction, Request, Response } from "express";

type GatewayLocals = {
  gatewayRoute?: string;
  gatewayUpstream?: string;
};

function getPathname(url: string) {
  const idx = url.indexOf("?");
  return idx === -1 ? url : url.slice(0, idx);
}

function isProtectedRoute(req: Request, pathname: string) {
  const method = req.method.toUpperCase();
  if (method === "OPTIONS") return false;

  // Health checks are intentionally public across services.
  if (pathname.endsWith("/health") || pathname.endsWith("/health/db")) return false;

  // Public review endpoints (also exposed under /api/products/*).
  if (/^\/api\/reviews\/products\/[^/]+\/(reviews|rating)$/.test(pathname)) return false;
  if (/^\/api\/products\/[^/]+\/(reviews|rating)$/.test(pathname)) return false;

  const protectedPrefixes = [
    "/users",
    "/vendors",
    "/me",
    "/api/cart",
    "/api/orders",
    "/api/vendor/orders",
    "/api/payments",
    "/api/notifications",
    "/api/vendor/notifications",
    "/api/reviews",
    "/protected",
  ];

  if (protectedPrefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return true;

  // /products has a mix of public + protected routes; warn only for write ops and vendor-only read.
  if (pathname === "/products/mine" || pathname.startsWith("/products/mine/")) return true;
  if (pathname === "/products" || pathname.startsWith("/products/")) {
    return ["POST", "PUT", "PATCH", "DELETE"].includes(method);
  }

  return false;
}

export function gatewayDiagnostics(req: Request, res: Response, next: NextFunction) {
  const startNs = process.hrtime.bigint();
  const incomingUrl = req.originalUrl;
  const pathname = getPathname(incomingUrl);

  const correlationId =
    (req as any).correlationId ?? req.header("x-correlation-id") ?? undefined;

  res.setHeader("x-gateway", "kada-mandiya");
  res.setHeader("x-gateway-route", "none");
  (res.locals as GatewayLocals).gatewayRoute = "none";

  if (pathname === "/products" || pathname.startsWith("/products/")) {
    console.warn(
      JSON.stringify({
        level: "warn",
        event: "gateway.ambiguity.products_vs_api_products",
        message: "Request targets /products; frontend might be using /api/products for a different service.",
        method: req.method,
        path: pathname,
        correlationId,
      })
    );
  }

  if (isProtectedRoute(req, pathname) && !req.header("authorization")) {
    console.warn(
      JSON.stringify({
        level: "warn",
        event: "gateway.missing_authorization",
        message: "Protected route requested without Authorization header (request is not blocked).",
        method: req.method,
        path: pathname,
        correlationId,
      })
    );
  }

  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - startNs) / 1e6;
    const locals = res.locals as GatewayLocals;
    const gatewayRoute = locals.gatewayRoute ?? "none";
    const forwardedTo = locals.gatewayUpstream;
    const proxyMatched = gatewayRoute !== "none" && Boolean(forwardedTo);

    const host = req.header("host");
    const origin = req.header("origin");
    const fullUrl = `${req.protocol}://${host ?? "unknown"}${incomingUrl}`;

    console.log(
      JSON.stringify({
        level: "info",
        event: "gateway.request",
        method: req.method,
        path: pathname,
        url: fullUrl,
        host,
        origin,
        status: res.statusCode,
        correlationId,
        proxyMatched,
        gatewayRoute,
        forwardedTo,
        durationMs: Math.round(durationMs),
      })
    );

    if (pathname.startsWith("/api/") && !proxyMatched) {
      console.warn(
        JSON.stringify({
          level: "warn",
          event: "gateway.unhandled_api_path",
          message: "Request path starts with /api/ but no proxy route matched.",
          method: req.method,
          path: pathname,
          correlationId,
        })
      );
    }
  });

  next();
}
