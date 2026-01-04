"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

type TiltedCardProps = {
  children: React.ReactNode
  className?: string
  containerClassName?: string
  perspective?: number
  maxTilt?: number
  scale?: number
  glare?: boolean
}

export function TiltedCard({
  children,
  className,
  containerClassName,
  perspective = 1200,
  maxTilt = 10,
  scale = 1.015,
  glare = true,
}: TiltedCardProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const cardRef = React.useRef<HTMLDivElement | null>(null)
  const glareRef = React.useRef<HTMLDivElement | null>(null)
  const rafRef = React.useRef<number | null>(null)
  const latestRef = React.useRef<{ x: number; y: number } | null>(null)
  const disabledRef = React.useRef(false)

  React.useEffect(() => {
    const media = window.matchMedia?.("(prefers-reduced-motion: reduce)")
    if (!media) return
    const update = () => {
      disabledRef.current = media.matches
      if (media.matches) reset()
    }
    update()
    media.addEventListener?.("change", update)
    return () => media.removeEventListener?.("change", update)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const reset = React.useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    latestRef.current = null
    if (cardRef.current) {
      cardRef.current.style.transform = ""
    }
    if (glareRef.current) {
      glareRef.current.style.opacity = "0"
      glareRef.current.style.background = ""
    }
  }, [])

  const apply = React.useCallback(() => {
    rafRef.current = null
    const container = containerRef.current
    const card = cardRef.current
    if (!container || !card) return

    const latest = latestRef.current
    if (!latest) return

    const rect = container.getBoundingClientRect()
    const px = Math.min(Math.max(latest.x - rect.left, 0), rect.width)
    const py = Math.min(Math.max(latest.y - rect.top, 0), rect.height)

    const dx = px / rect.width - 0.5
    const dy = py / rect.height - 0.5

    const tiltY = dx * maxTilt * 2
    const tiltX = -dy * maxTilt * 2

    card.style.transform = `rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(
      2
    )}deg) scale(${scale})`

    const glareEl = glareRef.current
    if (glareEl) {
      glareEl.style.opacity = "1"
      glareEl.style.background = `radial-gradient(circle at ${(
        (px / rect.width) *
        100
      ).toFixed(1)}% ${((py / rect.height) * 100).toFixed(
        1
      )}%, rgba(255,255,255,0.20), transparent 55%)`
    }
  }, [maxTilt, scale])

  const scheduleApply = React.useCallback(() => {
    if (rafRef.current) return
    rafRef.current = requestAnimationFrame(apply)
  }, [apply])

  return (
    <div
      ref={containerRef}
      className={cn("relative [transform-style:preserve-3d]", containerClassName)}
      style={{ perspective }}
      onPointerMove={(event) => {
        if (disabledRef.current) return
        if (event.pointerType && event.pointerType !== "mouse" && event.pointerType !== "pen")
          return
        latestRef.current = { x: event.clientX, y: event.clientY }
        scheduleApply()
      }}
      onPointerLeave={() => reset()}
    >
      <div
        ref={cardRef}
        className={cn(
          "relative h-full w-full will-change-transform transition-transform duration-200 ease-out [transform-style:preserve-3d]",
          className
        )}
      >
        {children}
      </div>
      {glare ? (
        <div
          ref={glareRef}
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-200"
        />
      ) : null}
    </div>
  )
}

