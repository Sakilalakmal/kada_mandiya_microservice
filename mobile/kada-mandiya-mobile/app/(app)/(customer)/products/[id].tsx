import React from 'react';
import { Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Header } from '../../../../src/components/layout/Header';
import { Screen } from '../../../../src/components/layout/Screen';
import { Button } from '../../../../src/components/ui/Button';
import { Card } from '../../../../src/components/ui/Card';
import { useTheme } from '../../../../src/providers/ThemeProvider';

export default function CustomerProductDetailsPlaceholder() {
  const { theme } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <Screen scroll>
      <Header title="Product" subtitle="Details and checkout coming next." canGoBack />

      <View style={{ marginTop: theme.spacing.lg, gap: theme.spacing.lg }}>
        <Card style={{ gap: theme.spacing.sm }}>
          <Text style={{ color: theme.colors.foreground, fontWeight: '900', fontSize: theme.typography.subtitle }}>
            Coming next
          </Text>
          <Text style={{ color: theme.colors.placeholder, fontWeight: '600', fontSize: theme.typography.body }}>
            Product details, images, vendor info, and cart flow are the next step.
          </Text>
          {id ? (
            <Text style={{ color: theme.colors.placeholder, fontWeight: '700', fontSize: theme.typography.small }}>
              Product ID: {id}
            </Text>
          ) : null}
        </Card>

        <Button label="Back to products" variant="outline" onPress={() => router.push('/(app)/(customer)/products')} />
      </View>
    </Screen>
  );
}

