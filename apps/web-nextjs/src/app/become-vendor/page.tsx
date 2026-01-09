"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Store } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";

import { UploadButton } from "@/lib/uploadthing";
import { apiFetch, type ApiError } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import {
  useVendorDashboardOrdersQuery,
  useVendorDashboardProductsQuery,
  useVendorDashboardProfileQuery,
} from "@/lib/queries/vendorDashboard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

const trimmedOptional = <T extends z.ZodString>(schema: T) =>
  z.preprocess(
    (val) => {
      if (typeof val !== "string") return val;
      const next = val.trim();
      return next.length ? next : undefined;
    },
    schema.optional()
  );

const becomeVendorSchema = z.object({
  storeName: z
    .string()
    .trim()
    .min(2, "Store name is required")
    .max(120, "Store name must be at most 120 characters")
    .transform((v) => v.trim()),
  description: trimmedOptional(
    z.string().max(800, "Description must be at most 800 characters")
  ),
  phone: trimmedOptional(z.string().max(20, "Phone must be at most 20 characters")),
  address: trimmedOptional(z.string().max(255, "Address must be at most 255 characters")),
  shopImageUrl: trimmedOptional(
    z
      .string()
      .max(500, "Image URL must be at most 500 characters")
      .url("Must be a valid URL")
  ),
});

type BecomeVendorFormValues = z.infer<typeof becomeVendorSchema>;

