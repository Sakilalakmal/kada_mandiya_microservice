import type { Request } from "express";
import { Readable } from "stream";

export function copyHeaders(req: Request) {
  const headers: Record<string, string> = {};
  for (const [key, value] of Object.entries(req.headers)) {
    const lower = key.toLowerCase();
    if (lower === "host" || lower === "content-length" || lower === "transfer-encoding") continue;
    if (Array.isArray(value)) headers[key] = value.join(", ");
    else if (value !== undefined) headers[key] = value as string;
  }
  return headers;
}

export function buildUpstreamBody(req: Request, headers: Record<string, string>) {
  const method = req.method.toUpperCase();
  if (["GET", "HEAD"].includes(method)) return undefined;

  const contentType = String(req.headers["content-type"] ?? "");

  if (contentType.includes("application/json")) {
    if (Buffer.isBuffer(req.body)) {
      headers["content-type"] = headers["content-type"] ?? "application/json";
      return req.body;
    }

    if (req.body !== undefined) {
      const body = JSON.stringify(req.body);
      headers["content-type"] = headers["content-type"] ?? "application/json";
      return body;
    }

    // When the gateway skips JSON parsing (e.g. for Stripe webhooks), forward the raw stream.
    return req as unknown as Readable;
  }

  if (contentType.startsWith("multipart/form-data")) {
    return req as unknown as Readable;
  }

  return req as unknown as Readable;
}

export function needsDuplex(body: unknown) {
  return typeof body === "object" && body !== null && "pipe" in body;
}
