"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles, Store } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";

import { UploadButton } from "@/lib/uploadthing";
import { apiFetch, type ApiError } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#050507] via-[#0b0b12] to-[#120f24] text-slate-50">
        <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-10 sm:px-10">
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#c4b5fd]/10 text-[#c4b5fd]">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-[#c4b5fd]">
                  Kada Mandiya
                </p>
                <p className="text-lg font-semibold text-white">You are already a vendor</p>
              </div>
            </div>
            <Button asChild variant="outline" className="border-[#c4b5fd]/40 text-[#c4b5fd]">
              <Link href="/vendor/dashboard">Go to dashboard</Link>
            </Button>
          </header>

          <Card className="border-[#c4b5fd]/30 bg-[#0f0c1a]/80 text-slate-100 shadow-lg backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Store className="h-5 w-5 text-[#c4b5fd]" />
                Vendor profile active
              </CardTitle>
              <CardDescription className="text-slate-300">
                Continue to your vendor dashboard to add products and manage your store.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Button asChild className="bg-[#c4b5fd] text-slate-900 hover:bg-[#b7a4ff]">
                <Link href="/vendor/dashboard">Open dashboard</Link>
              </Button>
              <Button asChild variant="outline" className="border-white/20 text-white">
                <Link href="/">Back to home</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#050507] via-[#0b0b12] to-[#120f24] text-slate-50">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-10 px-6 py-10 sm:px-10">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#c4b5fd]/10 text-[#c4b5fd]">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-[#c4b5fd]">
                Kada Mandiya
              </p>
              <p className="text-lg font-semibold text-white">Start to sell</p>
              <p className="text-sm text-slate-300">
                Create your vendor profile to unlock the dashboard.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="outline"
              className="border-[#c4b5fd]/40 text-[#c4b5fd] hover:bg-[#c4b5fd]/10"
            >
              <Link href="/" className="inline-flex items-center gap-2">
                <Store className="h-4 w-4" />
                Home
              </Link>
            </Button>
          </div>
        </header>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-[#c4b5fd]/30 bg-[#0f0c1a]/80 text-slate-100 shadow-lg backdrop-blur">
            <CardHeader className="space-y-2">
              <CardTitle className="flex items-center gap-2 text-xl text-white">
                <Store className="h-5 w-5 text-[#c4b5fd]" />
                Become a vendor
              </CardTitle>
              <CardDescription className="text-slate-300">
                Share your store details and upload a shop image to get started.
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
                  {form.formState.errors.storeName && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.storeName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    rows={4}
                    className="resize-none"
                    placeholder="Tell customers what makes your shop special (optional)"
                    {...form.register("description")}
                  />
                  {form.formState.errors.description && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.description.message}
                    </p>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      inputMode="tel"
                      placeholder="+94 7x xxx xxxx"
                      {...form.register("phone")}
                    />
                    {form.formState.errors.phone && (
                      <p className="text-xs text-destructive">
                        {form.formState.errors.phone.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      placeholder="Street, city, district"
                      {...form.register("address")}
                    />
                    {form.formState.errors.address && (
                      <p className="text-xs text-destructive">
                        {form.formState.errors.address.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="shopImageUrl">Shop image</Label>
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
                  {form.formState.errors.shopImageUrl && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.shopImageUrl.message}
                    </p>
                  )}
                  {form.watch("shopImageUrl") && (
                    <p className="truncate text-xs text-[#c4b5fd]">
                      Image set: {form.watch("shopImageUrl")}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[#c4b5fd] text-slate-900 hover:bg-[#b7a4ff]"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating vendor profile...
                    </>
                  ) : (
                    "Become a Vendor"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-[#c4b5fd]/30 bg-gradient-to-b from-[#18122d] to-[#0f0c1a] text-slate-100 shadow-lg">
            <CardHeader className="space-y-2">
              <CardTitle className="text-white">Why sell on Kada Mandiya?</CardTitle>
              <CardDescription className="text-slate-300">
                A focused workspace to manage your store with a minimal, confident look.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-200">
              <div className="rounded-xl border border-white/5 bg-white/5 p-4">
                <p className="font-medium text-[#c4b5fd]">Reach shoppers fast</p>
                <p className="mt-1 text-slate-300">
                  Your products surface through the API gateway with JWT-protected requests.
                </p>
              </div>
              <div className="rounded-xl border border-white/5 bg-white/5 p-4">
                <p className="font-medium text-[#c4b5fd]">Track with clarity</p>
                <p className="mt-1 text-slate-300">
                  Clean dashboards and vendor-only routes keep your operations separate.
                </p>
              </div>
              <div className="rounded-xl border border-white/5 bg-white/5 p-4">
                <p className="font-medium text-[#c4b5fd]">Upload ready</p>
                <p className="mt-1 text-slate-300">
                  UploadThing is wired in - drop your shop photo and go live.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
