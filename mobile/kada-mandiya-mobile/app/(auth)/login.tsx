import React from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { useLazyMeQuery, useLoginMutation } from '../../src/api/authApi';
import { Screen } from '../../src/components/layout/Screen';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
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
          : '/(app)/(customer)/(tabs)/home'
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
    <Screen style={{ paddingHorizontal: 0, paddingVertical: 0 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1, paddingBottom: theme.spacing.xxxl }}
        >
          <View
            style={{
              backgroundColor: theme.colors.primary,
              paddingTop: theme.spacing.xxxl,
              paddingBottom: theme.spacing.xxxxl,
              paddingHorizontal: theme.spacing.md,
              borderBottomLeftRadius: theme.radius.xxl,
              borderBottomRightRadius: theme.radius.xxl,
            }}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: theme.typography.displayLarge, letterSpacing: -1 }}>
              Kada <Text style={{ color: theme.colors.accent }}>Mandiya</Text>
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.9)', fontWeight: '700', fontSize: theme.typography.body }}>
              Sign in to continue shopping
            </Text>
          </View>

          <View style={{ marginTop: -theme.spacing.xl, paddingHorizontal: theme.spacing.md }}>
            <Card variant="elevated" style={{ gap: theme.spacing.lg, padding: theme.spacing.lg }}>
              {serverError ? (
                <View
                  style={{
                    padding: theme.spacing.md,
                    borderRadius: theme.radius.lg,
                    borderWidth: 1,
                    borderColor: theme.colors.danger,
                    backgroundColor: theme.colors.dangerMuted,
                  }}
                >
                  <Text
                    style={{
                      color: theme.colors.danger,
                      fontWeight: '700',
                      fontSize: theme.typography.bodySmall,
                      lineHeight: theme.typography.bodySmall * theme.typography.lineHeight.relaxed,
                    }}
                  >
                    {serverError}
                  </Text>
                </View>
              ) : null}

              <View style={{ gap: theme.spacing.lg }}>
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
                      placeholder="********"
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
              </View>

              <Link href="/(auth)/forgot-password" asChild>
                <Pressable style={{ alignSelf: 'flex-end' }}>
                  <Text style={{ color: theme.colors.primaryDark, fontWeight: '800', fontSize: theme.typography.bodySmall }}>
                    Forgot password?
                  </Text>
                </Pressable>
              </Link>

              <Button
                label="Sign in"
                size="md"
                onPress={onSubmit}
                loading={isSubmitting || loginState.isLoading}
                disabled={loginState.isLoading}
              />

              <View style={{ alignItems: 'center', gap: theme.spacing.xs }}>
                <Text style={{ color: theme.colors.mutedForeground, fontWeight: '600', fontSize: theme.typography.bodySmall }}>
                  New here?
                </Text>
                <Link href="/(auth)/register" asChild>
                  <Pressable>
                    <Text style={{ color: theme.colors.primaryDark, fontWeight: '900', fontSize: theme.typography.body }}>
                      Create account
                    </Text>
                  </Pressable>
                </Link>
              </View>
            </Card>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
