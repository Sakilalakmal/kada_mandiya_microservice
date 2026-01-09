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

const schema = z
  .object({
    fullName: z.string().min(2, 'Enter your full name'),
    email: z.string().email('Enter a valid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Confirm your password'),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof schema>;

export default function RegisterScreen() {
  const { theme } = useTheme();

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
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
            Create account
          </Text>

          <Controller
            control={control}
            name="fullName"
            render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
              <Input
                label="Full name"
                placeholder="Your name"
                textContentType="name"
                autoComplete="name"
                onBlur={onBlur}
                value={value}
                onChangeText={onChange}
                error={error?.message}
              />
            )}
          />

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
                textContentType="newPassword"
                autoComplete="password-new"
                onBlur={onBlur}
                value={value}
                onChangeText={onChange}
                error={error?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
              <Input
                label="Confirm password"
                placeholder="••••••••"
                secureTextEntry
                textContentType="newPassword"
                autoComplete="password-new"
                onBlur={onBlur}
                value={value}
                onChangeText={onChange}
                error={error?.message}
              />
            )}
          />

          <Button label="Create account" onPress={onSubmit} loading={isSubmitting} />

          <Link href="/(auth)/login" asChild>
            <Pressable style={{ alignSelf: 'flex-start' }}>
              <Text style={{ color: theme.colors.placeholder, fontWeight: '600' }}>
                Already have an account?
              </Text>
            </Pressable>
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
