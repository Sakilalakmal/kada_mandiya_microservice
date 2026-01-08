"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

import { ThemeToggle } from "@/components/theme-toggle";
import { UserNav } from "@/components/user-nav";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { VendorNotificationBell } from "@/features/notifications/components/vendor-notification-bell";

function getVendorSection(pathname: string) {
  if (!pathname.startsWith("/vendor")) return "Vendor";
  const parts = pathname.split("/").filter(Boolean);
  const section = parts[1] ?? "dashboard";

  if (section === "dashboard") return "Dashboard";
  if (section === "orders") return parts.length > 2 ? "Order details" : "Orders";
  if (section === "products") {
    if (parts[2] === "new") return "New product";
    if (parts[3] === "edit") return "Edit product";
    return "Products";
  }

  return "Vendor";
}

export function VendorTopbar() {
  const pathname = usePathname();
  const section = React.useMemo(() => getVendorSection(pathname ?? ""), [pathname]);

  return (
    <header className="sticky top-0 z-30 flex h-[var(--header-height)] items-center border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex w-full min-w-0 items-center gap-2 px-4 md:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 h-4" />

        <div className="min-w-0">
          <Link href="/vendor/dashboard" className="truncate text-sm font-medium hover:underline">
            Vendor
          </Link>
          <div className="truncate text-xs text-muted-foreground">{section}</div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <VendorNotificationBell />
          <UserNav />
        </div>
      </div>
    </header>
  );
}

