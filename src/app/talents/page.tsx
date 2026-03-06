"use client"

import { startTransition, useEffect, useMemo, useState } from "react"
import { InteractiveTableHeader } from "@/app/components/InteractiveTableHeader"
import { ToggleButton } from "@/app/components/ToggleButton"
import { DUNGEON_UNLOCKS_STORAGE_KEY, isDungeonUnlockTag } from "@/app/data/dungeon_unlocks"
import { talent_data } from "@/app/data/talent_data"
import { race_data, race_data_by_tag, type RaceTag } from "@/app/data/race_data"
import { computeBuildStatStages, readBuildSnapshot } from "@/app/lib/buildStats"
import { calculateDamage, readDamageCalcState } from "@/app/lib/damageCalc"
import { useManagedColumns } from "@/app/lib/managedColumns"
import { talentTableColumns } from "@/app/lib/tableColumnDefinitions"
import { getTalentAvailabilityState, matchesClassFilter, matchesRaceFilter } from "@/app/lib/tableRequirements"
import {
  getDefaultTableViewState,
  MANAGED_TABLE_VIEW_EVENT,
  readTableViewState,
  type ManagedTableViewChangeDetail,
  type TableViewState,
} from "@/app/lib/tableViewState"

const STORAGE_KEY = "selectedTalents"

const isRaceTag = (value: string): value is RaceTag => value in race_data_by_tag
const talentNames = Object.keys(talent_data)
const defaultTalentOrder = new Map(talentNames.map((name, index) => [name, index]))

export default function TalentsPage() {
  const [isHydrated, setIsHydrated] = useState(false)
  const [totalLevels, setTotalLevels] = useState(0)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [selectedRacePrereqs, setSelectedRacePrereqs] = useState<Set<string>>(new Set())
  const [selectedDungeonUnlocks, setSelectedDungeonUnlocks] = useState<Set<string>>(new Set())
  const [classLevels, setClassLevels] = useState({ tank: 0, warrior: 0, caster: 0, healer: 0 })
  const [averageDamageChanges, setAverageDamageChanges] = useState<Record<string, number>>({})
  const [viewState, setViewState] = useState<TableViewState>(getDefaultTableViewState)
  const columnLayout = useManagedColumns("talentColumnLayout", talentTableColumns)
  const allRaceTokens = useMemo(() => new Set(race_data.flatMap((race) => [race.tag, race.name])), [])

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

    setViewState(readTableViewState(localStorage, "talents"))
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
    const handleManagedTableViewChange = (event: Event) => {
      const detail = (event as CustomEvent<ManagedTableViewChangeDetail>).detail

      if (detail.page === "talents") {
        setViewState(detail.viewState)
      }
    }

    const handleResetUi = () => {
      columnLayout.reset()
    }

    window.addEventListener(MANAGED_TABLE_VIEW_EVENT, handleManagedTableViewChange)
    window.addEventListener("resetManagedTableUi", handleResetUi)
    return () => {
      window.removeEventListener(MANAGED_TABLE_VIEW_EVENT, handleManagedTableViewChange)
      window.removeEventListener("resetManagedTableUi", handleResetUi)
    }
  }, [columnLayout])

  const displayedTalentNames = useMemo(() => {
    const filteredTalentNames = talentNames.filter((talentName) => {
      const talent = talent_data[talentName]

      if (!matchesClassFilter(talent.class_levels, viewState.classFilter)) {
        return false
      }

      const availabilityState = getTalentAvailabilityState({
        talentName,
        talent,
        selectedTalents: selected,
        selectedRacePrereqs,
        selectedDungeonUnlocks,
        classLevels,
        totalLevels,
      })

      if (!matchesRaceFilter(availabilityState.raceFilterTokens, viewState.raceFilter, selectedRacePrereqs, allRaceTokens)) {
        return false
      }

      if (viewState.availabilityFilter === "available" && !availabilityState.isAvailable) {
        return false
      }

      if (viewState.availabilityFilter === "unavailable" && availabilityState.isAvailable) {
        return false
      }

      return true
    })

    return [...filteredTalentNames].sort((left, right) => {
      if (viewState.sortMode === "damage") {
        const difference = (averageDamageChanges[left] ?? 0) - (averageDamageChanges[right] ?? 0)

        if (difference !== 0) {
          return viewState.sortDirection === "asc" ? difference : -difference
        }
      }

      if (viewState.sortMode === "cost") {
        const difference = (talent_data[left].tp_spent ?? 0) - (talent_data[right].tp_spent ?? 0)

        if (difference !== 0) {
          return viewState.sortDirection === "asc" ? difference : -difference
        }
      }

      const defaultDifference = (defaultTalentOrder.get(left) ?? 0) - (defaultTalentOrder.get(right) ?? 0)
      return viewState.sortMode === "default" && viewState.sortDirection === "desc"
        ? -defaultDifference
        : defaultDifference
    })
  }, [
    allRaceTokens,
    averageDamageChanges,
    classLevels,
    selected,
    selectedDungeonUnlocks,
    selectedRacePrereqs,
    totalLevels,
    viewState,
  ])

  if (!isHydrated || !columnLayout.isReady) return <div className="p-4">Loading...</div>

  return (
    <div className="h-[calc(100vh-2.5rem)] overflow-auto border rounded-md">
      <div className="min-w-full w-max">
        <InteractiveTableHeader
          visibleColumns={columnLayout.visibleColumns}
          gridTemplateColumns={columnLayout.gridTemplateColumns}
          onSetColumnCollapsed={columnLayout.setColumnCollapsed}
          onReorderColumns={columnLayout.reorderVisibleColumns}
          onSetColumnWidth={columnLayout.setColumnWidth}
        />

        <div className="space-y-0.5">
          {displayedTalentNames.map((name) => (
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
