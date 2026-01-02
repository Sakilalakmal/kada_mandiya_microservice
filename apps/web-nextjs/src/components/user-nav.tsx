"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { UserRound } from "lucide-react";

import {
  fetchMe,
  profileDisplayName,
  type UserProfile,
} from "@/lib/user-profile";
import { resolveProfileImageSrc } from "@/lib/profile-schema";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";

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

function errorStatus(err: unknown): number | undefined {
  if (typeof err !== "object" || err === null) return undefined;
  if (!("status" in err)) return undefined;
  const status = (err as Record<string, unknown>).status;
  return typeof status === "number" ? status : undefined;
}

export function UserNav() {
  const { token, setAuthToken } = useAuth();

  const { data: profile, isFetching } = useQuery<UserProfile | null>({
    queryKey: ["me", token],
    queryFn: async () => {
      if (!token) return null;
      try {
        return await fetchMe();
      } catch (err) {
        if (errorStatus(err) === 401) {
          setAuthToken(null);
          return null;
        }
        throw err;
      }
    },
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  });

  const name = profile ? profileDisplayName(profile) : "Account";
  const initials = initialsFromName(name);

  return (
    <Link
      href="/profile"
      aria-busy={isFetching}
      className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-2 py-1 text-white backdrop-blur transition-colors hover:bg-white/20"
    >
      <Avatar className="h-8 w-8 border border-white/20">
        <AvatarImage
          src={resolveProfileImageSrc(profile?.profileImageUrl)}
          alt={name}
        />
        <AvatarFallback className="bg-white/25 text-slate-900">
          {initials}
        </AvatarFallback>
      </Avatar>
      <span className="hidden max-w-[10rem] truncate text-sm font-medium sm:block">
        {name}
      </span>
      <UserRound className="hidden h-4 w-4 opacity-80 sm:block" />
    </Link>
  );
}
