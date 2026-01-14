export type Money = {
  amount: number;
  currency: string;
};

export type PaymentMethod = 'COD' | 'ONLINE';

export type OrderStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export type VendorUpdatableOrderStatus = 'PROCESSING' | 'SHIPPED' | 'DELIVERED';

export type OrderBadgeVariant = 'neutral' | 'info' | 'success' | 'danger';

export function getOrderStatusBadgeMeta(status: OrderStatus): { label: string; variant: OrderBadgeVariant } {
  switch (status) {
    case 'PENDING':
      return { label: 'Pending', variant: 'neutral' };
    case 'PROCESSING':
      return { label: 'Processing', variant: 'info' };
    case 'SHIPPED':
      return { label: 'Shipped', variant: 'info' };
    case 'DELIVERED':
      return { label: 'Delivered', variant: 'success' };
    case 'CANCELLED':
      return { label: 'Cancelled', variant: 'danger' };
    default: {
      const exhaustive: never = status;
      return exhaustive;
    }
  }
}

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

export type CancelOrderResponse = {
  ok: true;
};

export type GetMyOrdersResponse = {
  ok: true;
  orders: OrderListItem[];
};

export type GetOrderResponse = {
  ok: true;
  order: OrderDetails;
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

export type VendorOrderListItem = {
  orderId: string;
  status: OrderStatus;
  subtotal: number;
  vendorSubtotal: number;
  createdAt: string;
  itemsForThisVendor: VendorOrderListItemItem[];
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

export type GetVendorOrdersResponse = {
  ok: true;
  orders: VendorOrderListItem[];
};

export type GetVendorOrderResponse = {
  ok: true;
  order: VendorOrderDetail;
};

export type VendorOrderStatusUpdateRequest = {
  orderId: string;
  status: VendorUpdatableOrderStatus;
};

