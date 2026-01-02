import { getToken } from "@/lib/auth";

// Prefer explicit gateway base URL so requests always hit the API gateway (defaults to local dev port 4001).
// Keep empty string fallback so rewrites still work when NEXT_PUBLIC_API_BASE_URL is intentionally blank.
export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4001";

export async function apiFetch(
  path: string,
  init: RequestInit = {},
  token: string | null = getToken()
) {
  const headers = new Headers(init.headers);
  if (!headers.has("accept")) headers.set("accept", "application/json");
  if (token) headers.set("authorization", `Bearer ${token}`);
  if (typeof init.body === "string" && init.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  });

  return res;
}
