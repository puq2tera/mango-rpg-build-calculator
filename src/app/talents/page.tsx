"use client"

import { useEffect, useState } from "react"
import ToggleButton from "@/app/components/ToggleButton"
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

export default function TalentsPage() {
  const [colWidths, setColWidths] = useState<string[]>([])
  const [selected, setSelected] = useState<Set<string> | null>(null)

  useEffect(() => {
    const font = "14px Inter"
    const longest: number[] = headerLabels.map(label => measureTextWidth(label, font))

    for (const [name, t] of Object.entries(talent_data)) {
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

    const calculated = longest.map(w => `${Math.ceil(w + 32)}px`) // 16px left+right padding
    setColWidths(calculated)
  }, [])

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    try {
      setSelected(stored ? new Set(JSON.parse(stored)) : new Set())
    } catch {
      setSelected(new Set())
    }
  }, [])

  useEffect(() => {
    if (selected) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...selected]))
    }
  }, [selected])

  const toggle = (id: string) => {
    if (!selected) return
    const copy = new Set(selected)
    copy.has(id) ? copy.delete(id) : copy.add(id)
    setSelected(copy)
  }

  if (selected === null || colWidths.length === 0) return <div className="p-4">Loading...</div>

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
        {Object.entries(talent_data).map(([name]) => (
          <ToggleButton
            key={name}
            id={name}
            label={name}
            selected={selected.has(name)}
            toggle={toggle}
            colWidths={colWidths}
          />
        ))}
      </div>
    </div>
  )
}
