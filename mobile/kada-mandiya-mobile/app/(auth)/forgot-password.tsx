import React from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text } from 'react-native';
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
});

type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordScreen() {
  const { theme } = useTheme();

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
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
          <LogoHeader subtitle="Reset your password" />

          <Text style={{ fontSize: 26, fontWeight: '800', color: theme.colors.foreground }}>
            Forgot password
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

          <Button label="Send reset link" onPress={onSubmit} loading={isSubmitting} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

