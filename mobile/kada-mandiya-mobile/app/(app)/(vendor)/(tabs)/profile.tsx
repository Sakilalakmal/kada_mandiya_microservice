import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { router } from 'expo-router';

import { useGetMyVendorProfileQuery } from '../../../../src/api/vendorApi';
import { Screen } from '../../../../src/components/layout/Screen';
import { Button } from '../../../../src/components/ui/Button';
import { useTheme } from '../../../../src/providers/ThemeProvider';
import { clearAuth } from '../../../../src/store/authSlice';
import { useAppDispatch, useAppSelector } from '../../../../src/store/hooks';
import { clearTokens } from '../../../../src/utils/tokenStorage';

export default function VendorProfile() {
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const { data, isFetching, isError } = useGetMyVendorProfileQuery();

  const vendor = data?.vendor ?? null;

  return (
    <Screen>
      <Text style={{ fontSize: 22, fontWeight: '800', color: theme.colors.foreground }}>Profile</Text>

      <View style={{ marginTop: theme.spacing.lg, gap: theme.spacing.sm }}>
        <Text style={{ color: theme.colors.placeholder, fontWeight: '700' }}>Signed in as</Text>
        <Text style={{ color: theme.colors.foreground, fontWeight: '700' }}>{user?.email}</Text>

        {isFetching ? (
          <ActivityIndicator color={theme.colors.primary} />
        ) : isError ? (
          <Text style={{ color: theme.colors.danger, fontWeight: '700' }}>
            Failed to load vendor profile.
          </Text>
        ) : vendor ? (
          <>
            <Text style={{ color: theme.colors.placeholder, fontWeight: '700' }}>Store</Text>
            <Text style={{ color: theme.colors.foreground, fontWeight: '700' }}>{vendor.storeName}</Text>
          </>
        ) : (
          <Text style={{ color: theme.colors.placeholder, fontWeight: '700' }}>No vendor profile found.</Text>
        )}
      </View>

      <View style={{ flex: 1 }} />

      <View style={{ gap: theme.spacing.sm }}>
        <Button label="Vendor status" variant="outline" onPress={() => router.push('/(app)/(vendor)/vendor-status')} />
        <Button
          label="Logout"
          variant="outline"
          onPress={async () => {
            await clearTokens();
            dispatch(clearAuth());
            router.replace('/(auth)/login');
          }}
        />
      </View>
    </Screen>
  );
}

