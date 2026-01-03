"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Trash2, Upload } from "lucide-react";
import * as React from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { UploadButton } from "@/lib/uploadthing";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";

const MotionButton = motion(Button);

const productFormSchema = z.object({
  name: z
    .string({ message: "Name is required" })
    .trim()
    .min(2, "Name is required")
    .max(160, "Name must be at most 160 characters"),
  description: z.string().max(1200, "Max 1200 characters").optional(),
  category: z.string().max(80, "Max 80 characters").optional(),
  price: z.number({ message: "Price is required" }).positive("Price must be greater than 0"),
  currency: z
    .string({ message: "Currency is required" })
    .trim()
    .min(1, "Currency is required")
    .max(10, "Currency must be at most 10 characters")
    .default("LKR"),
  stockQty: z
    .number({ message: "Stock is required" })
    .int("Stock must be a whole number")
    .min(0, "Stock cannot be negative"),
  images: z.array(z.string().url("Must be a valid URL")).max(8, "Up to 8 images").default([]),
  isActive: z.boolean().optional(),
});

export type ProductFormValues = z.output<typeof productFormSchema>;
type ProductFormInput = z.input<typeof productFormSchema>;

type ProductFormProps = {
  defaultValues?: Partial<ProductFormValues>;
  onSubmit: (values: ProductFormValues) => Promise<void> | void;
  onDeactivate?: () => Promise<void> | void;
  submitLabel?: string;
  isSubmitting?: boolean;
  showStatusToggle?: boolean;
};

export function ProductForm({
  defaultValues,
  onSubmit,
  onDeactivate,
  submitLabel = "Save product",
  isSubmitting,
  showStatusToggle = false,
}: ProductFormProps) {
  const form = useForm<ProductFormInput, undefined, ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
      price: 0,
      currency: "LKR",
      stockQty: 0,
      images: [],
      isActive: true,
      ...defaultValues,
    },
  });

  const images = useWatch({ control: form.control, name: "images" }) ?? [];

  React.useEffect(() => {
    if (!defaultValues) return;
    form.reset({
      name: defaultValues.name ?? "",
      description: defaultValues.description ?? "",
      category: defaultValues.category ?? "",
      price: defaultValues.price ?? 0,
      currency: defaultValues.currency ?? "LKR",
      stockQty: defaultValues.stockQty ?? 0,
      images: defaultValues.images ?? [],
      isActive: defaultValues.isActive ?? true,
    });
  }, [defaultValues, form]);

  const handleSubmit = async (values: ProductFormValues) => {
    const normalizedDescription = values.description?.trim();
    const normalizedCategory = values.category?.trim();
    const normalizedImages = (values.images ?? [])
      .map((url) => url.trim())
      .filter((url) => url.length > 0);

    await onSubmit({
      ...values,
      name: values.name.trim(),
      description: normalizedDescription ? normalizedDescription : undefined,
      category: normalizedCategory ? normalizedCategory : undefined,
      currency: values.currency.trim(),
      images: normalizedImages,
    });
  };

  const submitting = isSubmitting ?? form.formState.isSubmitting;

  const handleUploadComplete = (files: { url?: string; ufsUrl?: string }[]) => {
    const urls = files
      .map((file) => file.url ?? file.ufsUrl)
      .filter((url): url is string => Boolean(url));

    if (!urls.length) {
      toast.error("Upload failed: missing file URL");
      return;
    }

    const current = form.getValues("images") ?? [];
    const remainingSlots = Math.max(0, 8 - current.length);
    const next = [...current, ...urls.slice(0, remainingSlots)];
    form.setValue("images", next, { shouldDirty: true, shouldValidate: true });
    toast.success("Images added");
  };

  const handleUploadError = (message: string) => {
    toast.error(message || "Upload failed");
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          <Card className="border bg-card">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Product details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Product name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Grocery" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add a concise description (optional)"
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          value={field.value ?? ""}
                          onChange={(e) => {
                            const next = e.target.valueAsNumber;
                            field.onChange(Number.isNaN(next) ? undefined : next);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <FormControl>
                        <Input placeholder="LKR" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="stockQty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock quantity</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          inputMode="numeric"
                          min={0}
                          value={field.value ?? ""}
                          onChange={(e) => {
                            const next = e.target.valueAsNumber;
                            field.onChange(Number.isNaN(next) ? undefined : next);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {showStatusToggle ? (
                <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">Active listing</p>
                    <p className="text-xs text-muted-foreground">
                      Toggle visibility for buyers.
                    </p>
                  </div>
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center gap-3 space-y-0">
                        <FormControl>
                          <Switch
                            checked={field.value ?? true}
                            onCheckedChange={(checked) => field.onChange(checked)}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="border bg-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">Images</CardTitle>
              <div className="flex items-center gap-2">
                <UploadButton
                  endpoint="imageUploader"
                  onClientUploadComplete={handleUploadComplete}
                  onUploadError={(err) => handleUploadError(err?.message ?? "Upload failed")}
                  appearance={{
                    button:
                      "px-2 ut-button w-full justify-center rounded-md border border-border bg-foreground text-background hover:bg-foreground/90 ut-ready:shadow-sm ut-uploading:bg-muted ut-uploading:text-foreground ut-uploading:cursor-wait transition active:scale-95",
                  }}
                  content={{
                    button({ isUploading }) {
                      return (
                        <span className="flex items-center gap-2 text-sm font-medium">
                          <Upload className="h-4 w-4" />
                          {isUploading ? "Uploading..." : "Choose image"}
                        </span>
                      );
                    },
                  }}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {images.length === 0 ? (
                <p className="text-sm text-muted-foreground">No images uploaded yet.</p>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-2">
                <AnimatePresence initial={false}>
                  {images.map((url, index) => (
                    <motion.div
                      key={`${url}-${index}`}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.15 }}
                      className="group relative overflow-hidden rounded-lg border bg-muted/40"
                    >
                      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                        {url ? (
                          <Image
                            src={url}
                            alt={`Product image ${index + 1}`}
                            fill
                            sizes="(min-width: 640px) 240px, 45vw"
                            unoptimized
                            className="object-contain transition duration-300 group-hover:scale-[1.02]"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                            Uploading...
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const next = images.filter((_, idx) => idx !== index);
                          form.setValue("images", next, { shouldDirty: true, shouldValidate: true });
                        }}
                        className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-background/80 px-2 py-1 text-xs text-foreground shadow-sm ring-1 ring-border transition hover:bg-background"
                      >
                        <Trash2 className="h-3 w-3" />
                        Remove
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {form.formState.errors.images?.message ? (
                <p className="text-sm text-destructive">
                  {form.formState.errors.images?.message?.toString()}
                </p>
              ) : null}
            </CardContent>
          </Card>
        </motion.div>

        <div className="flex flex-wrap gap-3">
          <MotionButton
            type="submit"
            disabled={submitting}
            whileTap={{ scale: 0.97 }}
            whileHover={{ y: -1 }}
            className={cn("gap-2 active:scale-95", submitting && "opacity-90")}
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitLabel}
          </MotionButton>
          {onDeactivate ? (
            <Button
              type="button"
              variant="outline"
              onClick={onDeactivate}
              className="gap-2 active:scale-95"
            >
              Deactivate
            </Button>
          ) : null}
        </div>
      </form>
    </Form>
  );
}
