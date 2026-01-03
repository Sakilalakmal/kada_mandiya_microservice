import { apiFetch } from "@/lib/api";

export type OrderStatus = "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";

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
  paymentMethod: string;
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
  paymentMethod?: "COD";
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
  });
}

export async function getMyOrders(): Promise<OrderListItem[]> {
  const data = await apiFetch<{ ok: true; orders: OrderListItem[] }>("/api/orders/my", {
    method: "GET",
  });
  return data.orders ?? [];
}

export async function getOrderDetail(orderId: string): Promise<OrderDetail> {
  const data = await apiFetch<{ ok: true; order: OrderDetail }>(`/api/orders/${orderId}`, {
    method: "GET",
  });
  if (!data?.order) throw new Error("Order missing from response");
  return data.order;
}

export async function cancelOrder(orderId: string): Promise<{ ok: true }> {
  return apiFetch<{ ok: true }>(`/api/orders/${orderId}/cancel`, {
    method: "PATCH",
  });
}

