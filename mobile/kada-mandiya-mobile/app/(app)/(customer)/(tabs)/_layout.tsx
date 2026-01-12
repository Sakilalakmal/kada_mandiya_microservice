import React from 'react';
import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import { useGetCartQuery } from '../../../../src/api/cartApi';
import { useTheme } from '../../../../src/providers/ThemeProvider';

export default function CustomerTabsLayout() {
  const { theme } = useTheme();
  const { data: cart } = useGetCartQuery(undefined, { refetchOnFocus: true, refetchOnReconnect: true });

  const cartCount = (cart?.items ?? []).reduce((sum, item) => sum + Math.max(0, Math.floor(Number(item.qty ?? 0))), 0);

  return (
    <Tabs
      initialRouteName="home"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.placeholder,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          height: theme.spacing.xl + theme.spacing.lg + theme.spacing.xs,
          paddingTop: theme.spacing.xs,
          paddingBottom: theme.spacing.xs,
        },
        tabBarLabelStyle: { fontWeight: '700', fontSize: theme.typography.small },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Feather name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarIcon: ({ color, size }) => <Feather name="shopping-cart" size={size} color={color} />,
          tabBarBadge: cartCount > 0 ? cartCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: theme.colors.primary,
            color: theme.colors.primaryForeground,
            fontWeight: '900',
          },
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ color, size }) => <Feather name="shopping-bag" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <Feather name="user" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}


