"use client"

import { startTransition, useEffect, useState } from "react"
import { SkillButton } from "@/app/components/ToggleButton"
import { DUNGEON_UNLOCKS_STORAGE_KEY, isDungeonUnlockTag } from "@/app/data/dungeon_unlocks"
import { skill_data, __columnWidths } from "@/app/data/skill_data"
import { computeBuildStatStages, readBuildSnapshot } from "@/app/lib/buildStats"
import { calculateDamage, readDamageCalcState } from "@/app/lib/damageCalc"

const STORAGE_KEY = "selectedBuffs"
const buffNames = Object.entries(skill_data)
  .filter(([, data]) => data.type?.is_buff === true)
  .map(([name]) => name)

const headerLabels = [
  "Name", "PreReq", "Tag", "BlockedTag",
  "Gold", "Exp", "SP",
  "Tank", "Warrior", "Caster", "Healer",
  "Description", "Avg DMG Change"
]
const headerTitles: Record<number, string> = {
  12: "Change in Damage Calculator average damage using your saved calculator settings",
}

export default function BuffsPage() {
  const [colWidths] = useState<string[]>(() => {
    const widths = __columnWidths.slice(0, 12)
    widths.push("110px")
    return widths
  })
  const [isHydrated, setIsHydrated] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [selectedTalents, setSelectedTalents] = useState<Set<string>>(new Set())
  const [selectedDungeonUnlocks, setSelectedDungeonUnlocks] = useState<Set<string>>(new Set())
  const [classLevels, setClassLevels] = useState({ tank: 0, warrior: 0, caster: 0, healer: 0 })
  const [averageDamageChanges, setAverageDamageChanges] = useState<Record<string, number>>({})

  // Load selectedBuffs on mount
  useEffect(() => {
    console.log(`Loaded selectedBuffs into selected`)
    const stored = localStorage.getItem(STORAGE_KEY)
    const storedTalents = localStorage.getItem("selectedTalents")
    const storedDungeonUnlocks = localStorage.getItem(DUNGEON_UNLOCKS_STORAGE_KEY)
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
      const parsedUnlocks: string[] = storedDungeonUnlocks ? JSON.parse(storedDungeonUnlocks) : []
      setSelectedDungeonUnlocks(new Set(parsedUnlocks.filter(isDungeonUnlockTag)))
    } catch {
      setSelectedDungeonUnlocks(new Set())
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

  useEffect(() => {
    if (!isHydrated) return

    let cancelled = false
    let timeoutId: number | null = null

    setAverageDamageChanges({})

    const snapshot = readBuildSnapshot(localStorage)
    const damageState = readDamageCalcState(localStorage)
    const selectedBuffNames = Array.from(selected)
    const currentAverage = calculateDamage(
      computeBuildStatStages(snapshot, { selectedBuffs: selectedBuffNames }).StatsDmgReady,
      damageState,
    ).average

    const computedChanges: Record<string, number> = {}
    let index = 0
    const chunkSize = 20

    const computeChunk = () => {
      if (cancelled) return

      const maxIndex = Math.min(index + chunkSize, buffNames.length)
      for (; index < maxIndex; index++) {
        const buffName = buffNames[index]
        const toggledBuffs = new Set(selectedBuffNames)

        if (toggledBuffs.has(buffName)) {
          toggledBuffs.delete(buffName)
        } else {
          toggledBuffs.add(buffName)
        }

        const nextAverage = calculateDamage(
          computeBuildStatStages(snapshot, { selectedBuffs: toggledBuffs }).StatsDmgReady,
          damageState,
        ).average

        computedChanges[buffName] = nextAverage - currentAverage
      }

      if (index < buffNames.length) {
        timeoutId = window.setTimeout(computeChunk, 0)
        return
      }

      startTransition(() => {
        setAverageDamageChanges(computedChanges)
      })
    }

    timeoutId = window.setTimeout(computeChunk, 0)

    return () => {
      cancelled = true
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId)
      }
    }
  }, [isHydrated, selected])

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
            title={headerTitles[i]}
          >
            {label}
          </div>
        ))}
      </div>

      <div className="space-y-0.5">
      {buffNames.map((name) => (
          <SkillButton
            key={name}
            skillName={name}
            skill={skill_data[name]}
            selected={selected}
            setSelected={setSelected}
            selectedTalents={selectedTalents}
            selectedDungeonUnlocks={selectedDungeonUnlocks}
            classLevels={classLevels}
            colWidths={colWidths}
            averageDamageChange={averageDamageChanges[name] ?? null}
          />
        ))}
      </div>
    </div>
  )
}
