import React from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';

import { Button } from '../../../../src/components/ui/Button';
import { Screen } from '../../../../src/components/layout/Screen';
import { useTheme } from '../../../../src/providers/ThemeProvider';
import { clearAuth } from '../../../../src/store/authSlice';
import { useAppDispatch, useAppSelector } from '../../../../src/store/hooks';
import { clearTokens } from '../../../../src/utils/tokenStorage';

export default function CustomerProfile() {
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);

  return (
    <Screen>
      <Text style={{ fontSize: 22, fontWeight: '800', color: theme.colors.foreground }}>Profile</Text>

      <View style={{ marginTop: theme.spacing.lg, gap: theme.spacing.sm }}>
        <Text style={{ color: theme.colors.placeholder, fontWeight: '700' }}>Signed in as</Text>
        <Text style={{ color: theme.colors.foreground, fontWeight: '700' }}>{user?.email}</Text>
        <Text style={{ color: theme.colors.placeholder, fontWeight: '700' }}>
          Role: {user?.roles?.includes('vendor') ? 'vendor' : 'customer'}
        </Text>
      </View>

      <View style={{ flex: 1 }} />

      <View style={{ gap: theme.spacing.sm }}>
        <Button
          label="Become a Vendor"
          onPress={() => router.push('/(app)/(customer)/become-vendor')}
        />
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

