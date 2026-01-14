import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { useGetVendorOrderByIdQuery, useUpdateVendorOrderStatusMutation } from '../../../../src/api/orderApi';
import { Header } from '../../../../src/components/layout/Header';
import { Screen } from '../../../../src/components/layout/Screen';
import { OrderStatusBadge } from '../../../../src/components/orders/OrderStatusBadge';
import { StatusPill } from '../../../../src/components/orders/StatusPill';
import { Button } from '../../../../src/components/ui/Button';
import { Card } from '../../../../src/components/ui/Card';
import { Toast } from '../../../../src/components/ui/Toast';
import { useTheme } from '../../../../src/providers/ThemeProvider';
import { getOrderStatusBadgeMeta, type VendorUpdatableOrderStatus } from '../../../../src/types/order.types';
import { getApiErrorMessage } from '../../../../src/utils/apiError';
import { formatDateTime } from '../../../../src/utils/format';
import { formatMoney } from '../../../../src/utils/money';
import { getNextVendorOrderStatuses } from '../../../../src/utils/orderStatus';

function singleParam(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  const trimmed = v?.trim();
  return trimmed ? trimmed : undefined;
}

export default function VendorOrderDetailsScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { id: rawId } = useLocalSearchParams<{ id?: string | string[] }>();
  const orderId = singleParam(rawId);

  const { data: order, isLoading, isFetching, error, refetch } = useGetVendorOrderByIdQuery(orderId ?? '', {
    skip: !orderId,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  const [updateStatus, updateState] = useUpdateVendorOrderStatusMutation();
  const [toast, setToast] = useState<{ visible: boolean; message: string }>({ visible: false, message: '' });

  const currency = 'LKR';

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

  const paidPill = useMemo(() => {
    const accent = theme.colors.primary;
    const backgroundColor = theme.scheme === 'dark' ? 'rgba(37, 99, 235, 0.22)' : 'rgba(37, 99, 235, 0.12)';
    const borderColor = theme.scheme === 'dark' ? 'rgba(37, 99, 235, 0.42)' : 'rgba(37, 99, 235, 0.24)';
    return { accent, backgroundColor, borderColor };
  }, [theme.colors.primary, theme.scheme]);

  const nextStatuses = useMemo(() => (order ? getNextVendorOrderStatuses(order.status) : []), [order]);

  const onUpdateStatus = useCallback(
    (nextStatus: VendorUpdatableOrderStatus) => {
      if (!orderId) return;
      const nextLabel = getOrderStatusBadgeMeta(nextStatus).label;
      Alert.alert('Update order status?', `Mark this order as ${nextLabel}?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: async () => {
            try {
              await updateStatus({ orderId, status: nextStatus }).unwrap();
              setToast({ visible: true, message: `Status updated: ${nextLabel}` });
              setTimeout(() => setToast({ visible: false, message: '' }), 2200);
            } catch (e) {
              Alert.alert('Could not update status', getApiErrorMessage(e));
            }
          },
        },
      ]);
    },
    [orderId, updateStatus]
  );

  return (
    <Screen scroll>
      <Header title="Order details" subtitle={orderId ? `Order ID: ${orderId}` : 'Missing order id.'} canGoBack right={headerRight} />

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
              <View style={styles.row}>
                <Text style={{ color: theme.colors.placeholder, fontWeight: '700' }}>Status</Text>
                <OrderStatusBadge status={order.status} />
              </View>

              <View style={styles.row}>
                <Text style={{ color: theme.colors.placeholder, fontWeight: '700' }}>Payment</Text>
                <StatusPill label="Paid" accent={paidPill.accent} backgroundColor={paidPill.backgroundColor} borderColor={paidPill.borderColor} />
              </View>

              <Text style={{ color: theme.colors.placeholder, fontWeight: '700' }}>
                Placed {formatDateTime(order.createdAt)}
              </Text>
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
                      key={`${item.productId}-${item.title}`}
                      style={[
                        styles.itemRow,
                        {
                          borderColor: theme.colors.border,
                          borderRadius: theme.radius.md,
                          backgroundColor: theme.colors.background,
                          padding: theme.spacing.md,
                        },
                      ]}
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

            <Card style={{ gap: theme.spacing.sm }}>
              <Text style={{ color: theme.colors.foreground, fontWeight: '900', fontSize: theme.typography.subtitle }}>
                Totals
              </Text>
              <View style={styles.row}>
                <Text style={{ color: theme.colors.placeholder, fontWeight: '700' }}>Vendor total</Text>
                <Text style={{ color: theme.colors.foreground, fontWeight: '900' }}>{formatMoney(order.vendorSubtotal, currency)}</Text>
              </View>
            </Card>

            <Card style={{ gap: theme.spacing.sm }}>
              <Text style={{ color: theme.colors.foreground, fontWeight: '900', fontSize: theme.typography.subtitle }}>
                Shipping address
              </Text>
              <Text style={{ color: theme.colors.placeholder, fontWeight: '600' }}>
                {order.deliveryAddress?.trim() ? order.deliveryAddress.trim() : 'Not available for vendor view.'}
              </Text>
            </Card>

            <Card style={{ gap: theme.spacing.sm }}>
              <Text style={{ color: theme.colors.foreground, fontWeight: '900', fontSize: theme.typography.subtitle }}>
                Update status
              </Text>
              <Text style={{ color: theme.colors.placeholder, fontWeight: '600' }}>
                Choose the next step for this order.
              </Text>

              {nextStatuses.length ? (
                nextStatuses.map((s) => {
                  const label = getOrderStatusBadgeMeta(s).label;
                  return (
                    <Button
                      key={s}
                      label={updateState.isLoading ? 'Updating…' : `Mark as ${label}`}
                      onPress={() => onUpdateStatus(s)}
                      disabled={updateState.isLoading}
                    />
                  );
                })
              ) : (
                <Text style={{ color: theme.colors.placeholder, fontWeight: '700' }}>
                  No further updates available for this status.
                </Text>
              )}
            </Card>
          </>
        )}
      </View>

      <Toast visible={toast.visible} message={toast.message} onDismiss={() => setToast({ visible: false, message: '' })} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemRow: { borderWidth: 1, flexDirection: 'row', gap: 16 },
});

