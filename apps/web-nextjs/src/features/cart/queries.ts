"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { Cart } from "@/api/cart";
import {
  addToCart,
  clearCart,
  getCart,
  removeItem,
  updateQty,
  type AddToCartPayload,
} from "@/api/cart";
import { toastApiError } from "@/components/ui/feedback";
import { useAuth } from "@/hooks/use-auth";

function roundMoney(value: number) {
  return Number(value.toFixed(2));
}

function optimisticSetQty(cart: Cart, itemId: string, qty: number): Cart {
  const nextQty = Math.max(1, qty);
  let subtotal = 0;

  const items = cart.items.map((item) => {
    if (item.itemId !== itemId) {
      subtotal += item.lineTotal;
      return item;
    }

    const nextLineTotal = roundMoney(item.unitPrice * nextQty);
    const nextItem =
      item.qty === nextQty && item.lineTotal === nextLineTotal
        ? item
        : { ...item, qty: nextQty, lineTotal: nextLineTotal };

    subtotal += nextItem.lineTotal;
    return nextItem;
  });

  return { ...cart, items, subtotal: roundMoney(subtotal) };
}

function optimisticRemoveItem(cart: Cart, itemId: string): Cart {
  const items = cart.items.filter((item) => item.itemId !== itemId);
  const subtotal = roundMoney(items.reduce((sum, item) => sum + item.lineTotal, 0));
  return { ...cart, items, subtotal };
}

export function cartTotalQty(cart: Cart | undefined | null) {
  if (!cart?.items?.length) return 0;
  return cart.items.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
}

export function useCartQuery() {
  const { token } = useAuth();
  return useQuery<Cart>({
    queryKey: ["cart"],
    queryFn: getCart,
    enabled: !!token,
    staleTime: 20_000,
  });
}

export function useAddToCartMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AddToCartPayload) => addToCart(payload),
    onSuccess: (cart) => {
      queryClient.setQueryData(["cart"], cart);
      toast.success("Added to cart");
    },
    onError: (err) => toastApiError(err, "Failed to add to cart"),
  });
}

export function useUpdateCartQtyMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, qty }: { itemId: string; qty: number }) => updateQty(itemId, qty),
    onMutate: async ({ itemId, qty }) => {
      await queryClient.cancelQueries({ queryKey: ["cart"] });
      const previous = queryClient.getQueryData<Cart>(["cart"]);

      if (previous) {
        queryClient.setQueryData<Cart>(["cart"], (old) => {
          if (!old) return old as any;
          return optimisticSetQty(old, itemId, qty);
        });
      }

      return { previous };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(["cart"], ctx.previous);
      toastApiError(err, "Failed to update quantity");
    },
    onSuccess: (cart) => {
      queryClient.setQueryData(["cart"], cart);
    },
  });
}

export function useRemoveCartItemMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: string) => removeItem(itemId),
    onMutate: async (itemId) => {
      await queryClient.cancelQueries({ queryKey: ["cart"] });
      const previous = queryClient.getQueryData<Cart>(["cart"]);

      if (previous) {
        queryClient.setQueryData<Cart>(["cart"], (old) => {
          if (!old) return old as any;
          return optimisticRemoveItem(old, itemId);
        });
      }

      return { previous };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(["cart"], ctx.previous);
      toastApiError(err, "Failed to remove item");
    },
    onSuccess: (cart) => {
      queryClient.setQueryData(["cart"], cart);
    },
  });
}

export function useClearCartMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: clearCart,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["cart"] });
      const previous = queryClient.getQueryData<Cart>(["cart"]);

      if (previous) {
        queryClient.setQueryData<Cart>(["cart"], {
          ...previous,
          items: [],
          subtotal: 0,
        });
      }

      return { previous };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(["cart"], ctx.previous);
      toastApiError(err, "Failed to clear cart");
    },
    onSuccess: () => {
      toast.success("Cart cleared");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
}
