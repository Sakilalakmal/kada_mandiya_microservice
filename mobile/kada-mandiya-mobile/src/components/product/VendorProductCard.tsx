import React, { memo } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { useTheme } from '../../providers/ThemeProvider';
import type { Product } from '../../types/product.types';
import { formatDateTime } from '../../utils/format';

type Props = {
  product: Product;
  onPress: () => void;
};

function VendorProductCardInner({ product, onPress }: Props) {
  const { theme } = useTheme();

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1 }]}>
      <Card>
        <View style={{ flexDirection: 'row', gap: theme.spacing.md }}>
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: theme.radius.md,
              borderWidth: 1,
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.background,
              overflow: 'hidden',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {product.thumbnailImageUrl ? (
              <Image
                source={{ uri: product.thumbnailImageUrl }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
            ) : (
              <Feather name="image" size={18} color={theme.colors.placeholder} />
            )}
          </View>

          <View style={{ flex: 1, gap: theme.spacing.xs }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text
                numberOfLines={1}
                style={{ flex: 1, color: theme.colors.foreground, fontWeight: '900', fontSize: theme.typography.subtitle }}
              >
                {product.name}
              </Text>
              <Badge label={product.isActive ? 'ACTIVE' : 'INACTIVE'} />
            </View>

            <Text style={{ color: theme.colors.placeholder, fontWeight: '700', fontSize: theme.typography.small }}>
              {product.category ?? 'Uncategorized'} • {product.currency} {product.price.toFixed(2)}
            </Text>

            <Text style={{ color: theme.colors.placeholder, fontWeight: '600', fontSize: theme.typography.small }}>
              Stock: {product.stockQty} • Updated {formatDateTime(product.updatedAt)}
            </Text>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

export const VendorProductCard = memo(VendorProductCardInner);

