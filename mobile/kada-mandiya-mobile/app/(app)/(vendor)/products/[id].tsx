import React, { useMemo } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import {
  useDeactivateVendorProductMutation,
  useGetMyVendorProductsQuery,
  useGetVendorProductByIdQuery,
  useReactivateVendorProductMutation,
} from '../../../../src/api/vendorProductApi';
import { Header } from '../../../../src/components/layout/Header';
import { Screen } from '../../../../src/components/layout/Screen';
import { ProductActions } from '../../../../src/components/product/ProductActions';
import { ProductImages } from '../../../../src/components/product/ProductImages';
import { ProductInfoCard } from '../../../../src/components/product/ProductInfoCard';
import { Button } from '../../../../src/components/ui/Button';
import { Card } from '../../../../src/components/ui/Card';
import { useTheme } from '../../../../src/providers/ThemeProvider';
import { showToast } from '../../../../src/utils/toast';

export default function VendorProductDetailsScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const productId = typeof params.id === 'string' ? params.id : '';

  const {
    data: listData,
    isFetching: listFetching,
    isError: listError,
    refetch: refetchList,
  } = useGetMyVendorProductsQuery();

  const listItem = useMemo(() => listData?.items?.find((p) => p.id === productId) ?? null, [listData?.items, productId]);

  const {
    data: detail,
    isFetching: detailFetching,
    isError: detailError,
    refetch: refetchDetail,
  } = useGetVendorProductByIdQuery(productId, { skip: !productId });

  const product = detail ?? listItem;
  const title = product?.name ? (product.name.length > 28 ? `${product.name.slice(0, 28)}…` : product.name) : 'Product';

  const imageUrls = useMemo(() => {
    if (detail?.images?.length) return detail.images.map((img) => img.imageUrl);
    if (listItem?.thumbnailImageUrl) return [listItem.thumbnailImageUrl];
    return [];
  }, [detail?.images, listItem?.thumbnailImageUrl]);

  const specifications = useMemo(() => {
    const raw = (detail as any)?.specifications ?? (listItem as any)?.specifications;
    if (!Array.isArray(raw)) return [];
    return raw
      .map((row: any) => ({ key: typeof row?.key === 'string' ? row.key.trim() : '', value: typeof row?.value === 'string' ? row.value.trim() : '' }))
      .filter((row) => row.key.length > 0 && row.value.length > 0)
      .slice(0, 20);
  }, [detail, listItem]);

  const [deactivateProduct, deactivateState] = useDeactivateVendorProductMutation();
  const [reactivateProduct, reactivateState] = useReactivateVendorProductMutation();

  const busy = deactivateState.isLoading || reactivateState.isLoading;

  const canRetry = Boolean(productId);
  const showErrorState = !product && (detailError || listError);

  return (
    <Screen scroll>
      <Header title={title} canGoBack />

      <View style={{ marginTop: theme.spacing.lg }}>
        {detailFetching || (listFetching && !listItem) ? (
          <View style={{ paddingVertical: theme.spacing.xl, alignItems: 'center' }}>
            <ActivityIndicator color={theme.colors.primary} />
          </View>
        ) : showErrorState ? (
          <Card style={{ gap: theme.spacing.sm }}>
            <Text style={{ color: theme.colors.danger, fontWeight: '900', fontSize: theme.typography.subtitle }}>
              Couldn’t load product
            </Text>
            <Text style={{ color: theme.colors.placeholder, fontWeight: '600', fontSize: theme.typography.body }}>
              Please check your connection and try again.
            </Text>
            <Button
              label="Retry"
              variant="outline"
              disabled={!canRetry}
              onPress={() => {
                refetchList();
                refetchDetail();
              }}
            />
            <Button label="Back" variant="ghost" onPress={() => router.back()} />
          </Card>
        ) : product ? (
          <View style={{ gap: theme.spacing.lg }}>
            <ProductImages imageUrls={imageUrls} />

            <ProductInfoCard
              price={product.price}
              currency={product.currency}
              stockQty={product.stockQty}
              category={product.category ?? null}
              updatedAt={product.updatedAt}
              isActive={product.isActive}
            />

            <Card style={{ gap: theme.spacing.sm }}>
              <Text style={{ color: theme.colors.foreground, fontWeight: '900', fontSize: theme.typography.subtitle }}>
                Description
              </Text>
              <Text style={{ color: theme.colors.placeholder, fontWeight: '600', fontSize: theme.typography.body }}>
                {'description' in product && product.description ? product.description : 'No description available.'}
              </Text>
            </Card>

            {specifications.length > 0 ? (
              <Card style={{ gap: theme.spacing.sm }}>
                <Text style={{ color: theme.colors.foreground, fontWeight: '900', fontSize: theme.typography.subtitle }}>
                  Specifications
                </Text>
                <View style={{ gap: theme.spacing.xs }}>
                  {specifications.map((row, idx) => (
                    <View key={`${row.key}-${idx}`} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: theme.spacing.md }}>
                      <Text style={{ flex: 1, color: theme.colors.placeholder, fontWeight: '700', fontSize: theme.typography.body }}>
                        {row.key}
                      </Text>
                      <Text style={{ flex: 1, textAlign: 'right', color: theme.colors.foreground, fontWeight: '800', fontSize: theme.typography.body }}>
                        {row.value}
                      </Text>
                    </View>
                  ))}
                </View>
              </Card>
            ) : null}

            <ProductActions
              isActive={product.isActive}
              busy={busy}
              onEdit={() => router.push(`/(app)/(vendor)/products/${productId}/edit`)}
              onDeactivate={async () => {
                try {
                  await deactivateProduct({ id: productId }).unwrap();
                  showToast('Product deactivated');
                } catch {
                  showToast('Could not deactivate product');
                }
              }}
              onReactivate={async () => {
                try {
                  await reactivateProduct({ id: productId }).unwrap();
                  showToast('Product reactivated');
                } catch {
                  showToast('Could not reactivate product');
                }
              }}
            />

            {!detail && listItem?.isActive === false ? (
              <Card style={{ gap: theme.spacing.xs }}>
                <Text style={{ color: theme.colors.foreground, fontWeight: '900', fontSize: theme.typography.body }}>
                  Limited details
                </Text>
                <Text style={{ color: theme.colors.placeholder, fontWeight: '600', fontSize: theme.typography.body }}>
                  This product is inactive, so full details like description and image gallery may be unavailable.
                </Text>
              </Card>
            ) : null}
          </View>
        ) : (
          <Card style={{ gap: theme.spacing.sm }}>
            <Text style={{ color: theme.colors.foreground, fontWeight: '900', fontSize: theme.typography.subtitle }}>
              Product not found
            </Text>
            <Text style={{ color: theme.colors.placeholder, fontWeight: '600', fontSize: theme.typography.body }}>
              It may have been removed.
            </Text>
            <Button label="Back" variant="outline" onPress={() => router.back()} />
          </Card>
        )}
      </View>
    </Screen>
  );
}
