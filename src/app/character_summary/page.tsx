"use client"

import { useEffect, useState } from "react"
import talent_data from "@/app/data/talent_data"

const STORAGE_KEY = "selectedTalents"

export default function TalentsPage() {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [totalStats, setTotalStats] = useState<Record<string, number>>({})

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = new Set<string>(JSON.parse(stored))
        setSelected(parsed)
      } catch {}
    }
  }, [])

  useEffect(() => {
    const stats: Record<string, number> = {}
    for (const [name, data] of Object.entries(talent_data)) {
      if (!selected.has(name)) continue
      for (const [stat, value] of Object.entries(data.stats)) {
        stats[stat] = (stats[stat] || 0) + value
      }
    }
    setTotalStats(stats)
  }, [selected])

  return (
    <div className="p-4 space-y-2">
      <h1 className="text-xl font-bold">Talent Summary</h1>
      <div>
        {Object.entries(totalStats).map(([stat, value]) => (
          <div key={stat} className="flex gap-2 whitespace-nowrap">
            <span className="font-mono min-w-[10rem]">{stat}</span>
            <span className="font-bold">{Math.round(value * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
