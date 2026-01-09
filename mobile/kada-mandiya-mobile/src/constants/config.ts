export const API_BASE_URLS = {
  dev: 'http://localhost:3000',
  staging: 'https://staging.example.com',
  prod: 'https://api.example.com',
} as const;

export type ApiEnvironment = keyof typeof API_BASE_URLS;

export const DEFAULT_API_ENV: ApiEnvironment = 'dev';

export function getApiBaseUrl(env: ApiEnvironment = DEFAULT_API_ENV): string {
  return API_BASE_URLS[env];
}

