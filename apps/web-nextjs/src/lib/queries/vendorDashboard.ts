"use client";

import { useQuery } from "@tanstack/react-query";

import type { VendorOrderListItem } from "@/api/orders";
import type { ProductListItem } from "@/lib/products";
import {
  getVendorOrders,
  getVendorProducts,
  getVendorProfile,
  type VendorProfile,
} from "@/lib/api/vendor";
import { useAuth } from "@/hooks/use-auth";

const PENDING_STATUSES = new Set(["PENDING", "PROCESSING"]);

export const vendorDashboardKeys = {
  base: (token: string | null) => ["vendor", "dashboard", token] as const,
  profile: (token: string | null) => [...vendorDashboardKeys.base(token), "profile"] as const,
  orders: (token: string | null) => [...vendorDashboardKeys.base(token), "orders"] as const,
  products: (token: string | null) => [...vendorDashboardKeys.base(token), "products"] as const,
};

export type VendorOrdersSummary = {
  orders: VendorOrderListItem[];
  totalOrders: number;
  pendingOrders: number;
  recentOrders: VendorOrderListItem[];
};

export type VendorProductsSummary = {
  totalProducts: number;
  lowStockProducts: ProductListItem[];
};

function sortOrdersByCreatedAt(orders: VendorOrderListItem[]) {
  return [...orders].sort((a, b) => {
    const timeA = Date.parse(a.createdAt ?? "");
    const timeB = Date.parse(b.createdAt ?? "");
    if (Number.isNaN(timeA) && Number.isNaN(timeB)) return 0;
    if (Number.isNaN(timeA)) return 1;
    if (Number.isNaN(timeB)) return -1;
    return timeB - timeA;
  });
}

function selectOrdersSummary(orders: VendorOrderListItem[]): VendorOrdersSummary {
  const sortedOrders = sortOrdersByCreatedAt(orders);
  const pendingOrders = sortedOrders.filter((order) => PENDING_STATUSES.has(order.status)).length;
  return {
    orders: sortedOrders,
    totalOrders: sortedOrders.length,
    pendingOrders,
    recentOrders: sortedOrders.slice(0, 8),
  };
}

function selectProductsSummary(products: ProductListItem[]): VendorProductsSummary {
  const lowStockProducts = products
    .filter((product) => product.stockQty <= 5)
    .sort((a, b) => a.stockQty - b.stockQty)
    .slice(0, 8);

  return {
    totalProducts: products.length,
    lowStockProducts,
  };
}

export function useVendorDashboardProfileQuery() {
  const { token, isVendor } = useAuth();

  return useQuery<VendorProfile | null>({
    queryKey: vendorDashboardKeys.profile(token),
    queryFn: getVendorProfile,
    enabled: Boolean(token) && Boolean(isVendor),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

export function useVendorDashboardOrdersQuery() {
  const { token, isVendor } = useAuth();

  return useQuery({
    queryKey: vendorDashboardKeys.orders(token),
    queryFn: () => getVendorOrders(),
    enabled: Boolean(token) && Boolean(isVendor),
    staleTime: 20_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
    select: selectOrdersSummary,
  });
}

export function useVendorDashboardProductsQuery() {
  const { token, isVendor } = useAuth();

  return useQuery({
    queryKey: vendorDashboardKeys.products(token),
    queryFn: getVendorProducts,
    enabled: Boolean(token) && Boolean(isVendor),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
    select: selectProductsSummary,
  });
}
