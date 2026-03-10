"use client"

import { startTransition, useEffect, useMemo, useState } from "react"
import { InteractiveTableHeader } from "@/app/components/InteractiveTableHeader"
import { SkillButton } from "@/app/components/ToggleButton"
import { DUNGEON_UNLOCKS_STORAGE_KEY, isDungeonUnlockTag } from "@/app/data/dungeon_unlocks"
import { skill_data } from "@/app/data/skill_data"
import { allRacePrereqTokens, getRacePrereqTokens, race_data_by_tag, type RaceTag } from "@/app/data/race_data"
import { dispatchBuildSnapshotUpdated } from "@/app/lib/buildEvents"
import { computeBuildStatStages, readBuildSnapshot } from "@/app/lib/buildStats"
import { calculateDamage, readDamageCalcState } from "@/app/lib/damageCalc"
import { useManagedColumns } from "@/app/lib/managedColumns"
import { buffTableColumns } from "@/app/lib/tableColumnDefinitions"
import { getSkillAvailabilityState, matchesClassFilter, matchesRaceFilter } from "@/app/lib/tableRequirements"
import {
  getDefaultTableViewState,
  MANAGED_TABLE_VIEW_EVENT,
  readTableViewState,
  type ManagedTableViewChangeDetail,
  type TableViewState,
} from "@/app/lib/tableViewState"

const STORAGE_KEY = "selectedBuffs"
const STACK_STORAGE_KEY = "selectedBuffStacks"
const TRAINING_STORAGE_KEY = "SelectedTraining"
const buffNames = Object.entries(skill_data)
  .filter(([, data]) => data.type?.is_buff === true)
  .map(([name]) => name)
const defaultBuffOrder = new Map(buffNames.map((name, index) => [name, index]))
const isRaceTag = (value: string): value is RaceTag => value in race_data_by_tag

