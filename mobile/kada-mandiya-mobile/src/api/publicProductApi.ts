import { baseApi } from './baseApi';
import { PRODUCTS_BASE_URL } from '../constants/config';
import type { GetProductDetailResponse, Product, ProductDetail } from '../types/product.types';

export type PublicProductsQuery = {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
};

export type ListPublicProductsResponse = {
  ok: true;
  items: Product[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

function toQueryString(params: Record<string, string | number | undefined>) {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    const stringValue = typeof value === 'number' ? String(value) : value.trim();
    if (!stringValue) continue;
    qs.set(key, stringValue);
  }
  const str = qs.toString();
  return str ? `?${str}` : '';
}

export const publicProductApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listPublicProducts: builder.query<ListPublicProductsResponse, PublicProductsQuery | void>({
      query: (query) => {
        const page = query?.page ?? 1;
        const limit = query?.limit ?? 12;
        const search = query?.search;
        const category = query?.category;

        const qs = toQueryString({ page, limit, search, category });
        return { url: `${PRODUCTS_BASE_URL}${qs}`, method: 'GET' };
      },
      providesTags: (result) => {
        const items = result?.items ?? [];
        return [{ type: 'Product' as const, id: 'LIST' }, ...items.map((p) => ({ type: 'Product' as const, id: p.id }))];
      },
    }),

    getPublicProductById: builder.query<ProductDetail, string>({
      query: (id) => ({ url: `${PRODUCTS_BASE_URL}/${encodeURIComponent(id)}`, method: 'GET' }),
      transformResponse: (response: GetProductDetailResponse) => response.product,
      providesTags: (_result, _err, id) => [{ type: 'Product' as const, id }],
    }),
  }),
  overrideExisting: false,
});

export const { useListPublicProductsQuery, useGetPublicProductByIdQuery } = publicProductApi;
