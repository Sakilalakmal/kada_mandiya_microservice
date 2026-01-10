import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { useLazyMeQuery, useRefreshMutation } from '../../../src/api/authApi';
import { useBecomeVendorMutation, useLazyGetMyVendorProfileQuery } from '../../../src/api/vendorApi';
import { Screen } from '../../../src/components/layout/Screen';
import { Button } from '../../../src/components/ui/Button';
import { Input } from '../../../src/components/ui/Input';
import { useTheme } from '../../../src/providers/ThemeProvider';
import { setUser } from '../../../src/store/authSlice';
import { useAppDispatch } from '../../../src/store/hooks';
import type { VendorApplication } from '../../../src/types/vendor.types';
import { getApiErrorMessage } from '../../../src/utils/apiError';
import { setTokens } from '../../../src/utils/tokenStorage';

const schema = z.object({
  storeName: z.string().trim().min(1, 'Store name is required'),
  description: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  address: z.string().trim().optional(),
  shopImageUrl: z.string().trim().url('Enter a valid URL').optional().or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;

export default function BecomeVendorScreen() {
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverSuccess, setServerSuccess] = useState<string | null>(null);

  const [becomeVendor, becomeState] = useBecomeVendorMutation();
  const [refresh] = useRefreshMutation();
  const [triggerMe] = useLazyMeQuery();
  const [triggerVendor] = useLazyGetMyVendorProfileQuery();

  const defaultValues = useMemo<FormValues>(
    () => ({
      storeName: '',
      description: '',
      phone: '',
      address: '',
      shopImageUrl: '',
    }),
    []
  );

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    setServerSuccess(null);

    const payload: VendorApplication = {
      storeName: values.storeName,
      description: values.description?.trim() ? values.description.trim() : undefined,
      phone: values.phone?.trim() ? values.phone.trim() : undefined,
      address: values.address?.trim() ? values.address.trim() : undefined,
      shopImageUrl: values.shopImageUrl?.trim() ? values.shopImageUrl.trim() : undefined,
    };

    try {
      const result = await becomeVendor(payload).unwrap();
      await triggerVendor().unwrap();
      setServerSuccess(result.message);

      const refreshed = await refresh().unwrap();
      await setTokens({ accessToken: refreshed.accessToken, refreshToken: refreshed.accessToken });

      const me = await triggerMe().unwrap();
      dispatch(setUser({ id: me.payload.sub, email: me.payload.email, roles: me.payload.roles }));
      router.replace('/(app)/(vendor)/(tabs)/dashboard');
    } catch (err) {
      setServerError(getApiErrorMessage(err));
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
          contentContainerStyle={{ flexGrow: 1, gap: theme.spacing.lg }}
        >
          <Text style={{ fontSize: 22, fontWeight: '800', color: theme.colors.foreground }}>
            Become a Vendor
          </Text>
          <Text style={{ color: theme.colors.placeholder, fontWeight: '600' }}>
            Create your vendor profile. Your account will be upgraded to vendor.
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

          {serverSuccess ? (
            <View
              style={{
                padding: theme.spacing.md,
                borderRadius: theme.radius.md,
                borderWidth: 1,
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.muted,
              }}
            >
              <Text style={{ color: theme.colors.foreground, fontWeight: '700' }}>{serverSuccess}</Text>
            </View>
          ) : null}

          <Controller
            control={control}
            name="storeName"
            render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
              <Input
                label="Store name"
                placeholder="Kada Mandiya Store"
                onBlur={onBlur}
                value={value}
                onChangeText={onChange}
                error={error?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
              <Input
                label="Description (optional)"
                placeholder="What do you sell?"
                onBlur={onBlur}
                value={value}
                onChangeText={onChange}
                error={error?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
              <Input
                label="Phone (optional)"
                placeholder="+94 77 123 4567"
                keyboardType="phone-pad"
                onBlur={onBlur}
                value={value}
                onChangeText={onChange}
                error={error?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="address"
            render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
              <Input
                label="Address (optional)"
                placeholder="City, Street, No."
                onBlur={onBlur}
                value={value}
                onChangeText={onChange}
                error={error?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="shopImageUrl"
            render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
              <Input
                label="Shop image URL (optional)"
                placeholder="https://example.com/image.jpg"
                autoCapitalize="none"
                keyboardType="url"
                onBlur={onBlur}
                value={value}
                onChangeText={onChange}
                error={error?.message}
              />
            )}
          />

          <View style={{ flex: 1 }} />

          <View style={{ gap: theme.spacing.sm }}>
            <Button
              label="Submit"
              onPress={onSubmit}
              loading={isSubmitting || becomeState.isLoading}
              disabled={becomeState.isLoading}
            />
            <Button label="Cancel" variant="ghost" onPress={() => router.back()} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

