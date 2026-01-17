import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';

import { Screen } from '../../src/components/layout/Screen';
import { useTheme } from '../../src/providers/ThemeProvider';
import { useAppDispatch, useAppSelector } from '../../src/store/hooks';
import { hydrateAuth } from '../../src/store/authSlice';
import { hasVendorRole } from '../../src/utils/roles';

export default function AppLayout() {
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const segments = useSegments();
  const { user, isHydrating } = useAppSelector((s) => s.auth);
  const splashStart = useRef(Date.now());
  const [minDelayDone, setMinDelayDone] = useState(false);
  const segmentsKey = segments.join('/');
  const isLoggedIn = Boolean(user);
  const isVendor = hasVendorRole(user?.roles);
  const roleKey = user?.roles.join(',') ?? '';
  const inVendorGroup = segmentsKey.includes('(vendor)');
  const inCustomerGroup = segmentsKey.includes('(customer)');

  useEffect(() => {
    const MIN_SPLASH_MS = 1500;

    if (isHydrating) {
      splashStart.current = Date.now();
      setMinDelayDone(false);
      return;
    }

    const elapsed = Date.now() - splashStart.current;
    const remaining = Math.max(0, MIN_SPLASH_MS - elapsed);
    const t = setTimeout(() => setMinDelayDone(true), remaining);
    return () => clearTimeout(t);
  }, [isHydrating]);

  useEffect(() => {
    dispatch(hydrateAuth());
  }, [dispatch]);

  useEffect(() => {
    if (isHydrating || !minDelayDone) return;

    if (!isLoggedIn) {
      router.replace('/(auth)/login');
      return;
    }

    const target = isVendor ? '/(app)/(vendor)/(tabs)/profile' : '/(app)/(customer)/(tabs)/home';

    if (isVendor && !inVendorGroup) router.replace(target);
    if (!isVendor && !inCustomerGroup) router.replace(target);
  }, [inCustomerGroup, inVendorGroup, isHydrating, isLoggedIn, isVendor, minDelayDone, roleKey, router, segmentsKey]);

  if (isHydrating || !minDelayDone) {
    return (
      <Screen style={{ paddingHorizontal: 0, paddingVertical: 0 }}>
        <View style={[styles.splash, { backgroundColor: theme.colors.primary, paddingHorizontal: theme.spacing.lg }]}>
          <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: theme.typography.displayLarge, letterSpacing: -1 }}>
            Kada <Text style={{ color: theme.colors.accent }}>Mandiya</Text>
          </Text>
          <Text
            style={{
              marginTop: theme.spacing.sm,
              color: 'rgba(255,255,255,0.92)',
              fontWeight: '700',
              fontSize: theme.typography.body,
              textAlign: 'center',
              lineHeight: theme.typography.body * theme.typography.lineHeight.relaxed,
            }}
          >
            කඩ මණ්ඩිය — ශ්‍රී ලංකාවේ ඔබගේ නවීන ඔන්ලයින් වෙළඳපොළ.
          </Text>

          <View style={{ marginTop: theme.spacing.xl }}>
            <ActivityIndicator color="#FFFFFF" />
          </View>
        </View>
      </Screen>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

const styles = StyleSheet.create({
  splash: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
