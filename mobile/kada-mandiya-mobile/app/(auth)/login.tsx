import React from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { useLazyMeQuery, useLoginMutation } from '../../src/api/authApi';
import { LogoHeader } from '../../src/components/branding/LogoHeader';
import { Screen } from '../../src/components/layout/Screen';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { API_BASE_URL } from '../../src/constants/config';
import { useTheme } from '../../src/providers/ThemeProvider';
import { setUser } from '../../src/store/authSlice';
import { useAppDispatch } from '../../src/store/hooks';
import { getApiErrorMessage } from '../../src/utils/apiError';
import { setTokens } from '../../src/utils/tokenStorage';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type FormValues = z.infer<typeof schema>;

export default function LoginScreen() {
  const { theme } = useTheme();
  const dispatch = useAppDispatch();

  const [login, loginState] = useLoginMutation();
  const [triggerMe] = useLazyMeQuery();
  const [serverError, setServerError] = React.useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);

    try {
      const auth = await login(values).unwrap();
      await setTokens({ accessToken: auth.accessToken, refreshToken: auth.accessToken });

      const me = await triggerMe().unwrap();
      const user = { id: me.payload.sub, email: me.payload.email, roles: me.payload.roles };
      dispatch(setUser(user));

      router.replace(
        user.roles.includes('vendor')
          ? '/(app)/(vendor)/(tabs)/profile'
          : '/(app)/(customer)/(tabs)/profile'
      );
    } catch (err) {
      const msg = getApiErrorMessage(err);
      if (/network request failed|fetch_error/i.test(msg)) {
        setServerError(
          `Network error. API: ${API_BASE_URL}\nIf using a phone, set EXPO_PUBLIC_API_URL to your PC LAN IP.`
        );
      } else {
        setServerError(msg);
      }
    }
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

          {serverError ? (
            <View
              style={{
                padding: theme.spacing.md,
                borderRadius: theme.radius.md,
                borderWidth: 1,
                borderColor: theme.colors.danger,
                backgroundColor: theme.colors.muted,
              }}
            >
              <Text style={{ color: theme.colors.danger, fontWeight: '700' }}>{serverError}</Text>
            </View>
          ) : null}

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

          <Button
            label="Sign in"
            onPress={onSubmit}
            loading={isSubmitting || loginState.isLoading}
            disabled={loginState.isLoading}
          />

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
