import React from 'react';
import { Platform, View } from 'react-native';
import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import { useTheme } from '../../../../src/providers/ThemeProvider';

export default function VendorTabsLayout() {
  const { theme } = useTheme();

  return (
    <Tabs
      initialRouteName="profile"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primaryDark,
        tabBarInactiveTintColor: theme.colors.mutedForeground,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: theme.colors.card,
          borderTopWidth: 0,
          height: Platform.OS === 'ios' ? 92 : 72,
          paddingHorizontal: theme.spacing.md,
          paddingTop: theme.spacing.sm,
          paddingBottom: Platform.OS === 'ios' ? theme.spacing.xl : theme.spacing.md,
          borderTopLeftRadius: theme.radius.xxl,
          borderTopRightRadius: theme.radius.xxl,
          ...theme.shadow.lg,
        },
        tabBarLabelStyle: { fontWeight: '700', fontSize: theme.typography.caption, marginTop: 2 },
        tabBarIconStyle: { marginTop: 4 },
      }}
    >
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

