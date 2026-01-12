import React, { useMemo } from 'react';
import { ActivityIndicator, Image, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { useGetPublicProductByIdQuery } from '../../../../src/api/publicProductApi';
import { Header } from '../../../../src/components/layout/Header';
import { Screen } from '../../../../src/components/layout/Screen';
import { Button } from '../../../../src/components/ui/Button';
import { Card } from '../../../../src/components/ui/Card';
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

  const title = useMemo(() => product?.name ?? 'Product', [product?.name]);
  const imageUrl = product?.images?.[0]?.imageUrl ?? null;

  return (
    <Screen scroll>
      <Header title={title} subtitle="Details" canGoBack />

      <View style={{ marginTop: theme.spacing.lg, gap: theme.spacing.lg }}>
        {!id ? (
          <Card style={{ gap: theme.spacing.sm }}>
            <Text style={{ color: theme.colors.foreground, fontWeight: '900', fontSize: theme.typography.subtitle }}>
              Missing product id
            </Text>
            <Text style={{ color: theme.colors.placeholder, fontWeight: '600' }}>
              Please go back and select a product again.
            </Text>
            <Button label="Back to products" variant="outline" onPress={() => router.push('/(app)/(customer)/products')} />
          </Card>
        ) : isLoading ? (
          <Card style={{ gap: theme.spacing.sm }}>
            <View style={{ height: 220, borderRadius: theme.radius.md, backgroundColor: theme.colors.muted }} />
            <View style={{ height: 16, borderRadius: 8, backgroundColor: theme.colors.muted, width: '85%' }} />
            <View style={{ height: 14, borderRadius: 8, backgroundColor: theme.colors.muted, width: '45%' }} />
            <View style={{ paddingTop: theme.spacing.sm }}>
              <ActivityIndicator color={theme.colors.primary} />
            </View>
          </Card>
        ) : error ? (
          <Card style={{ gap: theme.spacing.sm }}>
            <Text style={{ color: theme.colors.foreground, fontWeight: '900', fontSize: theme.typography.subtitle }}>
              Couldn't load product
            </Text>
            <Text style={{ color: theme.colors.placeholder, fontWeight: '600' }}>{getApiErrorMessage(error)}</Text>
            <Button label="Retry" onPress={() => refetch()} loading={isFetching} />
            <Button label="Back to products" variant="outline" onPress={() => router.push('/(app)/(customer)/products')} />
          </Card>
        ) : !product ? (
          <Card style={{ gap: theme.spacing.sm }}>
            <Text style={{ color: theme.colors.foreground, fontWeight: '900', fontSize: theme.typography.subtitle }}>
              Product not found
            </Text>
            <Text style={{ color: theme.colors.placeholder, fontWeight: '600' }}>
              This product may have been removed.
            </Text>
            <Button label="Back to products" variant="outline" onPress={() => router.push('/(app)/(customer)/products')} />
          </Card>
        ) : (
          <>
            <Card style={{ gap: theme.spacing.sm }}>
              <View
                style={{
                  height: 220,
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
                  <Text style={{ color: theme.colors.placeholder, fontWeight: '700' }}>No image</Text>
                )}
              </View>

              <Text style={{ color: theme.colors.foreground, fontWeight: '900', fontSize: 20 }}>
                {product.name}
              </Text>
              <Text style={{ color: theme.colors.primary, fontWeight: '900', fontSize: theme.typography.subtitle }}>
                {formatMoney(product.price, product.currency)}
              </Text>

              <Text style={{ color: theme.colors.placeholder, fontWeight: '700' }}>
                {product.category ?? 'Uncategorized'}
              </Text>
            </Card>

            <Card style={{ gap: theme.spacing.sm }}>
              <Text style={{ color: theme.colors.foreground, fontWeight: '900', fontSize: theme.typography.subtitle }}>
                Description
              </Text>
              <Text style={{ color: theme.colors.placeholder, fontWeight: '600', fontSize: theme.typography.body }}>
                {product.description?.trim() ? product.description.trim() : 'No description provided.'}
              </Text>
            </Card>

            <Button label="Browse more products" variant="outline" onPress={() => router.push('/(app)/(customer)/products')} />
          </>
        )}

      </View>
    </Screen>
  );
}
