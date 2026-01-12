import React, { useEffect, useMemo } from 'react';
import { Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

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

export default function PaymentFailedScreen() {
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { orderId: rawOrderId } = useLocalSearchParams<{ orderId?: string | string[] }>();
  const orderId = singleParam(rawOrderId);

  useEffect(() => {
    dispatch(orderApi.util.invalidateTags([{ type: 'Orders', id: 'LIST' }]));
    if (orderId) dispatch(paymentApi.util.invalidateTags([{ type: 'Payment', id: orderId }]));
  }, [dispatch, orderId]);

  const subtitle = useMemo(() => {
    return 'Payment failed or was cancelled.';
  }, []);

  return (
    <Screen scroll>
      <Header title="Payment failed" subtitle={subtitle} canGoBack />

      <View style={{ marginTop: theme.spacing.lg, gap: theme.spacing.lg }}>
        <Card style={{ gap: theme.spacing.sm, alignItems: 'center', paddingVertical: theme.spacing.lg }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 999,
              backgroundColor: theme.colors.muted,
              borderWidth: 1,
              borderColor: theme.colors.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Feather name="x" size={28} color={theme.colors.placeholder} />
          </View>

          <Text style={{ marginTop: theme.spacing.sm, color: theme.colors.foreground, fontWeight: '900', fontSize: 20 }}>
            Payment not completed
          </Text>
          <Text style={{ color: theme.colors.placeholder, fontWeight: '700', textAlign: 'center' }}>
            You can try again with the same order.
          </Text>
          {orderId ? (
            <Text style={{ color: theme.colors.placeholder, fontWeight: '700' }}>Order ID: {orderId}</Text>
          ) : null}
        </Card>

        <Button
          label="Try again"
          onPress={() => {
            if (!orderId) return;
            router.replace({ pathname: '/(app)/(customer)/payment/pending', params: { orderId } });
          }}
          disabled={!orderId}
        />
        <Button label="Back to checkout" variant="outline" onPress={() => router.replace('/(app)/(customer)/checkout')} />
      </View>
    </Screen>
  );
}
