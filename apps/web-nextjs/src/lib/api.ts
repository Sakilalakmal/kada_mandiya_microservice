export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4001";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("accessToken");
}

export function clearAccessToken() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem("accessToken");
}

export async function apiFetch(
  path: string,
  init: RequestInit = {},
  token: string | null = getAccessToken()
) {
  const headers = new Headers(init.headers);
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
