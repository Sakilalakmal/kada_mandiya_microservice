import React, { useState } from 'react';
import { Alert, View } from 'react-native';
import { router } from 'expo-router';

import { useCreateVendorProductMutation } from '../../../../src/api/vendorProductApi';
import { Header } from '../../../../src/components/layout/Header';
import { Screen } from '../../../../src/components/layout/Screen';
import { ProductForm, type ProductFormValues } from '../../../../src/components/product/ProductForm';
import { useTheme } from '../../../../src/providers/ThemeProvider';
import type { CreateProductRequest } from '../../../../src/types/product.types';
import { getApiErrorMessage } from '../../../../src/utils/apiError';
import { showToast } from '../../../../src/utils/toast';

export default function CreateVendorProductScreen() {
  const { theme } = useTheme();
  const [createProduct, createState] = useCreateVendorProductMutation();
  const [serverError, setServerError] = useState<string | null>(null);

  const toPayload = (values: ProductFormValues): CreateProductRequest => ({
    name: values.name.trim(),
    description: values.description?.trim() ? values.description.trim() : undefined,
    category: values.category?.trim() ? values.category.trim() : undefined,
    price: Number(values.price),
    currency: values.currency.trim() || 'LKR',
    stockQty: values.stockQty?.trim() ? Math.max(0, Math.floor(Number(values.stockQty))) : 0,
    images: values.images,
  });

  return (
    <Screen scroll keyboardAvoiding>
      <Header title="Create product" subtitle="Add details and upload photos." canGoBack />

      <View style={{ marginTop: theme.spacing.lg }}>
        <ProductForm
          submitLabel="Create product"
          submitBusy={createState.isLoading}
          errorMessage={serverError}
          onCancel={() => router.back()}
          onSubmit={async (values) => {
            setServerError(null);
            try {
              await createProduct(toPayload(values)).unwrap();
              showToast('Product created');
              Alert.alert('Product created', 'Your product has been saved.');
              router.replace('/(app)/(vendor)/products');
            } catch (err) {
              setServerError(getApiErrorMessage(err));
            }
          }}
        />
      </View>
    </Screen>
  );
}

