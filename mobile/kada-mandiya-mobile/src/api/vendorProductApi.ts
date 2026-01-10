import { baseApi } from './baseApi';
import { PRODUCTS_BASE_URL } from '../constants/config';
import type { CreateProductRequest, CreateProductResponse, GetMyProductsResponse } from '../types/product.types';

export const vendorProductApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyVendorProducts: builder.query<GetMyProductsResponse, void>({
      query: () => ({ url: `${PRODUCTS_BASE_URL}/mine`, method: 'GET' }),
      providesTags: ['Product'],
    }),
    createVendorProduct: builder.mutation<CreateProductResponse, CreateProductRequest>({
      query: (body) => ({ url: PRODUCTS_BASE_URL, method: 'POST', body }),
      invalidatesTags: ['Product'],
    }),
  }),
  overrideExisting: false,
});

export const { useGetMyVendorProductsQuery, useCreateVendorProductMutation } = vendorProductApi;

