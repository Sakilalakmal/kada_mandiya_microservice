import { apiFetch } from "@/lib/api";

export type OrderStatus = "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
export type OrderPaymentMethod = "COD" | "ONLINE";

export type OrderListItem = {
  orderId: string;
  status: OrderStatus;
  subtotal: number;
  createdAt: string;
};

export type OrderItem = {
  itemId: string;
  productId: string;
  vendorId: string | null;
  title: string;
  imageUrl: string | null;
  unitPrice: number;
  qty: number;
  lineTotal: number;
  createdAt: string;
};

export type OrderDetail = {
  orderId: string;
  userId: string;
  status: OrderStatus;
  paymentMethod: OrderPaymentMethod;
  deliveryAddress: string;
  mobile: string | null;
  subtotal: number;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
};

export type CreateOrderPayload = {
  deliveryAddress: string;
  mobile?: string;
  paymentMethod?: OrderPaymentMethod;
};

export type CreateOrderResponse = {
  ok: true;
  message: string;
  orderId: string;
  status: OrderStatus;
  subtotal: number;
};

export async function createOrder(payload: CreateOrderPayload): Promise<CreateOrderResponse> {
  return apiFetch<CreateOrderResponse>("/api/orders", {
    method: "POST",
    body: payload,
    auth: "required",
  });
}

export async function getMyOrders(): Promise<OrderListItem[]> {
  const data = await apiFetch<{ ok: true; orders: OrderListItem[] }>("/api/orders/my", {
    method: "GET",
    auth: "required",
  });
  return data.orders ?? [];
}

export async function getOrderDetail(orderId: string): Promise<OrderDetail> {
  const data = await apiFetch<{ ok: true; order: OrderDetail }>(`/api/orders/${orderId}`, {
    method: "GET",
    auth: "required",
  });
  if (!data?.order) throw new Error("Order missing from response");
  return data.order;
}

export async function cancelOrder(orderId: string): Promise<{ ok: true }> {
  return apiFetch<{ ok: true }>(`/api/orders/${orderId}/cancel`, {
    method: "PATCH",
    auth: "required",
  });
}

export type VendorOrderListItem = {
  orderId: string;
  status: OrderStatus;
  subtotal: number;
  vendorSubtotal: number;
  createdAt: string;
  itemsForThisVendor: VendorOrderListItemItem[];
};

export type VendorOrderListItemItem = {
  itemId: string;
  productId: string;
  title: string;
  imageUrl: string | null;
  unitPrice: number;
  qty: number;
  lineTotal: number;
  createdAt: string;
};

export type VendorOrderDetailItem = {
  productId: string;
  title: string;
  imageUrl: string | null;
  unitPrice: number;
  qty: number;
  lineTotal: number;
};

export type VendorOrderDetail = {
  orderId: string;
  status: OrderStatus;
  createdAt: string;
  deliveryAddress?: string;
  items: VendorOrderDetailItem[];
  vendorSubtotal: number;
};

export async function getVendorOrders(): Promise<VendorOrderListItem[]> {
  const data = await apiFetch<{ ok: true; orders: VendorOrderListItem[] }>("/api/vendor/orders", {
    method: "GET",
    auth: "required",
  });
  return data.orders ?? [];
}

export async function getVendorOrderById(orderId: string): Promise<VendorOrderDetail> {
  const data = await apiFetch<{ ok: true; order: VendorOrderDetail }>(`/api/vendor/orders/${orderId}`, {
    method: "GET",
    auth: "required",
  });
  if (!data?.order) throw new Error("Order missing from response");
  return data.order;
}

export async function updateVendorOrderStatus(
  orderId: string,
  status: "PROCESSING" | "SHIPPED" | "DELIVERED"
): Promise<{ ok: true }> {
  return apiFetch<{ ok: true }>(`/api/vendor/orders/${orderId}/status`, {
    method: "PATCH",
    body: { status },
    auth: "required",
  });
}

