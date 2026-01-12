import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';

import { useCreateCheckoutSessionMutation, useGetPaymentByOrderIdQuery } from '../../../../src/api/paymentApi';
import { Header } from '../../../../src/components/layout/Header';
import { Screen } from '../../../../src/components/layout/Screen';
import { Button } from '../../../../src/components/ui/Button';
import { Card } from '../../../../src/components/ui/Card';
import { useTheme } from '../../../../src/providers/ThemeProvider';
import type { PaymentStatus } from '../../../../src/types/payment.types';
import { getApiErrorMessage } from '../../../../src/utils/apiError';

function singleParam(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  const trimmed = v?.trim();
  return trimmed ? trimmed : undefined;
}

function isTerminal(status: PaymentStatus) {
  return status === 'COMPLETED' || status === 'FAILED' || status === 'CANCELLED' || status === 'NOT_REQUIRED';
}

export default function PaymentPendingScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { orderId: rawOrderId } = useLocalSearchParams<{ orderId?: string | string[] }>();
  const orderId = singleParam(rawOrderId);

  const [createSession, sessionState] = useCreateCheckoutSessionMutation();
  const autoStarted = useRef(false);
  const [lastUrl, setLastUrl] = useState<string | null>(null);
  const [sessionAttempts, setSessionAttempts] = useState(0);
  const attemptsRef = useRef(0);

  const {
    data: payment,
    error: paymentError,
    isFetching: paymentFetching,
    refetch: refetchPayment,
  } = useGetPaymentByOrderIdQuery(orderId ?? '', {
    skip: !orderId,
    pollingInterval: 3500,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  const status = payment?.status;

  const getErrorStatus = useCallback((e: unknown): number | null => {
    const fbq = e as FetchBaseQueryError | undefined;
    if (fbq && typeof fbq === 'object' && 'status' in fbq) {
      const s = (fbq as any).status;
      return typeof s === 'number' ? s : null;
    }
    return null;
  }, []);

  useEffect(() => {
    if (!orderId) return;
    if (!status) return;

    if (status === 'COMPLETED' || status === 'NOT_REQUIRED') {
      router.replace({ pathname: '/(app)/(customer)/payment/success', params: { orderId } });
      return;
    }

    if (status === 'FAILED' || status === 'CANCELLED') {
      router.replace({ pathname: '/(app)/(customer)/payment/failed', params: { orderId } });
    }
  }, [orderId, router, status]);

  const openCheckout = useCallback(
    async (url: string) => {
      try {
        await WebBrowser.openBrowserAsync(url, { showTitle: true, enableBarCollapsing: true });
      } catch (e) {
        Alert.alert('Could not open payment page', getApiErrorMessage(e));
      }
    },
    []
  );

  const payNow = useCallback(async (opts?: { silent?: boolean }) => {
    if (!orderId) return;
    try {
      const res = await createSession({ orderId }).unwrap();
      setLastUrl(res.url);
      await openCheckout(res.url);
    } catch (e) {
      const statusCode = getErrorStatus(e);
      const msg = getApiErrorMessage(e);

      // payment-service creates the Payment row asynchronously from the order.created event
      if (statusCode === 404 || /payment not found/i.test(msg)) {
        if (attemptsRef.current < 8) {
          attemptsRef.current += 1;
          setSessionAttempts(attemptsRef.current);
          setTimeout(() => {
            payNow({ silent: true });
          }, 1200);
          return;
        }
        setTimeout(() => {
          payNow({ silent: true });
        }, 1200);
        return;
      }

      if (!opts?.silent) Alert.alert('Could not start payment', msg);
    }
  }, [createSession, getErrorStatus, openCheckout, orderId]);

  useEffect(() => {
    if (autoStarted.current) return;
    autoStarted.current = true;
    payNow({ silent: true });
  }, [payNow]);

  const title = useMemo(() => {
    if (!orderId) return 'Payment';
    if (status === 'PENDING') return 'Waiting for payment';
    if (status) return 'Payment';
    return 'Preparing payment';
  }, [orderId, status]);

  const subtitle = useMemo(() => {
    if (!orderId) return 'Missing order id.';
    if (status === 'PENDING') return 'Complete payment in the browser, then come back.';
    if (!status) return 'Setting up your payment…';
    return 'Checking payment status…';
  }, [orderId, status]);

  const showStatusText = useMemo(() => {
    if (!orderId) return 'Order ID missing.';
    if (status) return `Status: ${status}`;
    if (paymentError) return 'Waiting for payment to be created…';
    return sessionAttempts > 0 ? `Preparing payment… (attempt ${sessionAttempts + 1}/9)` : 'Preparing payment…';
  }, [orderId, paymentError, sessionAttempts, status]);

  const busy = sessionState.isLoading || paymentFetching;

  return (
    <Screen scroll>
      <Header title={title} subtitle={subtitle} canGoBack />

      <View style={{ marginTop: theme.spacing.lg, gap: theme.spacing.lg }}>
        <Card style={{ gap: theme.spacing.sm }}>
          <Text style={{ color: theme.colors.placeholder, fontWeight: '800' }}>{showStatusText}</Text>
          {orderId ? (
            <Text style={{ color: theme.colors.placeholder, fontWeight: '700', fontSize: theme.typography.small }}>
              Order ID: {orderId}
            </Text>
          ) : null}

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
            <ActivityIndicator color={theme.colors.primary} />
            <Text style={{ color: theme.colors.foreground, fontWeight: '800' }}>Auto-checking…</Text>
          </View>
        </Card>

        <Card style={{ gap: theme.spacing.sm }}>
          <Text style={{ color: theme.colors.foreground, fontWeight: '900', fontSize: theme.typography.subtitle }}>
            Actions
          </Text>

          <Button
            label="Open payment page"
            onPress={() => payNow()}
            loading={sessionState.isLoading}
            disabled={!orderId || busy}
          />
          <Button label="Check status now" variant="outline" onPress={() => refetchPayment()} disabled={!orderId || busy} />

          {lastUrl ? (
            <Pressable onPress={() => openCheckout(lastUrl)} style={({ pressed }) => ({ opacity: pressed ? 0.86 : 1 })}>
              <Text style={{ color: theme.colors.primary, fontWeight: '900' }}>Re-open last payment link</Text>
            </Pressable>
          ) : null}
        </Card>

        {paymentError ? (
          <Card style={{ gap: theme.spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
              <Feather name="info" size={18} color={theme.colors.placeholder} />
              <Text style={{ color: theme.colors.placeholder, fontWeight: '700' }}>
                Payment may take a moment to appear after order creation.
              </Text>
            </View>
          </Card>
        ) : null}

        {status && isTerminal(status) ? (
          <Card style={{ gap: theme.spacing.sm }}>
            <Text style={{ color: theme.colors.foreground, fontWeight: '900' }}>
              Status: {status}
            </Text>
            <Button
              label="Continue"
              onPress={() => {
                if (!orderId) return;
                if (status === 'COMPLETED' || status === 'NOT_REQUIRED') {
                  router.replace({ pathname: '/(app)/(customer)/payment/success', params: { orderId } });
                } else {
                  router.replace({ pathname: '/(app)/(customer)/payment/failed', params: { orderId } });
                }
              }}
            />
          </Card>
        ) : null}
      </View>
    </Screen>
  );
}
