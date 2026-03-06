"use client"

import { startTransition, useEffect, useState } from "react"
import { InteractiveTableHeader } from "@/app/components/InteractiveTableHeader"
import { ToggleButton } from "@/app/components/ToggleButton"
import { DUNGEON_UNLOCKS_STORAGE_KEY, isDungeonUnlockTag } from "@/app/data/dungeon_unlocks"
import { talent_data } from "@/app/data/talent_data"
import { race_data_by_tag, type RaceTag } from "@/app/data/race_data"
import { computeBuildStatStages, readBuildSnapshot } from "@/app/lib/buildStats"
import { calculateDamage, readDamageCalcState } from "@/app/lib/damageCalc"
import { useManagedColumns } from "@/app/lib/managedColumns"
import { talentTableColumns } from "@/app/lib/tableColumnDefinitions"

const STORAGE_KEY = "selectedTalents"

const isRaceTag = (value: string): value is RaceTag => value in race_data_by_tag
const talentNames = Object.keys(talent_data)

export default function TalentsPage() {
  const [isHydrated, setIsHydrated] = useState(false)
  const [totalLevels, setTotalLevels] = useState(0)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [selectedRacePrereqs, setSelectedRacePrereqs] = useState<Set<string>>(new Set())
  const [selectedDungeonUnlocks, setSelectedDungeonUnlocks] = useState<Set<string>>(new Set())
  const [classLevels, setClassLevels] = useState({ tank: 0, warrior: 0, caster: 0, healer: 0 })
  const [averageDamageChanges, setAverageDamageChanges] = useState<Record<string, number>>({})
  const columnLayout = useManagedColumns("talentColumnLayout", talentTableColumns)

  // Load selectedTalents on mount
  useEffect(() => {
    console.log(`Loaded selectedTalents into selected`)
    const stored = localStorage.getItem(STORAGE_KEY)
    const storedRace = localStorage.getItem("SelectedRace")
    const storedDungeonUnlocks = localStorage.getItem(DUNGEON_UNLOCKS_STORAGE_KEY)
    const rawLevels = localStorage.getItem("SelectedLevels")

    try {
      setSelected(stored ? new Set(JSON.parse(stored)) : new Set())
    } catch {
      setSelected(new Set())
    }

    try {
      const parsedLevels: Record<string, number> = rawLevels ? JSON.parse(rawLevels) : {}
      const nextClassLevels = {
        tank: Number(parsedLevels.tank ?? 0),
        warrior: Number(parsedLevels.warrior ?? 0),
        caster: Number(parsedLevels.caster ?? 0),
        healer: Number(parsedLevels.healer ?? 0),
      }
      const total = ["tank", "warrior", "caster", "healer"].reduce((sum, key) => {
        const value = nextClassLevels[key as keyof typeof nextClassLevels]
        return sum + (Number.isFinite(value) ? value : 0)
      }, 0)
      setClassLevels(nextClassLevels)
      setTotalLevels(total)
    } catch {
      setClassLevels({ tank: 0, warrior: 0, caster: 0, healer: 0 })
      setTotalLevels(0)
    }

    try {
      const parsedUnlocks: string[] = storedDungeonUnlocks ? JSON.parse(storedDungeonUnlocks) : []
      setSelectedDungeonUnlocks(new Set(parsedUnlocks.filter(isDungeonUnlockTag)))
    } catch {
      setSelectedDungeonUnlocks(new Set())
    }

    if (storedRace && isRaceTag(storedRace)) {
      const race = race_data_by_tag[storedRace]
      setSelectedRacePrereqs(new Set([race.tag, race.name]))
    } else {
      setSelectedRacePrereqs(new Set())
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
    const selectedTalentNames = Array.from(selected)
    const currentAverage = calculateDamage(
      computeBuildStatStages(snapshot, { selectedTalents: selectedTalentNames }).StatsDmgReady,
      damageState,
    ).average

    const computedChanges: Record<string, number> = {}
    let index = 0
    const chunkSize = 20

    const computeChunk = () => {
      if (cancelled) return

      const maxIndex = Math.min(index + chunkSize, talentNames.length)
      for (; index < maxIndex; index++) {
        const talentName = talentNames[index]
        const toggledTalents = new Set(selectedTalentNames)

        if (toggledTalents.has(talentName)) {
          toggledTalents.delete(talentName)
        } else {
          toggledTalents.add(talentName)
        }

        const nextAverage = calculateDamage(
          computeBuildStatStages(snapshot, { selectedTalents: toggledTalents }).StatsDmgReady,
          damageState,
        ).average

        computedChanges[talentName] = nextAverage - currentAverage
      }

      if (index < talentNames.length) {
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

  useEffect(() => {
    const handleResetUi = () => {
      columnLayout.reset()
    }

    window.addEventListener("resetManagedTableUi", handleResetUi)
    return () => {
      window.removeEventListener("resetManagedTableUi", handleResetUi)
    }
  }, [columnLayout])

  if (!isHydrated || !columnLayout.isReady) return <div className="p-4">Loading...</div>

  return (
    <div className="h-[calc(100vh-2.5rem)] overflow-auto border rounded-md">
      <div className="min-w-full w-max">
        <InteractiveTableHeader
          allColumns={columnLayout.allColumns}
          visibleColumns={columnLayout.visibleColumns}
          gridTemplateColumns={columnLayout.gridTemplateColumns}
          onSetColumnCollapsed={columnLayout.setColumnCollapsed}
          onReorderColumns={columnLayout.reorderVisibleColumns}
          onSetColumnWidth={columnLayout.setColumnWidth}
        />

        <div className="space-y-0.5">
          {Object.entries(talent_data).map(([name]) => (
            <ToggleButton
              key={name}
              talentName={name}
              talent={talent_data[name]}
              selected={selected}
              setSelected={setSelected}
              totalLevels={totalLevels}
              selectedRacePrereqs={selectedRacePrereqs}
              selectedDungeonUnlocks={selectedDungeonUnlocks}
              classLevels={classLevels}
              columns={columnLayout.visibleColumns}
              averageDamageChange={averageDamageChanges[name] ?? null}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
