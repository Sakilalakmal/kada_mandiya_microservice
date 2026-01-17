import { baseApi } from './baseApi';
import { cartApi } from './cartApi';
import type {
  CancelOrderResponse,
  CreateOrderRequest,
  CreateOrderResponse,
  GetMyOrdersResponse,
  GetOrderResponse,
  GetVendorOrderResponse,
  GetVendorOrdersResponse,
  OrderDetails,
  OrderListItem,
  VendorOrderDetail,
  VendorOrderListItem,
  VendorOrderStatusUpdateRequest,
} from '../types/order.types';

type OrdersListTag = { type: 'Orders'; id: 'LIST' | 'VENDOR_LIST' };
type OrderItemTag = { type: 'Orders'; id: `Order:${string}` };

export const orderApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createOrder: builder.mutation<CreateOrderResponse, CreateOrderRequest>({
      query: (body) => ({ url: '/orders', method: 'POST', body }),
      invalidatesTags: (_res, _err): (OrdersListTag | { type: 'Cart'; id: 'CURRENT' } | { type: 'Product'; id: 'LIST' })[] => [
        { type: 'Orders', id: 'LIST' },
        { type: 'Cart', id: 'CURRENT' },
        { type: 'Product', id: 'LIST' },
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
      providesTags: (result): (OrdersListTag | OrderItemTag)[] => {
        const tags: (OrdersListTag | OrderItemTag)[] = [{ type: 'Orders', id: 'LIST' }];
        for (const o of result ?? []) tags.push({ type: 'Orders', id: `Order:${o.orderId}` });
        return tags;
      },
    }),

    getOrderById: builder.query<OrderDetails, string>({
      query: (orderId) => ({ url: `/orders/${encodeURIComponent(orderId)}`, method: 'GET' }),
      transformResponse: (response: GetOrderResponse) => response.order,
      providesTags: (_res, _err, orderId): OrderItemTag[] => [{ type: 'Orders', id: `Order:${orderId}` }],
    }),

    cancelOrder: builder.mutation<CancelOrderResponse, { orderId: string }>({
      query: ({ orderId }) => ({ url: `/orders/${encodeURIComponent(orderId)}/cancel`, method: 'PATCH' }),
      invalidatesTags: (_res, _err, { orderId }): (OrdersListTag | OrderItemTag)[] => [
        { type: 'Orders', id: 'LIST' },
        { type: 'Orders', id: `Order:${orderId}` },
      ],
    }),

    getVendorOrders: builder.query<VendorOrderListItem[], void>({
      query: () => ({ url: '/vendor/orders', method: 'GET' }),
      transformResponse: (response: GetVendorOrdersResponse) => response.orders,
      providesTags: (result): (OrdersListTag | OrderItemTag)[] => {
        const tags: (OrdersListTag | OrderItemTag)[] = [{ type: 'Orders', id: 'VENDOR_LIST' }];
        for (const o of result ?? []) tags.push({ type: 'Orders', id: `Order:${o.orderId}` });
        return tags;
      },
    }),

    getVendorOrderById: builder.query<VendorOrderDetail, string>({
      query: (orderId) => ({ url: `/vendor/orders/${encodeURIComponent(orderId)}`, method: 'GET' }),
      transformResponse: (response: GetVendorOrderResponse) => response.order,
      providesTags: (_res, _err, orderId): OrderItemTag[] => [{ type: 'Orders', id: `Order:${orderId}` }],
    }),

    updateVendorOrderStatus: builder.mutation<{ ok: true }, VendorOrderStatusUpdateRequest>({
      query: ({ orderId, status }) => ({
        url: `/vendor/orders/${encodeURIComponent(orderId)}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: (_res, _err, { orderId }): (OrdersListTag | OrderItemTag)[] => [
        { type: 'Orders', id: 'VENDOR_LIST' },
        { type: 'Orders', id: `Order:${orderId}` },
      ],
      async onQueryStarted({ orderId, status }, { dispatch, queryFulfilled }) {
        const patchDetail = dispatch(
          orderApi.util.updateQueryData('getVendorOrderById', orderId, (draft) => {
            draft.status = status;
          })
        );

        const patchList = dispatch(
          orderApi.util.updateQueryData('getVendorOrders', undefined, (draft) => {
            const order = draft.find((o) => o.orderId === orderId);
            if (order) order.status = status;
          })
        );

        try {
          await queryFulfilled;
        } catch {
          patchDetail.undo();
          patchList.undo();
        }
      },
    }),
  }),
  overrideExisting: false,
});

export const {
  useCreateOrderMutation,
  useGetMyOrdersQuery,
  useGetOrderByIdQuery,
  useCancelOrderMutation,
  useGetVendorOrdersQuery,
  useGetVendorOrderByIdQuery,
  useUpdateVendorOrderStatusMutation,
} = orderApi;
