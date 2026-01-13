const TOKEN_STORAGE_KEY = "accessToken";

function base64UrlDecode(segment: string): string | null {
  const normalized = segment.replace(/-/g, "+").replace(/_/g, "/");
  const padded =
    normalized.length % 4 === 0
      ? normalized
      : normalized.padEnd(normalized.length + (4 - (normalized.length % 4)), "=");

  try {
    if (typeof window !== "undefined" && typeof window.atob === "function") {
      return window.atob(padded);
    }
    if (typeof Buffer !== "undefined") {
      return Buffer.from(padded, "base64").toString("utf-8");
    }
  } catch (err) {
    console.error("Failed to decode JWT payload", err);
  }

  return null;
}

export type JwtPayload = Record<string, unknown> & {
  roles?: string[];
};

export function decodeJwtPayload(token: string): JwtPayload | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;

  const payload = base64UrlDecode(parts[1]);
  if (!payload) return null;

  try {
    return JSON.parse(payload) as JwtPayload;
  } catch (err) {
    console.error("Failed to parse JWT payload", err);
    return null;
  }
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setToken(token: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
  window.dispatchEvent(new CustomEvent("auth:token-changed"));
}

export function clearToken() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent("auth:token-changed"));
}

export function getRoles(token?: string | null): string[] {
  if (!token) return [];
  const payload = decodeJwtPayload(token);
  const roles = payload?.roles;
  if (!Array.isArray(roles)) return [];
  return roles.filter((role): role is string => typeof role === "string");
}

// Backwards compatibility
export const getRolesFromToken = getRoles;

export function hasRole(role: string, token?: string | null) {
  return getRoles(token).includes(role);
}

export function isVendor(token?: string | null) {
  return hasRole("vendor", token);
}
