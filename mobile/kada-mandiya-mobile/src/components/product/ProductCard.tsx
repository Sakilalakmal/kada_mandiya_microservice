import React, { memo, useMemo, useRef } from 'react';
import {
  Animated,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ImageStyle,
  type ViewStyle,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

import { Card } from '../ui/Card';
import { useTheme } from '../../providers/ThemeProvider';
import type { Product } from '../../types/product.types';
import { formatMoney } from '../../utils/money';

export type ProductCardVariant = 'featured' | 'grid';

type Props = {
  product: Product;
  variant?: ProductCardVariant;
  onPress?: () => void;
  onPressProduct?: (id: string) => void;
  style?: ViewStyle;
};

function ProductCardInner({ product, variant = 'featured', onPress, onPressProduct, style }: Props) {
  const { theme } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = useMemo(() => {
    if (typeof onPress === 'function') return onPress;
    if (typeof onPressProduct === 'function') return () => onPressProduct(product.id);
    return () => {};
  }, [onPress, onPressProduct, product.id]);

  const sizes = useMemo(() => {
    if (variant === 'grid') {
      return {
        cardPadding: 0,
        imageHeight: 140,
        imageRadius: theme.radius.lg,
        priceSize: theme.typography.subtitle,
        nameSize: theme.typography.bodySmall,
      };
    }
    return {
      cardPadding: 0,
      imageHeight: 160,
      imageRadius: theme.radius.lg,
      priceSize: theme.typography.subtitle,
      nameSize: theme.typography.body,
    };
  }, [theme, variant]);

  const imageWrapStyle: ViewStyle = useMemo(
    () => ({
      height: sizes.imageHeight,
      borderRadius: sizes.imageRadius,
      backgroundColor: theme.colors.backgroundSecondary,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
    }),
    [sizes.imageHeight, sizes.imageRadius, theme.colors.backgroundSecondary]
  );

  const imageStyle: ImageStyle = useMemo(() => ({ width: '100%', height: '100%' }), []);

  const animateIn = () => {
    Animated.timing(scale, {
      toValue: 0.98,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const animateOut = () => {
    Animated.timing(scale, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable onPress={handlePress} onPressIn={animateIn} onPressOut={animateOut} style={style}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <Card
          variant="elevated"
          noPadding
          style={{
            overflow: 'hidden',
            borderRadius: theme.radius.xl,
          }}
        >
          {/* Product Image */}
          <View style={imageWrapStyle}>
            {product.thumbnailImageUrl ? (
              <Image source={{ uri: product.thumbnailImageUrl }} style={imageStyle} resizeMode="cover" />
            ) : (
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: theme.radius.sm,
                  backgroundColor: theme.colors.muted,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Feather name="image" size={20} color={theme.colors.placeholder} />
              </View>
            )}

            {/* Wish icon (decorative) */}
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                top: theme.spacing.sm,
                right: theme.spacing.sm,
                width: 34,
                height: 34,
                borderRadius: theme.radius.full,
                backgroundColor: 'rgba(255, 255, 255, 0.92)',
                alignItems: 'center',
                justifyContent: 'center',
                ...theme.shadow.sm,
              }}
            >
              <Feather name="heart" size={16} color={theme.colors.mutedForeground} />
            </View>
          </View>

          {/* Product Info */}
          <View style={{ padding: theme.spacing.md, gap: 6 }}>
            <Text
              numberOfLines={2}
              style={{
                color: theme.colors.foreground,
                fontWeight: '600',
                fontSize: sizes.nameSize,
                lineHeight: sizes.nameSize * 1.4,
              }}
            >
              {product.name}
            </Text>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing.sm }}>
              <Text
                style={{
                  color: theme.colors.foreground,
                  fontWeight: '900',
                  fontSize: sizes.priceSize,
                }}
              >
                {formatMoney(product.price, product.currency)}
              </Text>

              {variant === 'grid' ? (
                <View
                  pointerEvents="none"
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: theme.radius.full,
                    backgroundColor: theme.colors.primaryMuted,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Feather name="plus" size={18} color={theme.colors.primaryDark} />
                </View>
              ) : null}
            </View>
          </View>
        </Card>
      </Animated.View>
    </Pressable>
  );
}

export const ProductCard = memo(ProductCardInner);

type SkeletonProps = {
  variant?: ProductCardVariant;
  style?: ViewStyle;
};

export function ProductCardSkeleton({ variant = 'featured', style }: SkeletonProps) {
  const { theme } = useTheme();

  const imageHeight = variant === 'grid' ? 140 : 160;
  const shimmer = theme.scheme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)';
  const shimmerBright = theme.scheme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';

  return (
    <View style={style}>
      <Card
        variant="elevated"
        style={{
          gap: theme.spacing.sm,
          padding: variant === 'grid' ? theme.spacing.sm : theme.spacing.md,
        }}
      >
        <View
          style={{
            height: imageHeight,
            borderRadius: theme.radius.md,
            backgroundColor: shimmer,
          }}
        />
        <View style={{ gap: theme.spacing.xs }}>
          <View style={[styles.line, { backgroundColor: shimmerBright, width: '90%', height: 14 }]} />
          <View style={[styles.line, { backgroundColor: shimmer, width: '50%', height: 16 }]} />
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  line: { borderRadius: 6 },
});
