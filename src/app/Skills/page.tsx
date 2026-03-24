"use client"

import Link from "next/link"
import { Suspense, startTransition, useEffect, useMemo, useRef, useState } from "react"
import { InteractiveTableHeader } from "@/app/components/InteractiveTableHeader"
import { SkillButton } from "@/app/components/ToggleButton"
import { DUNGEON_UNLOCKS_STORAGE_KEY, isDungeonUnlockTag } from "@/app/data/dungeon_unlocks"
import { skill_data } from "@/app/data/skill_data"
import { allRacePrereqTokens, getRacePrereqTokens, race_data_by_tag, type RaceTag } from "@/app/data/race_data"
import { computeBuildStatStages, readBuildSnapshot } from "@/app/lib/buildStats"
import { dispatchBuildSnapshotUpdated } from "@/app/lib/buildEvents"
import { calculateDamage, readDamageCalcState } from "@/app/lib/damageCalc"
import { readSelectedSkills, SKILL_SELECTION_STORAGE_KEY } from "@/app/lib/learnCommands"
import { MANUAL_TRAINING_SECTION_ID } from "@/app/lib/manualTraining"
import { useManagedColumns } from "@/app/lib/managedColumns"
import {
  persistTableScrollPosition,
  readTableScrollPosition,
  TABLE_FOCUS_QUERY_PARAM,
} from "@/app/lib/tableNavigation"
import { skillTableColumns } from "@/app/lib/tableColumnDefinitions"
import { getSkillAvailabilityState, matchesClassFilter, matchesRaceFilter } from "@/app/lib/tableRequirements"
import {
  getDefaultTableViewState,
  MANAGED_TABLE_VIEW_EVENT,
  readTableViewState,
  type ManagedTableViewChangeDetail,
  type TableViewState,
} from "@/app/lib/tableViewState"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

const TRAINING_STORAGE_KEY = "SelectedTraining"
const TABLE_SCROLL_STORAGE_KEY = "skillsTableScroll"
const isRaceTag = (value: string): value is RaceTag => value in race_data_by_tag
const skillNames = Object.keys(skill_data)
const defaultSkillOrder = new Map(skillNames.map((name, index) => [name, index]))
const defaultTraining = { ATK: 0, DEF: 0, MATK: 0, HEAL: 0 }
const trainingFields = [
  { key: "DEF", label: "Tank DEF" },
  { key: "ATK", label: "Warrior ATK" },
  { key: "MATK", label: "Caster MATK" },
  { key: "HEAL", label: "Healer HEAL" },
] as const

