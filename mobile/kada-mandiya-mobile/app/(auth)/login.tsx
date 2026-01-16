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
    <Screen>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ 
            flexGrow: 1, 
            justifyContent: 'center', 
            paddingHorizontal: theme.spacing.lg,
            paddingTop: theme.spacing.xxxl,
            paddingBottom: theme.spacing.xxl,
            gap: theme.spacing.md 
          }}
        >
          {/* Welcome section with soft background */}
          <View style={{ 
            marginBottom: theme.spacing.lg,
            gap: theme.spacing.xs 
          }}>
            <Text style={{ 
              fontSize: theme.typography.display, 
              fontWeight: '700', 
              color: theme.colors.foreground,
            }}>
              Welcome back
            </Text>
            <Text style={{ 
              fontSize: theme.typography.body, 
              fontWeight: '400', 
              color: theme.colors.foregroundSecondary,
            }}>
              Sign in to continue shopping
            </Text>
          </View>

          {serverError ? (
            <View
              style={{
                padding: theme.spacing.md,
                borderRadius: theme.radius.md,
                borderWidth: 1,
                borderColor: theme.colors.danger,
                backgroundColor: theme.colors.dangerMuted,
                marginBottom: theme.spacing.sm,
              }}
            >
              <Text style={{ 
                color: theme.colors.danger, 
                fontWeight: '500',
                fontSize: theme.typography.bodySmall,
                lineHeight: theme.typography.bodySmall * theme.typography.lineHeight.relaxed,
              }}>
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
          </View>

          <Link href="/(auth)/forgot-password" asChild>
            <Pressable style={{ alignSelf: 'flex-end', marginTop: theme.spacing.sm }}>
              <Text style={{ 
                color: theme.colors.primary, 
                fontWeight: '600',
                fontSize: theme.typography.bodySmall,
              }}>
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
            style={{ marginTop: theme.spacing.md }}
          />

          {/* Spacer */}
          <View style={{ height: theme.spacing.lg }} />

          {/* Sign up link */}
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: theme.spacing.xs,
          }}>
            <Text style={{ 
              color: theme.colors.foregroundSecondary, 
              fontWeight: '400',
              fontSize: theme.typography.body,
            }}>
              New here?
            </Text>
            <Link href="/(auth)/register" asChild>
              <Pressable>
                <Text style={{ 
                  color: theme.colors.primary, 
                  fontWeight: '600',
                  fontSize: theme.typography.body,
                }}>
                  Create account
                </Text>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