export default function BecomeVendorPage() {
  const router = useRouter();
  const { refreshAuth, setAuthToken, isVendor } = useAuth();
  const profileQuery = useVendorDashboardProfileQuery();
  const ordersQuery = useVendorDashboardOrdersQuery();
  const productsQuery = useVendorDashboardProductsQuery();

  const form = useForm<BecomeVendorFormValues>({
    resolver: zodResolver(becomeVendorSchema),
    defaultValues: {
      storeName: "",
      description: "",
      phone: "",
      address: "",
      shopImageUrl: "",
    },
  });

  const refreshMutation = useMutation({
    mutationFn: async () => {
      return refreshAuth();
    },
    onSuccess: () => {
      toast.success("You are now a vendor");
      router.push("/vendor/dashboard");
      router.refresh();
    },
    onError: (err: ApiError) => {
      if (err?.status === 401) {
        setAuthToken(null);
        router.push("/auth?mode=login");
        return;
      }
      toast.error(err?.message ?? "Failed to refresh session");
    },
  });

  const becomeMutation = useMutation({
    mutationFn: async (values: BecomeVendorFormValues) => {
      return apiFetch("/vendors/become", {
        method: "POST",
        body: {
          storeName: values.storeName,
          description: values.description,
          phone: values.phone,
          address: values.address,
          shopImageUrl: values.shopImageUrl,
        },
      });
    },
    onSuccess: async () => {
      await refreshMutation.mutateAsync();
    },
    onError: (err: ApiError) => {
      if (err?.status === 401) {
        setAuthToken(null);
        router.push("/auth?mode=login");
        return;
      }
      toast.error(err?.message ?? "Could not create vendor profile");
    },
  });

  const isSubmitting = becomeMutation.isPending || refreshMutation.isPending;

  if (isVendor) {
    const vendorName = profileQuery.data?.storeName ?? "Your store";
    const totalOrders = ordersQuery.data?.totalOrders ?? 0;
    const totalProducts = productsQuery.data?.totalProducts ?? 0;

    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-10 sm:px-10">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border bg-card">
                <Store className="h-5 w-5" />
              </div>
              <div>
                <p className="text-base font-semibold">Kada Mandiya (කඩ මණ්ඩිය)</p>
                <p className="text-sm text-muted-foreground">Vendor profile</p>
              </div>
            </div>
            <Button asChild variant="ghost">
              <Link href="/" className="inline-flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Home
              </Link>
            </Button>
          </header>

          <Card className="animate-in border bg-card shadow-sm fade-in slide-in-from-bottom-3 duration-300">
            <CardHeader className="space-y-1">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle className="text-xl">{vendorName}</CardTitle>
                <Badge variant="secondary">Active</Badge>
              </div>
              <CardDescription>
                A quick summary of your store. Manage products and orders from the vendor dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {profileQuery.isLoading || ordersQuery.isLoading || productsQuery.isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : profileQuery.isError || ordersQuery.isError || productsQuery.isError ? (
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>We could not load your vendor summary. Please try again.</p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      profileQuery.refetch();
                      ordersQuery.refetch();
                      productsQuery.refetch();
                    }}
                  >
                    Retry
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-lg border bg-muted/30 p-4">
                      <p className="text-xs font-medium text-muted-foreground">Total products</p>
                      <p className="mt-2 text-2xl font-semibold">{totalProducts}</p>
                    </div>
                    <div className="rounded-lg border bg-muted/30 p-4">
                      <p className="text-xs font-medium text-muted-foreground">Total orders</p>
                      <p className="mt-2 text-2xl font-semibold">{totalOrders}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button asChild>
                      <Link href="/vendor/dashboard">Open dashboard</Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link href="/">Back to home</Link>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-10 px-6 py-10 sm:px-10">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border bg-card">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <p className="text-base font-semibold">Kada Mandiya (කඩ මණ්ඩිය)</p>
              <p className="text-sm text-muted-foreground">Become a vendor</p>
            </div>
          </div>
          <Button asChild variant="ghost">
            <Link href="/" className="inline-flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Home
            </Link>
          </Button>
        </header>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="animate-in border bg-card shadow-sm fade-in slide-in-from-bottom-3 duration-300">
            <CardHeader className="space-y-2">
              <CardTitle className="text-xl">Store details</CardTitle>
              <CardDescription>
                Share a few details to create your vendor profile. You can update most fields later.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                className="space-y-6"
                onSubmit={form.handleSubmit(async (values) => {
                  await becomeMutation.mutateAsync(values);
                })}
              >
                <div className="space-y-2">
                  <Label htmlFor="storeName">Store name</Label>
                  <Input
                    id="storeName"
                    placeholder="Eg: Ella Organics"
                    {...form.register("storeName")}
                  />
                  <p className="text-xs text-muted-foreground">
                    This name appears on your storefront.
                  </p>
                  {form.formState.errors.storeName && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.storeName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <Label htmlFor="description">Description</Label>
                    <span className="text-xs text-muted-foreground">Optional</span>
                  </div>
                  <Textarea
                    id="description"
                    rows={4}
                    className="resize-none"
                    placeholder="Tell customers what makes your shop special (optional)"
                    {...form.register("description")}
                  />
                  <p className="text-xs text-muted-foreground">
                    A short summary customers will see on your store page.
                  </p>
                  {form.formState.errors.description && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.description.message}
                    </p>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <Label htmlFor="phone">Phone</Label>
                      <span className="text-xs text-muted-foreground">Optional</span>
                    </div>
                    <Input
                      id="phone"
                      inputMode="tel"
                      placeholder="+94 7x xxx xxxx"
                      {...form.register("phone")}
                    />
                    <p className="text-xs text-muted-foreground">
                      Used for order coordination if you choose to share it.
                    </p>
                    {form.formState.errors.phone && (
                      <p className="text-xs text-destructive">
                        {form.formState.errors.phone.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <Label htmlFor="address">Address</Label>
                      <span className="text-xs text-muted-foreground">Optional</span>
                    </div>
                    <Input
                      id="address"
                      placeholder="Street, city, district"
                      {...form.register("address")}
                    />
                    <p className="text-xs text-muted-foreground">
                      Helpful for pickup and fulfillment details.
                    </p>
                    {form.formState.errors.address && (
                      <p className="text-xs text-destructive">
                        {form.formState.errors.address.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="shopImageUrl">Shop image</Label>
                      <span className="text-xs text-muted-foreground">(optional)</span>
                    </div>
                    <UploadButton
                      endpoint="imageUploader"
                      onClientUploadComplete={(res) => {
                        const url = res?.[0]?.url;
                        if (!url) {
                          toast.error("Upload failed");
                          return;
                        }
                        form.setValue("shopImageUrl", url, { shouldValidate: true });
                        toast.success("Shop image uploaded");
                      }}
                      onUploadError={(error) => {
                        toast.error(error?.message ?? "Upload failed");
                      }}
                    />
                  </div>
                  <Input
                    id="shopImageUrl"
                    placeholder="https://..."
                    {...form.register("shopImageUrl")}
                  />
                  <p className="text-xs text-muted-foreground">
                    Upload a logo or storefront photo, or paste an image URL.
                  </p>
                  {form.formState.errors.shopImageUrl && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.shopImageUrl.message}
                    </p>
                  )}
                  {form.watch("shopImageUrl") && (
                    <p className="truncate text-xs text-muted-foreground">
                      Image set: {form.watch("shopImageUrl")}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating vendor profile...
                    </>
                  ) : (
                    "Become a vendor"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="border bg-card shadow-sm">
              <CardHeader className="space-y-2">
                <CardTitle>Why sell on Kada Mandiya?</CardTitle>
                <CardDescription>
                  A focused workspace to manage your store with a minimal, confident look.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>Set up your storefront in minutes and start listing products.</p>
                <p>Keep order handling and product edits in one vendor-only dashboard.</p>
                <p>Stay consistent with a clean, black-and-white UI built for daily use.</p>
              </CardContent>
            </Card>

            <Card className="border bg-card shadow-sm">
              <CardHeader className="space-y-1">
                <CardTitle className="text-base">Trust and visibility</CardTitle>
                <CardDescription>
                  Present a clear storefront and a consistent vendor identity.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border bg-card shadow-sm">
              <CardHeader className="space-y-1">
                <CardTitle className="text-base">Order workflow</CardTitle>
                <CardDescription>
                  Track orders, update statuses, and stay on top of fulfillment.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border bg-card shadow-sm">
              <CardHeader className="space-y-1">
                <CardTitle className="text-base">Upload ready</CardTitle>
                <CardDescription>
                  Add a shop image so customers recognize your store instantly.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
