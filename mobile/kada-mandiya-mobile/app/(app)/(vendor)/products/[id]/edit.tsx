import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { useGetMyVendorProductsQuery, useGetVendorProductByIdQuery, useUpdateVendorProductMutation } from '../../../../../src/api/vendorProductApi';
import { Header } from '../../../../../src/components/layout/Header';
import { Screen } from '../../../../../src/components/layout/Screen';
import { ProductForm, type ProductFormValues } from '../../../../../src/components/product/ProductForm';
import { Card } from '../../../../../src/components/ui/Card';
import type { UpdateProductRequest } from '../../../../../src/types/product.types';
import { getApiErrorMessage } from '../../../../../src/utils/apiError';
import { showToast } from '../../../../../src/utils/toast';
import { useTheme } from '../../../../../src/providers/ThemeProvider';

export default function VendorEditProductScreen() {
  const { theme } = useTheme();
  const params = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const productId = typeof params.id === 'string' ? params.id : '';

  const { data: listData, isFetching: listFetching } = useGetMyVendorProductsQuery();
  const listItem = useMemo(() => listData?.items?.find((p) => p.id === productId) ?? null, [listData?.items, productId]);

  const { data: detail, isFetching: detailFetching, isError: detailError } = useGetVendorProductByIdQuery(productId, { skip: !productId });

  const product = detail ?? listItem;
  const imagesKnown = Boolean(detail?.images?.length);
  const initialImageUrls = useMemo(() => (detail?.images?.length ? detail.images.map((img) => img.imageUrl) : []), [detail?.images]);

  const [updateProduct, updateState] = useUpdateVendorProductMutation();
  const [serverError, setServerError] = useState<string | null>(null);

  const initialFormValues = useMemo<Partial<ProductFormValues>>(() => {
    if (!product) return {};
    return {
      name: product.name ?? '',
      description: 'description' in product ? product.description ?? '' : '',
      category: product.category ?? '',
      price: String(product.price ?? ''),
      currency: product.currency ?? 'LKR',
      stockQty: String(product.stockQty ?? '0'),
      images: initialImageUrls,
    };
  }, [initialImageUrls, product]);

  const imagesHint = useMemo(() => {
    if (imagesKnown) return undefined;
    if (listItem?.isActive === false) {
      return 'This product is inactive, so the current image gallery may be unavailable. Adding photos will replace images.';
    }
    if (detailError) {
      return 'Could not load the current image gallery. Adding photos will replace images.';
    }
    return undefined;
  }, [detailError, imagesKnown, listItem?.isActive]);

  const buildPatch = (values: ProductFormValues): UpdateProductRequest => {
    const nextName = values.name.trim();
    const nextDescription = values.description?.trim() ? values.description.trim() : undefined;
    const nextCategory = values.category?.trim() ? values.category.trim() : undefined;
    const nextPrice = Number(values.price);
    const nextCurrency = values.currency.trim() || 'LKR';
    const nextStockQty = values.stockQty?.trim() ? Math.max(0, Math.floor(Number(values.stockQty))) : 0;

    const patch: UpdateProductRequest = {};

    if (!product || nextName !== product.name) patch.name = nextName;
    if (!product || ('description' in product ? (product.description ?? '') : '') !== (nextDescription ?? '')) {
      if (nextDescription !== undefined) patch.description = nextDescription;
    }
    if (!product || (product.category ?? '') !== (nextCategory ?? '')) {
      if (nextCategory !== undefined) patch.category = nextCategory;
    }
    if (!product || nextPrice !== product.price) patch.price = nextPrice;
    if (!product || nextCurrency !== product.currency) patch.currency = nextCurrency;
    if (!product || nextStockQty !== product.stockQty) patch.stockQty = nextStockQty;

    const nextImages = (values.images ?? []).filter((u) => u && u.trim().length).map((u) => u.trim()).slice(0, 8);
    const initialImages = initialImageUrls;
    const imagesChanged =
      nextImages.length !== initialImages.length || nextImages.some((u, i) => u !== initialImages[i]);

    if (imagesKnown) {
      if (imagesChanged) patch.images = nextImages;
    } else {
      if (nextImages.length > 0) patch.images = nextImages;
    }

    return patch;
  };

  return (
    <Screen scroll keyboardAvoiding>
      <Header title="Edit product" canGoBack />

      <View style={{ marginTop: theme.spacing.lg }}>
        {!productId ? (
          <Card>
            <Text style={{ color: theme.colors.danger, fontWeight: '800', fontSize: theme.typography.body }}>
              Missing product ID.
            </Text>
          </Card>
        ) : detailFetching || (listFetching && !listItem) ? (
          <View style={{ paddingVertical: theme.spacing.xl, alignItems: 'center' }}>
            <ActivityIndicator color={theme.colors.primary} />
          </View>
        ) : product ? (
          <ProductForm
            key={`${productId}:${imagesKnown ? 'detail' : 'list'}`}
            title="Update product"
            initialValues={initialFormValues}
            initialImageUrls={imagesKnown ? initialImageUrls : undefined}
            imagesHint={imagesHint}
            errorMessage={serverError}
            submitLabel="Save changes"
            submitBusy={updateState.isLoading}
            onCancel={() => router.back()}
            onSubmit={async (values) => {
              setServerError(null);
              const patch = buildPatch(values);

              try {
                await updateProduct({ id: productId, patch }).unwrap();
                showToast('Updated');
                router.back();
              } catch (err) {
                setServerError(getApiErrorMessage(err));
              }
            }}
          />
        ) : (
          <Card style={{ gap: theme.spacing.sm }}>
            <Text style={{ color: theme.colors.foreground, fontWeight: '900', fontSize: theme.typography.subtitle }}>
              Product not found
            </Text>
            <Text style={{ color: theme.colors.placeholder, fontWeight: '600', fontSize: theme.typography.body }}>
              It may have been removed.
            </Text>
          </Card>
        )}
      </View>
    </Screen>
  );
}
