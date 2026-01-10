import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';

import { Screen } from '../../src/components/layout/Screen';
import { API_BASE_URL } from '../../src/constants/config';
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

    const target = isVendor ? '/(app)/(vendor)/(tabs)/dashboard' : '/(app)/(customer)/(tabs)/home';

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

  return (
    <>
      {__DEV__ ? (
        <View pointerEvents="none" style={styles.devBadge}>
          <Text style={[styles.devText, { color: theme.colors.placeholder }]}>
            {API_BASE_URL} • {user?.roles?.[0] ?? 'guest'}
          </Text>
        </View>
      ) : null}
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}

const styles = StyleSheet.create({
  center: { justifyContent: 'center', alignItems: 'center' },
  devBadge: { position: 'absolute', right: 10, bottom: 10, zIndex: 10 },
  devText: { fontSize: 11, fontWeight: '600' },
});
