import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { orderApi, useGetMyOrdersQuery } from '../../../../src/api/orderApi';
import { CategoryChips, type CategoryChip } from '../../../../src/components/customer/CategoryChips';
import { Header } from '../../../../src/components/layout/Header';
import { Screen } from '../../../../src/components/layout/Screen';
import { OrderCard, OrderCardSkeleton } from '../../../../src/components/orders/OrderCard';
import { Button } from '../../../../src/components/ui/Button';
import { Card } from '../../../../src/components/ui/Card';
import { useTheme } from '../../../../src/providers/ThemeProvider';
import { useAppSelector } from '../../../../src/store/hooks';
import type { OrderDetails, OrderListItem } from '../../../../src/types/order.types';
import { getApiErrorMessage } from '../../../../src/utils/apiError';
import { isActiveOrderStatus, isCancelledOrderStatus, isCompletedOrderStatus } from '../../../../src/utils/orderStatus';

const FILTERS: CategoryChip[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

function sumQty(items: { qty: number }[]): number {
  return items.reduce((sum, item) => sum + Math.max(0, Math.floor(Number(item.qty ?? 0))), 0);
}

const CustomerOrderRow = React.memo(function CustomerOrderRow({
  order,
  currency,
  onPress,
}: {
  order: OrderListItem;
  currency: string;
  onPress: (orderId: string) => void;
}) {
  const cached = useAppSelector((s) => orderApi.endpoints.getOrderById.select(order.orderId)(s).data as OrderDetails | undefined);

  const itemCountLabel = useMemo(() => {
    if (!cached?.items?.length) return '— items';
    const count = sumQty(cached.items);
    return count === 1 ? '1 item' : `${count} items`;
  }, [cached?.items]);

  const thumbnailUrls = useMemo(() => {
    return (cached?.items ?? []).map((i) => i.imageUrl);
  }, [cached?.items]);

  return (
    <OrderCard
      orderId={order.orderId}
      status={order.status}
      createdAt={order.createdAt}
      amount={order.subtotal}
      currency={currency}
      itemCountLabel={itemCountLabel}
      thumbnailUrls={thumbnailUrls}
      onPress={() => onPress(order.orderId)}
    />
  );
});

export default function CustomerOrders() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const isFocused = useIsFocused();
  const [filter, setFilter] = useState(FILTERS[0]?.key ?? 'all');

  const { data: orders, isLoading, isFetching, error, refetch } = useGetMyOrdersQuery(undefined, {
    pollingInterval: isFocused ? 15000 : 0,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  const currency = 'LKR';
  const items = useMemo(() => orders ?? [], [orders]);

  const filtered = useMemo(() => {
    if (filter === 'active') return items.filter((o) => isActiveOrderStatus(o.status));
    if (filter === 'completed') return items.filter((o) => isCompletedOrderStatus(o.status));
    if (filter === 'cancelled') return items.filter((o) => isCancelledOrderStatus(o.status));
    return items;
  }, [filter, items]);

  const openOrder = useCallback(
    (id: string) => {
      router.push(`/(app)/(customer)/orders/${encodeURIComponent(id)}`);
    },
    [router]
  );

  const prefetchOrder = orderApi.usePrefetch('getOrderById');

  useEffect(() => {
    if (!isFocused) return;
    if (!items.length) return;
    for (const order of items.slice(0, 6)) {
      prefetchOrder(order.orderId, { force: false });
    }
  }, [isFocused, items, prefetchOrder]);

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

  const keyExtractor = useCallback((item: OrderListItem) => item.orderId, []);

  const renderItem = useCallback(
    ({ item }: { item: OrderListItem }) => (
      <View style={{ marginBottom: theme.spacing.md }}>
        <CustomerOrderRow order={item} currency={currency} onPress={openOrder} />
      </View>
    ),
    [currency, openOrder, theme.spacing.md]
  );

  const bottomSpacer = 60 + Math.max(insets.bottom, theme.spacing.sm) + theme.spacing.md;

  return (
    <Screen style={{ paddingBottom: bottomSpacer }}>
      <Header title="Orders" subtitle="Your recent purchases." right={headerRight} />

      <View style={{ flex: 1, marginTop: theme.spacing.lg, gap: theme.spacing.lg }}>
        <CategoryChips items={FILTERS} selectedKey={filter} onSelect={setFilter} />

        {isLoading ? (
          <View style={{ gap: theme.spacing.md }}>
            <OrderCardSkeleton />
            <OrderCardSkeleton />
            <OrderCardSkeleton />
          </View>
        ) : error ? (
          <Card style={{ gap: theme.spacing.sm }}>
            <Text style={{ color: theme.colors.foreground, fontWeight: '900', fontSize: theme.typography.subtitle }}>
              Couldn't load orders
            </Text>
            <Text style={{ color: theme.colors.placeholder, fontWeight: '600' }}>{getApiErrorMessage(error)}</Text>
            <Button label="Retry" onPress={() => refetch()} loading={isFetching} />
          </Card>
        ) : filtered.length === 0 ? (
          <Card style={{ gap: theme.spacing.sm }}>
            <Text style={{ color: theme.colors.foreground, fontWeight: '900', fontSize: theme.typography.subtitle }}>
              {filter === 'all' ? 'No orders yet' : 'No matching orders'}
            </Text>
            <Text style={{ color: theme.colors.placeholder, fontWeight: '600' }}>
              {filter === 'all'
                ? 'When you place an order, it will appear here.'
                : 'Try a different filter or check back later.'}
            </Text>
            <Button label="Browse products" onPress={() => router.push('/(app)/(customer)/products')} />
          </Card>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            refreshing={isFetching}
            onRefresh={() => refetch()}
            contentContainerStyle={{ paddingBottom: bottomSpacer }}
          />
        )}
      </View>
    </Screen>
  );
}

