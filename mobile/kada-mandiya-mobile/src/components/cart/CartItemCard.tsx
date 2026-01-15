import React, { memo, useCallback, useMemo, useRef } from 'react';
import { Alert, Animated, Image, Pressable, StyleSheet, Text, View } from 'react-native';
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

function QuantityButton({
  icon,
  onPress,
  disabled,
  theme,
}: {
  icon: 'minus' | 'plus';
  onPress: () => void;
  disabled?: boolean;
  theme: any;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const animateIn = () => {
    Animated.spring(scale, {
      toValue: 0.9,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  };

  const animateOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 10,
    }).start();
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={icon === 'minus' ? 'Decrease quantity' : 'Increase quantity'}
      onPress={onPress}
      onPressIn={animateIn}
      onPressOut={animateOut}
      disabled={disabled}
      style={({ pressed }) => ({ opacity: disabled ? 0.4 : pressed ? 0.7 : 1 })}
    >
      <Animated.View
        style={{
          width: 36,
          height: 36,
          borderRadius: theme.radius.sm,
          backgroundColor: theme.colors.muted,
          alignItems: 'center',
          justifyContent: 'center',
          transform: [{ scale }],
        }}
      >
        <Feather name={icon} size={18} color={theme.colors.foreground} />
      </Animated.View>
    </Pressable>
  );
}

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

  const imageUrl = item.imageUrl?.trim() ? item.imageUrl.trim() : null;

  return (
    <Card variant="elevated" style={{ padding: theme.spacing.md }}>
      <View style={{ flexDirection: 'row', gap: theme.spacing.md }}>
        {/* Product Image */}
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: theme.radius.md,
            backgroundColor: theme.colors.backgroundSecondary,
            overflow: 'hidden',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          ) : (
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: theme.radius.sm,
                backgroundColor: theme.colors.muted,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Feather name="image" size={20} color={theme.colors.placeholder} />
            </View>
          )}
        </View>

        {/* Item Details */}
        <View style={{ flex: 1, gap: theme.spacing.xs }}>
          {/* Title and Remove Button */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: theme.spacing.sm, alignItems: 'flex-start' }}>
            <Text
              numberOfLines={2}
              style={{
                flex: 1,
                color: theme.colors.foreground,
                fontWeight: '700',
                fontSize: theme.typography.body,
                lineHeight: theme.typography.body * 1.3,
              }}
            >
              {item.title}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Remove item"
              onPress={() => onRemove(item.itemId)}
              style={({ pressed }) => ({
                opacity: pressed ? 0.6 : 1,
                padding: 4,
              })}
            >
              <Feather name="trash-2" size={18} color={theme.colors.mutedForeground} />
            </Pressable>
          </View>

          {/* Unit Price */}
          <Text style={{ color: theme.colors.mutedForeground, fontWeight: '600', fontSize: theme.typography.bodySmall }}>
            {formatMoney(item.unitPrice, currency)} each
          </Text>

          {/* Quantity Controls and Line Total */}
          <View style={[styles.stepperRow, { marginTop: theme.spacing.xs }]}>
            <QuantityButton icon="minus" onPress={onPressMinus} theme={theme} />

            <View
              style={{
                paddingHorizontal: theme.spacing.md,
                height: 36,
                borderRadius: theme.radius.sm,
                backgroundColor: theme.colors.backgroundSecondary,
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: 48,
              }}
            >
              <Text style={{ color: theme.colors.foreground, fontWeight: '800', fontSize: theme.typography.body }}>
                {item.qty}
              </Text>
            </View>

            <QuantityButton icon="plus" onPress={onPressPlus} disabled={!canIncrease} theme={theme} />

            <View style={{ flex: 1 }} />

            <Text
              style={{
                color: theme.colors.primary,
                fontWeight: '800',
                fontSize: theme.typography.bodyLarge,
                letterSpacing: -0.3,
              }}
            >
              {formatMoney(item.lineTotal, currency)}
            </Text>
          </View>

          {/* Stock Info */}
          {item.stockQty > 0 && item.stockQty <= 10 ? (
            <View style={{ marginTop: theme.spacing.xxs }}>
              <Text style={{ color: theme.colors.warning, fontWeight: '600', fontSize: theme.typography.caption }}>
                Only {item.stockQty} left in stock
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </Card>
  );
}

export const CartItemCard = memo(CartItemCardInner);

const styles = StyleSheet.create({
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});

