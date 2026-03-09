"use client"

import { startTransition, useEffect, useMemo, useState } from "react"
import { InteractiveTableHeader } from "@/app/components/InteractiveTableHeader"
import { SkillButton } from "@/app/components/ToggleButton"
import { DUNGEON_UNLOCKS_STORAGE_KEY, isDungeonUnlockTag } from "@/app/data/dungeon_unlocks"
import { skill_data } from "@/app/data/skill_data"
import { allRacePrereqTokens, getRacePrereqTokens, race_data_by_tag, type RaceTag } from "@/app/data/race_data"
import { computeBuildStatStages, readBuildSnapshot } from "@/app/lib/buildStats"
import { calculateDamage, readDamageCalcState } from "@/app/lib/damageCalc"
import { useManagedColumns } from "@/app/lib/managedColumns"
import { skillTableColumns } from "@/app/lib/tableColumnDefinitions"
import { getSkillAvailabilityState, matchesClassFilter, matchesRaceFilter } from "@/app/lib/tableRequirements"
import {
  getDefaultTableViewState,
  MANAGED_TABLE_VIEW_EVENT,
  readTableViewState,
  type ManagedTableViewChangeDetail,
  type TableViewState,
} from "@/app/lib/tableViewState"

const STORAGE_KEY = "selectedBuffs"
const isRaceTag = (value: string): value is RaceTag => value in race_data_by_tag
const skillNames = Object.keys(skill_data)
const defaultSkillOrder = new Map(skillNames.map((name, index) => [name, index]))

export default function SkillsPage() {
  const [isHydrated, setIsHydrated] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [selectedTalents, setSelectedTalents] = useState<Set<string>>(new Set())
  const [selectedRacePrereqs, setSelectedRacePrereqs] = useState<Set<string>>(new Set())
  const [selectedDungeonUnlocks, setSelectedDungeonUnlocks] = useState<Set<string>>(new Set())
  const [classLevels, setClassLevels] = useState({ tank: 0, warrior: 0, caster: 0, healer: 0 })
  const [averageDamageChanges, setAverageDamageChanges] = useState<Record<string, number>>({})
  const [viewState, setViewState] = useState<TableViewState>(getDefaultTableViewState)
  const columnLayout = useManagedColumns("skillColumnLayout", skillTableColumns)
  const allRaceTokens = useMemo(() => allRacePrereqTokens, [])

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    const storedTalents = localStorage.getItem("selectedTalents")
    const storedRace = localStorage.getItem("SelectedRace")
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

    setViewState(readTableViewState(localStorage, "skills"))
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (!isHydrated) {
      setAverageDamageChanges({})
      return
    }

    let cancelled = false
    let timeoutId: number | null = null

    const snapshot = readBuildSnapshot(localStorage)
    const damageState = readDamageCalcState(localStorage)
    const selectedSkillNames = Array.from(selected)
    const currentAverage = calculateDamage(
      computeBuildStatStages(snapshot, { selectedBuffs: selectedSkillNames }).StatsDmgReady,
      damageState,
    ).average

    const computedChanges: Record<string, number> = {}
    let index = 0
    const chunkSize = 20

    const computeChunk = () => {
      if (cancelled) {
        return
      }

      const maxIndex = Math.min(index + chunkSize, skillNames.length)
      for (; index < maxIndex; index++) {
        const skillName = skillNames[index]
        const toggledSkills = new Set(selectedSkillNames)

        if (toggledSkills.has(skillName)) {
          toggledSkills.delete(skillName)
        } else {
          toggledSkills.add(skillName)
        }

        const nextAverage = calculateDamage(
          computeBuildStatStages(snapshot, { selectedBuffs: toggledSkills }).StatsDmgReady,
          damageState,
        ).average

        computedChanges[skillName] = nextAverage - currentAverage
      }

      if (index < skillNames.length) {
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

      if (detail.page === "skills") {
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

  const displayedSkillNames = useMemo(() => {
    const filteredSkillNames = skillNames.filter((skillName) => {
      const skill = skill_data[skillName]

      if (!matchesClassFilter(skill.class_levels, viewState.classFilter)) {
        return false
      }

      const availabilityState = getSkillAvailabilityState({
        skillName,
        skill,
        selectedSkills: selected,
        selectedTalents,
        selectedRacePrereqs,
        selectedDungeonUnlocks,
        classLevels,
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

    return [...filteredSkillNames].sort((left, right) => {
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

      const defaultDifference = (defaultSkillOrder.get(left) ?? 0) - (defaultSkillOrder.get(right) ?? 0)
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
    selectedTalents,
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
          {displayedSkillNames.map((name, rowIndex) => (
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
              columns={columnLayout.visibleColumns}
              averageDamageChange={averageDamageChanges[name] ?? null}
              rowIndex={rowIndex}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
