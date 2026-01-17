import React from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { Screen } from '../../src/components/layout/Screen';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
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
    <Screen style={{ paddingHorizontal: 0, paddingVertical: 0 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1, paddingBottom: theme.spacing.xxxl }}
        >
          <Text
            style={{
              backgroundColor: theme.colors.primary,
              paddingTop: theme.spacing.xxxl,
              paddingBottom: theme.spacing.xxxxl,
              paddingHorizontal: theme.spacing.md,
              borderBottomLeftRadius: theme.radius.xxl,
              borderBottomRightRadius: theme.radius.xxl,
              color: '#FFFFFF',
              fontWeight: '900',
              fontSize: theme.typography.display,
              letterSpacing: -0.8,
            }}
          >
            Reset password
          </Text>

          <View style={{ marginTop: -theme.spacing.xl, paddingHorizontal: theme.spacing.md }}>
            <Card variant="elevated" style={{ gap: theme.spacing.lg, padding: theme.spacing.lg }}>
              <Text style={{ color: theme.colors.foregroundSecondary, fontWeight: '700', fontSize: theme.typography.body }}>
                Enter your email address and we'll send you a reset link.
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
            </Card>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

