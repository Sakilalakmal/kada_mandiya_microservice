import { toast } from "sonner";

import type { ApiError } from "@/lib/api";
import { isAuthenticated } from "@/lib/auth-client";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readPayloadMessage(payload: unknown): string | null {
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

export function getErrorMessage(err: unknown, fallback = "Something went wrong") {
  const apiErr = err as ApiError | undefined;
  const payloadMessage = readPayloadMessage(apiErr?.payload);
  if (payloadMessage) return payloadMessage;
  if (apiErr?.message) return apiErr.message;
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === "string" && err.trim().length) return err.trim();
  return fallback;
}

export function toastApiError(err: unknown, fallback = "Request failed") {
  const apiErr = err as ApiError | undefined;
  const message = getErrorMessage(err, fallback);
  const status = apiErr?.status;

  const isAuthFailure =
    status === 401 ||
    (status === 403 && /invalid|expired|token|jwt/i.test(message));

  // Auth failures should not show noisy toasts. Guests get redirected when needed.
  if (isAuthFailure) {
    if (!isAuthenticated()) return;
    return;
  }

  toast.error(message);
}

export function vendorAccessToast(onAction?: () => void) {
  toast.error("Vendor access required", {
    action: onAction
      ? {
          label: "Become a vendor",
          onClick: onAction,
        }
      : undefined,
  });
}
