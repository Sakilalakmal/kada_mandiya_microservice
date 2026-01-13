"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Home } from "lucide-react";

import { VendorShellLayout } from "@/components/vendor-shell/VendorShellLayout";
import { LogoutButton } from "@/components/logout-button";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

function VendorGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { token, isVendor } = useAuth();

  React.useEffect(() => {
    if (!token) {
      router.replace(`/auth?mode=login&next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (token && !isVendor) {
      router.replace("/become-vendor");
    }
  }, [isVendor, pathname, router, token]);

  if (!token || !isVendor) {
    return (
      <div className="min-h-svh bg-background text-foreground">
        <div className="mx-auto flex min-h-svh max-w-3xl flex-col items-center justify-center gap-4 px-6 py-12 text-center">
          <div className="h-10 w-10 animate-pulse rounded-2xl bg-muted" />
          <p className="text-sm text-muted-foreground">Preparing your vendor dashboard…</p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="outline" onClick={() => router.push("/")}>
              <Home className="mr-2 h-4 w-4" />
              Home
            </Button>
            {token ? (
              <LogoutButton redirectTo="/auth?mode=login" />
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  return (
    <VendorGate>
      <div className="min-h-svh bg-background text-foreground">
        <VendorShellLayout>{children}</VendorShellLayout>
      </div>
    </VendorGate>
  );
}

