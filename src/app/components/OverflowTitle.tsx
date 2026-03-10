"use client"

import type { FocusEvent, MouseEvent, ReactNode } from "react"
import { syncOverflowTitle } from "@/app/lib/overflowTitle"

type OverflowTitleProps = {
  as?: "div" | "span"
  className?: string
  tooltipText?: string
  children: ReactNode
}

export function OverflowTitle({
  as = "span",
  className,
  tooltipText,
  children,
}: OverflowTitleProps) {
  const handleInteraction = (
    event: MouseEvent<HTMLElement> | FocusEvent<HTMLElement>,
  ) => {
    syncOverflowTitle(event.currentTarget, tooltipText)
  }

  const Component = as

  return (
    <Component
      className={className}
      onMouseEnter={handleInteraction}
      onFocus={handleInteraction}
    >
      {children}
    </Component>
  )
}
