import React, { useCallback, useMemo } from 'react';
import { Alert, ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { useClearCartMutation, useGetCartQuery, useRemoveCartItemMutation, useUpdateCartItemMutation } from '../../../../src/api/cartApi';
import { CartItemCard } from '../../../../src/components/cart/CartItemCard';
import { Header } from '../../../../src/components/layout/Header';
import { Screen } from '../../../../src/components/layout/Screen';
import { Button } from '../../../../src/components/ui/Button';
import { Card } from '../../../../src/components/ui/Card';
import { useTheme } from '../../../../src/providers/ThemeProvider';
import type { CartItem } from '../../../../src/types/cart.types';
import { getApiErrorMessage } from '../../../../src/utils/apiError';
import { formatMoney } from '../../../../src/utils/money';

function totalItems(items: CartItem[]) {
  return items.reduce((sum, item) => sum + Math.max(0, Math.floor(Number(item.qty ?? 0))), 0);
}

export default function CustomerCartScreen() {
  const { theme } = useTheme();
  const router = useRouter();

  const { data: cart, isLoading, isFetching, error, refetch } = useGetCartQuery(undefined, {
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  const [updateCartItem, updateState] = useUpdateCartItemMutation();
  const [removeCartItem, removeState] = useRemoveCartItemMutation();
  const [clearCart, clearState] = useClearCartMutation();

  const items = useMemo(() => cart?.items ?? [], [cart?.items]);
  const count = useMemo(() => totalItems(items), [items]);
  const subtotal = cart?.subtotal ?? 0;
  const currency = 'LKR';

  const busy = isFetching || updateState.isLoading || removeState.isLoading || clearState.isLoading;

  const onIncrease = useCallback(
    async (itemId: string, nextQty: number) => {
      try {
        await updateCartItem({ itemId, qty: nextQty }).unwrap();
      } catch (e) {
        Alert.alert('Could not update quantity', getApiErrorMessage(e));
      }
    },
    [updateCartItem]
  );

  const onDecrease = useCallback(
    async (itemId: string, nextQty: number) => {
      try {
        await updateCartItem({ itemId, qty: nextQty }).unwrap();
      } catch (e) {
        Alert.alert('Could not update quantity', getApiErrorMessage(e));
      }
    },
    [updateCartItem]
  );

  const onRemove = useCallback(
    async (itemId: string) => {
      try {
        await removeCartItem({ itemId }).unwrap();
      } catch (e) {
        Alert.alert('Could not remove item', getApiErrorMessage(e));
      }
    },
    [removeCartItem]
  );

  const onClear = useCallback(() => {
    if (!items.length) return;
    Alert.alert('Clear cart?', 'Remove all items from your cart?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          try {
            await clearCart().unwrap();
          } catch (e) {
            Alert.alert('Could not clear cart', getApiErrorMessage(e));
          }
        },
      },
    ]);
  }, [clearCart, items.length]);

  const headerRight = useMemo(() => {
    return (
      <Pressable onPress={onClear} disabled={!items.length || busy} style={({ pressed }) => ({ opacity: pressed ? 0.86 : busy ? 0.5 : 1 })}>
        <Text style={{ color: theme.colors.primary, fontWeight: '900' }}>Clear</Text>
      </Pressable>
    );
  }, [busy, items.length, onClear, theme.colors.primary]);

  const keyExtractor = useCallback((item: CartItem) => item.itemId, []);

  const renderItem = useCallback(
    ({ item }: { item: CartItem }) => (
      <View style={{ marginBottom: theme.spacing.md }}>
        <CartItemCard item={item} currency={currency} onIncrease={onIncrease} onDecrease={onDecrease} onRemove={onRemove} />
      </View>
    ),
    [currency, onDecrease, onIncrease, onRemove, theme.spacing.md]
  );

  return (
    <Screen style={{ paddingBottom: theme.spacing.lg }}>
      <Header title="Cart" subtitle="Review and update your items." right={headerRight} />

      <View style={{ flex: 1, marginTop: theme.spacing.lg }}>
        {isLoading ? (
          <View style={{ gap: theme.spacing.md }}>
            <ActivityIndicator color={theme.colors.primary} />
            <Card>
              <View style={{ height: 96 }} />
            </Card>
            <Card>
              <View style={{ height: 96 }} />
            </Card>
          </View>
        ) : error ? (
          <Card style={{ gap: theme.spacing.sm }}>
            <Text style={{ color: theme.colors.foreground, fontWeight: '900', fontSize: theme.typography.subtitle }}>
              Couldn't load cart
            </Text>
            <Text style={{ color: theme.colors.placeholder, fontWeight: '600' }}>{getApiErrorMessage(error)}</Text>
            <Button label="Retry" onPress={() => refetch()} loading={isFetching} />
          </Card>
        ) : items.length === 0 ? (
          <Card style={{ gap: theme.spacing.sm }}>
            <Text style={{ color: theme.colors.foreground, fontWeight: '900', fontSize: theme.typography.subtitle }}>
              Your cart is empty
            </Text>
            <Text style={{ color: theme.colors.placeholder, fontWeight: '600' }}>
              Browse products and add what you like.
            </Text>
            <Button label="Browse products" onPress={() => router.push('/(app)/(customer)/products')} />
          </Card>
        ) : (
          <>
            <FlatList
              data={items}
              keyExtractor={keyExtractor}
              renderItem={renderItem}
              showsVerticalScrollIndicator={false}
              refreshing={isFetching}
              onRefresh={() => refetch()}
              contentContainerStyle={{ paddingBottom: theme.spacing.lg }}
            />

            <Card style={{ gap: theme.spacing.sm }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: theme.colors.placeholder, fontWeight: '700' }}>Total items</Text>
                <Text style={{ color: theme.colors.foreground, fontWeight: '900' }}>{count}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: theme.colors.placeholder, fontWeight: '700' }}>Subtotal</Text>
                <Text style={{ color: theme.colors.foreground, fontWeight: '900' }}>
                  {formatMoney(subtotal, currency)}
                </Text>
              </View>

              <Button
                label="Checkout"
                onPress={() => router.push('/(app)/(customer)/checkout')}
                disabled={items.length === 0 || busy}
              />
            </Card>
          </>
        )}
      </View>
    </Screen>
  );
}
