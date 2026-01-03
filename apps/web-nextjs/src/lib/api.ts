import { getToken } from "@/lib/auth";

export type ApiError = Error & { status?: number; payload?: unknown };
export type ApiFetchInit = Omit<RequestInit, "body"> & { body?: unknown; token?: string | null };

// Prefer explicit gateway base URL so requests always hit the API gateway.
// Fall back to NEXT_PUBLIC_API_GATEWAY_URL (set via next.config env) and then local dev port 4001.
const rawApiBase =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_GATEWAY_URL ||
  "http://localhost:4001";

export const API_BASE = rawApiBase.replace(/\/+$/, "");

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeBody(body: unknown) {
  if (!body) return { body };
  const tag = Object.prototype.toString.call(body);
  if (tag === "[object Object]") return { body: JSON.stringify(body), contentType: "application/json" };
  return { body };
}

function readErrorMessage(payload: unknown): string | null {
  if (!payload) return null;
  if (typeof payload === "string") return payload;
  if (isRecord(payload)) {
    const err = payload.error;
    if (isRecord(err) && typeof err.message === "string") {
      return err.message;
    }
    if (typeof payload.message === "string") return payload.message;
  }
  return null;
}

export function isApiError(err: unknown): err is ApiError {
  return err instanceof Error;
}

export async function apiFetch<TResponse = unknown>(
  path: string,
  init: ApiFetchInit | undefined = {}
): Promise<TResponse> {
  const { token, ...rest } = init ?? {};
  const authToken = token ?? getToken();

  const headers = new Headers(rest.headers);
  if (!headers.has("accept")) headers.set("accept", "application/json");
  if (authToken) headers.set("authorization", `Bearer ${authToken}`);

  const { body, contentType } = normalizeBody(rest.body);
  if (contentType && !headers.has("content-type")) {
    headers.set("content-type", contentType);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers,
    body: body as BodyInit | null | undefined,
  });

  const contentTypeHeader = response.headers.get("content-type") ?? "";
  const isJson = contentTypeHeader.includes("application/json");
  const payload = isJson ? await response.json().catch(() => null) : await response.text().catch(() => null);

  if (!response.ok) {
    const message = readErrorMessage(payload) ?? `Request failed with status ${response.status}`;
    const error = new Error(message) as ApiError;
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload as TResponse;
}
