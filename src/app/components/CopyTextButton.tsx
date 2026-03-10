"use client"

import { useEffect, useRef, useState } from "react"

type CopyTextButtonProps = {
  className?: string
  copiedLabel?: string
  label: string
  text: string
}

export default function CopyTextButton({
  className = "",
  copiedLabel = "Copied",
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

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
        status === "copied"
          ? "border-emerald-400/50 bg-emerald-500/10 text-emerald-200"
          : status === "error"
            ? "border-rose-400/50 bg-rose-500/10 text-rose-200"
            : "border-slate-700 bg-slate-900/80 text-slate-200 hover:border-sky-400/40 hover:text-sky-200"
      } ${className}`}
    >
      {buttonLabel}
    </button>
  )
}
