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
    const body = req.body ? JSON.stringify(req.body) : undefined;
    if (body) headers["content-type"] = headers["content-type"] ?? "application/json";
    return body;
  }

  if (contentType.startsWith("multipart/form-data")) {
    return req as unknown as Readable;
  }

  return req as unknown as Readable;
}

export function needsDuplex(body: unknown) {
  return typeof body === "object" && body !== null && "pipe" in body;
}
