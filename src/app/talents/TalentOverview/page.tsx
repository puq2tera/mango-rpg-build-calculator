"use client"

import { useEffect, useState } from "react"
import talent_data from "@/app/data/talent_data"

const STORAGE_KEY = "selectedTalents"

const headerLabels = [
  "Name", "PreReq", "Tag", "BlockedTag",
  "Gold", "Exp", "TP", "Lvl",
  "Tank", "Warrior", "Caster", "Healer",
  "Description"
]

function measureTextWidth(text: string, font = "14px Inter"): number {
  const canvas = document.createElement("canvas")
  const context = canvas.getContext("2d")!
  context.font = font
  return context.measureText(text).width
}

export default function TalentOverview() {
  const [colWidths, setColWidths] = useState<string[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    try {
      setSelected(stored ? new Set(JSON.parse(stored)) : new Set())
    } catch {
      setSelected(new Set())
    }
  }, [])

  useEffect(() => {
    const font = "14px Inter"
    const longest: number[] = headerLabels.map(label => measureTextWidth(label, font))

    for (const [name, t] of Object.entries(talent_data)) {
      if (!selected.has(name)) continue
      const values = [
        name, t.PreReq, t.Tag, t.BlockedTag,
        String(t.gold), String(t.exp), String(t.tp_spent), String(t.total_level),
        String(t.class_levels.tank_levels),
        String(t.class_levels.warrior_levels),
        String(t.class_levels.caster_levels),
        String(t.class_levels.healer_levels),
        t.description
      ]

      values.forEach((val, i) => {
        const width = measureTextWidth(val ?? "", font)
        if (width > longest[i]) longest[i] = width
      })
    }

    const calculated = longest.map(w => `${Math.ceil(w + 56)}px`)
    setColWidths(calculated)
  }, [selected])

  if (colWidths.length === 0) return <div className="p-4">Loading...</div>

  return (
    <div className="h-[80vh] overflow-y-auto border rounded-md">
      <div
        className="sticky top-0 z-10 bg-white border-b py-2 grid gap-x-0"
        style={{ gridTemplateColumns: colWidths.join(" ") }}
      >
        {headerLabels.map((label, i) => (
          <div
            key={i}
            className="px-2 font-bold whitespace-nowrap border-r border-black last:border-r-0 box-border"
          >
            {label}
          </div>
        ))}
      </div>

      <div className="space-y-0.5">
        {Array.from(selected).map((name) => {
          const t = talent_data[name]
          const values = [
            name, t.PreReq, t.Tag, t.BlockedTag,
            t.gold, t.exp, t.tp_spent, t.total_level,
            t.class_levels.tank_levels,
            t.class_levels.warrior_levels,
            t.class_levels.caster_levels,
            t.class_levels.healer_levels,
            t.description
          ]
          return (
            <div
              key={name}
              className="grid border-b hover:bg-gray-100 transition"
              style={{ gridTemplateColumns: colWidths.join(" ") }}
            >
              {values.map((val, i) => (
                <span
                  key={i}
                  className="px-3 py-1 whitespace-nowrap border-r border-gray-300 last:border-r-0 box-border"
                >
                  {val}
                </span>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
