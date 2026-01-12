import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';

import { Screen } from '../../src/components/layout/Screen';
import { useTheme } from '../../src/providers/ThemeProvider';
import { useAppDispatch, useAppSelector } from '../../src/store/hooks';
import { hydrateAuth } from '../../src/store/authSlice';

export default function AppLayout() {
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const segments = useSegments();
  const { user, isHydrating } = useAppSelector((s) => s.auth);
  const segmentsKey = segments.join('/');
  const isLoggedIn = Boolean(user);
  const isVendor = user?.roles.includes('vendor') ?? false;
  const roleKey = user?.roles.join(',') ?? '';
  const inVendorGroup = segmentsKey.includes('(vendor)');
  const inCustomerGroup = segmentsKey.includes('(customer)');

  useEffect(() => {
    dispatch(hydrateAuth());
  }, [dispatch]);

  useEffect(() => {
    if (isHydrating) return;

    if (!isLoggedIn) {
      router.replace('/(auth)/login');
      return;
    }

    const target = isVendor ? '/(app)/(vendor)/(tabs)/profile' : '/(app)/(customer)/(tabs)/home';

    if (isVendor && !inVendorGroup) router.replace(target);
    if (!isVendor && !inCustomerGroup) router.replace(target);
  }, [inCustomerGroup, inVendorGroup, isHydrating, isLoggedIn, isVendor, roleKey, router, segmentsKey]);

  if (isHydrating) {
    return (
      <Screen style={styles.center}>
        <ActivityIndicator color={theme.colors.primary} />
      </Screen>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

const styles = StyleSheet.create({
  center: { justifyContent: 'center', alignItems: 'center' },
});
