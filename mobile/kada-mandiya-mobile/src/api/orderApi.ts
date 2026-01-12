import { baseApi } from './baseApi';
import { cartApi } from './cartApi';
import type { CreateOrderRequest, CreateOrderResponse, GetMyOrdersResponse, GetOrderResponse, OrderDetails, OrderListItem } from '../types/order.types';

type OrdersTag = { type: 'Orders'; id: 'LIST' };
type OrderTag = { type: 'Order'; id: string };

export const orderApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createOrder: builder.mutation<CreateOrderResponse, CreateOrderRequest>({
      query: (body) => ({ url: '/orders', method: 'POST', body }),
      invalidatesTags: (_res, _err): (OrdersTag | { type: 'Cart'; id: 'CURRENT' })[] => [
        { type: 'Orders', id: 'LIST' },
        { type: 'Cart', id: 'CURRENT' },
      ],
      async onQueryStarted(_args, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(
            cartApi.util.updateQueryData('getCart', undefined, (draft) => {
              draft.items = [];
              draft.subtotal = 0;
            })
          );
        } catch {
          // no-op
        }
      },
    }),

    getMyOrders: builder.query<OrderListItem[], void>({
      query: () => ({ url: '/orders/my', method: 'GET' }),
      transformResponse: (response: GetMyOrdersResponse) => response.orders,
      providesTags: (result): (OrdersTag | OrderTag)[] => {
        const tags: (OrdersTag | OrderTag)[] = [{ type: 'Orders', id: 'LIST' }];
        for (const o of result ?? []) tags.push({ type: 'Order', id: o.orderId });
        return tags;
      },
    }),

    getOrderById: builder.query<OrderDetails, string>({
      query: (orderId) => ({ url: `/orders/${encodeURIComponent(orderId)}`, method: 'GET' }),
      transformResponse: (response: GetOrderResponse) => response.order,
      providesTags: (_res, _err, orderId): OrderTag[] => [{ type: 'Order', id: orderId }],
    }),
  }),
  overrideExisting: false,
});

export const { useCreateOrderMutation, useGetMyOrdersQuery, useGetOrderByIdQuery } = orderApi;
