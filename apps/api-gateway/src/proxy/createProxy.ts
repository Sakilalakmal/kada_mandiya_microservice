import type { Request, Response } from "express";
import { buildUpstreamBody, copyHeaders, needsDuplex } from "./utils";

type CreateProxyOptions = {
  baseUrl: string;
  stripPrefix: string; // e.g. "/users"
  addUserHeaders?: boolean; // x-user-id / x-user-email
};

export function createProxy(opts: CreateProxyOptions) {
  return async (req: Request, res: Response) => {
    const correlationId = (req as any).correlationId;

    const targetPath = req.originalUrl.replace(new RegExp(`^${opts.stripPrefix}`), "") || "/";
    const url = `${opts.baseUrl}${targetPath}`;

    try {
      const headers = copyHeaders(req);
      headers["x-correlation-id"] = correlationId;

      if (opts.addUserHeaders) {
        headers["x-user-id"] = (req as any).user?.id ?? "";
        if ((req as any).user?.email) headers["x-user-email"] = (req as any).user.email;
      }

      const body = buildUpstreamBody(req, headers);

      const upstream = await fetch(url, {
        method: req.method,
        headers,
        body: body as any,
        ...(needsDuplex(body) ? { duplex: "half" as any } : {}),
      });

      res.status(upstream.status);
      upstream.headers.forEach((value, key) => {
        if (key.toLowerCase() === "content-length") return;
        res.setHeader(key, value);
      });

      const buffer = Buffer.from(await upstream.arrayBuffer());
      return res.send(buffer);
    } catch (err) {
      console.error(`Proxy error to ${opts.stripPrefix}:`, err);
      return res.status(502).json({
        error: { code: "BAD_GATEWAY", message: "Upstream service unreachable" },
      });
    }
  };
}
