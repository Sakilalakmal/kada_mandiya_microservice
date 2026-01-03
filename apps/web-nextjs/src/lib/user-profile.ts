import { apiFetch } from "@/lib/api";

export type UserProfile = {
  userId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  address: string | null;
  shippingAddress: string | null;
  profileImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UpdateUserProfileInput = Partial<
  Pick<
    UserProfile,
    | "firstName"
    | "lastName"
    | "phone"
    | "address"
    | "shippingAddress"
    | "profileImageUrl"
  >
>;

export function profileDisplayName(profile: UserProfile) {
  const first = profile.firstName?.trim();
  const last = profile.lastName?.trim();
  const full = [first, last].filter(Boolean).join(" ").trim();
  if (full) return full;

  const email = profile.email?.trim();
  if (!email) return "Account";
  const beforeAt = email.split("@")[0]?.trim();
  return beforeAt || email;
}

export async function fetchMe(): Promise<UserProfile> {
  const data = await apiFetch<UserProfile>("/users/me", { method: "GET" });
  return data;
}

export async function updateMe(
  patch: UpdateUserProfileInput
): Promise<UserProfile> {
  const data = await apiFetch<{ profile?: UserProfile } | UserProfile>("/users/me", {
    method: "PUT",
    body: patch,
  });

  if (typeof data === "object" && data !== null && "profile" in data && data.profile) {
    return (data as { profile: UserProfile }).profile;
  }

  return data as UserProfile;
}
