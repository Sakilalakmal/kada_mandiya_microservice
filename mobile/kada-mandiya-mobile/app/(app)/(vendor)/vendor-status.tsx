import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { useGetMyVendorProfileQuery } from '../../../src/api/vendorApi';
import { Header } from '../../../src/components/layout/Header';
import { Screen } from '../../../src/components/layout/Screen';
import { Button } from '../../../src/components/ui/Button';
import { Card } from '../../../src/components/ui/Card';
import { Badge } from '../../../src/components/ui/Badge';
import { useTheme } from '../../../src/providers/ThemeProvider';
import { formatDateTime } from '../../../src/utils/format';

export default function VendorStatusScreen() {
  const { theme } = useTheme();
  const { data, isFetching, isError, refetch } = useGetMyVendorProfileQuery();

  const vendor = data?.vendor ?? null;

  return (
    <Screen>
      <Header
        title="Vendor status"
        subtitle="Your vendor profile and approval state."
        canGoBack
      />

      <View style={{ flex: 1, marginTop: theme.spacing.lg }}>
        {isFetching ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator color={theme.colors.primary} />
          </View>
        ) : isError ? (
          <Card style={{ gap: theme.spacing.sm }}>
            <Text style={{ color: theme.colors.danger, fontWeight: '800', fontSize: theme.typography.body }}>
              Failed to load vendor profile.
            </Text>
            <Text style={{ color: theme.colors.placeholder, fontWeight: '600', fontSize: theme.typography.body }}>
              Check your connection and try again.
            </Text>
            <Button label="Retry" variant="outline" onPress={refetch} />
          </Card>
        ) : vendor ? (
          <Card style={{ gap: theme.spacing.lg }}>
            <View style={{ gap: theme.spacing.sm }}>
              <Text style={{ color: theme.colors.placeholder, fontWeight: '800', fontSize: theme.typography.small }}>
                Store
              </Text>
              <Text style={{ color: theme.colors.foreground, fontWeight: '900', fontSize: theme.typography.title }}>
                {vendor.storeName}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ gap: theme.spacing.xs }}>
                <Text
                  style={{ color: theme.colors.placeholder, fontWeight: '800', fontSize: theme.typography.small }}
                >
                  Status
                </Text>
                <Badge label="ACTIVE" />
              </View>

              <View style={{ alignItems: 'flex-end', gap: theme.spacing.xs }}>
                <Text
                  style={{ color: theme.colors.placeholder, fontWeight: '800', fontSize: theme.typography.small }}
                >
                  Created
                </Text>
                <Text style={{ color: theme.colors.foreground, fontWeight: '700', fontSize: theme.typography.body }}>
                  {formatDateTime(vendor.createdAt)}
                </Text>
              </View>
            </View>

            <Text style={{ color: theme.colors.placeholder, fontWeight: '600', fontSize: theme.typography.body }}>
              ACTIVE means your vendor profile exists and your account has the vendor role.
            </Text>
          </Card>
        ) : (
          <Card style={{ gap: theme.spacing.sm }}>
            <Text style={{ color: theme.colors.foreground, fontWeight: '800', fontSize: theme.typography.subtitle }}>
              No vendor profile found
            </Text>
            <Text style={{ color: theme.colors.placeholder, fontWeight: '600', fontSize: theme.typography.body }}>
              If you just applied, it may take a moment to appear.
            </Text>
          </Card>
        )}
      </View>
    </Screen>
  );
}

