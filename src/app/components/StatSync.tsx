// components/StatSync.tsx
"use client"

import { useEffect } from "react"
import talent_data from "@/app/data/talent_data"
export default function StatSync() {

  useEffect(() => {
    const observer = () => {
      const raw = localStorage.getItem("selectedTalents")
      if (!raw) return
      try {
        const selected = new Set<string>(JSON.parse(raw))
        const stats: Record<string, number> = {}
        for (const [name, data] of Object.entries(talent_data)) {
          if (!selected.has(name)) continue
          for (const [stat, value] of Object.entries(data.stats)) {
            stats[stat] = (stats[stat] || 0) + value
          }
        }
        localStorage.setItem("computedStats", JSON.stringify(stats))
      } catch {}
    }

    window.addEventListener("storage", observer)
    observer() // run once on mount
    return () => window.removeEventListener("storage", observer)
  }, [])

  return (null);
}
