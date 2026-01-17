import React, { useCallback, useMemo } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { useGetVendorOrdersQuery } from '../../../src/api/orderApi';
import { Header } from '../../../src/components/layout/Header';
import { Screen } from '../../../src/components/layout/Screen';
import { OrderCard } from '../../../src/components/orders/OrderCard';
import { Button } from '../../../src/components/ui/Button';
import { Card } from '../../../src/components/ui/Card';
import { useTheme } from '../../../src/providers/ThemeProvider';
import type { VendorOrderListItem } from '../../../src/types/order.types';
import { getApiErrorMessage } from '../../../src/utils/apiError';
import { formatMoney } from '../../../src/utils/money';
import { isActiveOrderStatus, isCompletedOrderStatus } from '../../../src/utils/orderStatus';

export default function VendorRevenueScreen() {
  const { theme } = useTheme();
  const { data: orders, isLoading, isFetching, error, refetch } = useGetVendorOrdersQuery();

  const items = useMemo(() => orders ?? [], [orders]);
  const delivered = useMemo(() => items.filter((o) => isCompletedOrderStatus(o.status)), [items]);
  const activeCount = useMemo(() => items.filter((o) => isActiveOrderStatus(o.status)).length, [items]);

  const deliveredRevenue = useMemo(
    () => delivered.reduce((sum, o) => sum + Math.max(0, Number(o.vendorSubtotal ?? 0)), 0),
    [delivered]
  );

  const openOrder = useCallback((id: string) => {
    router.push(`/(app)/(vendor)/orders/${encodeURIComponent(id)}`);
  }, []);

  const keyExtractor = useCallback((item: VendorOrderListItem) => item.orderId, []);

  const renderItem = useCallback(
    ({ item }: { item: VendorOrderListItem }) => (
      <View style={{ marginBottom: theme.spacing.md }}>
        <OrderCard
          orderId={item.orderId}
          status={item.status}
          createdAt={item.createdAt}
          amount={item.vendorSubtotal}
          currency="LKR"
          itemCountLabel={`${item.itemsForThisVendor?.length ?? 0} items`}
          thumbnailUrls={(item.itemsForThisVendor ?? []).map((i) => i.imageUrl)}
          onPress={() => openOrder(item.orderId)}
        />
      </View>
    ),
    [openOrder, theme.spacing.md]
  );

  const headerRight = useMemo(() => {
    return (
      <Pressable
        onPress={() => refetch()}
        disabled={isFetching}
        style={({ pressed }) => ({ opacity: pressed ? 0.86 : isFetching ? 0.6 : 1 })}
      >
        {isFetching ? (
          <ActivityIndicator color={theme.colors.primary} />
        ) : (
          <Text style={{ color: theme.colors.primary, fontWeight: '900' }}>Refresh</Text>
        )}
      </Pressable>
    );
  }, [isFetching, refetch, theme.colors.primary]);

  return (
    <Screen style={{ paddingHorizontal: 0, paddingVertical: 0 }}>
      <Header title="Revenue" subtitle="Sales from delivered orders." canGoBack right={headerRight} />

      <View style={{ flex: 1, paddingHorizontal: theme.spacing.md, paddingTop: theme.spacing.lg, gap: theme.spacing.lg }}>
        <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
          <Card style={{ flex: 1, gap: theme.spacing.xs }}>
            <Text style={{ color: theme.colors.placeholder, fontWeight: '800', fontSize: theme.typography.small }}>Total revenue</Text>
            <Text style={{ color: theme.colors.foreground, fontWeight: '900', fontSize: theme.typography.title }} numberOfLines={1}>
              {formatMoney(deliveredRevenue, 'LKR')}
            </Text>
            <Text style={{ color: theme.colors.placeholder, fontWeight: '600', fontSize: theme.typography.small }}>
              {delivered.length === 1 ? '1 delivered order' : `${delivered.length} delivered orders`}
            </Text>
          </Card>

          <Card style={{ flex: 1, gap: theme.spacing.xs }}>
            <Text style={{ color: theme.colors.placeholder, fontWeight: '800', fontSize: theme.typography.small }}>Active orders</Text>
            <Text style={{ color: theme.colors.foreground, fontWeight: '900', fontSize: theme.typography.title }} numberOfLines={1}>
              {activeCount}
            </Text>
            <Text style={{ color: theme.colors.placeholder, fontWeight: '600', fontSize: theme.typography.small }}>Need attention</Text>
          </Card>
        </View>

        {isLoading ? (
          <View style={{ paddingVertical: theme.spacing.xl, alignItems: 'center' }}>
            <ActivityIndicator color={theme.colors.primary} />
          </View>
        ) : error ? (
          <Card style={{ gap: theme.spacing.sm }}>
            <Text style={{ color: theme.colors.foreground, fontWeight: '900', fontSize: theme.typography.subtitle }}>
              Couldn't load revenue
            </Text>
            <Text style={{ color: theme.colors.placeholder, fontWeight: '600' }}>{getApiErrorMessage(error)}</Text>
            <Button label="Retry" onPress={() => refetch()} loading={isFetching} />
          </Card>
        ) : delivered.length === 0 ? (
          <Card style={{ gap: theme.spacing.sm }}>
            <Text style={{ color: theme.colors.foreground, fontWeight: '900', fontSize: theme.typography.subtitle }}>
              No delivered orders yet
            </Text>
            <Text style={{ color: theme.colors.placeholder, fontWeight: '600' }}>
              Revenue appears here once orders reach Delivered.
            </Text>
            <Button label="View orders" variant="outline" onPress={() => router.push('/(app)/(vendor)/(tabs)/orders')} />
          </Card>
        ) : (
          <FlatList
            data={delivered}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: theme.spacing.xl }}
            refreshing={isFetching}
            onRefresh={() => refetch()}
          />
        )}
      </View>
    </Screen>
  );
}

