import React, { useEffect, useMemo } from 'react';
import { Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { cartApi } from '../../../../src/api/cartApi';
import { orderApi } from '../../../../src/api/orderApi';
import { paymentApi } from '../../../../src/api/paymentApi';
import { Header } from '../../../../src/components/layout/Header';
import { Screen } from '../../../../src/components/layout/Screen';
import { Button } from '../../../../src/components/ui/Button';
import { Card } from '../../../../src/components/ui/Card';
import { useTheme } from '../../../../src/providers/ThemeProvider';
import { useAppDispatch } from '../../../../src/store/hooks';

function singleParam(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  const trimmed = v?.trim();
  return trimmed ? trimmed : undefined;
}

export default function PaymentSuccessScreen() {
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { orderId: rawOrderId } = useLocalSearchParams<{ orderId?: string | string[] }>();
  const orderId = singleParam(rawOrderId);

  useEffect(() => {
    // Ensure cart badge/orders refresh ASAP
    dispatch(cartApi.util.invalidateTags([{ type: 'Cart', id: 'CURRENT' }]));
    dispatch(orderApi.util.invalidateTags([{ type: 'Orders', id: 'LIST' }]));
    if (orderId) dispatch(paymentApi.util.invalidateTags([{ type: 'Payment', id: orderId }]));
  }, [dispatch, orderId]);

  const subtitle = useMemo(() => {
    return orderId ? 'Your order has been placed.' : 'Your order has been placed.';
  }, [orderId]);

  return (
    <Screen scroll>
      <Header title="Success" subtitle={subtitle} canGoBack />

      <View style={{ marginTop: theme.spacing.lg, gap: theme.spacing.lg }}>
        <Card style={{ gap: theme.spacing.sm, alignItems: 'center', paddingVertical: theme.spacing.lg }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 999,
              backgroundColor: 'rgba(37, 99, 235, 0.16)',
              borderWidth: 1,
              borderColor: 'rgba(37, 99, 235, 0.30)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Feather name="check" size={28} color={theme.colors.primary} />
          </View>

          <Text style={{ marginTop: theme.spacing.sm, color: theme.colors.foreground, fontWeight: '900', fontSize: 20 }}>
            Payment successful
          </Text>
          {orderId ? (
            <Text style={{ color: theme.colors.placeholder, fontWeight: '700' }}>Order ID: {orderId}</Text>
          ) : null}
        </Card>

        <Button
          label="View order"
          onPress={() => {
            if (!orderId) return;
            router.push(`/(app)/(customer)/orders/${encodeURIComponent(orderId)}`);
          }}
          disabled={!orderId}
        />
        <Button label="Continue shopping" variant="outline" onPress={() => router.replace('/(app)/(customer)/(tabs)/home')} />
      </View>
    </Screen>
  );
}
