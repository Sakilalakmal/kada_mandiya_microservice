import type { UserRole } from '../types/auth.types';

export function normalizeUserRoles(input: unknown): UserRole[] {
  if (!Array.isArray(input)) return [];

  const roles: UserRole[] = [];
  for (const raw of input) {
    const value = String(raw).toLowerCase().trim();
    if (value === 'vendor' || value === 'customer') roles.push(value);
  }
  return roles;
}

export function hasVendorRole(input: unknown): boolean {
  return normalizeUserRoles(input).includes('vendor');
}

