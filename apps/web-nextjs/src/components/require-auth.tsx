"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";

import { buildAuthRedirectUrl, getAccessToken, getCurrentPathWithQuery } from "@/lib/auth-client";

export function RequireAuth({
  children,
  nextPath,
}: {
  children: React.ReactNode;
  nextPath?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const token = getAccessToken();
  const isAuthPage = pathname?.startsWith("/auth");

  React.useEffect(() => {
    if (isAuthPage) return;
    if (token) return;

    const next = nextPath ?? getCurrentPathWithQuery();
    router.replace(buildAuthRedirectUrl(next));
  }, [isAuthPage, nextPath, router, token]);

  if (isAuthPage) return <>{children}</>;
  if (!token) return null;
  return <>{children}</>;
}

