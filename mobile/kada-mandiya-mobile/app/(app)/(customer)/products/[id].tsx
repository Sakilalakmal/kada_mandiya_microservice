import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { useAddToCartMutation } from '../../../../src/api/cartApi';
import { useGetPublicProductByIdQuery } from '../../../../src/api/publicProductApi';
import { Header } from '../../../../src/components/layout/Header';
import { Screen } from '../../../../src/components/layout/Screen';
import { Button } from '../../../../src/components/ui/Button';
import { Card } from '../../../../src/components/ui/Card';
import { Toast } from '../../../../src/components/ui/Toast';
import { useTheme } from '../../../../src/providers/ThemeProvider';
import { formatMoney } from '../../../../src/utils/money';
import { getApiErrorMessage } from '../../../../src/utils/apiError';

function singleParam(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  const trimmed = v?.trim();
  return trimmed ? trimmed : undefined;
}

export default function CustomerProductDetailsScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { id: rawId } = useLocalSearchParams<{ id: string | string[] }>();
  const id = singleParam(rawId);

  const { data: product, isLoading, isFetching, error, refetch } = useGetPublicProductByIdQuery(id ?? '', {
    skip: !id,
  });

  const [addToCart, addState] = useAddToCartMutation();
  const [qty, setQty] = useState(1);
  const [toastVisible, setToastVisible] = useState(false);

  const title = useMemo(() => product?.name ?? 'Product', [product?.name]);
  const imageUrl = product?.images?.[0]?.imageUrl ?? null;
  const inStock = (product?.stockQty ?? 0) > 0;
  const maxQty = Math.max(1, Math.floor(product?.stockQty ?? 1));

  useEffect(() => {
    setQty(1);
  }, [id]);

  useEffect(() => {
    if (!toastVisible) return;
    const t = setTimeout(() => setToastVisible(false), 2200);
    return () => clearTimeout(t);
  }, [toastVisible]);

  return (
    <Screen scroll>
      <Header title={title} subtitle="Product Details" canGoBack />

      <View style={{ marginTop: theme.spacing.lg, gap: theme.spacing.lg }}>
        {!id ? (
          <Card style={{ gap: theme.spacing.md }}>
            <Text style={{ color: theme.colors.foreground, fontWeight: '800', fontSize: theme.typography.h3 }}>
              Missing product id
            </Text>
            <Text style={{ color: theme.colors.foregroundSecondary, fontWeight: '500' }}>
              Please go back and select a product again.
            </Text>
            <Button label="Back to products" variant="outline" onPress={() => router.push('/(app)/(customer)/products')} />
          </Card>
        ) : isLoading ? (
          <Card style={{ gap: theme.spacing.md }}>
            <View style={{ height: 280, borderRadius: theme.radius.xl, backgroundColor: theme.colors.muted }} />
            <View style={{ height: 20, borderRadius: 10, backgroundColor: theme.colors.muted, width: '85%' }} />
            <View style={{ height: 16, borderRadius: 8, backgroundColor: theme.colors.muted, width: '45%' }} />
            <View style={{ paddingTop: theme.spacing.md }}>
              <ActivityIndicator color={theme.colors.primary} size="large" />
            </View>
          </Card>
        ) : error ? (
          <Card style={{ gap: theme.spacing.md }}>
            <Text style={{ color: theme.colors.foreground, fontWeight: '800', fontSize: theme.typography.h3 }}>
              Couldn't load product
            </Text>
            <Text style={{ color: theme.colors.foregroundSecondary, fontWeight: '500' }}>{getApiErrorMessage(error)}</Text>
            <Button label="Retry" onPress={() => refetch()} loading={isFetching} />
            <Button label="Back to products" variant="outline" onPress={() => router.push('/(app)/(customer)/products')} />
          </Card>
        ) : !product ? (
          <Card style={{ gap: theme.spacing.md }}>
            <Text style={{ color: theme.colors.foreground, fontWeight: '800', fontSize: theme.typography.h3 }}>
              Product not found
            </Text>
            <Text style={{ color: theme.colors.foregroundSecondary, fontWeight: '500' }}>
              This product may have been removed.
            </Text>
            <Button label="Back to products" variant="outline" onPress={() => router.push('/(app)/(customer)/products')} />
          </Card>
        ) : (
          <>
            {/* Large Product Image */}
            <Card noPadding variant="elevated" style={{ overflow: 'hidden' }}>
              <View
                style={{
                  height: 320,
                  backgroundColor: theme.colors.backgroundSecondary,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {imageUrl ? (
                  <Image source={{ uri: imageUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                ) : (
                  <View style={{ alignItems: 'center', gap: theme.spacing.sm }}>
                    <Feather name="image" size={48} color={theme.colors.placeholder} />
                    <Text style={{ color: theme.colors.placeholder, fontWeight: '600' }}>No image</Text>
                  </View>
                )}
              </View>
            </Card>

            {/* Product Info Card */}
            <Card style={{ gap: theme.spacing.lg }}>
              <View style={{ gap: theme.spacing.xs }}>
                <Text style={{ color: theme.colors.foreground, fontWeight: '900', fontSize: theme.typography.h2, letterSpacing: -0.5 }}>
                  {product.name}
                </Text>
                <Text style={{ color: theme.colors.primary, fontWeight: '900', fontSize: theme.typography.priceDisplay, letterSpacing: -0.8, marginTop: theme.spacing.xs }}>
                  {formatMoney(product.price, product.currency)}
                </Text>
              </View>

              {product.category && (
                <View style={{ 
                  alignSelf: 'flex-start',
                  paddingHorizontal: theme.spacing.lg,
                  paddingVertical: theme.spacing.sm,
                  borderRadius: theme.radius.lg,
                  backgroundColor: theme.colors.primaryMuted,
                }}>
                  <Text style={{ color: theme.colors.primary, fontWeight: '700', fontSize: theme.typography.bodySmall }}>
                    {product.category}
                  </Text>
                </View>
              )}

              {product.description && (
                <View style={{ gap: theme.spacing.sm }}>
                  <Text style={{ color: theme.colors.foreground, fontWeight: '700', fontSize: theme.typography.h4 }}>
                    Description
                  </Text>
                  <Text style={{ 
                    color: theme.colors.foregroundSecondary, 
                    fontWeight: '500',
                    fontSize: theme.typography.body,
                    lineHeight: theme.typography.body * theme.typography.lineHeight.relaxed,
                  }}>
                    {product.description}
                  </Text>
                </View>
              )}

              {/* Quantity Selector */}
              <View style={{ gap: theme.spacing.md }}>
                <Text style={{ color: theme.colors.foreground, fontWeight: '700', fontSize: theme.typography.h4 }}>
                  Quantity
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Decrease quantity"
                    onPress={() => setQty((v) => Math.max(1, v - 1))}
                    style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                  >
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: theme.radius.lg,
                        borderWidth: 0,
                        backgroundColor: theme.colors.muted,
                        alignItems: 'center',
                        justifyContent: 'center',
                        ...theme.shadow.sm,
                      }}
                    >
                      <Feather name="minus" size={20} color={theme.colors.foreground} />
                    </View>
                  </Pressable>

                  <View
                    style={{
                      minWidth: 80,
                      height: 48,
                      borderRadius: theme.radius.lg,
                      borderWidth: 0,
                      backgroundColor: theme.colors.muted,
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingHorizontal: theme.spacing.lg,
                    }}
                  >
                    <Text style={{ color: theme.colors.foreground, fontWeight: '900', fontSize: theme.typography.h4 }}>
                      {qty}
                    </Text>
                  </View>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Increase quantity"
                    disabled={!inStock || qty >= maxQty}
                    onPress={() => setQty((v) => Math.min(maxQty, v + 1))}
                    style={({ pressed }) => ({ opacity: !inStock || qty >= maxQty ? 0.4 : pressed ? 0.7 : 1 })}
                  >
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: theme.radius.lg,
                        borderWidth: 0,
                        backgroundColor: theme.colors.muted,
                        alignItems: 'center',
                        justifyContent: 'center',
                        ...theme.shadow.sm,
                      }}
                    >
                      <Feather name="plus" size={20} color={theme.colors.foreground} />
                    </View>
                  </Pressable>
                </View>

                {inStock && (
                  <Text style={{ color: theme.colors.foregroundSecondary, fontWeight: '600', fontSize: theme.typography.bodySmall }}>
                    {product.stockQty} available in stock
                  </Text>
                )}
              </View>
            </Card>

            {/* Add to Cart Button - Fixed at bottom visually */}
            <View style={{ marginTop: theme.spacing.md, marginBottom: theme.spacing.xxl }}>
              <Button
                label={inStock ? 'Add to cart' : 'Out of stock'}
                size="lg"
                onPress={async () => {
                  try {
                    const raw = imageUrl?.trim();
                    const safeImageUrl = raw && /^https?:\/\//i.test(raw) ? raw : undefined;

                    await addToCart({
                      productId: product.id,
                      qty,
                      unitPrice: product.price,
                      title: product.name,
                      imageUrl: safeImageUrl,
                      vendorId: product.vendorUserId,
                    }).unwrap();

                    setToastVisible(true);
                  } catch (e) {
                    Alert.alert('Could not add to cart', getApiErrorMessage(e));
                  }
                }}
                loading={addState.isLoading}
                disabled={!inStock || addState.isLoading}
              />
            </View>
          </>
        )}

      </View>

      <Toast
        visible={toastVisible}
        message="Added to cart"
        actionLabel="View"
        onAction={() => {
          setToastVisible(false);
          router.push('/(app)/(customer)/(tabs)/cart');
        }}
        onDismiss={() => setToastVisible(false)}
      />
    </Screen>
  );
}
