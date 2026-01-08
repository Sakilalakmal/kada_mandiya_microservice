"use client";

import * as React from "react";

import { VendorSidebar } from "@/components/vendor-dashboard/VendorSidebar";
import { VendorTopbar } from "@/components/vendor-shell/VendorTopbar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export function VendorShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "18rem",
          "--header-height": "4rem",
        } as React.CSSProperties
      }
    >
      <VendorSidebar />
      <SidebarInset className="min-w-0">
        <VendorTopbar />
        <div className="flex min-w-0 flex-1 flex-col px-4 py-6 md:px-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

