import React from 'react';
import { View } from 'react-native';
import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useGetCartQuery } from '../../../../src/api/cartApi';
import { useTheme } from '../../../../src/providers/ThemeProvider';

export default function CustomerTabsLayout() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { data: cart } = useGetCartQuery(undefined, { refetchOnFocus: true, refetchOnReconnect: true });

  const cartCount = (cart?.items ?? []).reduce((sum, item) => sum + Math.max(0, Math.floor(Number(item.qty ?? 0))), 0);

  const bottomPad = Math.max(insets.bottom, theme.spacing.sm);
  const tabBarHeight = 60 + bottomPad;

  return (
    <Tabs
      initialRouteName="home"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primaryDark,
        tabBarInactiveTintColor: theme.colors.mutedForeground,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: theme.colors.card,
          borderTopWidth: 0,
          height: tabBarHeight,
          paddingTop: theme.spacing.sm,
          paddingBottom: bottomPad,
          borderRadius: theme.radius.xxl,
          left: theme.spacing.md,
          right: theme.spacing.md,
          bottom: theme.spacing.sm,
          position: 'absolute',
          overflow: 'hidden',
          ...theme.shadow.lg,
        },
        tabBarLabelStyle: {
          fontWeight: '700',
          fontSize: theme.typography.caption,
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
        tabBarItemStyle: {
          paddingVertical: theme.spacing.xxs,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ size, focused }) => (
            <View
              style={{
                width: 44,
                height: 34,
                borderRadius: theme.radius.full,
                backgroundColor: focused ? theme.colors.primaryMuted : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Feather name="home" size={size} color={focused ? theme.colors.primaryDark : theme.colors.mutedForeground} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarIcon: ({ size, focused }) => (
            <View
              style={{
                width: 44,
                height: 34,
                borderRadius: theme.radius.full,
                backgroundColor: focused ? theme.colors.primaryMuted : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Feather
                name="shopping-cart"
                size={size}
                color={focused ? theme.colors.primaryDark : theme.colors.mutedForeground}
              />
            </View>
          ),
          tabBarBadge: cartCount > 0 ? cartCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: theme.colors.primary,
            color: theme.colors.primaryForeground,
            fontWeight: '700',
            fontSize: 10,
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
          tabBarIcon: ({ size, focused }) => (
            <View
              style={{
                width: 44,
                height: 34,
                borderRadius: theme.radius.full,
                backgroundColor: focused ? theme.colors.primaryMuted : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Feather
                name="shopping-bag"
                size={size}
                color={focused ? theme.colors.primaryDark : theme.colors.mutedForeground}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ size, focused }) => (
            <View
              style={{
                width: 44,
                height: 34,
                borderRadius: theme.radius.full,
                backgroundColor: focused ? theme.colors.primaryMuted : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Feather name="user" size={size} color={focused ? theme.colors.primaryDark : theme.colors.mutedForeground} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

