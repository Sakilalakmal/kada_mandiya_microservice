import type { AppTheme } from '../constants/theme';
import type { PaymentStatus } from '../types/payment.types';
import {
  getOrderStatusBadgeMeta,
  type OrderBadgeVariant,
  type OrderStatus,
  type VendorUpdatableOrderStatus,
} from '../types/order.types';

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const normalized = hex.replace('#', '').trim();
  const full = normalized.length === 3 ? normalized.split('').map((c) => c + c).join('') : normalized;
  if (full.length !== 6) return null;
  const value = Number.parseInt(full, 16);
  if (Number.isNaN(value)) return null;
  return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
}

function withOpacity(hex: string, alpha: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const a = Math.max(0, Math.min(1, alpha));
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${a})`;
}

export function formatOrderIdShort(orderId: string): string {
  const id = String(orderId ?? '').trim();
  if (id.length <= 6) return id;
  return id.slice(-6);
}

function accentForVariant(theme: AppTheme, variant: OrderBadgeVariant): string {
  if (variant === 'danger') return theme.colors.danger;
  if (variant === 'info') return theme.colors.primary;
  if (variant === 'success') return theme.colors.primary;
  return theme.colors.placeholder;
}

export function getOrderStatusBadgeStyle(theme: AppTheme, status: OrderStatus) {
  const meta = getOrderStatusBadgeMeta(status);
  const accent = accentForVariant(theme, meta.variant);

  const bgAlpha = theme.scheme === 'dark' ? 0.18 : 0.1;
  const borderAlpha = theme.scheme === 'dark' ? 0.35 : 0.22;

  return {
    ...meta,
    accent,
    backgroundColor: withOpacity(accent, bgAlpha),
    borderColor: withOpacity(accent, borderAlpha),
  };
}

export function getPaymentStatusBadgeMeta(status: PaymentStatus): { label: string; variant: OrderBadgeVariant } {
  switch (status) {
    case 'NOT_REQUIRED':
      return { label: 'Not required', variant: 'success' };
    case 'PENDING':
      return { label: 'Pending', variant: 'neutral' };
    case 'COMPLETED':
      return { label: 'Paid', variant: 'success' };
    case 'FAILED':
      return { label: 'Failed', variant: 'danger' };
    case 'CANCELLED':
      return { label: 'Cancelled', variant: 'danger' };
    default: {
      const exhaustive: never = status;
      return exhaustive;
    }
  }
}

export function getPaymentStatusBadgeStyle(theme: AppTheme, status: PaymentStatus) {
  const meta = getPaymentStatusBadgeMeta(status);
  const accent = accentForVariant(theme, meta.variant);

  const bgAlpha = theme.scheme === 'dark' ? 0.18 : 0.1;
  const borderAlpha = theme.scheme === 'dark' ? 0.35 : 0.22;

  return {
    ...meta,
    accent,
    backgroundColor: withOpacity(accent, bgAlpha),
    borderColor: withOpacity(accent, borderAlpha),
  };
}

export function isActiveOrderStatus(status: OrderStatus): boolean {
  return status === 'PENDING' || status === 'PROCESSING' || status === 'SHIPPED';
}

export function isCompletedOrderStatus(status: OrderStatus): boolean {
  return status === 'DELIVERED';
}

export function isCancelledOrderStatus(status: OrderStatus): boolean {
  return status === 'CANCELLED';
}

export function canCancelOrder(status: OrderStatus): boolean {
  return status === 'PENDING';
}

export function getNextVendorOrderStatuses(current: OrderStatus): VendorUpdatableOrderStatus[] {
  switch (current) {
    case 'PENDING':
      return ['PROCESSING'];
    case 'PROCESSING':
      return ['SHIPPED'];
    case 'SHIPPED':
      return ['DELIVERED'];
    case 'DELIVERED':
    case 'CANCELLED':
      return [];
    default: {
      const exhaustive: never = current;
      return exhaustive;
    }
  }
}

export function canVendorUpdateOrderStatus(current: OrderStatus): boolean {
  return getNextVendorOrderStatuses(current).length > 0;
}

