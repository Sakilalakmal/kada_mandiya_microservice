import React from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text } from 'react-native';
import { Link } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { Screen } from '../../src/components/layout/Screen';
import { LogoHeader } from '../../src/components/branding/LogoHeader';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { useTheme } from '../../src/providers/ThemeProvider';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type FormValues = z.infer<typeof schema>;

export default function LoginScreen() {
  const { theme } = useTheme();

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async () => {
    Alert.alert('Coming soon', 'Auth wiring coming next');
  });

  return (
    <Screen>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', gap: theme.spacing.lg }}
        >
          <LogoHeader />

          <Text style={{ fontSize: 26, fontWeight: '800', color: theme.colors.foreground }}>
            Welcome back
          </Text>
          <Text style={{ fontSize: 15, fontWeight: '600', color: theme.colors.placeholder }}>
            Sign in to continue
          </Text>

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
              <Input
                label="Email"
                placeholder="you@example.com"
                autoCapitalize="none"
                keyboardType="email-address"
                textContentType="emailAddress"
                autoComplete="email"
                onBlur={onBlur}
                value={value}
                onChangeText={onChange}
                error={error?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
              <Input
                label="Password"
                placeholder="••••••••"
                secureTextEntry
                textContentType="password"
                autoComplete="password"
                onBlur={onBlur}
                value={value}
                onChangeText={onChange}
                error={error?.message}
              />
            )}
          />

          <Button label="Sign in" onPress={onSubmit} loading={isSubmitting} />

          <Link href="/(auth)/forgot-password" asChild>
            <Pressable style={{ alignSelf: 'flex-start' }}>
              <Text style={{ color: theme.colors.primary, fontWeight: '700' }}>Forgot password?</Text>
            </Pressable>
          </Link>

          <Link href="/(auth)/register" asChild>
            <Pressable style={{ alignSelf: 'flex-start' }}>
              <Text style={{ color: theme.colors.placeholder, fontWeight: '600' }}>
                Create an account
              </Text>
            </Pressable>
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