export default function BuffsPage() {
  const [isHydrated, setIsHydrated] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [buffStacks, setBuffStacks] = useState<Record<string, number>>({})
  const [selectedTalents, setSelectedTalents] = useState<Set<string>>(new Set())
  const [selectedRacePrereqs, setSelectedRacePrereqs] = useState<Set<string>>(new Set())
  const [selectedDungeonUnlocks, setSelectedDungeonUnlocks] = useState<Set<string>>(new Set())
  const [classLevels, setClassLevels] = useState({ tank: 0, warrior: 0, caster: 0, healer: 0 })
  const [trainingPointsSpent, setTrainingPointsSpent] = useState(0)
  const [averageDamageChanges, setAverageDamageChanges] = useState<Record<string, number>>({})
  const [viewState, setViewState] = useState<TableViewState>(getDefaultTableViewState)
  const columnLayout = useManagedColumns("buffColumnLayout", buffTableColumns)
  const allRaceTokens = useMemo(() => allRacePrereqTokens, [])

  // Load selectedBuffs on mount
  useEffect(() => {
    console.log(`Loaded selectedBuffs into selected`)
    const stored = localStorage.getItem(STORAGE_KEY)
    const storedStacks = localStorage.getItem(STACK_STORAGE_KEY)
    const storedTalents = localStorage.getItem("selectedTalents")
    const storedRace = localStorage.getItem("SelectedRace")
    const storedDungeonUnlocks = localStorage.getItem(DUNGEON_UNLOCKS_STORAGE_KEY)
    const rawLevels = localStorage.getItem("SelectedLevels")
    const rawTraining = localStorage.getItem(TRAINING_STORAGE_KEY)

    try {
      setSelected(stored ? new Set(JSON.parse(stored)) : new Set())
    } catch {
      setSelected(new Set())
    }

    try {
      const parsedStacks = storedStacks ? JSON.parse(storedStacks) : {}
      setBuffStacks(
        typeof parsedStacks === "object" && parsedStacks !== null
          ? Object.entries(parsedStacks).reduce<Record<string, number>>((result, [name, value]) => {
            if (typeof value === "number" && Number.isFinite(value)) {
              result[name] = Math.max(0, Math.floor(value))
            }
            return result
          }, {})
          : {},
      )
    } catch {
      setBuffStacks({})
    }

    try {
      setSelectedTalents(storedTalents ? new Set(JSON.parse(storedTalents)) : new Set())
    } catch {
      setSelectedTalents(new Set())
    }

    if (storedRace && isRaceTag(storedRace)) {
      const race = race_data_by_tag[storedRace]
      setSelectedRacePrereqs(new Set(getRacePrereqTokens(race)))
    } else {
      setSelectedRacePrereqs(new Set())
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

    try {
      const parsedTraining: Record<string, number> = rawTraining ? JSON.parse(rawTraining) : {}
      setTrainingPointsSpent(
        Number(parsedTraining.DEF ?? 0)
        + Number(parsedTraining.ATK ?? 0)
        + Number(parsedTraining.MATK ?? 0)
        + Number(parsedTraining.HEAL ?? 0),
      )
    } catch {
      setTrainingPointsSpent(0)
    }

    setViewState(readTableViewState(localStorage, "buffs"))
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
      computeBuildStatStages(snapshot, { selectedBuffs: selectedBuffNames, buffStacks }).StatsDmgReady,
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
          computeBuildStatStages(snapshot, { selectedBuffs: toggledBuffs, buffStacks }).StatsDmgReady,
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
  }, [buffStacks, isHydrated, selected])

  useEffect(() => {
    const handleManagedTableViewChange = (event: Event) => {
      const detail = (event as CustomEvent<ManagedTableViewChangeDetail>).detail

      if (detail.page === "buffs") {
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

  const displayedBuffNames = useMemo(() => {
    const filteredBuffNames = buffNames.filter((buffName) => {
      const skill = skill_data[buffName]

      if (!matchesClassFilter(skill.class_levels, viewState.classFilter)) {
        return false
      }

      const availabilityState = getSkillAvailabilityState({
        skillName: buffName,
        skill,
        selectedSkills: selected,
        selectedTalents,
        selectedRacePrereqs,
        selectedDungeonUnlocks,
        classLevels,
        trainingPointsSpent,
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
    return [...filteredBuffNames].sort((left, right) => {
      if (viewState.sortMode === "damage") {
        const difference = (averageDamageChanges[left] ?? 0) - (averageDamageChanges[right] ?? 0)

        if (difference !== 0) {
          return viewState.sortDirection === "asc" ? difference : -difference
        }
      }

      if (viewState.sortMode === "cost") {
        const difference = (skill_data[left].sp_spent ?? 0) - (skill_data[right].sp_spent ?? 0)

        if (difference !== 0) {
          return viewState.sortDirection === "asc" ? difference : -difference
        }
      }

      const defaultDifference = (defaultBuffOrder.get(left) ?? 0) - (defaultBuffOrder.get(right) ?? 0)
      return viewState.sortMode === "default" && viewState.sortDirection === "desc"
        ? -defaultDifference
        : defaultDifference
    })
  }, [
    averageDamageChanges,
    allRaceTokens,
    classLevels,
    selected,
    selectedDungeonUnlocks,
    selectedRacePrereqs,
    selectedTalents,
    trainingPointsSpent,
    viewState,
  ])

  if (!isHydrated || !columnLayout.isReady) return <div className="p-4">Loading...</div>

  const handleChangeStack = (buffName: string, nextValue: number) => {
    setBuffStacks((currentStacks) => {
      const updatedStacks = {
        ...currentStacks,
        [buffName]: nextValue,
      }
      localStorage.setItem(STACK_STORAGE_KEY, JSON.stringify(updatedStacks))
      dispatchBuildSnapshotUpdated()
      return updatedStacks
    })
  }

  return (
    <div className="viewport-below-top-nav overflow-auto border rounded-md">
      <div className="min-w-full w-max">
        <InteractiveTableHeader
          visibleColumns={columnLayout.visibleColumns}
          gridTemplateColumns={columnLayout.gridTemplateColumns}
          onSetColumnCollapsed={columnLayout.setColumnCollapsed}
          onReorderColumns={columnLayout.reorderVisibleColumns}
          onSetColumnWidth={columnLayout.setColumnWidth}
        />

        <div className="space-y-0.5">
          {displayedBuffNames.map((name, rowIndex) => (
            <SkillButton
              key={name}
              skillName={name}
              skill={skill_data[name]}
              selected={selected}
              setSelected={setSelected}
              selectedTalents={selectedTalents}
              selectedRacePrereqs={selectedRacePrereqs}
              selectedDungeonUnlocks={selectedDungeonUnlocks}
              classLevels={classLevels}
              trainingPointsSpent={trainingPointsSpent}
              columns={columnLayout.visibleColumns}
              averageDamageChange={averageDamageChanges[name] ?? null}
              rowIndex={rowIndex}
              canStack={Boolean(skill_data[name].stack_stats || skill_data[name].stack_conversions)}
              stackValue={buffStacks[name] ?? 0}
              onChangeStack={handleChangeStack}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
