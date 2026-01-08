import type { VendorOrderListItem } from "@/api/orders";
import { apiFetch } from "@/lib/api";
import { fetchMyProducts, type ProductListItem } from "@/lib/products";

export type VendorProfile = {
  id: string;
  userId: string;
  email: string | null;
  storeName: string;
  description: string | null;
  phone: string | null;
  address: string | null;
  shopImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

type VendorOrdersResponse = {
  ok: true;
  orders: VendorOrderListItem[];
};

type VendorProfileResponse = {
  ok: true;
  vendor: VendorProfile | null;
};

function buildQuery(params: { limit?: number }) {
  const query = new URLSearchParams();
  if (params.limit) query.set("limit", String(params.limit));
  const qs = query.toString();
  return qs ? `?${qs}` : "";
}

export async function getVendorOrders(params: { limit?: number } = {}) {
  const query = buildQuery(params);
  const data = await apiFetch<VendorOrdersResponse>(`/api/vendor/orders${query}`, {
    method: "GET",
  });
  return data.orders ?? [];
}

export async function getVendorProfile() {
  const data = await apiFetch<VendorProfileResponse>("/vendors/me", {
    method: "GET",
  });
  return data.vendor ?? null;
}

export async function getVendorProducts(): Promise<ProductListItem[]> {
  return fetchMyProducts();
}
