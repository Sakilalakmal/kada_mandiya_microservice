import React, { memo, useMemo } from 'react';

import { useTheme } from '../../providers/ThemeProvider';
import type { OrderStatus } from '../../types/order.types';
import { getOrderStatusBadgeStyle } from '../../utils/orderStatus';
import { StatusPill } from './StatusPill';

type Props = {
  status: OrderStatus;
};

function OrderStatusBadgeInner({ status }: Props) {
  const { theme } = useTheme();
  const meta = useMemo(() => getOrderStatusBadgeStyle(theme, status), [status, theme]);

  return (
    <StatusPill
      label={meta.label}
      accent={meta.accent}
      backgroundColor={meta.backgroundColor}
      borderColor={meta.borderColor}
    />
  );
}

export const OrderStatusBadge = memo(OrderStatusBadgeInner);

