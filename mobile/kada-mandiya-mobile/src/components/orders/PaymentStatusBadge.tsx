import React, { memo, useMemo } from 'react';

import { useTheme } from '../../providers/ThemeProvider';
import type { PaymentStatus } from '../../types/payment.types';
import { getPaymentStatusBadgeStyle } from '../../utils/orderStatus';
import { StatusPill } from './StatusPill';

type Props = {
  status: PaymentStatus;
};

function PaymentStatusBadgeInner({ status }: Props) {
  const { theme } = useTheme();
  const meta = useMemo(() => getPaymentStatusBadgeStyle(theme, status), [status, theme]);

  return (
    <StatusPill
      label={meta.label}
      accent={meta.accent}
      backgroundColor={meta.backgroundColor}
      borderColor={meta.borderColor}
    />
  );
}

export const PaymentStatusBadge = memo(PaymentStatusBadgeInner);

