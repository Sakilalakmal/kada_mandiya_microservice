import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useGetCartQuery } from '../../../src/api/cartApi';
import { useCreateOrderMutation } from '../../../src/api/orderApi';
import { Header } from '../../../src/components/layout/Header';
import { Screen } from '../../../src/components/layout/Screen';
import { Button } from '../../../src/components/ui/Button';
import { Card } from '../../../src/components/ui/Card';
import { Input } from '../../../src/components/ui/Input';
import { useTheme } from '../../../src/providers/ThemeProvider';
import type { PaymentMethod } from '../../../src/types/order.types';
import { getApiErrorMessage } from '../../../src/utils/apiError';
import { formatMoney } from '../../../src/utils/money';

type MethodOption = {
  key: PaymentMethod;
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof Feather>['name'];
};

const METHODS: MethodOption[] = [
  { key: 'ONLINE', title: 'Card (Stripe)', subtitle: 'Pay securely online', icon: 'credit-card' },
  { key: 'COD', title: 'Cash on delivery', subtitle: 'Pay when it arrives', icon: 'truck' },
];

function totalItems(items: { qty: number }[]) {
  return items.reduce((sum, item) => sum + Math.max(0, Math.floor(Number(item.qty ?? 0))), 0);
}

export default function CustomerCheckoutScreen() {
  const { theme } = useTheme();
  const router = useRouter();

  const { data: cart, isFetching: cartFetching } = useGetCartQuery(undefined, {
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });
  const items = useMemo(() => cart?.items ?? [], [cart?.items]);
  const itemCount = useMemo(() => totalItems(items), [items]);
  const subtotal = cart?.subtotal ?? 0;
  const currency = 'LKR';

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('COD');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [mobile, setMobile] = useState('');

  const [createOrder, createState] = useCreateOrderMutation();

  const addressValid = deliveryAddress.trim().length >= 5;
  const cartEmpty = itemCount === 0;

  const submit = useCallback(async () => {
    if (cartEmpty) {
      Alert.alert('Cart is empty', 'Add at least one item before checking out.');
      return;
    }
    if (!addressValid) {
      Alert.alert('Delivery address required', 'Please enter a valid delivery address.');
      return;
    }

    try {
      const res = await createOrder({
        deliveryAddress: deliveryAddress.trim(),
        mobile: mobile.trim() ? mobile.trim() : undefined,
        paymentMethod,
      }).unwrap();

      if (paymentMethod === 'COD') {
        router.replace({ pathname: '/(app)/(customer)/payment/success', params: { orderId: res.orderId, method: 'COD' } });
        return;
      }

      router.replace({ pathname: '/(app)/(customer)/payment/pending', params: { orderId: res.orderId } });
    } catch (e) {
      Alert.alert('Checkout failed', getApiErrorMessage(e));
    }
  }, [addressValid, cartEmpty, createOrder, deliveryAddress, mobile, paymentMethod, router]);

  const primaryLabel = paymentMethod === 'ONLINE' ? 'Pay & place order' : 'Place order';
  const primaryDisabled = cartEmpty || !addressValid || createState.isLoading;

  return (
    <Screen scroll keyboardAvoiding>
      <Header title="Checkout" subtitle="Confirm details and place your order." canGoBack />

      <View style={{ marginTop: theme.spacing.lg, gap: theme.spacing.lg }}>
        {cartEmpty ? (
          <Card style={{ gap: theme.spacing.sm }}>
            <Text style={{ color: theme.colors.foreground, fontWeight: '900', fontSize: theme.typography.subtitle }}>
              Your cart is empty
            </Text>
            <Text style={{ color: theme.colors.placeholder, fontWeight: '600' }}>
              Browse products and add items to continue.
            </Text>
            <Button label="Browse products" onPress={() => router.push('/(app)/(customer)/products')} />
          </Card>
        ) : null}

        <Card style={{ gap: theme.spacing.sm }}>
          <Text style={{ color: theme.colors.foreground, fontWeight: '900', fontSize: theme.typography.subtitle }}>
            Delivery address
          </Text>
          <Input
            label={undefined}
            placeholder="Street, city, and any delivery notes"
            value={deliveryAddress}
            onChangeText={setDeliveryAddress}
            multiline
            numberOfLines={4}
          />
          <Input
            label={undefined}
            placeholder="Mobile (optional)"
            value={mobile}
            onChangeText={setMobile}
            keyboardType="phone-pad"
            autoComplete="tel"
            textContentType="telephoneNumber"
            leadingIcon={<Feather name="phone" size={18} color={theme.colors.placeholder} />}
          />
          {!addressValid ? (
            <Text style={{ color: theme.colors.danger, fontWeight: '700' }}>
              Please enter a valid address (at least 5 characters).
            </Text>
          ) : null}
        </Card>

        <Card style={{ gap: theme.spacing.sm }}>
          <Text style={{ color: theme.colors.foreground, fontWeight: '900', fontSize: theme.typography.subtitle }}>
            Order summary
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: theme.colors.placeholder, fontWeight: '700' }}>Items</Text>
            <Text style={{ color: theme.colors.foreground, fontWeight: '900' }}>
              {itemCount}
              {cartFetching ? ' …' : ''}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: theme.colors.placeholder, fontWeight: '700' }}>Subtotal</Text>
            <Text style={{ color: theme.colors.foreground, fontWeight: '900' }}>
              {formatMoney(subtotal, currency)}
            </Text>
          </View>
        </Card>

        <Card style={{ gap: theme.spacing.sm }}>
          <Text style={{ color: theme.colors.foreground, fontWeight: '900', fontSize: theme.typography.subtitle }}>
            Payment method
          </Text>

          <View style={{ gap: theme.spacing.sm }}>
            {METHODS.map((m) => {
              const selected = paymentMethod === m.key;
              return (
                <Pressable
                  key={m.key}
                  onPress={() => setPaymentMethod(m.key)}
                  style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1 })}
                >
                  <View
                    style={{
                      borderWidth: 1,
                      borderColor: selected ? theme.colors.primary : theme.colors.border,
                      backgroundColor: theme.colors.background,
                      borderRadius: theme.radius.md,
                      padding: theme.spacing.md,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: theme.spacing.md,
                    }}
                  >
                    <View
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: theme.colors.muted,
                      }}
                    >
                      <Feather name={m.icon} size={18} color={theme.colors.foreground} />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={{ color: theme.colors.foreground, fontWeight: '900' }}>{m.title}</Text>
                      <Text style={{ marginTop: 4, color: theme.colors.placeholder, fontWeight: '600' }}>
                        {m.subtitle}
                      </Text>
                    </View>

                    <View
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 999,
                        borderWidth: 2,
                        borderColor: selected ? theme.colors.primary : theme.colors.border,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {selected ? (
                        <View
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 999,
                            backgroundColor: theme.colors.primary,
                          }}
                        />
                      ) : null}
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </Card>

        <Button label={primaryLabel} onPress={submit} loading={createState.isLoading} disabled={primaryDisabled} />

        {paymentMethod === 'ONLINE' ? (
          <Text style={{ color: theme.colors.placeholder, fontWeight: '600', textAlign: 'center' }}>
            Card payments open Stripe Checkout in your browser and return here to confirm status.
          </Text>
        ) : null}
      </View>
    </Screen>
  );
}
