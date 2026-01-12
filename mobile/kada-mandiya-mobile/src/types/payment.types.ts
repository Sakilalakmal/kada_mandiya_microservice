export type PaymentMethod = 'COD' | 'ONLINE';
export type PaymentStatus = 'NOT_REQUIRED' | 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export type Payment = {
  paymentId: string;
  orderId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  provider: string;
  providerRef: string | null;
  stripeSessionId: string | null;
  stripePaymentIntentId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type GetPaymentByOrderIdResponse = {
  ok: true;
  payment: Payment;
};

export type CreateCheckoutSessionResponse = {
  ok: true;
  url: string;
};

