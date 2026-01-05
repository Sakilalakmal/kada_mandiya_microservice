"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { OrderDetail, OrderListItem, OrderStatus } from "@/api/orders";
import { cancelOrder, createOrder, getMyOrders, getOrderDetail, type CreateOrderPayload } from "@/api/orders";
import { toastApiError } from "@/components/ui/feedback";
import { useAuth } from "@/hooks/use-auth";

export const ordersKeys = {
  my: ["orders", "my"] as const,
  detail: (orderId: string) => ["orders", "detail", orderId] as const,
};

export function useOrdersQuery() {
  const { token } = useAuth();
  return useQuery<OrderListItem[]>({
    queryKey: ordersKeys.my,
    queryFn: getMyOrders,
    enabled: !!token,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
}

export function useOrderDetailQuery(orderId: string) {
  const { token } = useAuth();
  return useQuery<OrderDetail>({
    queryKey: ordersKeys.detail(orderId),
    queryFn: () => getOrderDetail(orderId),
    enabled: !!token && !!orderId,
    staleTime: 30_000,
    gcTime: 10 * 60_000,
  });
}

export function useCreateOrderMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateOrderPayload) => createOrder(payload),
    onSuccess: async (data, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["cart"] });
      await queryClient.invalidateQueries({ queryKey: ordersKeys.my });

      queryClient.setQueryData<OrderDetail>(ordersKeys.detail(data.orderId), (old) => {
        if (old) return old;
        const now = new Date().toISOString();
        return {
          orderId: data.orderId,
          userId: "",
          status: data.status,
          paymentMethod: variables.paymentMethod ?? "COD",
          deliveryAddress: "",
          mobile: null,
          subtotal: data.subtotal,
          createdAt: now,
          updatedAt: now,
          items: [],
        };
      });
    },
    onError: (err) => toastApiError(err, "Failed to create order"),
  });
}

export function useCancelOrderMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => cancelOrder(orderId),
    onMutate: async (orderId) => {
      await queryClient.cancelQueries({ queryKey: ordersKeys.detail(orderId) });
      await queryClient.cancelQueries({ queryKey: ordersKeys.my });

      const previousDetail = queryClient.getQueryData<OrderDetail>(ordersKeys.detail(orderId));
      const previousList = queryClient.getQueryData<OrderListItem[]>(ordersKeys.my);

      const nextStatus: OrderStatus = "CANCELLED";

      queryClient.setQueryData<OrderDetail>(ordersKeys.detail(orderId), (old) => {
        if (!old) return old;
        return {
          ...old,
          status: nextStatus,
          updatedAt: new Date().toISOString(),
        };
      });

      queryClient.setQueryData<OrderListItem[]>(ordersKeys.my, (old) => {
        if (!old) return old;
        return old.map((o) => (o.orderId === orderId ? { ...o, status: nextStatus } : o));
      });

      return { previousDetail, previousList };
    },
    onSuccess: () => {
      toast.success("Order cancelled");
    },
    onError: (err, orderId, ctx) => {
      if (ctx?.previousDetail) queryClient.setQueryData(ordersKeys.detail(orderId), ctx.previousDetail);
      if (ctx?.previousList) queryClient.setQueryData(ordersKeys.my, ctx.previousList);
      toastApiError(err, "Failed to cancel order");
    },
    onSettled: async (_data, _err, orderId) => {
      await queryClient.invalidateQueries({ queryKey: ordersKeys.detail(orderId) });
      await queryClient.invalidateQueries({ queryKey: ordersKeys.my });
    },
  });
}

