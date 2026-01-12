import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

import { API_BASE_URL } from '../constants/config';
import { createCorrelationId } from '../utils/correlationId';
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from '../utils/tokenStorage';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: async (headers) => {
    if (!headers.has('accept')) headers.set('accept', 'application/json');
    if (!headers.has('content-type')) headers.set('content-type', 'application/json');
    if (!headers.has('x-correlation-id')) headers.set('x-correlation-id', createCorrelationId());

    if (!headers.has('authorization')) {
      const accessToken = await getAccessToken();
      if (accessToken) headers.set('authorization', `Bearer ${accessToken}`);
    }

    return headers;
  },
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(api: Parameters<typeof rawBaseQuery>[1]) {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return null;

  const result = await rawBaseQuery(
    {
      url: '/auth/refresh',
      method: 'POST',
      headers: { authorization: `Bearer ${refreshToken}` },
    },
    api,
    {}
  );

  const data = result.data as any;
  if (!data || data.ok !== true || typeof data.accessToken !== 'string') return null;

  await setTokens({ accessToken: data.accessToken, refreshToken: data.accessToken });
  return data.accessToken;
}

const baseQueryWithReauth: typeof rawBaseQuery = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    if (!refreshPromise) {
      refreshPromise = refreshAccessToken(api).finally(() => {
        refreshPromise = null;
      });
    }

    const newAccessToken = await refreshPromise;
    if (!newAccessToken) {
      await clearTokens();
      api.dispatch({ type: 'auth/clearAuth' });
      return result;
    }

    result = await rawBaseQuery(args, api, extraOptions);
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Vendor', 'Me', 'Product', 'VendorProducts', 'VendorProduct'],
  endpoints: () => ({}),
});

