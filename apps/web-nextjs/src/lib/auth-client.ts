import { clearToken, decodeJwtPayload, getToken } from "@/lib/auth";

const TOKEN_CHANGED_EVENT = "auth:token-changed";

export function buildNextParam(next: string | null | undefined) {
  const value = typeof next === "string" ? next.trim() : "";
  if (!value) return "/";
  if (!value.startsWith("/")) return "/";
  if (value.startsWith("//")) return "/";
  return value;
}

export function buildAuthRedirectUrl(next?: string | null) {
  const safeNext = buildNextParam(next);
  return `/auth?mode=login&next=${encodeURIComponent(safeNext)}`;
}

export function getCurrentPathWithQuery(): string {
  if (typeof window === "undefined") return "/";
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

function tokenExpSeconds(token: string): number | null {
  const payload = decodeJwtPayload(token);
  const exp = payload?.exp;
  if (typeof exp === "number" && Number.isFinite(exp)) return exp;
  if (typeof exp === "string") {
    const parsed = Number(exp);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

export function getAccessToken(): string | null {
  const token = getToken();
  if (!token) return null;

  const exp = tokenExpSeconds(token);
  if (!exp) return token;

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (exp <= nowSeconds) {
    clearToken();
    return null;
  }

  return token;
}

export function isAuthenticated(): boolean {
  return Boolean(getAccessToken());
}

export function redirectToAuth(next?: string | null) {
  if (typeof window === "undefined") return;
  const url = buildAuthRedirectUrl(next ?? getCurrentPathWithQuery());
  if (window.location.pathname.startsWith("/auth")) return;
  window.location.replace(url);
}

export function requireAuthOrRedirect(next?: string | null): boolean {
  if (isAuthenticated()) return true;
  redirectToAuth(next);
  return false;
}

export function tokenChangedEventName() {
  return TOKEN_CHANGED_EVENT;
}

