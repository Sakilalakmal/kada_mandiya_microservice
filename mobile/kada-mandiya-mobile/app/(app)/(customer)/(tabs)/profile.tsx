import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';

import { Header } from '../../../../src/components/layout/Header';
import { Screen } from '../../../../src/components/layout/Screen';
import { Card } from '../../../../src/components/ui/Card';
import { ListItem } from '../../../../src/components/ui/ListItem';
import { useTheme } from '../../../../src/providers/ThemeProvider';
import { clearAuth } from '../../../../src/store/authSlice';
import { useAppDispatch, useAppSelector } from '../../../../src/store/hooks';
import { clearTokens } from '../../../../src/utils/tokenStorage';

export default function CustomerProfile() {
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);

  const isVendor = useMemo(() => user?.roles?.includes('vendor') ?? false, [user?.roles]);

  return (
    <Screen scroll>
      <Header title="Profile" subtitle="Your account and settings." />

      <View style={{ marginTop: theme.spacing.lg, gap: theme.spacing.lg }}>
        <Card style={{ gap: theme.spacing.xs }}>
          <Text style={{ color: theme.colors.placeholder, fontWeight: '800', fontSize: theme.typography.small }}>
            Signed in as
          </Text>
          <Text style={{ color: theme.colors.foreground, fontWeight: '900', fontSize: theme.typography.body }}>
            {user?.email ?? '—'}
          </Text>
          <Text style={{ color: theme.colors.placeholder, fontWeight: '700', fontSize: theme.typography.small }}>
            Role: {isVendor ? 'vendor' : 'customer'}
          </Text>
        </Card>

        <Card style={{ gap: theme.spacing.sm }}>
          <Text style={{ color: theme.colors.foreground, fontWeight: '900', fontSize: theme.typography.subtitle }}>
            Explore
          </Text>
          <View style={{ gap: theme.spacing.sm }}>
            <ListItem
              title="Browse products"
              subtitle="Start shopping (coming next)"
              leftIcon="shopping-cart"
              onPress={() => router.push('/(app)/(customer)/products')}
            />
            <ListItem
              title="Orders"
              subtitle="View your order history"
              leftIcon="shopping-bag"
              onPress={() => router.push('/(app)/(customer)/(tabs)/orders')}
            />
          </View>
        </Card>

        <Card style={{ gap: theme.spacing.sm }}>
          <Text style={{ color: theme.colors.foreground, fontWeight: '900', fontSize: theme.typography.subtitle }}>
            Account
          </Text>
          <View style={{ gap: theme.spacing.sm }}>
            {!isVendor ? (
              <ListItem
                title="Become vendor"
                subtitle="Start selling on Kada Mandiya"
                leftIcon="briefcase"
                onPress={() => router.push('/(app)/(customer)/become-vendor')}
              />
            ) : null}

            <ListItem
              title="Settings"
              subtitle="Preferences (coming soon)"
              leftIcon="settings"
              onPress={() => router.push('/(app)/(customer)/settings')}
            />

            <ListItem
              title="Logout"
              subtitle="Sign out of this account"
              leftIcon="log-out"
              onPress={async () => {
                await clearTokens();
                dispatch(clearAuth());
                router.replace('/(auth)/login');
              }}
            />
          </View>
        </Card>
      </View>
    </Screen>
  );
}

