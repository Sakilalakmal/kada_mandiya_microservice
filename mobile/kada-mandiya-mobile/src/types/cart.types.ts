export type CartItem = {
  itemId: string;
  productId: string;
  vendorId?: string;
  title: string;
  imageUrl?: string;
  unitPrice: number;
  qty: number;
  lineTotal: number;
  stockQty: number;
};

export type Cart = {
  cartId: string | null;
  userId: string;
  items: CartItem[];
  subtotal: number;
};

export type GetCartResponse = {
  ok: true;
  cart: Cart;
};

export type AddToCartRequest = {
  productId: string;
  qty: number;
  unitPrice: number;
  title: string;
  imageUrl?: string;
  vendorId?: string;
};

export type AddToCartResponse = {
  ok: true;
  cart: Cart;
};

export type UpdateCartItemRequest = {
  qty: number;
};

export type UpdateCartItemResponse = {
  ok: true;
  cart: Cart;
};

export type RemoveCartItemResponse = {
  ok: true;
  cart: Cart;
};

export type ClearCartResponse = {
  ok: true;
  message: string;
};

