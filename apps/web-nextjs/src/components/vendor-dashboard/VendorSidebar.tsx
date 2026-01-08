"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Boxes, CreditCard, LayoutDashboard, Package } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

const NAV_ITEMS = [
  { href: "/vendor/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/vendor/orders", label: "Orders", icon: Package },
  { href: "/vendor/products", label: "Products", icon: Boxes },
] as const;

export function VendorSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar
      variant="inset"
      collapsible="icon"
      className="border-sidebar-border bg-sidebar text-sidebar-foreground"
    >
      <SidebarHeader className="px-3 py-3">
        <Link
          href="/vendor/dashboard"
          className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-sidebar-accent"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-sidebar-border bg-sidebar-accent text-sidebar-foreground">
            <StoreIcon />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-tight">
              Kada Mandiya (කඩ මණ්ඩිය)
            </p>
            <p className="truncate text-xs text-sidebar-foreground/70">Vendor</p>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarMenu>
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href || (item.href !== "/vendor/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  className="text-sidebar-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground hover:bg-sidebar-accent/70"
                >
                  <Link href={item.href} className="gap-2">
                    <Icon className="h-4 w-4 text-sidebar-foreground/70" />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="px-2 pb-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="text-sidebar-foreground hover:bg-sidebar-accent/70"
              tooltip="Stripe payouts (soon)"
              disabled
            >
              <div className="flex items-center gap-2 opacity-70">
                <CreditCard className="h-4 w-4 text-sidebar-foreground/70" />
                <span>Payouts (soon)</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}

function StoreIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 7h16" />
      <path d="M6 7l1.5-3h9L18 7" />
      <path d="M6 10v10h12V10" />
      <path d="M9 20v-6h6v6" />
    </svg>
  );
}
