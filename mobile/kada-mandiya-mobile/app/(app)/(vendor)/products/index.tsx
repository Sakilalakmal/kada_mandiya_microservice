import React from 'react';
import { ActivityIndicator, Image, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import { useGetMyVendorProductsQuery } from '../../../../src/api/vendorProductApi';
import { Header } from '../../../../src/components/layout/Header';
import { Screen } from '../../../../src/components/layout/Screen';
import { Badge } from '../../../../src/components/ui/Badge';
import { Button } from '../../../../src/components/ui/Button';
import { Card } from '../../../../src/components/ui/Card';
import { useTheme } from '../../../../src/providers/ThemeProvider';
import { formatDateTime } from '../../../../src/utils/format';

export default function VendorProductsListScreen() {
  const { theme } = useTheme();
  const { data, isFetching, isError, refetch } = useGetMyVendorProductsQuery();

  const items = data?.items ?? [];

  return (
    <Screen scroll>
      <Header title="Products" subtitle="Create and manage your items." canGoBack />

      <View style={{ marginTop: theme.spacing.lg, gap: theme.spacing.lg }}>
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
        ) : (
          <View style={{ gap: theme.spacing.sm }}>
            {items.map((p) => (
              <Pressable
                key={p.id}
                onPress={() => {}}
                style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1 }]}
              >
                <Card>
                  <View style={{ flexDirection: 'row', gap: theme.spacing.md }}>
                    <View
                      style={{
                        width: 72,
                        height: 72,
                        borderRadius: theme.radius.md,
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                        backgroundColor: theme.colors.background,
                        overflow: 'hidden',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {p.thumbnailImageUrl ? (
                        <Image
                          source={{ uri: p.thumbnailImageUrl }}
                          style={{ width: '100%', height: '100%' }}
                          resizeMode="cover"
                        />
                      ) : (
                        <Feather name="image" size={18} color={theme.colors.placeholder} />
                      )}
                    </View>

                    <View style={{ flex: 1, gap: theme.spacing.xs }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text
                          numberOfLines={1}
                          style={{ flex: 1, color: theme.colors.foreground, fontWeight: '900', fontSize: theme.typography.subtitle }}
                        >
                          {p.name}
                        </Text>
                        <Badge label={p.isActive ? 'ACTIVE' : 'INACTIVE'} />
                      </View>

                      <Text style={{ color: theme.colors.placeholder, fontWeight: '700', fontSize: theme.typography.small }}>
                        {p.category ?? 'Uncategorized'} • {p.currency} {p.price.toFixed(2)}
                      </Text>

                      <Text style={{ color: theme.colors.placeholder, fontWeight: '600', fontSize: theme.typography.small }}>
                        Stock: {p.stockQty} • Updated {formatDateTime(p.updatedAt)}
                      </Text>
                    </View>
                  </View>
                </Card>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </Screen>
  );
}

