import { baseApi } from './baseApi';
import type { BecomeVendorResponse, GetMyVendorProfileResponse, VendorApplication } from '../types/vendor.types';

export const vendorApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    becomeVendor: builder.mutation<BecomeVendorResponse, VendorApplication>({
      query: (body) => ({ url: '/vendors/become', method: 'POST', body }),
      invalidatesTags: ['Vendor', 'Me'],
    }),
    getMyVendorProfile: builder.query<GetMyVendorProfileResponse, void>({
      query: () => ({ url: '/vendors/me', method: 'GET' }),
      providesTags: ['Vendor'],
    }),
  }),
  overrideExisting: false,
});

export const { useBecomeVendorMutation, useGetMyVendorProfileQuery, useLazyGetMyVendorProfileQuery } =
  vendorApi;

