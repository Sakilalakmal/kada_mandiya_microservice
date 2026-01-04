"use client"

import * as React from "react"
import { motion, useMotionValue, useTransform } from "motion/react"

import styles from "./stack.module.css"
import { cn } from "@/lib/utils"

type AnimationConfig = {
  stiffness: number
  damping: number
}

type StackProps = {
  cards: React.ReactNode[]
  randomRotation?: boolean
  sensitivity?: number
  animationConfig?: AnimationConfig
  sendToBackOnClick?: boolean
  autoplay?: boolean
  autoplayDelay?: number
  pauseOnHover?: boolean
  mobileClickOnly?: boolean
  mobileBreakpoint?: number
  className?: string
  cardClassName?: string
}

type StackCard = {
  id: number
  content: React.ReactNode
  rotateZ: number
}

function seededRotation(index: number) {
  const seed = Math.sin((index + 1) * 999) * 10000
  const frac = seed - Math.floor(seed)
  return frac * 8 - 4
}

type CardRotateProps = {
  children: React.ReactNode
  onSendToBack: () => void
  sensitivity: number
  disableDrag?: boolean
}

function CardRotate({ children, onSendToBack, sensitivity, disableDrag }: CardRotateProps) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotateX = useTransform(y, [-100, 100], [18, -18])
  const rotateY = useTransform(x, [-100, 100], [-18, 18])

  function handleDragEnd(_: unknown, info: { offset: { x: number; y: number } }) {
    if (Math.abs(info.offset.x) > sensitivity || Math.abs(info.offset.y) > sensitivity) {
      onSendToBack()
      x.set(0)
      y.set(0)
      return
    }

    x.set(0)
    y.set(0)
  }

  if (disableDrag) {
    return (
      <div className={styles.cardRotateDisabled} style={{ transform: "translate3d(0,0,0)" }}>
        {children}
      </div>
    )
  }

  return (
    <motion.div
      className={styles.cardRotate}
      style={{ x, y, rotateX, rotateY }}
      drag
      dragConstraints={{
        left: -Math.max(220, Math.round(sensitivity * 1.6)),
        right: Math.max(220, Math.round(sensitivity * 1.6)),
        top: -Math.max(220, Math.round(sensitivity * 1.6)),
        bottom: Math.max(220, Math.round(sensitivity * 1.6)),
      }}
      dragElastic={0.45}
      dragMomentum={false}
      whileTap={{ cursor: "grabbing" }}
      onDragEnd={handleDragEnd}
    >
      {children}
    </motion.div>
  )
}

export function Stack({
  cards,
  randomRotation = false,
  sensitivity = 160,
  animationConfig = { stiffness: 240, damping: 26 },
  sendToBackOnClick = false,
  autoplay = false,
  autoplayDelay = 3000,
  pauseOnHover = false,
  mobileClickOnly = false,
  mobileBreakpoint = 768,
  className,
  cardClassName,
}: StackProps) {
  const [isMobile, setIsMobile] = React.useState(false)
  const [isPaused, setIsPaused] = React.useState(false)

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < mobileBreakpoint)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [mobileBreakpoint])

  const shouldDisableDrag = mobileClickOnly && isMobile
  const shouldEnableClick = sendToBackOnClick || shouldDisableDrag

  const [stack, setStack] = React.useState<StackCard[]>(() => {
    const built = cards.map((content, index) => ({
      id: index + 1,
      content,
      rotateZ: randomRotation ? seededRotation(index) : 0,
    }))

    // Match React Bits feel: first card starts on top (last in DOM order).
    return built.reverse()
  })

  React.useEffect(() => {
    const built = cards.map((content, index) => ({
      id: index + 1,
      content,
      rotateZ: randomRotation ? seededRotation(index) : 0,
    }))

    setStack(built.reverse())
  }, [cards, randomRotation])

  const sendToBack = React.useCallback((id: number) => {
    setStack((prev) => {
      const next = [...prev]
      const index = next.findIndex((card) => card.id === id)
      const [card] = next.splice(index, 1)
      next.unshift(card)
      return next
    })
  }, [])

  React.useEffect(() => {
    if (!autoplay || stack.length < 2 || isPaused) return
    const interval = setInterval(() => {
      const topCardId = stack[stack.length - 1]?.id
      if (topCardId) sendToBack(topCardId)
    }, autoplayDelay)
    return () => clearInterval(interval)
  }, [autoplay, autoplayDelay, isPaused, sendToBack, stack])

  return (
    <div
      className={cn(styles.container, className)}
      onMouseEnter={() => pauseOnHover && setIsPaused(true)}
      onMouseLeave={() => pauseOnHover && setIsPaused(false)}
    >
      {stack.map((card, index) => {
        const depth = stack.length - index - 1
        const clampedDepth = Math.min(Math.max(depth, 0), 3)
        const offset = clampedDepth * 14
        const scale = 1 - clampedDepth * 0.05

        return (
          <CardRotate
            key={card.id}
            onSendToBack={() => sendToBack(card.id)}
            sensitivity={sensitivity}
            disableDrag={shouldDisableDrag}
          >
            <motion.div
              className={cn(styles.card, cardClassName)}
              onClick={() => shouldEnableClick && sendToBack(card.id)}
              animate={{
                x: offset,
                y: offset,
                rotateZ: depth * 3 + card.rotateZ,
                scale,
                transformOrigin: "90% 90%",
                opacity: clampedDepth === 0 ? 1 : 0.95,
              }}
              initial={false}
              transition={{
                type: "spring",
                stiffness: animationConfig.stiffness,
                damping: animationConfig.damping,
              }}
            >
              {card.content}
            </motion.div>
          </CardRotate>
        )
      })}
    </div>
  )
}
