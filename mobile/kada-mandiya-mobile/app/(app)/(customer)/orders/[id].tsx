import React, { useMemo } from 'react';
import { ActivityIndicator, Image, Pressable, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { useGetOrderByIdQuery } from '../../../../src/api/orderApi';
import { useGetPaymentByOrderIdQuery } from '../../../../src/api/paymentApi';
import { Header } from '../../../../src/components/layout/Header';
import { Screen } from '../../../../src/components/layout/Screen';
import { Button } from '../../../../src/components/ui/Button';
import { Card } from '../../../../src/components/ui/Card';
import { useTheme } from '../../../../src/providers/ThemeProvider';
import { getApiErrorMessage } from '../../../../src/utils/apiError';
import { formatDateTime } from '../../../../src/utils/format';
import { formatMoney } from '../../../../src/utils/money';

function singleParam(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  const trimmed = v?.trim();
  return trimmed ? trimmed : undefined;
}

export default function CustomerOrderDetailsScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { id: rawId } = useLocalSearchParams<{ id?: string | string[] }>();
  const orderId = singleParam(rawId);

  const { data: order, isLoading, isFetching, error, refetch } = useGetOrderByIdQuery(orderId ?? '', {
    skip: !orderId,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  const { data: payment } = useGetPaymentByOrderIdQuery(orderId ?? '', { skip: !orderId });

  const title = useMemo(() => (orderId ? 'Order' : 'Order'), [orderId]);
  const currency = 'LKR';

  return (
    <Screen scroll>
      <Header title={title} subtitle={orderId ? `Order ID: ${orderId}` : 'Missing order id.'} canGoBack />

      <View style={{ marginTop: theme.spacing.lg, gap: theme.spacing.lg }}>
        {!orderId ? (
          <Card style={{ gap: theme.spacing.sm }}>
            <Text style={{ color: theme.colors.foreground, fontWeight: '900', fontSize: theme.typography.subtitle }}>
              Missing order id
            </Text>
            <Button label="Back" variant="outline" onPress={() => router.back()} />
          </Card>
        ) : isLoading ? (
          <Card style={{ gap: theme.spacing.sm }}>
            <ActivityIndicator color={theme.colors.primary} />
            <Text style={{ color: theme.colors.placeholder, fontWeight: '700' }}>Loading order…</Text>
          </Card>
        ) : error ? (
          <Card style={{ gap: theme.spacing.sm }}>
            <Text style={{ color: theme.colors.foreground, fontWeight: '900', fontSize: theme.typography.subtitle }}>
              Couldn't load order
            </Text>
            <Text style={{ color: theme.colors.placeholder, fontWeight: '600' }}>{getApiErrorMessage(error)}</Text>
            <Button label="Retry" onPress={() => refetch()} loading={isFetching} />
          </Card>
        ) : !order ? (
          <Card style={{ gap: theme.spacing.sm }}>
            <Text style={{ color: theme.colors.foreground, fontWeight: '900', fontSize: theme.typography.subtitle }}>
              Order not found
            </Text>
          </Card>
        ) : (
          <>
            <Card style={{ gap: theme.spacing.sm }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: theme.colors.placeholder, fontWeight: '700' }}>Status</Text>
                <Text style={{ color: theme.colors.foreground, fontWeight: '900' }}>{order.status}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: theme.colors.placeholder, fontWeight: '700' }}>Payment</Text>
                <Text style={{ color: theme.colors.foreground, fontWeight: '900' }}>
                  {payment?.status ?? order.paymentMethod}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: theme.colors.placeholder, fontWeight: '700' }}>Subtotal</Text>
                <Text style={{ color: theme.colors.foreground, fontWeight: '900' }}>
                  {formatMoney(order.subtotal, currency)}
                </Text>
              </View>
              <Text style={{ color: theme.colors.placeholder, fontWeight: '700' }}>
                Placed {formatDateTime(order.createdAt)}
              </Text>
            </Card>

            <Card style={{ gap: theme.spacing.sm }}>
              <Text style={{ color: theme.colors.foreground, fontWeight: '900', fontSize: theme.typography.subtitle }}>
                Delivery
              </Text>
              <Text style={{ color: theme.colors.placeholder, fontWeight: '600' }}>{order.deliveryAddress}</Text>
              {order.mobile ? (
                <Text style={{ color: theme.colors.placeholder, fontWeight: '700' }}>Mobile: {order.mobile}</Text>
              ) : null}
            </Card>

            <Card style={{ gap: theme.spacing.sm }}>
              <Text style={{ color: theme.colors.foreground, fontWeight: '900', fontSize: theme.typography.subtitle }}>
                Items
              </Text>
              <View style={{ gap: theme.spacing.sm }}>
                {order.items.map((item) => {
                  const imageUrl = item.imageUrl?.trim() ? item.imageUrl.trim() : null;
                  return (
                    <View
                      key={item.itemId}
                      style={{
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                        borderRadius: theme.radius.md,
                        backgroundColor: theme.colors.background,
                        padding: theme.spacing.md,
                        flexDirection: 'row',
                        gap: theme.spacing.md,
                      }}
                    >
                      <View
                        style={{
                          width: 56,
                          height: 56,
                          borderRadius: theme.radius.md,
                          borderWidth: 1,
                          borderColor: theme.colors.border,
                          backgroundColor: theme.colors.muted,
                          overflow: 'hidden',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {imageUrl ? (
                          <Image source={{ uri: imageUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                        ) : (
                          <Feather name="image" size={16} color={theme.colors.placeholder} />
                        )}
                      </View>

                      <View style={{ flex: 1, gap: 6 }}>
                        <Text style={{ color: theme.colors.foreground, fontWeight: '900' }} numberOfLines={2}>
                          {item.title}
                        </Text>
                        <Text style={{ color: theme.colors.placeholder, fontWeight: '700' }}>
                          {item.qty} × {formatMoney(item.unitPrice, currency)}
                        </Text>
                      </View>

                      <Text style={{ color: theme.colors.foreground, fontWeight: '900' }}>
                        {formatMoney(item.lineTotal, currency)}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </Card>

            {payment?.status === 'PENDING' ? (
              <Card style={{ gap: theme.spacing.sm }}>
                <Text style={{ color: theme.colors.foreground, fontWeight: '900' }}>Payment pending</Text>
                <Text style={{ color: theme.colors.placeholder, fontWeight: '600' }}>
                  Complete payment to proceed.
                </Text>
                <Button
                  label="Continue payment"
                  onPress={() => router.push({ pathname: '/(app)/(customer)/payment/pending', params: { orderId } })}
                />
              </Card>
            ) : null}

            <Pressable
              onPress={() => router.push('/(app)/(customer)/(tabs)/orders')}
              style={({ pressed }) => ({ opacity: pressed ? 0.86 : 1 })}
            >
              <Text style={{ color: theme.colors.primary, fontWeight: '900' }}>Back to orders</Text>
            </Pressable>
          </>
        )}
      </View>
    </Screen>
  );
}

