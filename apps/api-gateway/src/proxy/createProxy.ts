import type { Request, Response } from "express";
import { buildUpstreamBody, copyHeaders, needsDuplex } from "./utils";

type CreateProxyOptions = {
  baseUrl: string;
  stripPrefix: string; // e.g. "/users"
  addUserHeaders?: boolean; // x-user-id / x-user-email
  addVendorHeaders?: boolean; // x-vendor-id
};

function getProxyTimeoutMs() {
  const raw = process.env.GATEWAY_PROXY_TIMEOUT_MS ?? "15000";
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return 15000;
  return Math.max(1000, Math.min(120000, Math.trunc(parsed)));
}

export function createProxy(opts: CreateProxyOptions) {
  return async (req: Request, res: Response) => {
    const correlationId = (req as any).correlationId;

    const routeLabel = req.baseUrl || opts.stripPrefix;
    (res.locals as any).gatewayRoute = routeLabel;
    (res.locals as any).gatewayUpstream = opts.baseUrl;
    res.setHeader("x-gateway-route", routeLabel);

    let targetPath = req.url || "/";
    if (!targetPath.startsWith("/")) targetPath = `/${targetPath}`;
    const url = `${opts.baseUrl}${targetPath}`;

    const controller = new AbortController();
    const timeoutMs = getProxyTimeoutMs();
    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeoutMs);

    // Only abort upstream when the client actually aborts (not on normal request completion).
    req.once("aborted", () => controller.abort());
    res.once("close", () => {
      if (!res.writableEnded) controller.abort();
    });

    try {
      const headers = copyHeaders(req);
      headers["x-correlation-id"] = correlationId;

      if (opts.addUserHeaders) {
        const userId = (req as any).user?.id;
        if (userId && !headers["x-user-id"]) headers["x-user-id"] = userId;
        if ((req as any).user?.email && !headers["x-user-email"]) headers["x-user-email"] = (req as any).user.email;
      }

      if (opts.addVendorHeaders) {
        const vendorId = (req as any).user?.id;
        if (vendorId && !headers["x-vendor-id"]) headers["x-vendor-id"] = vendorId;
      }

      const body = buildUpstreamBody(req, headers);

      const upstream = await fetch(url, {
        method: req.method,
        headers,
        body: body as any,
        ...(needsDuplex(body) ? { duplex: "half" as any } : {}),
        signal: controller.signal,
      });

      res.status(upstream.status);
      upstream.headers.forEach((value, key) => {
        if (key.toLowerCase() === "content-length") return;
        res.setHeader(key, value);
      });

      const buffer = Buffer.from(await upstream.arrayBuffer());
      return res.send(buffer);
    } catch (err) {
      const errName = (err as any)?.name;
      const isAbort = errName === "AbortError";

      if (isAbort) {
        if (!timedOut) {
          console.warn(`Proxy aborted by client: ${routeLabel} -> ${opts.baseUrl}${targetPath}`);
          return;
        }

        console.warn(`Proxy timeout (${timeoutMs}ms) to ${routeLabel} -> ${opts.baseUrl}${targetPath}`);
        return res.status(504).json({
          error: { code: "GATEWAY_TIMEOUT", message: "Upstream service timeout" },
        });
      }

      console.error(`Proxy error to ${routeLabel}:`, err);
      return res.status(502).json({
        error: { code: "BAD_GATEWAY", message: "Upstream service unreachable" },
      });
    } finally {
      clearTimeout(timeout);
    }
  };
}
