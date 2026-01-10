import React from 'react';
import { Text } from 'react-native';

import { Screen } from '../../../../src/components/layout/Screen';
import { useTheme } from '../../../../src/providers/ThemeProvider';

export default function VendorDashboard() {
  const { theme } = useTheme();

  return (
    <Screen style={{ justifyContent: 'center' }}>
      <Text style={{ fontSize: 22, fontWeight: '800', color: theme.colors.foreground }}>
        Vendor Dashboard
      </Text>
      <Text style={{ marginTop: 8, color: theme.colors.placeholder, fontWeight: '600' }}>
        Manage your store and products.
      </Text>
    </Screen>
  );
}

