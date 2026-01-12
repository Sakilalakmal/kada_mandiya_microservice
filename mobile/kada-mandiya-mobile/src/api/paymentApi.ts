import { baseApi } from './baseApi';
import type { CreateCheckoutSessionResponse, GetPaymentByOrderIdResponse, Payment } from '../types/payment.types';

type PaymentTag = { type: 'Payment'; id: string };

export const paymentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPaymentByOrderId: builder.query<Payment, string>({
      query: (orderId) => ({ url: `/payments/${encodeURIComponent(orderId)}`, method: 'GET' }),
      transformResponse: (response: GetPaymentByOrderIdResponse) => response.payment,
      providesTags: (_res, _err, orderId): PaymentTag[] => [{ type: 'Payment', id: orderId }],
    }),

    createCheckoutSession: builder.mutation<CreateCheckoutSessionResponse, { orderId: string }>({
      query: ({ orderId }) => ({ url: `/payments/${encodeURIComponent(orderId)}/checkout-session`, method: 'POST' }),
      invalidatesTags: (_res, _err, { orderId }): PaymentTag[] => [{ type: 'Payment', id: orderId }],
    }),
  }),
  overrideExisting: false,
});

export const { useGetPaymentByOrderIdQuery, useLazyGetPaymentByOrderIdQuery, useCreateCheckoutSessionMutation } = paymentApi;

