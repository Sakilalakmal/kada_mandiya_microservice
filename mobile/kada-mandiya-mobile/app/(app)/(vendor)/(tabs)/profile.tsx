import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useGetMyVendorProfileQuery } from '../../../../src/api/vendorApi';
import { Header } from '../../../../src/components/layout/Header';
import { Screen } from '../../../../src/components/layout/Screen';
import { Badge } from '../../../../src/components/ui/Badge';
import { Card } from '../../../../src/components/ui/Card';
import { ListItem } from '../../../../src/components/ui/ListItem';
import { useTheme } from '../../../../src/providers/ThemeProvider';
import { clearAuth } from '../../../../src/store/authSlice';
import { useAppDispatch, useAppSelector } from '../../../../src/store/hooks';
import { clearTokens } from '../../../../src/utils/tokenStorage';

export default function VendorProfile() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const { data, isFetching, isError } = useGetMyVendorProfileQuery();

  const vendor = data?.vendor ?? null;
  const bottomSpacer = 60 + Math.max(insets.bottom, theme.spacing.sm) + theme.spacing.md;

  return (
    <Screen scroll style={{ paddingBottom: bottomSpacer }}>
      <Header title="Profile" subtitle="Account and vendor settings." />

      <View style={{ marginTop: theme.spacing.lg, gap: theme.spacing.lg }}>
        <Card style={{ gap: theme.spacing.md }}>
          <View style={{ gap: theme.spacing.xs }}>
            <Text style={{ color: theme.colors.placeholder, fontWeight: '800', fontSize: theme.typography.small }}>
              Signed in as
            </Text>
            <Text style={{ color: theme.colors.foreground, fontWeight: '900', fontSize: theme.typography.body }}>
              {user?.email ?? '—'}
            </Text>
          </View>

          <View style={{ height: 1, backgroundColor: theme.colors.border }} />

          {isFetching ? (
            <View style={{ paddingVertical: theme.spacing.sm }}>
              <ActivityIndicator color={theme.colors.primary} />
            </View>
          ) : isError ? (
            <Text style={{ color: theme.colors.danger, fontWeight: '800', fontSize: theme.typography.body }}>
              Failed to load vendor profile.
            </Text>
          ) : vendor ? (
            <View style={{ gap: theme.spacing.xs }}>
              <Text style={{ color: theme.colors.placeholder, fontWeight: '800', fontSize: theme.typography.small }}>
                Store
              </Text>
              <Text style={{ color: theme.colors.foreground, fontWeight: '900', fontSize: theme.typography.subtitle }}>
                {vendor.storeName}
              </Text>
              <View style={{ marginTop: theme.spacing.xs }}>
                <Badge label="ACTIVE" />
              </View>
            </View>
          ) : (
            <Text style={{ color: theme.colors.placeholder, fontWeight: '700', fontSize: theme.typography.body }}>
              No vendor profile found.
            </Text>
          )}
        </Card>

        <Card style={{ gap: theme.spacing.sm }}>
          <Text style={{ color: theme.colors.foreground, fontWeight: '900', fontSize: theme.typography.subtitle }}>
            Vendor hub
          </Text>
          <View style={{ gap: theme.spacing.sm }}>
            <ListItem
              title="Vendor status"
              subtitle="Check approval and store details"
              leftIcon="shield"
              onPress={() => router.push('/(app)/(vendor)/vendor-status')}
            />
            <ListItem
              title="Products"
              subtitle="Create, edit, activate/deactivate"
              leftIcon="package"
              onPress={() => router.push('/(app)/(vendor)/products')}
            />
            <ListItem
              title="Vendor dashboard"
              subtitle="Quick store overview"
              leftIcon="grid"
              onPress={() => router.push('/(app)/(vendor)/dashboard')}
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

