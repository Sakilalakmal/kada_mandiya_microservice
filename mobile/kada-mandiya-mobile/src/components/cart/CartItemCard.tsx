import React, { memo, useCallback, useMemo } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { Card } from '../ui/Card';
import { useTheme } from '../../providers/ThemeProvider';
import type { CartItem } from '../../types/cart.types';
import { formatMoney } from '../../utils/money';

type Props = {
  item: CartItem;
  currency?: string;
  onIncrease: (itemId: string, nextQty: number) => void;
  onDecrease: (itemId: string, nextQty: number) => void;
  onRemove: (itemId: string) => void;
};

function CartItemCardInner({ item, currency = 'LKR', onIncrease, onDecrease, onRemove }: Props) {
  const { theme } = useTheme();

  const canIncrease = item.stockQty > 0 ? item.qty < item.stockQty : true;
  const canDecrease = item.qty > 1;

  const onPressMinus = useCallback(() => {
    if (canDecrease) {
      onDecrease(item.itemId, item.qty - 1);
      return;
    }

    Alert.alert('Remove item?', 'Quantity is 1. Remove this item from your cart?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => onRemove(item.itemId) },
    ]);
  }, [canDecrease, item.itemId, item.qty, onDecrease, onRemove]);

  const onPressPlus = useCallback(() => {
    if (!canIncrease) return;
    onIncrease(item.itemId, item.qty + 1);
  }, [canIncrease, item.itemId, item.qty, onIncrease]);

  const iconButtonStyle = useMemo(
    () => ({
      width: 36,
      height: 36,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.muted,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    }),
    [theme.colors.border, theme.colors.muted, theme.radius.md]
  );

  const imageUrl = item.imageUrl?.trim() ? item.imageUrl.trim() : null;

  return (
    <Card style={{ padding: theme.spacing.md }}>
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
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          ) : (
            <Feather name="image" size={18} color={theme.colors.placeholder} />
          )}
        </View>

        <View style={{ flex: 1, gap: theme.spacing.xs }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: theme.spacing.sm }}>
            <Text
              numberOfLines={2}
              style={{ flex: 1, color: theme.colors.foreground, fontWeight: '900', fontSize: theme.typography.body }}
            >
              {item.title}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Remove item"
              onPress={() => onRemove(item.itemId)}
              style={({ pressed }) => [{ opacity: pressed ? 0.86 : 1 }]}
            >
              <Feather name="trash-2" size={18} color={theme.colors.placeholder} />
            </Pressable>
          </View>

          <Text style={{ color: theme.colors.placeholder, fontWeight: '800', fontSize: theme.typography.small }}>
            {formatMoney(item.unitPrice, currency)}
          </Text>

          <View style={[styles.stepperRow, { marginTop: theme.spacing.sm }]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Decrease quantity"
              onPress={onPressMinus}
              style={({ pressed }) => [{ opacity: pressed ? 0.86 : 1 }]}
            >
              <View style={iconButtonStyle}>
                <Feather name="minus" size={16} color={theme.colors.foreground} />
              </View>
            </Pressable>

            <View
              style={{
                paddingHorizontal: theme.spacing.md,
                height: 36,
                borderRadius: theme.radius.md,
                borderWidth: 1,
                borderColor: theme.colors.border,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: theme.colors.background,
              }}
            >
              <Text style={{ color: theme.colors.foreground, fontWeight: '900' }}>{item.qty}</Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Increase quantity"
              onPress={onPressPlus}
              disabled={!canIncrease}
              style={({ pressed }) => [{ opacity: !canIncrease ? 0.45 : pressed ? 0.86 : 1 }]}
            >
              <View style={iconButtonStyle}>
                <Feather name="plus" size={16} color={theme.colors.foreground} />
              </View>
            </Pressable>

            <View style={{ flex: 1 }} />

            <Text style={{ color: theme.colors.foreground, fontWeight: '900' }}>
              {formatMoney(item.lineTotal, currency)}
            </Text>
          </View>

          {item.stockQty > 0 ? (
            <Text style={{ marginTop: theme.spacing.xs, color: theme.colors.placeholder, fontWeight: '700' }}>
              Stock: {item.stockQty}
            </Text>
          ) : null}
        </View>
      </View>
    </Card>
  );
}

export const CartItemCard = memo(CartItemCardInner);

const styles = StyleSheet.create({
  stepperRow: { flexDirection: 'row', alignItems: 'center' },
});

