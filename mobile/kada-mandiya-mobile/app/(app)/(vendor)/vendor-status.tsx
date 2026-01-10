import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { router } from 'expo-router';

import { useGetMyVendorProfileQuery } from '../../../src/api/vendorApi';
import { Screen } from '../../../src/components/layout/Screen';
import { Button } from '../../../src/components/ui/Button';
import { useTheme } from '../../../src/providers/ThemeProvider';

export default function VendorStatusScreen() {
  const { theme } = useTheme();
  const { data, isFetching, isError, refetch } = useGetMyVendorProfileQuery();

  const vendor = data?.vendor ?? null;

  return (
    <Screen>
      <Text style={{ fontSize: 22, fontWeight: '800', color: theme.colors.foreground }}>
        Vendor status
      </Text>

      <View style={{ marginTop: theme.spacing.lg, gap: theme.spacing.md }}>
        {isFetching ? (
          <ActivityIndicator color={theme.colors.primary} />
        ) : isError ? (
          <>
            <Text style={{ color: theme.colors.danger, fontWeight: '700' }}>
              Failed to load vendor profile.
            </Text>
            <Button label="Retry" variant="outline" onPress={refetch} />
          </>
        ) : vendor ? (
          <View
            style={{
              padding: theme.spacing.lg,
              borderRadius: theme.radius.lg,
              borderWidth: 1,
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.muted,
              gap: theme.spacing.sm,
            }}
          >
            <Text style={{ color: theme.colors.placeholder, fontWeight: '800' }}>Store</Text>
            <Text style={{ color: theme.colors.foreground, fontWeight: '800', fontSize: 18 }}>
              {vendor.storeName}
            </Text>
            <Text style={{ color: theme.colors.placeholder, fontWeight: '800' }}>Status</Text>
            <Text style={{ color: theme.colors.foreground, fontWeight: '800' }}>ACTIVE</Text>
            <Text style={{ color: theme.colors.placeholder, fontWeight: '800' }}>Created</Text>
            <Text style={{ color: theme.colors.foreground, fontWeight: '700' }}>{vendor.createdAt}</Text>

            <Text style={{ marginTop: theme.spacing.sm, color: theme.colors.placeholder, fontWeight: '600' }}>
              ACTIVE means your vendor profile exists and your account has the vendor role.
            </Text>
          </View>
        ) : (
          <Text style={{ color: theme.colors.placeholder, fontWeight: '700' }}>
            No vendor profile found.
          </Text>
        )}
      </View>

      <View style={{ flex: 1 }} />

      <Button label="Back" variant="ghost" onPress={() => router.back()} />
    </Screen>
  );
}

