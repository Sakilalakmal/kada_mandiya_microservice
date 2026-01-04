"use client"

import * as React from "react"

import styles from "./magic-bento.module.css"
import { cn } from "@/lib/utils"

type MagicBentoProps = {
  children: React.ReactNode
  className?: string
}

export function MagicBento({ children, className }: MagicBentoProps) {
  return <div className={cn(styles.grid, className)}>{children}</div>
}

type MagicBentoCardProps = {
  children: React.ReactNode
  className?: string
}

export function MagicBentoCard({ children, className }: MagicBentoCardProps) {
  return <div className={cn(styles.card, className)}>{children}</div>
}

