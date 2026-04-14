"use client"

import { useEffect, useRef, useState } from "react"

type CopyTextButtonProps = {
  className?: string
  copiedLabel?: string
  iconOnly?: boolean
  label: string
  text: string
}

export default function CopyTextButton({
  className = "",
  copiedLabel = "Copied",
  iconOnly = false,
  label,
  text,
}: CopyTextButtonProps) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle")
  const timeoutRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setStatus("copied")
    } catch {
      setStatus("error")
    }

    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = window.setTimeout(() => {
      setStatus("idle")
      timeoutRef.current = null
    }, 1800)
  }

  const buttonLabel = status === "copied"
    ? copiedLabel
    : status === "error"
      ? "Copy failed"
      : label

  const buttonStateClass = status === "copied"
    ? "border-emerald-400/50 bg-emerald-500/10 text-emerald-200"
    : status === "error"
      ? "border-rose-400/50 bg-rose-500/10 text-rose-200"
      : "border-slate-700 bg-slate-900/80 text-slate-200 hover:border-sky-400/40 hover:text-sky-200"

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={buttonLabel}
      title={buttonLabel}
      className={`rounded-lg border font-semibold transition ${buttonStateClass} ${
        iconOnly ? "flex h-9 w-9 items-center justify-center px-0 py-0" : "px-3 py-1.5 text-xs"
      } ${className}`}
    >
      {iconOnly ? (
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
        >
          <rect x="9" y="9" width="11" height="11" rx="2" />
          <path d="M5 15V6a2 2 0 0 1 2-2h9" />
        </svg>
      ) : (
        buttonLabel
      )}
    </button>
  )
}
