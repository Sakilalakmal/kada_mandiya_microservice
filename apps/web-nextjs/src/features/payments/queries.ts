"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { PaymentDetail, PaymentListItem, SimulatePaymentResult } from "@/api/payments";
import {
  getMyPayments,
  getPaymentByOrderId,
  simulatePaymentFail,
  simulatePaymentSuccess,
} from "@/api/payments";
import { toastApiError } from "@/components/ui/feedback";
import { useAuth } from "@/hooks/use-auth";

export const paymentsKeys = {
  byOrder: (orderId: string) => ["payments", "byOrder", orderId] as const,
  my: ["payments", "my"] as const,
};

export function usePaymentByOrderQuery(orderId: string) {
  const { token } = useAuth();

  return useQuery<PaymentDetail>({
    queryKey: paymentsKeys.byOrder(orderId),
    queryFn: () => getPaymentByOrderId(orderId),
    enabled: !!token && !!orderId,
    staleTime: 20_000,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: false,
    refetchInterval: (query) => (query.state.data?.status === "PENDING" ? 2000 : false),
  });
}

export function useMyPaymentsQuery() {
  const { token } = useAuth();

  return useQuery<PaymentListItem[]>({
    queryKey: paymentsKeys.my,
    queryFn: getMyPayments,
    enabled: !!token,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
}

function isSupported(result: SimulatePaymentResult): result is { ok: true } {
  return !!result && result.ok === true;
}

export function useSimulateSuccessMutation(orderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => simulatePaymentSuccess(orderId),
    onSuccess: async (result) => {
      if (!isSupported(result)) {
        toast.message("Simulate endpoint not enabled");
        return;
      }
      toast.success("Payment marked as paid");
      await queryClient.invalidateQueries({ queryKey: paymentsKeys.byOrder(orderId) });
      await queryClient.invalidateQueries({ queryKey: paymentsKeys.my });
    },
    onError: (err) => toastApiError(err, "Failed to simulate payment success"),
  });
}

export function useSimulateFailMutation(orderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => simulatePaymentFail(orderId),
    onSuccess: async (result) => {
      if (!isSupported(result)) {
        toast.message("Simulate endpoint not enabled");
        return;
      }
      toast.success("Payment marked as failed");
      await queryClient.invalidateQueries({ queryKey: paymentsKeys.byOrder(orderId) });
      await queryClient.invalidateQueries({ queryKey: paymentsKeys.my });
    },
    onError: (err) => toastApiError(err, "Failed to simulate payment fail"),
  });
}

