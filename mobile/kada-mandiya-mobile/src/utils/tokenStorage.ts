import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'kada.auth.accessToken';
const REFRESH_TOKEN_KEY = 'kada.auth.refreshToken';

let accessTokenCache: string | null | undefined;
let refreshTokenCache: string | null | undefined;

export async function setTokens(tokens: { accessToken: string; refreshToken: string }) {
  accessTokenCache = tokens.accessToken;
  refreshTokenCache = tokens.refreshToken;
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.accessToken);
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken);
}

export async function getAccessToken(): Promise<string | null> {
  if (accessTokenCache !== undefined) return accessTokenCache;
  const v = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  accessTokenCache = v ?? null;
  return accessTokenCache;
}

export async function getRefreshToken(): Promise<string | null> {
  if (refreshTokenCache !== undefined) return refreshTokenCache;
  const v = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  refreshTokenCache = v ?? null;
  return refreshTokenCache;
}

export async function clearTokens(): Promise<void> {
  accessTokenCache = null;
  refreshTokenCache = null;
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}

