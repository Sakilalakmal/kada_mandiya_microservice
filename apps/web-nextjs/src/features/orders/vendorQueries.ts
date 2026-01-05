"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { VendorOrderDetail, VendorOrderListItem } from "@/api/orders";
import { getVendorOrderById, getVendorOrders, updateVendorOrderStatus } from "@/api/orders";
import { toastApiError } from "@/components/ui/feedback";
import { useAuth } from "@/hooks/use-auth";

export const vendorOrdersKeys = {
  list: ["vendor", "orders", "list"] as const,
  detail: (orderId: string) => ["vendor", "orders", "detail", orderId] as const,
};

export function useVendorOrdersQuery() {
  const { token, isVendor } = useAuth();

  return useQuery<VendorOrderListItem[]>({
    queryKey: vendorOrdersKeys.list,
    queryFn: getVendorOrders,
    enabled: Boolean(token) && Boolean(isVendor),
    staleTime: 15_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

export function useVendorOrderDetailQuery(orderId: string) {
  const { token, isVendor } = useAuth();

  return useQuery<VendorOrderDetail>({
    queryKey: vendorOrdersKeys.detail(orderId),
    queryFn: () => getVendorOrderById(orderId),
    enabled: Boolean(token) && Boolean(isVendor) && Boolean(orderId),
    staleTime: 15_000,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

export function useUpdateVendorOrderStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { orderId: string; status: "PROCESSING" | "SHIPPED" | "DELIVERED" }) =>
      updateVendorOrderStatus(input.orderId, input.status),
    onSuccess: async (_data, input) => {
      toast.success("Order status updated");
      await queryClient.invalidateQueries({ queryKey: vendorOrdersKeys.detail(input.orderId) });
      await queryClient.invalidateQueries({ queryKey: vendorOrdersKeys.list });
    },
    onError: (err) => toastApiError(err, "Failed to update order status"),
  });
}

