import { apiFetch } from "@/lib/api";

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
  const res = await apiFetch("/users/me", { method: "GET" });
  const data = (await res.json().catch(() => null)) as unknown;

  if (!res.ok) {
    const message = readErrorMessage(data) ?? "Request failed";
    const err = new Error(message) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }

  return data as UserProfile;
}

export async function updateMe(
  patch: UpdateUserProfileInput
): Promise<UserProfile> {
  const res = await apiFetch("/users/me", {
    method: "PUT",
    body: JSON.stringify(patch),
  });
  const data = (await res.json().catch(() => null)) as unknown;

  if (!res.ok) {
    const message = readErrorMessage(data) ?? "Request failed";
    console.error("updateMe failed:", { status: res.status, data });
    const err = new Error(message) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }

  // Backend returns { ok: true, message: string, profile: UserProfile }
  if (isRecord(data) && isRecord(data.profile)) return data.profile as UserProfile;
  return data as UserProfile;
}
