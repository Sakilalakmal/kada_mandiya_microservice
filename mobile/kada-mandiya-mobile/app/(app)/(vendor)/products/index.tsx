import React, { useCallback, useMemo } from 'react';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import { useGetMyVendorProductsQuery } from '../../../../src/api/vendorProductApi';
import { Header } from '../../../../src/components/layout/Header';
import { Screen } from '../../../../src/components/layout/Screen';
import { VendorProductCard } from '../../../../src/components/product/VendorProductCard';
import { Button } from '../../../../src/components/ui/Button';
import { Card } from '../../../../src/components/ui/Card';
import { useTheme } from '../../../../src/providers/ThemeProvider';

export default function VendorProductsListScreen() {
  const { theme } = useTheme();
  const { data, isFetching, isError, refetch } = useGetMyVendorProductsQuery();

  const items = useMemo(() => data?.items ?? [], [data?.items]);
  const navigateToDetails = useCallback((id: string) => router.push(`/(app)/(vendor)/products/${id}`), []);

  return (
    <Screen style={{ paddingHorizontal: 0, paddingVertical: 0 }}>
      <Header title="Products" subtitle="Create and manage your items." canGoBack />

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        removeClippedSubviews
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={10}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: theme.spacing.md,
          paddingTop: theme.spacing.lg,
          paddingBottom: theme.spacing.xl,
          gap: theme.spacing.sm,
        }}
        ListHeaderComponent={
          <View style={{ gap: theme.spacing.lg }}>
            <Card>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flex: 1, gap: theme.spacing.xs }}>
                  <Text style={{ color: theme.colors.foreground, fontWeight: '900', fontSize: theme.typography.subtitle }}>
                    Add a new product
                  </Text>
                  <Text style={{ color: theme.colors.placeholder, fontWeight: '600', fontSize: theme.typography.body }}>
                    Upload photos and publish instantly.
                  </Text>
                </View>
                <Feather name="plus-circle" size={18} color={theme.colors.primary} />
              </View>
              <View style={{ marginTop: theme.spacing.md }}>
                <Button label="Create product" onPress={() => router.push('/(app)/(vendor)/products/new')} />
              </View>
            </Card>

            {isFetching ? (
              <View style={{ paddingVertical: theme.spacing.xl, alignItems: 'center' }}>
                <ActivityIndicator color={theme.colors.primary} />
              </View>
            ) : isError ? (
              <Card style={{ gap: theme.spacing.sm }}>
                <Text style={{ color: theme.colors.danger, fontWeight: '800', fontSize: theme.typography.body }}>
                  Failed to load products.
                </Text>
                <Button label="Retry" variant="outline" onPress={refetch} />
              </Card>
            ) : items.length === 0 ? (
              <Card style={{ gap: theme.spacing.sm }}>
                <Text style={{ color: theme.colors.foreground, fontWeight: '800', fontSize: theme.typography.subtitle }}>
                  No products yet
                </Text>
                <Text style={{ color: theme.colors.placeholder, fontWeight: '600', fontSize: theme.typography.body }}>
                  Create your first product to start selling.
                </Text>
              </Card>
            ) : null}
          </View>
        }
        renderItem={({ item }) => <VendorProductCard product={item} onPress={() => navigateToDetails(item.id)} />}
      />
    </Screen>
  );
}

