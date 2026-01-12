import { baseApi } from './baseApi';
import type {
  AddToCartRequest,
  AddToCartResponse,
  Cart,
  ClearCartResponse,
  GetCartResponse,
  RemoveCartItemResponse,
  UpdateCartItemResponse,
} from '../types/cart.types';

type CartTag = { type: 'Cart'; id: 'CURRENT' };

function roundMoney(value: number) {
  return Number((Number.isFinite(value) ? value : 0).toFixed(2));
}

function recomputeSubtotal(cart: Cart) {
  cart.subtotal = roundMoney(cart.items.reduce((sum, item) => sum + Number(item.lineTotal ?? 0), 0));
}

function emptyCartLike(prev?: Cart): Cart {
  return {
    cartId: prev?.cartId ?? null,
    userId: prev?.userId ?? '',
    items: [],
    subtotal: 0,
  };
}

export const cartApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCart: builder.query<Cart, void>({
      query: () => ({ url: '/cart', method: 'GET' }),
      transformResponse: (response: GetCartResponse) => response.cart,
      providesTags: (): CartTag[] => [{ type: 'Cart', id: 'CURRENT' }],
    }),

    addToCart: builder.mutation<Cart, AddToCartRequest>({
      query: (body) => ({ url: '/cart/items', method: 'POST', body }),
      transformResponse: (response: AddToCartResponse) => response.cart,
      invalidatesTags: (): CartTag[] => [{ type: 'Cart', id: 'CURRENT' }],
      async onQueryStarted(args, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          cartApi.util.updateQueryData('getCart', undefined, (draft) => {
            const existing = draft.items.find((i) => i.productId === args.productId);
            if (existing) {
              existing.qty = Math.max(1, Number(existing.qty) + Number(args.qty));
              existing.unitPrice = Number(args.unitPrice);
              existing.title = args.title;
              if (args.imageUrl) existing.imageUrl = args.imageUrl;
              if (args.vendorId) existing.vendorId = args.vendorId;
              existing.lineTotal = roundMoney(existing.unitPrice * existing.qty);
            } else {
              draft.items.unshift({
                itemId: `temp-${Date.now()}`,
                productId: args.productId,
                vendorId: args.vendorId,
                title: args.title,
                imageUrl: args.imageUrl,
                unitPrice: Number(args.unitPrice),
                qty: Math.max(1, Number(args.qty)),
                lineTotal: roundMoney(Number(args.unitPrice) * Math.max(1, Number(args.qty))),
                stockQty: 0,
              });
            }
            recomputeSubtotal(draft);
          })
        );

        try {
          const { data } = await queryFulfilled;
          dispatch(cartApi.util.upsertQueryData('getCart', undefined, data));
        } catch {
          patch.undo();
        }
      },
    }),

    updateCartItem: builder.mutation<Cart, { itemId: string; qty: number }>({
      query: ({ itemId, qty }) => ({ url: `/cart/items/${encodeURIComponent(itemId)}`, method: 'PATCH', body: { qty } }),
      transformResponse: (response: UpdateCartItemResponse) => response.cart,
      invalidatesTags: (): CartTag[] => [{ type: 'Cart', id: 'CURRENT' }],
      async onQueryStarted({ itemId, qty }, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          cartApi.util.updateQueryData('getCart', undefined, (draft) => {
            const item = draft.items.find((i) => i.itemId === itemId);
            if (!item) return;
            item.qty = Math.max(1, Math.floor(Number(qty)));
            item.lineTotal = roundMoney(Number(item.unitPrice) * item.qty);
            recomputeSubtotal(draft);
          })
        );

        try {
          const { data } = await queryFulfilled;
          dispatch(cartApi.util.upsertQueryData('getCart', undefined, data));
        } catch {
          patch.undo();
        }
      },
    }),

    removeCartItem: builder.mutation<Cart, { itemId: string }>({
      query: ({ itemId }) => ({ url: `/cart/items/${encodeURIComponent(itemId)}`, method: 'DELETE' }),
      transformResponse: (response: RemoveCartItemResponse) => response.cart,
      invalidatesTags: (): CartTag[] => [{ type: 'Cart', id: 'CURRENT' }],
      async onQueryStarted({ itemId }, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          cartApi.util.updateQueryData('getCart', undefined, (draft) => {
            draft.items = draft.items.filter((i) => i.itemId !== itemId);
            recomputeSubtotal(draft);
          })
        );

        try {
          const { data } = await queryFulfilled;
          dispatch(cartApi.util.upsertQueryData('getCart', undefined, data));
        } catch {
          patch.undo();
        }
      },
    }),

    clearCart: builder.mutation<ClearCartResponse, void>({
      query: () => ({ url: '/cart', method: 'DELETE' }),
      invalidatesTags: (): CartTag[] => [{ type: 'Cart', id: 'CURRENT' }],
      async onQueryStarted(_args, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          cartApi.util.updateQueryData('getCart', undefined, (draft) => {
            const empty = emptyCartLike(draft);
            draft.cartId = empty.cartId;
            draft.userId = empty.userId;
            draft.items = empty.items;
            draft.subtotal = empty.subtotal;
          })
        );

        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetCartQuery,
  useAddToCartMutation,
  useUpdateCartItemMutation,
  useRemoveCartItemMutation,
  useClearCartMutation,
} = cartApi;