function SkillsPageContent() {
  const [isHydrated, setIsHydrated] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [selectedTalents, setSelectedTalents] = useState<Set<string>>(new Set())
  const [selectedRacePrereqs, setSelectedRacePrereqs] = useState<Set<string>>(new Set())
  const [selectedDungeonUnlocks, setSelectedDungeonUnlocks] = useState<Set<string>>(new Set())
  const [classLevels, setClassLevels] = useState({ tank: 0, warrior: 0, caster: 0, healer: 0 })
  const [training, setTraining] = useState(defaultTraining)
  const [averageDamageChanges, setAverageDamageChanges] = useState<Record<string, number>>({})
  const [viewState, setViewState] = useState<TableViewState>(getDefaultTableViewState)
  const columnLayout = useManagedColumns("skillColumnLayout", skillTableColumns)
  const allRaceTokens = useMemo(() => allRacePrereqTokens, [])
  const totalTraining = Object.values(training).reduce((sum, value) => sum + value, 0)
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const focusSkill = searchParams.get(TABLE_FOCUS_QUERY_PARAM)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const hasRestoredScrollRef = useRef(false)
  const lastHandledFocusRef = useRef<string | null>(null)

  useEffect(() => {
    const storedTalents = localStorage.getItem("selectedTalents")
    const storedRace = localStorage.getItem("SelectedRace")
    const storedDungeonUnlocks = localStorage.getItem(DUNGEON_UNLOCKS_STORAGE_KEY)
    const rawLevels = localStorage.getItem("SelectedLevels")
    const rawTraining = localStorage.getItem(TRAINING_STORAGE_KEY)

    try {
      setSelected(new Set(readSelectedSkills(localStorage)))
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

    try {
      const parsedTraining: Record<string, number> = rawTraining ? JSON.parse(rawTraining) : {}
      setTraining({
        ATK: Number(parsedTraining.ATK ?? 0),
        DEF: Number(parsedTraining.DEF ?? 0),
        MATK: Number(parsedTraining.MATK ?? 0),
        HEAL: Number(parsedTraining.HEAL ?? 0),
      })
    } catch {
      setTraining(defaultTraining)
    }

    setViewState(readTableViewState(localStorage, "skills"))
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (!isHydrated) {
      return
    }

    localStorage.setItem(TRAINING_STORAGE_KEY, JSON.stringify(training))
    dispatchBuildSnapshotUpdated()
  }, [isHydrated, training])

  useEffect(() => {
    if (!isHydrated) {
      setAverageDamageChanges({})
      return
    }

    let cancelled = false
    let timeoutId: number | null = null

    const snapshot = readBuildSnapshot(localStorage)
    snapshot.selectedTraining = training
    const damageState = readDamageCalcState(localStorage)
    const selectedBuffNames = snapshot.selectedBuffs
    const currentAverage = calculateDamage(
      computeBuildStatStages(snapshot).StatsDmgReady,
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
        const toggledSkills = new Set(selectedBuffNames)

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
  }, [isHydrated, training])

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

  useEffect(() => {
    if (!isHydrated || !columnLayout.isReady) {
      return
    }

    const container = containerRef.current
    if (!container) {
      return
    }

    const persistScroll = () => {
      persistTableScrollPosition(localStorage, TABLE_SCROLL_STORAGE_KEY, {
        left: container.scrollLeft,
        top: container.scrollTop,
      })
    }

    container.addEventListener("scroll", persistScroll, { passive: true })
    return () => {
      container.removeEventListener("scroll", persistScroll)
    }
  }, [columnLayout.isReady, isHydrated])

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
        trainingPointsSpent: totalTraining,
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
    totalTraining,
    viewState,
  ])

  useEffect(() => {
    if (!isHydrated || !columnLayout.isReady) {
      return
    }

    const container = containerRef.current
    if (!container) {
      return
    }

    if (focusSkill) {
      const targetRow = rowRefs.current[focusSkill]
      if (!targetRow || lastHandledFocusRef.current === focusSkill) {
        return
      }

      lastHandledFocusRef.current = focusSkill
      hasRestoredScrollRef.current = true

      requestAnimationFrame(() => {
        targetRow.scrollIntoView({ block: "center", inline: "nearest" })
        const nextParams = new URLSearchParams(searchParams.toString())
        nextParams.delete(TABLE_FOCUS_QUERY_PARAM)
        const nextUrl = nextParams.size > 0 ? `${pathname}?${nextParams.toString()}` : pathname
        router.replace(nextUrl, { scroll: false })
      })

      return
    }

    if (hasRestoredScrollRef.current) {
      return
    }

    hasRestoredScrollRef.current = true
    const savedPosition = readTableScrollPosition(localStorage, TABLE_SCROLL_STORAGE_KEY)
    requestAnimationFrame(() => {
      container.scrollTo({
        left: savedPosition.left,
        top: savedPosition.top,
      })
    })
  }, [columnLayout.isReady, displayedSkillNames.length, focusSkill, isHydrated, pathname, router, searchParams])

  if (!isHydrated || !columnLayout.isReady) return <div className="p-4">Loading...</div>

  const totalLevels = Object.values(classLevels).reduce((sum, value) => sum + value, 0)
  const spentSkillPoints = Array.from(selected).reduce((sum, skillName) => sum + (skill_data[skillName]?.sp ?? 0), 0) + totalTraining
  const availableSkillPoints = Math.max(0, Math.floor((totalLevels - 1) / 2))
  const skillPointsOverSpent = spentSkillPoints > availableSkillPoints

  return (
    <div ref={containerRef} className="viewport-below-top-nav overflow-auto border rounded-md">
      <div className="min-w-full w-max">
        <div className="border-b bg-slate-950/90 px-4 py-3">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <div className="text-sm font-semibold text-slate-100">Training</div>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-slate-400">Total chosen: {totalTraining}</span>
                <Link
                  href={`/StatFix#${MANUAL_TRAINING_SECTION_ID}`}
                  className="text-sky-300 underline decoration-sky-500/60 underline-offset-2 transition hover:text-sky-200"
                >
                  Stat Fix
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              {trainingFields.map(({ key, label }) => (
                <label key={key} className="flex flex-col gap-1 text-xs text-slate-300">
                  <span>{label}</span>
                  <input
                    type="number"
                    value={training[key]}
                    onChange={(event) => setTraining({ ...training, [key]: Number(event.target.value) || 0 })}
                    className="w-24 border bg-slate-950 px-2 py-1 text-center text-sm text-slate-100"
                  />
                </label>
              ))}
            </div>
          </div>
        </div>

        <InteractiveTableHeader
          visibleColumns={columnLayout.visibleColumns}
          gridTemplateColumns={columnLayout.gridTemplateColumns}
          onSetColumnCollapsed={columnLayout.setColumnCollapsed}
          onReorderColumns={columnLayout.reorderVisibleColumns}
          onSetColumnWidth={columnLayout.setColumnWidth}
          renderHeaderLabel={(column) => (
            column.id === "name"
              ? (
                <span className="flex w-full min-w-0 items-center justify-start gap-2">
                  <span
                    className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-mono ${
                      skillPointsOverSpent
                        ? "border-rose-500/50 bg-rose-500/10 text-rose-200"
                        : "border-sky-500/40 bg-sky-500/10 text-sky-200"
                    }`}
                  >
                    {spentSkillPoints}/{availableSkillPoints}
                  </span>
                  <span className="truncate">{column.label}</span>
                </span>
              )
              : <span className="truncate">{column.label}</span>
          )}
        />

        <div className="space-y-0.5">
          {displayedSkillNames.map((name, rowIndex) => (
            <SkillButton
              key={name}
              skillName={name}
              skill={skill_data[name]}
              rowRef={(node) => {
                rowRefs.current[name] = node
              }}
              selected={selected}
              setSelected={setSelected}
              selectionStorageKey={SKILL_SELECTION_STORAGE_KEY}
              selectedTalents={selectedTalents}
              selectedRacePrereqs={selectedRacePrereqs}
              selectedDungeonUnlocks={selectedDungeonUnlocks}
              classLevels={classLevels}
              trainingPointsSpent={totalTraining}
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

export default function SkillsPage() {
  return (
    <Suspense fallback={<div className="p-4">Loading...</div>}>
      <SkillsPageContent />
    </Suspense>
  )
}
