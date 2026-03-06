"use client"

import { useEffect, useState } from "react"
import { ToggleButton } from "@/app/components/ToggleButton"
import { talent_data, __columnWidths } from "@/app/data/talent_data"

const STORAGE_KEY = "selectedTalents"

const headerLabels = [
  "Name", "PreReq", "Tag", "BlockedTag",
  "Gold", "Exp", "TP", "Lvl",
  "T", "W", "C", "H",
  "Description"
]
const classHeaderTitles: Record<number, string> = {
  8: "Tank",
  9: "Warrior",
  10: "Caster",
  11: "Healer"
}

export default function TalentsPage() {
  const [colWidths] = useState<string[]>(() => {
    const widths = [...__columnWidths]
    widths[4] = "45px" // Gold
    widths[5] = "55px"
    widths[6] = "40px"
    widths[7] = "40px"
    widths[8] = "40px"
    widths[9] = "40px"
    widths[10] = "40px"
    widths[11] = "40px" // Healer
    return widths
  })
  const [isHydrated, setIsHydrated] = useState(false)
  const [totalLevels, setTotalLevels] = useState(0)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  // Load selectedTalents on mount
  useEffect(() => {
    console.log(`Loaded selectedTalents into selected`)
    const stored = localStorage.getItem(STORAGE_KEY)
    const rawLevels = localStorage.getItem("SelectedLevels")

    try {
      setSelected(stored ? new Set(JSON.parse(stored)) : new Set())
    } catch {
      setSelected(new Set())
    }

    try {
      const parsedLevels: Record<string, number> = rawLevels ? JSON.parse(rawLevels) : {}
      const total = ["tank", "warrior", "caster", "healer"].reduce((sum, key) => {
        const value = Number(parsedLevels[key] ?? 0)
        return sum + (Number.isFinite(value) ? value : 0)
      }, 0)
      setTotalLevels(total)
    } catch {
      setTotalLevels(0)
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
            title={classHeaderTitles[i]}
          >
            {label}
          </div>
        ))}
      </div>

      <div className="space-y-0.5">
        {Object.entries(talent_data).map(([name]) => (
          <ToggleButton
            key={name}
            talentName={name}
            talent={talent_data[name]}
            selected={selected}
            setSelected={setSelected}
            totalLevels={totalLevels}
            colWidths={colWidths}
          />
        ))}
      </div>
    </div>
  )
}
