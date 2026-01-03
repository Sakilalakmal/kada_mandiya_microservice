import { apiFetch } from "@/lib/api";

export type CartItem = {
  itemId: string;
  productId: string;
  vendorId: string | null;
  title: string;
  imageUrl: string | null;
  unitPrice: number;
  qty: number;
  lineTotal: number;
};

export type Cart = {
  cartId: string | null;
  userId: string;
  items: CartItem[];
  subtotal: number;
};

export type CartResponse = {
  ok: boolean;
  cart: Cart;
};

export type AddToCartPayload = {
  productId: string;
  qty: number;
  unitPrice: number;
  title: string;
  imageUrl?: string;
  vendorId?: string;
};

export async function getCart(): Promise<Cart> {
  const data = await apiFetch<CartResponse>("/api/cart", { method: "GET" });
  if (!data?.cart) throw new Error("Cart missing from response");
  return data.cart;
}

export async function addToCart(payload: AddToCartPayload): Promise<Cart> {
  const data = await apiFetch<CartResponse>("/api/cart/items", {
    method: "POST",
    body: payload,
  });
  if (!data?.cart) throw new Error("Cart missing from response");
  return data.cart;
}

export async function updateQty(itemId: string, qty: number): Promise<Cart> {
  const data = await apiFetch<CartResponse>(`/api/cart/items/${itemId}`, {
    method: "PATCH",
    body: { qty },
  });
  if (!data?.cart) throw new Error("Cart missing from response");
  return data.cart;
}

export async function removeItem(itemId: string): Promise<Cart> {
  const data = await apiFetch<CartResponse>(`/api/cart/items/${itemId}`, {
    method: "DELETE",
  });
  if (!data?.cart) throw new Error("Cart missing from response");
  return data.cart;
}

export async function clearCart(): Promise<{ ok: boolean; message?: string }> {
  return apiFetch<{ ok: boolean; message?: string }>("/api/cart", {
    method: "DELETE",
  });
}

