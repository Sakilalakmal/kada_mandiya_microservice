import { clearToken } from "@/lib/auth";

export type LogoutRedirectTarget = "/auth" | `/auth${string}` | "/";

type RouterLike = {
  replace: (href: string) => void;
  refresh?: () => void;
};

type QueryClientLike = {
  clear: () => void;
};

type LogoutOptions = {
  /**
   * Clears token/session stored by `AuthProvider` (localStorage `accessToken`)
   * and resets the in-memory auth state.
   */
  setAuthToken?: (token: string | null) => void;
  /**
   * Clears cached user data (TanStack Query).
   */
  queryClient?: QueryClientLike;
  /**
   * Next.js App Router instance for client-side redirect.
   */
  router?: RouterLike;
  /**
   * After logout redirect goes here (login page by default).
   */
  redirectTo?: LogoutRedirectTarget;
};

export function logout({
  setAuthToken,
  queryClient,
  router,
  redirectTo = "/auth?mode=login",
}: LogoutOptions = {}) {
  // Token/session is stored in localStorage (`accessToken`) via `AuthProvider`.
  // Clearing it here ensures protected routes require login again.
  if (setAuthToken) setAuthToken(null);
  else clearToken();

  // Clear client-side caches that may contain user-specific data.
  queryClient?.clear();

  // Redirect to login (or landing page) after logout.
  if (router) {
    router.replace(redirectTo);
    router.refresh?.();
    return;
  }

  if (typeof window !== "undefined") {
    window.location.assign(redirectTo);
  }
}

