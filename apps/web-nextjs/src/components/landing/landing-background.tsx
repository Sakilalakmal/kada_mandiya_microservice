"use client"

import * as React from "react"

import Particles from "@/components/Particles"

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

function useIsDarkTheme() {
  const [isDark, setIsDark] = React.useState(false)

  React.useEffect(() => {
    const root = document.documentElement
    const update = () => setIsDark(root.classList.contains("dark"))
    update()

    const observer = new MutationObserver(update)
    observer.observe(root, { attributes: true, attributeFilter: ["class"] })
    return () => observer.disconnect()
  }, [])

  return isDark
}

export function LandingBackground() {
  const prefersReducedMotion = usePrefersReducedMotion()
  const isDark = useIsDarkTheme()
  const [pixelRatio, setPixelRatio] = React.useState(1)

  React.useEffect(() => {
    setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
  }, [])

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[-10]">
      <div className="absolute inset-0 bg-background" />

      {!prefersReducedMotion && (
        <div className="absolute inset-0 opacity-50 dark:opacity-35">
          <Particles
            className="pointer-events-none"
            particleColors={isDark ? ["#ffffff", "#93c5fd", "#dbeafe"] : ["#0f172a", "#1d4ed8"]}
            particleCount={200}
            particleSpread={10}
            speed={0.1}
            particleBaseSize={100}
            moveParticlesOnHover
            alphaParticles={false}
            disableRotation={false}
            pixelRatio={pixelRatio}
          />
        </div>
      )}
    </div>
  )
}

