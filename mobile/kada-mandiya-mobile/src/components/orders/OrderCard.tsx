import React, { memo, useMemo, useRef } from 'react';
import { Animated, Image, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useTheme } from '../../providers/ThemeProvider';
import type { OrderStatus } from '../../types/order.types';
import { formatDateTime } from '../../utils/format';
import { formatMoney } from '../../utils/money';
import { formatOrderIdShort } from '../../utils/orderStatus';
import { OrderStatusBadge } from './OrderStatusBadge';

type Props = {
  orderId: string;
  status: OrderStatus;
  createdAt: string;
  amount: number;
  currency: string;
  itemCountLabel: string;
  thumbnailUrls?: (string | null | undefined)[];
  onPress?: () => void;
  style?: ViewStyle;
};

function OrderCardInner({
  orderId,
  status,
  createdAt,
  amount,
  currency,
  itemCountLabel,
  thumbnailUrls,
  onPress,
  style,
}: Props) {
  const { theme } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const thumbnails = useMemo(() => {
    const urls = (thumbnailUrls ?? []).map((u) => (typeof u === 'string' && u.trim().length ? u.trim() : null));
    return urls.filter(Boolean).slice(0, 3) as string[];
  }, [thumbnailUrls]);

  const headerSubtitle = useMemo(() => {
    const date = createdAt ? formatDateTime(createdAt) : '';
    const total = formatMoney(amount, currency);
    return date ? `${date} · ${total}` : total;
  }, [amount, createdAt, currency]);

  const shortId = useMemo(() => formatOrderIdShort(orderId), [orderId]);

  const containerStyle = useMemo<ViewStyle>(
    () => ({
      gap: theme.spacing.sm,
    }),
    [theme.spacing.sm]
  );

  const rowStyle = useMemo<ViewStyle>(
    () => ({
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.sm,
    }),
    [theme.spacing.sm]
  );

  const thumbSize = 28;

  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      onPress={onPress}
      disabled={!onPress}
      onPressIn={() => {
        Animated.timing(scale, { toValue: 0.985, duration: 110, useNativeDriver: true }).start();
      }}
      onPressOut={() => {
        Animated.timing(scale, { toValue: 1, duration: 110, useNativeDriver: true }).start();
      }}
      style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1 }, style]}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <View
          style={[
            styles.card,
            theme.shadow,
            {
              backgroundColor: theme.colors.muted,
              borderRadius: theme.radius.md,
              borderColor: theme.colors.border,
              padding: theme.spacing.md,
            },
            containerStyle,
          ]}
        >
          <View style={rowStyle}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.colors.foreground, fontWeight: '900', fontSize: theme.typography.body }}>
                Order #{shortId}
              </Text>
              <Text
                style={{ marginTop: theme.spacing.xs / 2, color: theme.colors.placeholder, fontWeight: '700' }}
                numberOfLines={1}
              >
                {headerSubtitle}
              </Text>
            </View>

            <OrderStatusBadge status={status} />
          </View>

          <View style={rowStyle}>
            <Text style={{ color: theme.colors.placeholder, fontWeight: '700' }}>{itemCountLabel}</Text>

            <View style={styles.thumbsRow}>
              {thumbnails.length ? (
                thumbnails.map((uri) => (
                  <View
                    key={uri}
                    style={[
                      styles.thumb,
                      {
                        width: thumbSize,
                        height: thumbSize,
                        borderRadius: theme.radius.sm,
                        borderColor: theme.colors.border,
                        backgroundColor: theme.colors.background,
                      },
                    ]}
                  >
                    <Image source={{ uri }} style={styles.thumbImage} resizeMode="cover" />
                  </View>
                ))
              ) : (
                <>
                  <View
                    style={[
                      styles.thumb,
                      {
                        width: thumbSize,
                        height: thumbSize,
                        borderRadius: theme.radius.sm,
                        borderColor: theme.colors.border,
                        backgroundColor: theme.colors.background,
                        alignItems: 'center',
                        justifyContent: 'center',
                      },
                    ]}
                  >
                    <Feather name="image" size={14} color={theme.colors.placeholder} />
                  </View>
                  <View
                    style={[
                      styles.thumb,
                      {
                        width: thumbSize,
                        height: thumbSize,
                        borderRadius: theme.radius.sm,
                        borderColor: theme.colors.border,
                        backgroundColor: theme.colors.background,
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.thumb,
                      {
                        width: thumbSize,
                        height: thumbSize,
                        borderRadius: theme.radius.sm,
                        borderColor: theme.colors.border,
                        backgroundColor: theme.colors.background,
                      },
                    ]}
                  />
                </>
              )}
            </View>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

export const OrderCard = memo(OrderCardInner);

export function OrderCardSkeleton() {
  const { theme } = useTheme();

  const block = useMemo<ViewStyle>(
    () => ({
      backgroundColor: theme.scheme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
      borderRadius: theme.radius.sm,
    }),
    [theme.radius.sm, theme.scheme]
  );

  return (
    <View
      style={[
        styles.card,
        theme.shadow,
        {
          backgroundColor: theme.colors.muted,
          borderRadius: theme.radius.md,
          borderColor: theme.colors.border,
          padding: theme.spacing.md,
        },
      ]}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: theme.spacing.sm }}>
        <View style={{ flex: 1, gap: theme.spacing.xs }}>
          <View style={[block, { height: 16, width: '55%' }]} />
          <View style={[block, { height: 14, width: '75%' }]} />
        </View>
        <View style={[block, { height: 26, width: 92 }]} />
      </View>

      <View style={{ marginTop: theme.spacing.md, flexDirection: 'row', justifyContent: 'space-between' }}>
        <View style={[block, { height: 14, width: 110 }]} />
        <View style={{ flexDirection: 'row', gap: theme.spacing.xs }}>
          <View style={[block, { height: 28, width: 28 }]} />
          <View style={[block, { height: 28, width: 28 }]} />
          <View style={[block, { height: 28, width: 28 }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1 },
  thumbsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  thumb: { borderWidth: 1, overflow: 'hidden' },
  thumbImage: { width: '100%', height: '100%' },
});

