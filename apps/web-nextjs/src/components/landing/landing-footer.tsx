import Link from "next/link"

import { cn } from "@/lib/utils"

type FooterLink = { label: string; href: string; external?: boolean }

const footerGroups: Array<{ title: string; links: FooterLink[] }> = [
  {
    title: "Product",
    links: [
      { label: "Home", href: "/" },
      { label: "Browse products", href: "/products" },
      { label: "Become a vendor", href: "/become-vendor" },
      { label: "Login", href: "/auth" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Features", href: "/#features" },
      { label: "Cart", href: "/cart" },
      { label: "Favorites", href: "/favorites" },
      { label: "Profile", href: "/profile" },
    ],
  },
  {
    title: "Vendors",
    links: [
      { label: "Vendor dashboard", href: "/vendor/dashboard" },
      { label: "Orders", href: "/orders" },
      { label: "Payments", href: "/payments" },
    ],
  },
]

function FooterLinkItem({ link, className }: { link: FooterLink; className?: string }) {
  const linkClassName = cn(
    "text-sm text-muted-foreground transition-colors hover:text-foreground",
    className
  )

  if (link.external) {
    return (
      <a className={linkClassName} href={link.href} target="_blank" rel="noreferrer">
        {link.label}
      </a>
    )
  }

  return (
    <Link className={linkClassName} href={link.href}>
      {link.label}
    </Link>
  )
}

export function LandingFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-border/60 bg-background">
      <div className="mx-auto max-w-6xl px-6 py-12 sm:px-10">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-5">
            <div className="inline-flex items-center gap-2">
              <span className="rounded-full border border-border/60 bg-card px-3 py-1 text-xs font-semibold tracking-wide text-foreground">
                Kada Mandiya
              </span>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
              A calm, premium marketplace for Sri Lankan shoppers and vendors—built for trust,
              clarity, and smooth checkout.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:col-span-7 lg:grid-cols-3">
            {footerGroups.map((group) => (
              <div key={group.title} className="space-y-3">
                <p className="text-sm font-semibold text-foreground">{group.title}</p>
                <ul className="space-y-2">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <FooterLinkItem link={link} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-border/60 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            © {year} Kada Mandiya. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">Powered by @sakila lakmal</p>
        </div>
      </div>
    </footer>
  )
}
