import React from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { useLazyMeQuery, useLoginMutation, useRegisterMutation } from '../../src/api/authApi';
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

const schema = z
  .object({
    name: z.string().trim().min(1, 'Name is required'),
    email: z.string().email('Enter a valid email'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Za-z]/, 'Password must include a letter')
      .regex(/[0-9]/, 'Password must include a number'),
    confirmPassword: z.string().min(8, 'Confirm your password'),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof schema>;

export default function RegisterScreen() {
  const { theme } = useTheme();
  const dispatch = useAppDispatch();

  const [registerUser, registerState] = useRegisterMutation();
  const [login, loginState] = useLoginMutation();
  const [triggerMe] = useLazyMeQuery();
  const [serverError, setServerError] = React.useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);

    try {
      await registerUser({ name: values.name, email: values.email, password: values.password }).unwrap();
      const auth = await login({ email: values.email, password: values.password }).unwrap();
      await setTokens({ accessToken: auth.accessToken, refreshToken: auth.accessToken });

      const me = await triggerMe().unwrap();
      const user = { id: me.payload.sub, email: me.payload.email, name: values.name.trim(), roles: me.payload.roles };
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

  const loading = isSubmitting || registerState.isLoading || loginState.isLoading;

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
          {/* Welcome section */}
          <View style={{ 
            marginBottom: theme.spacing.xl,
            gap: theme.spacing.xs 
          }}>
            <Text style={{ 
              fontSize: theme.typography.displayLarge, 
              fontWeight: '900', 
              color: theme.colors.foreground,
              letterSpacing: -0.5,
            }}>
              Create account
            </Text>
            <Text style={{ 
              fontSize: theme.typography.bodyLarge, 
              fontWeight: '500', 
              color: theme.colors.foregroundSecondary,
              marginTop: theme.spacing.xs,
            }}>
              Start your shopping journey today
            </Text>
          </View>

          {serverError ? (
            <View
              style={{
                padding: theme.spacing.lg,
                borderRadius: theme.radius.lg,
                borderWidth: 0,
                backgroundColor: theme.colors.dangerMuted,
                marginBottom: theme.spacing.sm,
              }}
            >
              <Text style={{ 
                color: theme.colors.danger, 
                fontWeight: '600',
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
              name="name"
              render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                <Input
                  label="Name"
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
          </View>

          <Button 
            label="Create account" 
            size="lg"
            onPress={onSubmit} 
            loading={loading} 
            disabled={loading}
            style={{ marginTop: theme.spacing.lg }}
          />

          {/* Spacer */}
          <View style={{ height: theme.spacing.xl }} />

          {/* Sign in link */}
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: theme.spacing.xs,
          }}>
            <Text style={{ 
              color: theme.colors.foregroundSecondary, 
              fontWeight: '500',
              fontSize: theme.typography.body,
            }}>
              Already have an account?
            </Text>
            <Link href="/(auth)/login" asChild>
              <Pressable>
                <Text style={{ 
                  color: theme.colors.primary, 
                  fontWeight: '700',
                  fontSize: theme.typography.body,
                }}>
                  Sign in
                </Text>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
