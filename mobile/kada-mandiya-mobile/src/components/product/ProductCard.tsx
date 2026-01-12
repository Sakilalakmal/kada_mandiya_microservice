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
  onPressProduct: (id: string) => void;
  style?: ViewStyle;
};

function ProductCardInner({ product, variant = 'featured', onPressProduct, style }: Props) {
  const { theme } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const sizes = useMemo(() => {
    if (variant === 'grid') {
      return {
        cardPadding: theme.spacing.md,
        imageHeight: 112,
        imageRadius: theme.radius.md,
      };
    }
    return {
      cardPadding: theme.spacing.md,
      imageHeight: 124,
      imageRadius: theme.radius.md,
    };
  }, [theme.radius.md, theme.spacing.md, variant]);

  const imageWrapStyle: ViewStyle = useMemo(
    () => ({
      height: sizes.imageHeight,
      borderRadius: sizes.imageRadius,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
    }),
    [sizes.imageHeight, sizes.imageRadius, theme.colors.background, theme.colors.border]
  );

  const imageStyle: ImageStyle = useMemo(() => ({ width: '100%', height: '100%' }), []);

  return (
    <Pressable
      onPress={() => onPressProduct(product.id)}
      onPressIn={() => {
        Animated.timing(scale, { toValue: 0.985, duration: 120, useNativeDriver: true }).start();
      }}
      onPressOut={() => {
        Animated.timing(scale, { toValue: 1, duration: 140, useNativeDriver: true }).start();
      }}
      style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1 }, style]}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <Card style={{ padding: sizes.cardPadding, gap: theme.spacing.sm }}>
          <View style={imageWrapStyle}>
            {product.thumbnailImageUrl ? (
              <Image source={{ uri: product.thumbnailImageUrl }} style={imageStyle} resizeMode="cover" />
            ) : (
              <Feather name="image" size={18} color={theme.colors.placeholder} />
            )}
          </View>

          <View style={{ gap: 6 }}>
            <Text
              numberOfLines={2}
              style={{
                color: theme.colors.foreground,
                fontWeight: '900',
                fontSize: theme.typography.body,
                lineHeight: theme.typography.body * 1.22,
              }}
            >
              {product.name}
            </Text>
            <Text style={{ color: theme.colors.placeholder, fontWeight: '800', fontSize: theme.typography.small }}>
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

  const imageHeight = variant === 'grid' ? 112 : 124;
  const shimmer = theme.scheme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';

  return (
    <View style={style}>
      <Card style={{ gap: theme.spacing.sm }}>
        <View
          style={{
            height: imageHeight,
            borderRadius: theme.radius.md,
            backgroundColor: shimmer,
            borderWidth: 1,
            borderColor: theme.colors.border,
          }}
        />
        <View style={{ gap: 10 }}>
          <View style={[styles.line, { backgroundColor: shimmer, width: '90%' }]} />
          <View style={[styles.line, { backgroundColor: shimmer, width: '55%' }]} />
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  line: { height: 12, borderRadius: 8 },
});

