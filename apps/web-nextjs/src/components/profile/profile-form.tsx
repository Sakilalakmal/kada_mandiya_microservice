"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Pencil } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  fetchMe,
  profileDisplayName,
  updateMe,
  type UserProfile,
} from "@/lib/user-profile";
import { clearToken, getToken } from "@/lib/auth";
import {
  resolveProfileImageSrc,
  updateProfileSchema,
  type UpdateProfileFormValues,
} from "@/lib/profile-schema";
import { UploadButton } from "@/lib/uploadthing";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readErrorMessage(data: unknown): string | null {
  if (!isRecord(data)) return null;
  const err = data.error;
  if (isRecord(err) && typeof err.message === "string") return err.message;
  if (typeof data.message === "string") return data.message;
  return null;
}

function toOptionalTrimmedString(value: string | undefined) {
  const trimmed = (value ?? "").trim();
  return trimmed ? trimmed : undefined;
}

function initialsFromName(name: string) {
  const parts = name
    .split(" ")
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0) return "U";
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
  return (first + last).toUpperCase();
}

export function ProfileForm() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const form = useForm<UpdateProfileFormValues>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      address: "",
      shippingAddress: "",
      profileImageUrl: "",
    },
  });

  const token = getToken();
  const {
    data: profile,
    isLoading,
    isFetching,
  } = useQuery<UserProfile | null>({
    queryKey: ["me", token],
    queryFn: async () => {
      if (!token) return null;
      try {
        return await fetchMe();
      } catch (err) {
        const status =
          typeof err === "object" && err !== null && "status" in err
            ? (err as Record<string, unknown>).status
            : undefined;
        if (status === 401) {
          clearToken();
          router.replace("/auth");
          router.refresh();
          throw err;
        }
        toast.error(
          err instanceof Error ? err.message : "Failed to load profile"
        );
        throw err;
      }
    },
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  });

  React.useEffect(() => {
    if (!profile) return;
    form.reset({
      firstName: profile.firstName ?? "",
      lastName: profile.lastName ?? "",
      phone: profile.phone ?? "",
      address: profile.address ?? "",
      shippingAddress: profile.shippingAddress ?? "",
      profileImageUrl: profile.profileImageUrl ?? "",
    });
  }, [form, profile]);

  const mutation = useMutation({
    mutationFn: async (values: UpdateProfileFormValues) => {
      return updateMe({
        firstName: toOptionalTrimmedString(values.firstName),
        lastName: toOptionalTrimmedString(values.lastName),
        phone: toOptionalTrimmedString(values.phone),
        address: toOptionalTrimmedString(values.address),
        shippingAddress: toOptionalTrimmedString(values.shippingAddress),
        profileImageUrl: toOptionalTrimmedString(values.profileImageUrl),
      });
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(["me", token], updated);
      toast.success("Profile updated");
    },
    onError: (err) => {
      const status =
        typeof err === "object" && err !== null && "status" in err
          ? (err as Record<string, unknown>).status
          : undefined;
      if (status === 401) {
        clearToken();
        router.replace("/auth");
        router.refresh();
        return;
      }
      toast.error(
        err instanceof Error ? err.message : "Failed to update profile"
      );
    },
  });

  const photoMutation = useMutation({
    mutationFn: async (url: string) => {
      return updateMe({ profileImageUrl: url });
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(["me", token], updated);
      form.setValue("profileImageUrl", updated.profileImageUrl ?? "");
      toast.success("Profile photo updated");
    },
    onError: (err) => {
      const status =
        typeof err === "object" && err !== null && "status" in err
          ? (err as Record<string, unknown>).status
          : undefined;
      if (status === 401) {
        clearToken();
        router.replace("/auth");
        router.refresh();
        return;
      }
      toast.error(err instanceof Error ? err.message : "Photo upload failed");
    },
  });

  async function onSubmit(values: UpdateProfileFormValues) {
    await mutation.mutateAsync(values);
  }

  if (isLoading || isFetching) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading...
        </CardContent>
      </Card>
    );
  }

  if (!token || !profile) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Please sign in to view and update your profile.
          </p>
          <Button asChild>
            <Link href="/auth">Go to login</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const name = profileDisplayName(profile);
  const initials = initialsFromName(name);
  const avatarSrc = resolveProfileImageSrc(profile.profileImageUrl);

  return (
    <Card className="shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Personal information</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">Manage your account details.</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          className="text-muted-foreground hover:text-foreground"
          onClick={() => document.getElementById("firstName")?.focus()}
        >
          <Pencil className="mr-2 h-4 w-4" />
          Change profile information
        </Button>
      </CardHeader>

      <CardContent>
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-16 w-16">
                <AvatarImage src={avatarSrc} alt={name} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-2 -right-2">
                <UploadButton
                  endpoint="imageUploader"
                  onClientUploadComplete={(res) => {
                    const url = res?.[0]?.url;
                    if (!url) {
                      toast.error("Upload failed");
                      return;
                    }
                    photoMutation.mutate(url);
                  }}
                  onUploadError={(error) => {
                    toast.error(error?.message ?? "Upload failed");
                  }}
                  appearance={{
                    button:
                      "h-9 w-9 rounded-full bg-secondary text-secondary-foreground shadow hover:bg-secondary/90",
                  }}
                  content={{
                    button({ ready }) {
                      if (photoMutation.isPending) {
                        return <Loader2 className="h-4 w-4 animate-spin" />;
                      }
                      return ready ? "Up" : "...";
                    },
                  }}
                />
              </div>
            </div>
            <div className="text-sm">
              <p className="font-medium leading-tight">{name}</p>
              <p className="text-muted-foreground leading-tight">{profile.email}</p>
            </div>
          </div>
        </div>

        <Separator className="my-6" />

        <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First name</Label>
              <Input id="firstName" {...form.register("firstName")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input id="lastName" {...form.register("lastName")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" inputMode="tel" {...form.register("phone")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profileImageUrl">Profile image URL</Label>
              <Input
                id="profileImageUrl"
                placeholder="https://... (optional)"
                {...form.register("profileImageUrl")}
              />
              {form.formState.errors.profileImageUrl && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.profileImageUrl.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                rows={4}
                className="resize-none"
                {...form.register("address")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shippingAddress">Shipping address</Label>
              <Textarea
                id="shippingAddress"
                rows={4}
                className="resize-none"
                {...form.register("shippingAddress")}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Pencil className="mr-2 h-4 w-4" />
              )}
              Update profile
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
