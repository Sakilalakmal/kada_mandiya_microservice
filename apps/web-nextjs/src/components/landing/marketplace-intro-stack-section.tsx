"use client"

import Image from "next/image"
import * as React from "react"

import { Stack } from "@/components/react-bits/stack"

function usePrefersReducedMotion() {
  const [reduced, setReduced] = React.useState(false)

  React.useEffect(() => {
    const media = window.matchMedia?.("(prefers-reduced-motion: reduce)")
    if (!media) return
    const update = () => setReduced(media.matches)
    update()
    media.addEventListener?.("change", update)
    return () => media.removeEventListener?.("change", update)
  }, [])

  return reduced
}

export function MarketplaceIntroStackSection() {
  const prefersReducedMotion = usePrefersReducedMotion()

  // TODO: If you move images out of `/public`, swap these for imported assets.
  const cards = [
    <div
      key="kada-mandiya-2"
      className="relative h-full w-full overflow-hidden rounded-3xl border border-border shadow-sm dark:shadow-[0_14px_50px_rgba(59,130,246,0.08)]"
    >
      <Image
        src="/kada_mandiya_2.png"
        alt="Kada Mandiya marketplace view"
        fill
        className="object-cover"
        sizes="(min-width: 1024px) 440px, 90vw"
        priority={false}
      />
    </div>,
    <div
      key="landing-kadamandiya"
      className="relative h-full w-full overflow-hidden rounded-3xl border border-border shadow-sm dark:shadow-[0_14px_50px_rgba(59,130,246,0.08)]"
    >
      <Image
        src="/landing-kadamandiya.png"
        alt="Kada Mandiya storefront and shopping experience"
        fill
        className="object-cover"
        sizes="(min-width: 1024px) 440px, 90vw"
        priority={false}
      />
    </div>,
  ] as const

  return (
    <section className="mx-auto max-w-6xl px-6 py-16 sm:px-10">
      <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
        <div className="mx-auto w-full max-w-md">
          <div className="relative h-[360px] w-full rounded-[2rem] p-3 sm:p-4 md:h-[420px]">
            <Stack
              cards={[...cards]}
              randomRotation={!prefersReducedMotion}
              sendToBackOnClick
              sensitivity={150}
              animationConfig={prefersReducedMotion ? { stiffness: 180, damping: 34 } : undefined}
              autoplay={false}
              pauseOnHover
              className="h-full"
              cardClassName="h-full w-full"
            />
          </div>
        </div>

        <div className="mx-auto w-full max-w-xl">
          <h2 className="text-pretty text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl">
            Empowering Sri Lankan commerce, locally and globally
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            We are a modern e-commerce platform built to support Sri Lankan vendors, strengthen
            local businesses, and showcase the country’s unique products to the world. By connecting
            trusted sellers with local and international customers, we help drive sustainable
            growth, support tourism-driven commerce, and contribute to Sri Lanka’s evolving digital
            economy.
          </p>
        </div>
      </div>
    </section>
  )
}
