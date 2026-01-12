import React from 'react';
import { Text, View } from 'react-native';

import { Header } from '../../../../src/components/layout/Header';
import { Screen } from '../../../../src/components/layout/Screen';
import { Card } from '../../../../src/components/ui/Card';
import { useTheme } from '../../../../src/providers/ThemeProvider';

export default function CustomerProductsPlaceholder() {
  const { theme } = useTheme();

  return (
    <Screen scroll>
      <Header title="Products" subtitle="Browse items from vendors." canGoBack />

      <View style={{ marginTop: theme.spacing.lg, gap: theme.spacing.lg }}>
        <Card style={{ gap: theme.spacing.sm }}>
          <Text style={{ color: theme.colors.foreground, fontWeight: '900', fontSize: theme.typography.subtitle }}>
            Coming next
          </Text>
          <Text style={{ color: theme.colors.placeholder, fontWeight: '600', fontSize: theme.typography.body }}>
            Product browsing, search, filters, and product details are the next step.
          </Text>
        </Card>
      </View>
    </Screen>
  );
}

