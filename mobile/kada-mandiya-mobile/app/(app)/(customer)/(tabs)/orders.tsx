import React, { useCallback } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { useGetMyOrdersQuery } from '../../../../src/api/orderApi';
import { Header } from '../../../../src/components/layout/Header';
import { Screen } from '../../../../src/components/layout/Screen';
import { Button } from '../../../../src/components/ui/Button';
import { Card } from '../../../../src/components/ui/Card';
import { useTheme } from '../../../../src/providers/ThemeProvider';
import { getApiErrorMessage } from '../../../../src/utils/apiError';
import { formatDateTime } from '../../../../src/utils/format';
import { formatMoney } from '../../../../src/utils/money';

export default function CustomerOrders() {
  const { theme } = useTheme();
  const router = useRouter();

  const { data: orders, isLoading, isFetching, error, refetch } = useGetMyOrdersQuery(undefined, {
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  const currency = 'LKR';
  const items = orders ?? [];

  const openOrder = useCallback(
    (id: string) => {
      router.push({ pathname: '/(app)/(customer)/orders/[id]', params: { id } });
    },
    [router]
  );

  return (
    <Screen scroll>
      <Header title="Orders" subtitle="Your recent purchases." />

      <View style={{ marginTop: theme.spacing.lg, gap: theme.spacing.lg }}>
        {isLoading ? (
          <Card style={{ gap: theme.spacing.sm }}>
            <ActivityIndicator color={theme.colors.primary} />
            <Text style={{ color: theme.colors.placeholder, fontWeight: '700' }}>Loading orders…</Text>
          </Card>
        ) : error ? (
          <Card style={{ gap: theme.spacing.sm }}>
            <Text style={{ color: theme.colors.foreground, fontWeight: '900', fontSize: theme.typography.subtitle }}>
              Couldn't load orders
            </Text>
            <Text style={{ color: theme.colors.placeholder, fontWeight: '600' }}>{getApiErrorMessage(error)}</Text>
            <Button label="Retry" onPress={() => refetch()} loading={isFetching} />
          </Card>
        ) : items.length === 0 ? (
          <Card style={{ gap: theme.spacing.sm }}>
            <Text style={{ color: theme.colors.foreground, fontWeight: '900', fontSize: theme.typography.subtitle }}>
              No orders yet
            </Text>
            <Text style={{ color: theme.colors.placeholder, fontWeight: '600' }}>
              When you place an order, it will appear here.
            </Text>
            <Button label="Browse products" onPress={() => router.push('/(app)/(customer)/products')} />
          </Card>
        ) : (
          <View style={{ gap: theme.spacing.md }}>
            {items.map((o) => (
              <Pressable
                key={o.orderId}
                onPress={() => openOrder(o.orderId)}
                style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1 })}
              >
                <Card style={{ gap: theme.spacing.sm }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ color: theme.colors.foreground, fontWeight: '900' }} numberOfLines={1}>
                      Order
                    </Text>
                    <Text style={{ color: theme.colors.primary, fontWeight: '900' }}>{o.status}</Text>
                  </View>

                  <Text style={{ color: theme.colors.placeholder, fontWeight: '700', fontSize: theme.typography.small }}>
                    {formatDateTime(o.createdAt)} · {formatMoney(o.subtotal, currency)}
                  </Text>

                  <Text style={{ color: theme.colors.placeholder, fontWeight: '700', fontSize: theme.typography.small }}>
                    {o.orderId}
                  </Text>
                </Card>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </Screen>
  );
}

