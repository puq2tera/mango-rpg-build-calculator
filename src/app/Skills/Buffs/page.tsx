"use client"

import { useEffect, useState } from "react"
import { SkillButton } from "@/app/components/ToggleButton"
import { skill_data, __columnWidths } from "@/app/data/skill_data"

const STORAGE_KEY = "selectedBuffs"

const headerLabels = [
  "Name", "PreReq", "Tag", "BlockedTag",
  "Gold", "Exp", "TP", "Lvl",
  "Tank", "Warrior", "Caster", "Healer",
  "Description"
]

export default function BuffsPage() {
  const [colWidths] = useState<string[]>(__columnWidths)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  // Load selectedBuffs on mount
  useEffect(() => {
    console.log(`Loaded selectedBuffs into selected`)
    const stored = localStorage.getItem(STORAGE_KEY)
    try {
      setSelected(stored ? new Set(JSON.parse(stored)) : new Set())
    } catch {
      setSelected(new Set())
    }
    console.log(stored)
  }, [])

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
      {Object.entries(skill_data)
        .filter(([, data]) => data.type?.is_buff === true)
        .map(([name]) => (
          <SkillButton
            key={name}
            skillName={name}
            skill={skill_data[name]}
            selected={selected}
            setSelected={setSelected}
            colWidths={colWidths}
          />
        ))}
      </div>
    </div>
  )
}
