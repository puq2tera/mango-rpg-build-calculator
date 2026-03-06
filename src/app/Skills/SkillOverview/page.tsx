"use client"

import { useEffect, useState } from "react"
import { skill_data, __columnWidths } from "@/app/data/skill_data"

const STORAGE_KEY = "selectedBuffs"

const headerLabels = [
  "Name", "PreReq", "Tag", "BlockedTag",
  "Gold", "Exp", "SP", "Lvl",
  "Tank", "Warrior", "Caster", "Healer",
  "Description"
]

export default function SkillOverview() {
  const [colWidths] = useState<string[]>(__columnWidths)
  const [selected, setSelected] = useState<string[]>([])

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    try {
      const parsed = stored ? JSON.parse(stored) : []
      setSelected(Array.isArray(parsed) ? parsed : [])
    } catch {
      setSelected([])
    }
  }, [])

  if (colWidths.length === 0) return <div className="p-4">Loading...</div>

  return (
    <div className="h-[80vh] overflow-y-auto border rounded-md">
      <div
        className="sticky top-0 z-10 bg-slate-900 border-b py-2 grid gap-x-0"
        style={{ gridTemplateColumns: colWidths.join(" ") }}
      >
        {headerLabels.map((label, i) => (
          <div
            key={i}
            className="px-2 font-bold whitespace-nowrap border-r border-slate-600 last:border-r-0 box-border"
          >
            {label}
          </div>
        ))}
      </div>

      <div className="space-y-0.5">
        {selected.map((name) => {
          const skill = skill_data[name]
          if (!skill) return null

          const values = [
            name,
            Array.isArray(skill.PreReq) ? skill.PreReq.join(", ") : skill.PreReq,
            skill.Tag,
            skill.BlockedTag,
            skill.gold,
            skill.exp,
            skill.sp_spent,
            skill.class_levels.tank_levels,
            skill.class_levels.warrior_levels,
            skill.class_levels.caster_levels,
            skill.class_levels.healer_levels,
            skill.description
          ]

          return (
            <div
              key={name}
              className="grid border-b hover:bg-slate-800/85 transition"
              style={{ gridTemplateColumns: colWidths.join(" ") }}
            >
              {values.map((val, i) => (
                <span
                  key={i}
                  className="px-3 py-1 whitespace-nowrap border-r border-slate-700 last:border-r-0 box-border"
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
