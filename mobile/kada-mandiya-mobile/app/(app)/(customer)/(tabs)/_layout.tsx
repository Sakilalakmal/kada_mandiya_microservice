import React from 'react';
import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import { useGetCartQuery } from '../../../../src/api/cartApi';
import { useTheme } from '../../../../src/providers/ThemeProvider';

export default function CustomerTabsLayout() {
  const { theme, scheme } = useTheme();
  const { data: cart } = useGetCartQuery(undefined, { refetchOnFocus: true, refetchOnReconnect: true });

  const cartCount = (cart?.items ?? []).reduce((sum, item) => sum + Math.max(0, Math.floor(Number(item.qty ?? 0))), 0);

  const tabBarHeight = Platform.OS === 'ios' ? 88 : 68;

  return (
    <Tabs
      initialRouteName="home"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.mutedForeground,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          height: tabBarHeight,
          paddingTop: theme.spacing.xs,
          paddingBottom: Platform.OS === 'ios' ? theme.spacing.lg : theme.spacing.sm,
          ...theme.shadow.lg,
        },
        tabBarLabelStyle: {
          fontWeight: '600',
          fontSize: theme.typography.caption,
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size, focused }) => (
            <Feather name="home" size={focused ? size + 2 : size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarIcon: ({ color, size, focused }) => (
            <Feather name="shopping-cart" size={focused ? size + 2 : size} color={color} />
          ),
          tabBarBadge: cartCount > 0 ? cartCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: theme.colors.primary,
            color: theme.colors.primaryForeground,
            fontWeight: '700',
            fontSize: 11,
            minWidth: 18,
            height: 18,
            borderRadius: 9,
            lineHeight: 18,
          },
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ color, size, focused }) => (
            <Feather name="shopping-bag" size={focused ? size + 2 : size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size, focused }) => (
            <Feather name="user" size={focused ? size + 2 : size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

