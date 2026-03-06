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
  const [isHydrated, setIsHydrated] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [selectedTalents, setSelectedTalents] = useState<Set<string>>(new Set())
  const [classLevels, setClassLevels] = useState({ tank: 0, warrior: 0, caster: 0, healer: 0 })

  // Load selectedBuffs on mount
  useEffect(() => {
    console.log(`Loaded selectedBuffs into selected`)
    const stored = localStorage.getItem(STORAGE_KEY)
    const storedTalents = localStorage.getItem("selectedTalents")
    const rawLevels = localStorage.getItem("SelectedLevels")

    try {
      setSelected(stored ? new Set(JSON.parse(stored)) : new Set())
    } catch {
      setSelected(new Set())
    }

    try {
      setSelectedTalents(storedTalents ? new Set(JSON.parse(storedTalents)) : new Set())
    } catch {
      setSelectedTalents(new Set())
    }

    try {
      const parsedLevels: Record<string, number> = rawLevels ? JSON.parse(rawLevels) : {}
      setClassLevels({
        tank: Number(parsedLevels.tank ?? 0),
        warrior: Number(parsedLevels.warrior ?? 0),
        caster: Number(parsedLevels.caster ?? 0),
        healer: Number(parsedLevels.healer ?? 0),
      })
    } catch {
      setClassLevels({ tank: 0, warrior: 0, caster: 0, healer: 0 })
    }

    setIsHydrated(true)
    console.log(stored)
  }, [])

  if (!isHydrated || colWidths.length === 0) return <div className="p-4">Loading...</div>

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
      {Object.entries(skill_data)
        .filter(([, data]) => data.type?.is_buff === true)
        .map(([name]) => (
          <SkillButton
            key={name}
            skillName={name}
            skill={skill_data[name]}
            selected={selected}
            setSelected={setSelected}
            selectedTalents={selectedTalents}
            classLevels={classLevels}
            colWidths={colWidths}
          />
        ))}
      </div>
    </div>
  )
}
