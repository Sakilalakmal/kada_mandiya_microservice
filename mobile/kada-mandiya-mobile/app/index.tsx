import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { Screen } from '../src/components/layout/Screen';
import { LogoHeader } from '../src/components/branding/LogoHeader';
import { useTheme } from '../src/providers/ThemeProvider';

export default function Splash() {
  const { theme } = useTheme();

  useEffect(() => {
    const t = setTimeout(() => {
      router.replace('/(auth)/login');
    }, 600);
    return () => clearTimeout(t);
  }, []);

  return (
    <Screen style={styles.center}>
      <LogoHeader subtitle="Loading…" />
      <View style={{ height: 24 }} />
      <ActivityIndicator color={theme.colors.primary} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { justifyContent: 'center', alignItems: 'center' },
});

