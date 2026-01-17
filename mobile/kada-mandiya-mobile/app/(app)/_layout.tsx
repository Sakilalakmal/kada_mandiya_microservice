import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
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
