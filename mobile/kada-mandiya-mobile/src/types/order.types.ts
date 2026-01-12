export type PaymentMethod = 'COD' | 'ONLINE';

export type OrderStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

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

export type OrderDetails = {
  orderId: string;
  userId: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod | string;
  deliveryAddress: string;
  mobile: string | null;
  subtotal: number;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
};

export type CreateOrderRequest = {
  deliveryAddress: string;
  mobile?: string;
  paymentMethod?: PaymentMethod;
};

export type CreateOrderResponse = {
  ok: true;
  message: string;
  orderId: string;
  status: OrderStatus;
  subtotal: number;
};

export type GetMyOrdersResponse = {
  ok: true;
  orders: OrderListItem[];
};

export type GetOrderResponse = {
  ok: true;
  order: OrderDetails;
};

