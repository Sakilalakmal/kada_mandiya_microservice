import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, Text, View } from 'react-native';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import { useCreateVendorProductMutation } from '../../../../src/api/vendorProductApi';
import { Header } from '../../../../src/components/layout/Header';
import { Screen } from '../../../../src/components/layout/Screen';
import { Button } from '../../../../src/components/ui/Button';
import { Card } from '../../../../src/components/ui/Card';
import { Input } from '../../../../src/components/ui/Input';
import { useTheme } from '../../../../src/providers/ThemeProvider';
import type { CreateProductRequest } from '../../../../src/types/product.types';
import { getApiErrorMessage } from '../../../../src/utils/apiError';
import { pickImages, uploadImageAsync } from '../../../../src/utils/upload';

const schema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(160, 'Max 160 characters'),
  description: z.string().trim().max(1200, 'Max 1200 characters').optional(),
  category: z.string().trim().max(80, 'Max 80 characters').optional(),
  price: z
    .string()
    .trim()
    .min(1, 'Price is required')
    .refine((v) => Number.isFinite(Number(v)) && Number(v) > 0, 'Price must be greater than 0'),
  currency: z.string().trim().min(1, 'Currency is required').max(10, 'Max 10 characters'),
  stockQty: z
    .string()
    .trim()
    .optional()
    .refine((v) => v === undefined || v === '' || (Number.isFinite(Number(v)) && Number(v) >= 0), 'Stock cannot be negative'),
  images: z.array(z.string().url()).max(8, 'Up to 8 images').default([]),
  specifications: z
    .array(z.object({ key: z.string().trim(), value: z.string().trim() }))
    .default([]),
});

type FormValues = z.infer<typeof schema>;

type UploadItem = {
  id: string;
  localUri: string;
  status: 'uploading' | 'done' | 'error';
  progress: number; // 0..1
  url?: string;
  error?: string;
  asset: Parameters<typeof uploadImageAsync>[0];
};

