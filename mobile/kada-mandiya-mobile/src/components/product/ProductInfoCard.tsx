import React from 'react';
import { Text, View } from 'react-native';

import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { useTheme } from '../../providers/ThemeProvider';
import { formatDateTime } from '../../utils/format';
import { formatMoney } from '../../utils/money';

type Props = {
  price: number;
  currency: string;
  stockQty: number;
  category: string | null;
  updatedAt: string;
  isActive: boolean;
};

export function ProductInfoCard({ price, currency, stockQty, category, updatedAt, isActive }: Props) {
  const { theme } = useTheme();

  return (
    <Card style={{ gap: theme.spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing.sm }}>
        <Text style={{ color: theme.colors.foreground, fontWeight: '900', fontSize: theme.typography.subtitle }}>
          Product info
        </Text>
        <Badge label={isActive ? 'ACTIVE' : 'INACTIVE'} />
      </View>

      <View style={{ gap: theme.spacing.xs }}>
        <Text style={{ color: theme.colors.placeholder, fontWeight: '700', fontSize: theme.typography.small }}>Price</Text>
        <Text style={{ color: theme.colors.foreground, fontWeight: '900', fontSize: theme.typography.title }}>
          {formatMoney(price, currency)}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', gap: theme.spacing.md }}>
        <View style={{ flex: 1, gap: theme.spacing.xs }}>
          <Text style={{ color: theme.colors.placeholder, fontWeight: '700', fontSize: theme.typography.small }}>Stock</Text>
          <Text style={{ color: theme.colors.foreground, fontWeight: '800', fontSize: theme.typography.body }}>
            {stockQty}
          </Text>
        </View>
        <View style={{ flex: 1, gap: theme.spacing.xs }}>
          <Text style={{ color: theme.colors.placeholder, fontWeight: '700', fontSize: theme.typography.small }}>Category</Text>
          <Text numberOfLines={1} style={{ color: theme.colors.foreground, fontWeight: '800', fontSize: theme.typography.body }}>
            {category ?? 'Uncategorized'}
          </Text>
        </View>
      </View>

      <View style={{ gap: theme.spacing.xs }}>
        <Text style={{ color: theme.colors.placeholder, fontWeight: '700', fontSize: theme.typography.small }}>Last updated</Text>
        <Text style={{ color: theme.colors.placeholder, fontWeight: '700', fontSize: theme.typography.body }}>
          {formatDateTime(updatedAt)}
        </Text>
      </View>
    </Card>
  );
}

