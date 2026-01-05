import { apiFetch } from "@/lib/api";

export type PaymentMethod = "COD" | "ONLINE";
export type PaymentStatus = "NOT_REQUIRED" | "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED";

export type PaymentDetail = {
  paymentId: string;
  orderId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  provider: string;
  providerRef: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PaymentListItem = {
  orderId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  provider: string;
  createdAt: string;
  updatedAt: string;
};

export async function getPaymentByOrderId(orderId: string): Promise<PaymentDetail> {
  const data = await apiFetch<{ ok: true; payment: PaymentDetail }>(`/api/payments/${orderId}`, {
    method: "GET",
  });
  if (!data?.payment) throw new Error("Payment missing from response");
  return data.payment;
}

export async function getMyPayments(): Promise<PaymentListItem[]> {
  const data = await apiFetch<{ ok: true; payments: PaymentListItem[] }>(`/api/payments/my`, {
    method: "GET",
  });
  return data.payments ?? [];
}

export type SimulatePaymentResult = { ok: true } | { ok: false; notSupported: true };

function errorStatus(err: unknown): number | undefined {
  if (typeof err !== "object" || err === null) return undefined;
  if (!("status" in err)) return undefined;
  const status = (err as Record<string, unknown>).status;
  return typeof status === "number" ? status : undefined;
}

export async function simulatePaymentSuccess(orderId: string): Promise<SimulatePaymentResult> {
  try {
    return await apiFetch<{ ok: true }>(`/api/payments/${orderId}/simulate-success`, {
      method: "POST",
    });
  } catch (err) {
    if (errorStatus(err) === 404) return { ok: false, notSupported: true };
    throw err;
  }
}

export async function simulatePaymentFail(orderId: string): Promise<SimulatePaymentResult> {
  try {
    return await apiFetch<{ ok: true }>(`/api/payments/${orderId}/simulate-fail`, {
      method: "POST",
    });
  } catch (err) {
    if (errorStatus(err) === 404) return { ok: false, notSupported: true };
    throw err;
  }
}

