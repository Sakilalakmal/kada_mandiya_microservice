import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, Text, View } from 'react-native';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Feather } from '@expo/vector-icons';

import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { useTheme } from '../../providers/ThemeProvider';
import { pickImages, uploadImageAsync } from '../../utils/upload';

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
    .refine(
      (v) => v === undefined || v === '' || (Number.isFinite(Number(v)) && Number(v) >= 0),
      'Stock cannot be negative'
    ),
  images: z.array(z.string().url()).max(8, 'Up to 8 images').default([]),
  specifications: z.array(z.object({ key: z.string().trim(), value: z.string().trim() })).default([]),
});

export type ProductFormValues = z.infer<typeof schema>;

type UploadItem = {
  id: string;
  localUri: string;
  status: 'uploading' | 'done' | 'error';
  progress: number;
  url?: string;
  error?: string;
  asset?: Parameters<typeof uploadImageAsync>[0];
};

type Props = {
  title?: string;
  initialValues?: Partial<ProductFormValues>;
  initialImageUrls?: string[];
  imagesHint?: string;
  errorMessage?: string | null;
  submitLabel: string;
  submitBusy?: boolean;
  onSubmit: (values: ProductFormValues) => Promise<void> | void;
  onCancel: () => void;
};

function createLocalId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeUrlList(urls: string[]) {
  return urls
    .filter((u) => typeof u === 'string' && u.trim().length)
    .map((u) => u.trim())
    .slice(0, 8);
}

export function ProductForm({
  title = 'Product details',
  initialValues,
  initialImageUrls,
  imagesHint,
  errorMessage,
  submitLabel,
  submitBusy,
  onSubmit,
  onCancel,
}: Props) {
  const { theme } = useTheme();
  const [uploads, setUploads] = useState<UploadItem[]>(
    () =>
      normalizeUrlList(initialImageUrls ?? []).map((url, idx) => ({
        id: `remote-${idx}-${url}`,
        localUri: url,
        status: 'done',
        progress: 1,
        url,
      })) ?? []
  );

  const defaultValues = useMemo<ProductFormValues>(
    () => ({
      name: initialValues?.name ?? '',
      description: initialValues?.description ?? '',
      category: initialValues?.category ?? '',
      price: initialValues?.price ?? '',
      currency: initialValues?.currency ?? 'LKR',
      stockQty: initialValues?.stockQty ?? '0',
      images: normalizeUrlList(initialValues?.images ?? initialImageUrls ?? []),
      specifications: initialValues?.specifications ?? [{ key: '', value: '' }],
    }),
    [initialImageUrls, initialValues]
  );

  const {
    control,
    handleSubmit,
    setValue,
    getValues,
    formState: { isSubmitting },
  } = useForm<ProductFormValues>({ resolver: zodResolver(schema), defaultValues });

  const specsArray = useFieldArray({ control, name: 'specifications' });

  const uploadingCount = uploads.filter((u) => u.status === 'uploading').length;
  const busy = Boolean(submitBusy || isSubmitting);
  const canSubmit = uploadingCount === 0 && !busy;

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
    if (!item?.asset) return;

    setUploads((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status: 'uploading', progress: 0, error: undefined } : u))
    );

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

  const addPhotos = async () => {
    const current = getValues('images') ?? [];
    const remaining = Math.max(0, 8 - current.length);
    if (remaining === 0) {
      Alert.alert('Limit reached', 'You can upload up to 8 images.');
      return;
    }

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
            setUploads((prev) => prev.map((u) => (u.id === id ? { ...u, progress: p.progress } : u)));
          },
        });

        setUploads((prev) => prev.map((u) => (u.id === id ? { ...u, status: 'done', url: result.url, progress: 1 } : u)));
        setValue('images', [...(getValues('images') ?? []), result.url], { shouldDirty: true, shouldValidate: true });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Upload failed.';
        setUploads((prev) => prev.map((u) => (u.id === id ? { ...u, status: 'error', error: message } : u)));
      }
    }
  };

  const submit = handleSubmit(async (values) => {
    if (uploadingCount > 0) {
      Alert.alert('Uploading', 'Please wait for uploads to finish.');
      return;
    }
    await onSubmit(values);
  });

  return (
    <View style={{ gap: theme.spacing.lg }}>
      {errorMessage ? (
        <Card style={{ gap: theme.spacing.sm, borderColor: theme.colors.danger }}>
          <Text style={{ color: theme.colors.danger, fontWeight: '800', fontSize: theme.typography.body }}>
            {errorMessage}
          </Text>
        </Card>
      ) : null}

      <Card style={{ gap: theme.spacing.md }}>
        <Text style={{ color: theme.colors.foreground, fontWeight: '900', fontSize: theme.typography.subtitle }}>
          {title}
        </Text>

        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
            <Input label="Name" placeholder="Product name" onBlur={onBlur} value={value} onChangeText={onChange} error={error?.message} />
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
            <Input label="Category (optional)" placeholder="e.g., Grocery" onBlur={onBlur} value={value ?? ''} onChangeText={onChange} error={error?.message} />
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
            <Input label="Stock" placeholder="0" keyboardType="number-pad" onBlur={onBlur} value={value ?? '0'} onChangeText={onChange} error={error?.message} />
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

        {imagesHint ? (
          <Text style={{ color: theme.colors.placeholder, fontWeight: '600', fontSize: theme.typography.body }}>
            {imagesHint}
          </Text>
        ) : null}

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
                      <View
                        style={{
                          height: '100%',
                          width: `${Math.round(u.progress * 100)}%`,
                          backgroundColor: theme.colors.primary,
                        }}
                      />
                    </View>
                  ) : null}
                </View>

                <View style={{ flex: 1, gap: theme.spacing.xs }}>
                  {u.status === 'uploading' ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
                      <ActivityIndicator size="small" color={theme.colors.primary} />
                      <Text style={{ color: theme.colors.placeholder, fontWeight: '700', fontSize: theme.typography.body }}>
                        Uploading... {Math.round(u.progress * 100)}%
                      </Text>
                    </View>
                  ) : u.status === 'done' ? (
                    <Text style={{ color: theme.colors.foreground, fontWeight: '800', fontSize: theme.typography.body }}>
                      Ready
                    </Text>
                  ) : (
                    <Text style={{ color: theme.colors.danger, fontWeight: '800', fontSize: theme.typography.body }}>
                      {u.error ?? 'Upload failed.'}
                    </Text>
                  )}
                </View>

                <View style={{ gap: theme.spacing.xs }}>
                  {u.status === 'error' && u.asset ? (
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
                {uploadingCount} upload{uploadingCount === 1 ? '' : 's'} in progress...
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
                      <Input label={index === 0 ? 'Key' : ' '} placeholder="e.g., Weight" onBlur={onBlur} value={value ?? ''} onChangeText={onChange} />
                    )}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Controller
                    control={control}
                    name={`specifications.${index}.value`}
                    render={({ field: { onChange, onBlur, value } }) => (
                      <Input label={index === 0 ? 'Value' : ' '} placeholder="e.g., 1kg" onBlur={onBlur} value={value ?? ''} onChangeText={onChange} />
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
        <Button label={uploadingCount > 0 ? 'Uploading...' : submitLabel} onPress={submit} loading={busy} disabled={!canSubmit} />
        <Button label="Cancel" variant="ghost" onPress={onCancel} disabled={busy} />
      </View>
    </View>
  );
}

