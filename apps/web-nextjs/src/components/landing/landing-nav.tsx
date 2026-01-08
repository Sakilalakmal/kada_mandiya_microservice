"use client";

import Link from "next/link";

import { useAuth } from "@/hooks/use-auth";

export function LandingNav() {
  const { token, isVendor } = useAuth();

  return (
    <nav className="hidden items-center gap-6 text-sm font-medium text-foreground/80 md:flex">
      <a className="hover:text-foreground" href="#features">
        Products
      </a>
      <Link className="hover:text-foreground" href="/orders">
        Orders
      </Link>
      <Link className="hover:text-foreground" href="/payments">
        Payments
      </Link>
      {token && isVendor ? (
        <Link className="hover:text-foreground" href="/vendor/dashboard">
          Dashboard
        </Link>
      ) : null}
      <a className="hover:text-foreground" href="#features">
        Support
      </a>
    </nav>
  );
}
