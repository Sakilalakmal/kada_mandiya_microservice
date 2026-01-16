import React, { useCallback, useMemo } from 'react';
import { Alert, ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

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
      <Pressable 
        onPress={onClear} 
        disabled={!items.length || busy} 
        style={({ pressed }) => ({ 
          opacity: pressed ? 0.7 : busy ? 0.4 : !items.length ? 0.3 : 1,
          paddingHorizontal: theme.spacing.sm,
          paddingVertical: theme.spacing.xs,
        })}
      >
        <Text style={{ 
          color: theme.colors.danger, 
          fontWeight: '700',
          fontSize: theme.typography.bodySmall,
        }}>
          Clear all
        </Text>
      </Pressable>
    );
  }, [busy, items.length, onClear, theme.colors.danger, theme.spacing.sm, theme.spacing.xs]);

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
    <Screen style={{ paddingBottom: 0 }}>
      <Header title="Shopping Cart" subtitle={`${count} ${count === 1 ? 'item' : 'items'}`} right={headerRight} />

      <View style={{ flex: 1, marginTop: theme.spacing.lg }}>
        {isLoading ? (
          <View style={{ gap: theme.spacing.lg }}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Card>
              <View style={{ height: 100 }} />
            </Card>
            <Card>
              <View style={{ height: 100 }} />
            </Card>
          </View>
        ) : error ? (
          <Card style={{ gap: theme.spacing.md }}>
            <Text style={{ color: theme.colors.foreground, fontWeight: '800', fontSize: theme.typography.h3 }}>
              Couldn't load cart
            </Text>
            <Text style={{ color: theme.colors.foregroundSecondary, fontWeight: '500' }}>{getApiErrorMessage(error)}</Text>
            <Button label="Retry" onPress={() => refetch()} loading={isFetching} />
          </Card>
        ) : items.length === 0 ? (
          <Card variant="tinted" style={{ gap: theme.spacing.xl, padding: theme.spacing.xxxl, alignItems: 'center' }}>
            <View
              style={{
                width: 96,
                height: 96,
                borderRadius: theme.radius.full,
                backgroundColor: theme.colors.primaryMuted,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Feather name="shopping-cart" size={44} color={theme.colors.primary} />
            </View>
            <View style={{ gap: theme.spacing.sm, alignItems: 'center' }}>
              <Text style={{ 
                color: theme.colors.foreground, 
                fontWeight: '900', 
                fontSize: theme.typography.h2,
                textAlign: 'center',
              }}>
                Your cart is empty
              </Text>
              <Text style={{ 
                color: theme.colors.foregroundSecondary, 
                fontWeight: '500', 
                textAlign: 'center',
                fontSize: theme.typography.body,
              }}>
                Browse products and add items to get started
              </Text>
            </View>
            <Button 
              label="Start Shopping" 
              onPress={() => router.push('/(app)/(customer)/products')} 
              size="lg" 
            />
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
              contentContainerStyle={{ paddingBottom: theme.spacing.xxxl }}
            />

            {/* Fixed Checkout Summary */}
            <View style={{ 
              backgroundColor: theme.colors.card,
              borderTopLeftRadius: theme.radius.xxl,
              borderTopRightRadius: theme.radius.xxl,
              paddingTop: theme.spacing.lg,
              paddingHorizontal: theme.spacing.lg,
              paddingBottom: theme.spacing.xl,
              ...theme.shadow.xl,
            }}>
              <View style={{ gap: theme.spacing.md }}>
                <View style={{ gap: theme.spacing.sm }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ 
                      color: theme.colors.foregroundSecondary, 
                      fontWeight: '600', 
                      fontSize: theme.typography.body,
                    }}>
                      Items ({count})
                    </Text>
                    <Text style={{ 
                      color: theme.colors.foreground, 
                      fontWeight: '700', 
                      fontSize: theme.typography.body,
                    }}>
                      {formatMoney(subtotal, currency)}
                    </Text>
                  </View>
                  
                  <View style={{ height: 1, backgroundColor: theme.colors.border }} />
                  
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: theme.spacing.xs }}>
                    <Text style={{ 
                      color: theme.colors.foreground, 
                      fontWeight: '900', 
                      fontSize: theme.typography.h3,
                    }}>
                      Total
                    </Text>
                    <Text style={{ 
                      color: theme.colors.primary, 
                      fontWeight: '900', 
                      fontSize: theme.typography.priceDisplay, 
                      letterSpacing: -0.8,
                    }}>
                      {formatMoney(subtotal, currency)}
                    </Text>
                  </View>
                </View>

                <Button
                  label="Proceed to Checkout"
                  onPress={() => router.push('/(app)/(customer)/checkout')}
                  disabled={items.length === 0 || busy}
                  size="lg"
                  fullWidth
                  style={{ marginTop: theme.spacing.md }}
                />
              </View>
            </View>
          </>
        )}
      </View>
    </Screen>
  );
}
