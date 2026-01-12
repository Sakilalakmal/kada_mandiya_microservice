import { baseApi } from './baseApi';
import { PRODUCTS_BASE_URL } from '../constants/config';
import type {
  CreateProductRequest,
  CreateProductResponse,
  GetMyProductsResponse,
  GetProductDetailResponse,
  ProductDetail,
  UpdateProductRequest,
  UpdateProductResponse,
  ToggleProductResponse,
} from '../types/product.types';

type VendorProductsListTag = { type: 'VendorProducts'; id: 'LIST' };
type VendorProductItemTag = { type: 'VendorProduct'; id: string };

function nowIso() {
  return new Date().toISOString();
}

export const vendorProductApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyVendorProducts: builder.query<GetMyProductsResponse, void>({
      query: () => ({ url: `${PRODUCTS_BASE_URL}/mine`, method: 'GET' }),
      providesTags: (result): (VendorProductsListTag | VendorProductItemTag)[] => {
        const tags: (VendorProductsListTag | VendorProductItemTag)[] = [{ type: 'VendorProducts', id: 'LIST' }];
        const items = result?.items ?? [];
        for (const item of items) tags.push({ type: 'VendorProduct', id: item.id });
        return tags;
      },
    }),

    getVendorProductById: builder.query<ProductDetail, string>({
      query: (id) => ({ url: `${PRODUCTS_BASE_URL}/${id}`, method: 'GET' }),
      transformResponse: (response: GetProductDetailResponse) => response.product,
      providesTags: (_result, _err, id): VendorProductItemTag[] => [{ type: 'VendorProduct', id }],
    }),

    createVendorProduct: builder.mutation<CreateProductResponse, CreateProductRequest>({
      query: (body) => ({ url: PRODUCTS_BASE_URL, method: 'POST', body }),
      invalidatesTags: (): VendorProductsListTag[] => [{ type: 'VendorProducts', id: 'LIST' }],
    }),

    updateVendorProduct: builder.mutation<UpdateProductResponse, { id: string; patch: UpdateProductRequest }>({
      query: ({ id, patch }) => ({ url: `${PRODUCTS_BASE_URL}/${id}`, method: 'PUT', body: patch }),
      invalidatesTags: (_res, _err, { id }): (VendorProductsListTag | VendorProductItemTag)[] => [
        { type: 'VendorProducts', id: 'LIST' },
        { type: 'VendorProduct', id },
      ],
      async onQueryStarted({ id, patch }, { dispatch, queryFulfilled }) {
        const updatedAt = nowIso();

        const patchList = dispatch(
          vendorProductApi.util.updateQueryData('getMyVendorProducts', undefined, (draft) => {
            const item = draft.items?.find((p) => p.id === id);
            if (!item) return;

            if (patch.name !== undefined) item.name = patch.name;
            if (patch.category !== undefined) item.category = patch.category ?? null;
            if (patch.price !== undefined) item.price = patch.price;
            if (patch.currency !== undefined) item.currency = patch.currency;
            if (patch.stockQty !== undefined) item.stockQty = patch.stockQty;
            if (patch.isActive !== undefined) item.isActive = patch.isActive;
            if (patch.images?.length) item.thumbnailImageUrl = patch.images[0] ?? null;
            item.updatedAt = updatedAt;
          })
        );

        const patchDetail = dispatch(
          vendorProductApi.util.updateQueryData('getVendorProductById', id, (draft) => {
            if (patch.name !== undefined) draft.name = patch.name;
            if (patch.description !== undefined) draft.description = patch.description ?? null;
            if (patch.category !== undefined) draft.category = patch.category ?? null;
            if (patch.price !== undefined) draft.price = patch.price;
            if (patch.currency !== undefined) draft.currency = patch.currency;
            if (patch.stockQty !== undefined) draft.stockQty = patch.stockQty;
            if (patch.isActive !== undefined) draft.isActive = patch.isActive;
            if (patch.images !== undefined) {
              draft.images = patch.images.map((url, idx) => ({
                id: `${idx}`,
                imageUrl: url,
                sortOrder: idx,
              }));
            }
            draft.updatedAt = updatedAt;
          })
        );

        try {
          await queryFulfilled;
        } catch {
          patchList.undo();
          patchDetail.undo();
        }
      },
    }),

    deactivateVendorProduct: builder.mutation<ToggleProductResponse, { id: string }>({
      query: ({ id }) => ({ url: `${PRODUCTS_BASE_URL}/${id}/deactivate`, method: 'PATCH' }),
      invalidatesTags: (_res, _err, { id }): (VendorProductsListTag | VendorProductItemTag)[] => [
        { type: 'VendorProducts', id: 'LIST' },
        { type: 'VendorProduct', id },
      ],
      async onQueryStarted({ id }, { dispatch, queryFulfilled }) {
        const updatedAt = nowIso();

        const patchList = dispatch(
          vendorProductApi.util.updateQueryData('getMyVendorProducts', undefined, (draft) => {
            const item = draft.items?.find((p) => p.id === id);
            if (!item) return;
            item.isActive = false;
            item.updatedAt = updatedAt;
          })
        );

        const patchDetail = dispatch(
          vendorProductApi.util.updateQueryData('getVendorProductById', id, (draft) => {
            draft.isActive = false;
            draft.updatedAt = updatedAt;
          })
        );

        try {
          await queryFulfilled;
        } catch {
          patchList.undo();
          patchDetail.undo();
        }
      },
    }),

    reactivateVendorProduct: builder.mutation<ToggleProductResponse, { id: string }>({
      query: ({ id }) => ({ url: `${PRODUCTS_BASE_URL}/${id}/reactivate`, method: 'PATCH' }),
      invalidatesTags: (_res, _err, { id }): (VendorProductsListTag | VendorProductItemTag)[] => [
        { type: 'VendorProducts', id: 'LIST' },
        { type: 'VendorProduct', id },
      ],
      async onQueryStarted({ id }, { dispatch, queryFulfilled }) {
        const updatedAt = nowIso();

        const patchList = dispatch(
          vendorProductApi.util.updateQueryData('getMyVendorProducts', undefined, (draft) => {
            const item = draft.items?.find((p) => p.id === id);
            if (!item) return;
            item.isActive = true;
            item.updatedAt = updatedAt;
          })
        );

        const patchDetail = dispatch(
          vendorProductApi.util.updateQueryData('getVendorProductById', id, (draft) => {
            draft.isActive = true;
            draft.updatedAt = updatedAt;
          })
        );

        try {
          await queryFulfilled;
        } catch {
          patchList.undo();
          patchDetail.undo();
        }
      },
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetMyVendorProductsQuery,
  useGetVendorProductByIdQuery,
  useCreateVendorProductMutation,
  useUpdateVendorProductMutation,
  useDeactivateVendorProductMutation,
  useReactivateVendorProductMutation,
} = vendorProductApi;

