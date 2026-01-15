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
  const opacity = useRef(new Animated.Value(1)).current;

  const handlePress = useMemo(() => {
    if (typeof onPress === 'function') return onPress;
    if (typeof onPressProduct === 'function') return () => onPressProduct(product.id);
    return () => {};
  }, [onPress, onPressProduct, product.id]);

  const sizes = useMemo(() => {
    if (variant === 'grid') {
      return {
        cardPadding: theme.spacing.sm,
        imageHeight: 140,
        imageRadius: theme.radius.md,
        priceSize: theme.typography.bodyLarge,
        nameSize: theme.typography.bodySmall,
      };
    }
    return {
      cardPadding: theme.spacing.md,
      imageHeight: 160,
      imageRadius: theme.radius.md,
      priceSize: theme.typography.bodyLarge,
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
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 0.97,
        useNativeDriver: true,
        speed: 50,
        bounciness: 0,
      }),
      Animated.timing(opacity, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateOut = () => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 50,
        bounciness: 6,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <Pressable onPress={handlePress} onPressIn={animateIn} onPressOut={animateOut} style={style}>
      <Animated.View style={{ transform: [{ scale }], opacity }}>
        <Card
          variant="elevated"
          style={{
            padding: sizes.cardPadding,
            gap: theme.spacing.sm,
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
          </View>

          {/* Product Info */}
          <View style={{ gap: theme.spacing.xxs }}>
            <Text
              numberOfLines={2}
              style={{
                color: theme.colors.foreground,
                fontWeight: '700',
                fontSize: sizes.nameSize,
                lineHeight: sizes.nameSize * 1.3,
                letterSpacing: -0.2,
              }}
            >
              {product.name}
            </Text>
            <Text
              style={{
                color: theme.colors.primary,
                fontWeight: '800',
                fontSize: sizes.priceSize,
                letterSpacing: -0.3,
              }}
            >
              {formatMoney(product.price, product.currency)}
            </Text>
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
