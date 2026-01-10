import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';

function firstString(v: unknown): string | null {
  if (typeof v === 'string' && v.trim()) return v.trim();
  return null;
}

export function getApiErrorMessage(error: unknown): string {
  const fbq = error as FetchBaseQueryError | undefined;
  const data = (fbq && typeof fbq === 'object' && 'data' in fbq ? (fbq as any).data : undefined) as any;

  const fromZod = data?.error?.details?.fieldErrors;
  if (fromZod && typeof fromZod === 'object') {
    for (const key of Object.keys(fromZod)) {
      const maybe = fromZod[key];
      if (Array.isArray(maybe) && typeof maybe[0] === 'string') return maybe[0];
    }
  }

  return (
    firstString(data?.error?.message) ??
    firstString(data?.message) ??
    firstString(data?.error) ??
    firstString(data) ??
    (fbq && typeof fbq === 'object' && 'error' in fbq ? firstString((fbq as any).error) : null) ??
    'Something went wrong'
  );
}

