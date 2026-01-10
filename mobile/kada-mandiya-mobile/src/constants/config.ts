import Constants from 'expo-constants';
import { Platform } from 'react-native';

function normalizeBaseUrl(value: string): string {
  const trimmed = value.trim();
  return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
}

function readExpoHostUri(): string | undefined {
  const anyConstants = Constants as any;
  return (
    (Constants.expoConfig as any)?.hostUri ??
    (Constants.expoGoConfig as any)?.hostUri ??
    anyConstants?.expoConfig?.hostUri ??
    anyConstants?.manifest2?.extra?.expoClient?.hostUri ??
    anyConstants?.manifest?.debuggerHost ??
    anyConstants?.manifest?.hostUri
  );
}

function extractHost(hostUri: string): string | null {
  const raw = hostUri.trim();
  if (!raw) return null;
  const withoutScheme = raw.replace(/^[a-z]+:\/\//i, '');
  const hostPort = withoutScheme.split('/')[0] ?? '';
  const host = hostPort.split(':')[0] ?? '';
  if (!host) return null;
  if ((host === 'localhost' || host === '127.0.0.1') && Platform.OS === 'android') return '10.0.2.2';
  return host;
}

const fromEnv = process.env.EXPO_PUBLIC_API_URL;
const fromExpoConfig = (Constants.expoConfig?.extra as any)?.apiUrl as string | undefined;
const devHost = __DEV__ ? extractHost(readExpoHostUri() ?? '') : null;

export const API_BASE_URL = normalizeBaseUrl(
  fromEnv ?? fromExpoConfig ?? (devHost ? `http://${devHost}:4001/api` : 'http://localhost:4001/api')
);

function stripApiSuffix(url: string): string {
  return url.endsWith('/api') ? url.slice(0, -4) : url;
}

export const GATEWAY_BASE_URL = stripApiSuffix(API_BASE_URL);
export const PRODUCTS_BASE_URL = `${GATEWAY_BASE_URL}/products`;

export const UPLOADTHING_URL = normalizeBaseUrl(
  process.env.EXPO_PUBLIC_UPLOADTHING_URL ??
    (devHost ? `http://${devHost}:3000/api/uploadthing` : 'http://localhost:3000/api/uploadthing')
);