function createLocalId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export default function CreateVendorProductScreen() {
  const { theme } = useTheme();
  const [createProduct, createState] = useCreateVendorProductMutation();
  const [serverError, setServerError] = useState<string | null>(null);
  const [uploads, setUploads] = useState<UploadItem[]>([]);

  const defaultValues = useMemo<FormValues>(
    () => ({
      name: '',
      description: '',
      category: '',
      price: '',
      currency: 'LKR',
      stockQty: '0',
      images: [],
      specifications: [{ key: '', value: '' }],
    }),
    []
  );

  const {
    control,
    handleSubmit,
    setValue,
    getValues,
    formState: { isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues });

  const specsArray = useFieldArray({ control, name: 'specifications' });

  const uploadingCount = uploads.filter((u) => u.status === 'uploading').length;
  const canSubmit = uploadingCount === 0 && !createState.isLoading && !isSubmitting;

  const addPhotos = async () => {
    setServerError(null);
    const current = getValues('images') ?? [];
    const remaining = Math.max(0, 8 - current.length);
    if (remaining === 0) {
      Alert.alert('Limit reached', 'You can upload up to 8 images.');
      return;
    }

    try {
      const assets = await pickImages({ max: remaining });
      if (!assets.length) return;

      for (const asset of assets) {
        const id = createLocalId();
        const item: UploadItem = {
          id,
          localUri: asset.uri,
          status: 'uploading',
          progress: 0,
          asset,
        };

        setUploads((prev) => [...prev, item]);

        try {
          const result = await uploadImageAsync(asset, {
            onProgress: (p) => {
              setUploads((prev) =>
                prev.map((u) => (u.id === id ? { ...u, progress: p.progress } : u))
              );
            },
          });

          setUploads((prev) =>
            prev.map((u) =>
              u.id === id ? { ...u, status: 'done', url: result.url, progress: 1 } : u
            )
          );

          setValue('images', [...(getValues('images') ?? []), result.url], {
            shouldDirty: true,
            shouldValidate: true,
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Upload failed.';
          setUploads((prev) => prev.map((u) => (u.id === id ? { ...u, status: 'error', error: message } : u)));
        }
      }
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Failed to open image picker.');
    }
  };

  const removeUpload = (id: string) => {
    const item = uploads.find((u) => u.id === id);
    setUploads((prev) => prev.filter((u) => u.id !== id));
    if (item?.url) {
      const next = (getValues('images') ?? []).filter((u) => u !== item.url);
      setValue('images', next, { shouldDirty: true, shouldValidate: true });
    }
  };

  const retryUpload = async (id: string) => {
    const item = uploads.find((u) => u.id === id);
    if (!item) return;
    setUploads((prev) => prev.map((u) => (u.id === id ? { ...u, status: 'uploading', progress: 0, error: undefined } : u)));
    try {
      const result = await uploadImageAsync(item.asset, {
        onProgress: (p) => {
          setUploads((prev) => prev.map((u) => (u.id === id ? { ...u, progress: p.progress } : u)));
        },
      });
      setUploads((prev) => prev.map((u) => (u.id === id ? { ...u, status: 'done', url: result.url, progress: 1 } : u)));
      setValue('images', [...(getValues('images') ?? []), result.url], { shouldDirty: true, shouldValidate: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed.';
      setUploads((prev) => prev.map((u) => (u.id === id ? { ...u, status: 'error', error: message } : u)));
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);

    if (uploadingCount > 0) {
      setServerError('Please wait for uploads to finish.');
      return;
    }

    const payload: CreateProductRequest = {
      name: values.name.trim(),
      description: values.description?.trim() ? values.description.trim() : undefined,
      category: values.category?.trim() ? values.category.trim() : undefined,
      price: Number(values.price),
      currency: values.currency.trim() || 'LKR',
      stockQty: values.stockQty?.trim() ? Math.max(0, Math.floor(Number(values.stockQty))) : 0,
      images: values.images,
    };

    try {
      await createProduct(payload).unwrap();
      Alert.alert('Product created', 'Your product has been saved.');
      router.replace('/(app)/(vendor)/products');
    } catch (err) {
      setServerError(getApiErrorMessage(err));
    }
  });

  return (
    <Screen scroll keyboardAvoiding>
      <Header title="Create product" subtitle="Add details and upload photos." canGoBack />

      <View style={{ marginTop: theme.spacing.lg, gap: theme.spacing.lg }}>
        {serverError ? (
          <Card style={{ gap: theme.spacing.sm, borderColor: theme.colors.danger }}>
            <Text style={{ color: theme.colors.danger, fontWeight: '800', fontSize: theme.typography.body }}>
              {serverError}
            </Text>
          </Card>
        ) : null}

        <Card style={{ gap: theme.spacing.md }}>
          <Text style={{ color: theme.colors.foreground, fontWeight: '900', fontSize: theme.typography.subtitle }}>
            Product details
          </Text>

          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
              <Input
                label="Name"
                placeholder="Product name"
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
                placeholder="Short, clear description"
                multiline
                onBlur={onBlur}
                value={value ?? ''}
                onChangeText={onChange}
                error={error?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="category"
            render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
              <Input
                label="Category (optional)"
                placeholder="e.g., Grocery"
                onBlur={onBlur}
                value={value ?? ''}
                onChangeText={onChange}
                error={error?.message}
              />
            )}
          />

          <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
            <View style={{ flex: 1 }}>
              <Controller
                control={control}
                name="price"
                render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                  <Input
                    label="Price"
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                    onBlur={onBlur}
                    value={value}
                    onChangeText={onChange}
                    error={error?.message}
                  />
                )}
              />
            </View>

            <View style={{ width: 96 }}>
              <Controller
                control={control}
                name="currency"
                render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                  <Input
                    label="Currency"
                    placeholder="LKR"
                    autoCapitalize="characters"
                    onBlur={onBlur}
                    value={value}
                    onChangeText={onChange}
                    error={error?.message}
                  />
                )}
              />
            </View>
          </View>

          <Controller
            control={control}
            name="stockQty"
            render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
              <Input
                label="Stock"
                placeholder="0"
                keyboardType="number-pad"
                onBlur={onBlur}
                value={value ?? '0'}
                onChangeText={onChange}
                error={error?.message}
              />
            )}
          />
        </Card>

        <Card style={{ gap: theme.spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ color: theme.colors.foreground, fontWeight: '900', fontSize: theme.typography.subtitle }}>
              Photos
            </Text>
            <Pressable
              onPress={addPhotos}
              style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }]}
            >
              <Feather name="upload" size={16} color={theme.colors.primary} />
              <Text style={{ color: theme.colors.primary, fontWeight: '800', fontSize: theme.typography.body }}>
                Add photos
              </Text>
            </Pressable>
          </View>

          {uploads.length === 0 ? (
            <Text style={{ color: theme.colors.placeholder, fontWeight: '600', fontSize: theme.typography.body }}>
              Add up to 8 images. Upload starts automatically.
            </Text>
          ) : (
            <View style={{ gap: theme.spacing.sm }}>
              {uploads.map((u) => (
                <View key={u.id} style={{ flexDirection: 'row', gap: theme.spacing.md, alignItems: 'center' }}>
                  <View
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: theme.radius.md,
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                      backgroundColor: theme.colors.background,
                      overflow: 'hidden',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Image source={{ uri: u.localUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                    {u.status === 'uploading' ? (
                      <View
                        style={{
                          position: 'absolute',
                          left: 0,
                          right: 0,
                          bottom: 0,
                          height: 6,
                          backgroundColor: theme.colors.border,
                        }}
                      >
                        <View style={{ height: '100%', width: `${Math.round(u.progress * 100)}%`, backgroundColor: theme.colors.primary }} />
                      </View>
                    ) : null}
                  </View>

                  <View style={{ flex: 1, gap: theme.spacing.xs }}>
                    {u.status === 'uploading' ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
                        <ActivityIndicator size="small" color={theme.colors.primary} />
                        <Text style={{ color: theme.colors.placeholder, fontWeight: '700', fontSize: theme.typography.body }}>
                          Uploading… {Math.round(u.progress * 100)}%
                        </Text>
                      </View>
                    ) : u.status === 'done' ? (
                      <Text style={{ color: theme.colors.foreground, fontWeight: '800', fontSize: theme.typography.body }}>
                        Uploaded
                      </Text>
                    ) : (
                      <Text style={{ color: theme.colors.danger, fontWeight: '800', fontSize: theme.typography.body }}>
                        {u.error ?? 'Upload failed.'}
                      </Text>
                    )}
                  </View>

                  <View style={{ gap: theme.spacing.xs }}>
                    {u.status === 'error' ? (
                      <Pressable onPress={() => retryUpload(u.id)} style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}>
                        <Text style={{ color: theme.colors.primary, fontWeight: '800', fontSize: theme.typography.small }}>
                          Retry
                        </Text>
                      </Pressable>
                    ) : null}
                    <Pressable onPress={() => removeUpload(u.id)} style={({ pressed }) => [{ opacity: pressed ? 0.75 : 1 }]}>
                      <Text style={{ color: theme.colors.placeholder, fontWeight: '800', fontSize: theme.typography.small }}>
                        Remove
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ))}

              {uploadingCount > 0 ? (
                <Text style={{ color: theme.colors.placeholder, fontWeight: '600', fontSize: theme.typography.small }}>
                  {uploadingCount} upload{uploadingCount === 1 ? '' : 's'} in progress…
                </Text>
              ) : null}
            </View>
          )}
        </Card>

        <Card style={{ gap: theme.spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ color: theme.colors.foreground, fontWeight: '900', fontSize: theme.typography.subtitle }}>
              Specifications (optional)
            </Text>
            <Pressable
              onPress={() => specsArray.append({ key: '', value: '' })}
              style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }]}
            >
              <Feather name="plus" size={16} color={theme.colors.primary} />
              <Text style={{ color: theme.colors.primary, fontWeight: '800', fontSize: theme.typography.body }}>
                Add spec
              </Text>
            </Pressable>
          </View>

          {specsArray.fields.length === 0 ? (
            <Text style={{ color: theme.colors.placeholder, fontWeight: '600', fontSize: theme.typography.body }}>
              Add key/value pairs like weight, size, or brand.
            </Text>
          ) : (
            <View style={{ gap: theme.spacing.sm }}>
              {specsArray.fields.map((field, index) => (
                <View key={field.id} style={{ flexDirection: 'row', gap: theme.spacing.sm, alignItems: 'flex-end' }}>
                  <View style={{ flex: 1 }}>
                    <Controller
                      control={control}
                      name={`specifications.${index}.key`}
                      render={({ field: { onChange, onBlur, value } }) => (
                        <Input
                          label={index === 0 ? 'Key' : ' '}
                          placeholder="e.g., Weight"
                          onBlur={onBlur}
                          value={value ?? ''}
                          onChangeText={onChange}
                        />
                      )}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Controller
                      control={control}
                      name={`specifications.${index}.value`}
                      render={({ field: { onChange, onBlur, value } }) => (
                        <Input
                          label={index === 0 ? 'Value' : ' '}
                          placeholder="e.g., 1kg"
                          onBlur={onBlur}
                          value={value ?? ''}
                          onChangeText={onChange}
                        />
                      )}
                    />
                  </View>
                  <Pressable
                    onPress={() => specsArray.remove(index)}
                    style={({ pressed }) => [{ opacity: pressed ? 0.75 : 1, paddingBottom: theme.spacing.xs }]}
                    accessibilityLabel="Remove specification"
                  >
                    <Feather name="trash-2" size={16} color={theme.colors.placeholder} />
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </Card>

        <View style={{ gap: theme.spacing.sm }}>
          <Button
            label={uploadingCount > 0 ? 'Uploading…' : 'Create product'}
            onPress={onSubmit}
            loading={createState.isLoading || isSubmitting}
            disabled={!canSubmit}
          />
          <Button label="Cancel" variant="ghost" onPress={() => router.back()} />
        </View>
      </View>
    </Screen>
  );
}

