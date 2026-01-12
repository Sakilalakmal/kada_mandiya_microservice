import React from 'react';
import { Text, View } from 'react-native';

import { Header } from '../../../src/components/layout/Header';
import { Screen } from '../../../src/components/layout/Screen';
import { Card } from '../../../src/components/ui/Card';
import { useTheme } from '../../../src/providers/ThemeProvider';

export default function CustomerSettingsScreen() {
  const { theme } = useTheme();

  return (
    <Screen scroll>
      <Header title="Settings" subtitle="Preferences and app options." canGoBack />

      <View style={{ marginTop: theme.spacing.lg }}>
        <Card style={{ gap: theme.spacing.sm }}>
          <Text style={{ color: theme.colors.foreground, fontWeight: '900', fontSize: theme.typography.subtitle }}>
            Coming soon
          </Text>
          <Text style={{ color: theme.colors.placeholder, fontWeight: '600', fontSize: theme.typography.body }}>
            Settings UI will be added later.
          </Text>
        </Card>
      </View>
    </Screen>
  );
}

