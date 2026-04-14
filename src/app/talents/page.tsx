"use client"

import { Suspense, startTransition, useEffect, useMemo, useRef, useState } from "react"
import { InteractiveTableHeader } from "@/app/components/InteractiveTableHeader"
import { ToggleButton } from "@/app/components/ToggleButton"
import { DUNGEON_UNLOCKS_STORAGE_KEY, isDungeonUnlockTag } from "@/app/data/dungeon_unlocks"
import { talent_data } from "@/app/data/talent_data"
import { allRacePrereqTokens, getRacePrereqTokens, race_data_by_tag, type RaceTag } from "@/app/data/race_data"
import {
  computeBuildStatStages,
  computeTalentToggledDmgReadyStatsDelta,
  prepareBuildStatDeltaCache,
  readBuildSnapshot,
} from "@/app/lib/buildStats"
import {
  calculateAverageDamageWithStatsDelta,
  prepareAverageDamageDeltaCache,
  readDamageCalcState,
} from "@/app/lib/damageCalc"
import { useManagedColumns } from "@/app/lib/managedColumns"
import {
  persistTableScrollPosition,
  readTableScrollPosition,
  TABLE_FOCUS_QUERY_PARAM,
} from "@/app/lib/tableNavigation"
import { talentTableColumns } from "@/app/lib/tableColumnDefinitions"
import { getTalentAvailabilityState, matchesClassFilter, matchesRaceFilter } from "@/app/lib/tableRequirements"
import {
  getDefaultTableViewState,
  MANAGED_TABLE_VIEW_EVENT,
  matchesAverageDamageFilter,
  readTableViewState,
  type ManagedTableViewChangeDetail,
  type TableViewState,
} from "@/app/lib/tableViewState"
import {
  summarizeBenchmark,
  usePagePerfBridge,
  waitForAnimationFrames,
  waitForCondition,
} from "@/app/lib/pagePerf"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

const STORAGE_KEY = "selectedTalents"
const TABLE_SCROLL_STORAGE_KEY = "talentsTableScroll"

const isRaceTag = (value: string): value is RaceTag => value in race_data_by_tag
const talentNames = Object.keys(talent_data)
const defaultTalentOrder = new Map(talentNames.map((name, index) => [name, index]))

function TalentsPageContent() {
  const [isHydrated, setIsHydrated] = useState(false)
  const [totalLevels, setTotalLevels] = useState(0)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [selectedRacePrereqs, setSelectedRacePrereqs] = useState<Set<string>>(new Set())
  const [selectedDungeonUnlocks, setSelectedDungeonUnlocks] = useState<Set<string>>(new Set())
  const [classLevels, setClassLevels] = useState({ tank: 0, warrior: 0, caster: 0, healer: 0 })
  const [averageDamageChanges, setAverageDamageChanges] = useState<Record<string, number>>({})
  const [isAverageDamageReady, setIsAverageDamageReady] = useState(false)
  const [viewState, setViewState] = useState<TableViewState>(getDefaultTableViewState)
  const columnLayout = useManagedColumns("talentColumnLayout", talentTableColumns)
  const allRaceTokens = useMemo(() => allRacePrereqTokens, [])
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const focusTalent = searchParams.get(TABLE_FOCUS_QUERY_PARAM)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const hasRestoredScrollRef = useRef(false)
  const lastHandledFocusRef = useRef<string | null>(null)
  const averageDamageComputationIdRef = useRef(0)
  const pendingAverageDamageComputationIdRef = useRef<number | null>(null)
  const completedAverageDamageComputationIdRef = useRef(0)

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
      setSelectedRacePrereqs(new Set(getRacePrereqTokens(race)))
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
    const computationId = averageDamageComputationIdRef.current + 1

    averageDamageComputationIdRef.current = computationId
    setIsAverageDamageReady(false)
    pendingAverageDamageComputationIdRef.current = null

    const selectedTalentNames = Array.from(selected)
    const snapshot = readBuildSnapshot(localStorage)
    snapshot.selectedTalents = selectedTalentNames
    const damageState = readDamageCalcState(localStorage)
    const stages = computeBuildStatStages(snapshot, { selectedTalents: selectedTalentNames })
    const deltaCache = prepareBuildStatDeltaCache(snapshot, stages)
    const averageDamageCache = prepareAverageDamageDeltaCache(stages.StatsDmgReady, damageState)
    const currentAverage = averageDamageCache.values.average

    const computedChanges: Record<string, number> = {}
    let index = 0
    const chunkSize = 20

    const computeChunk = () => {
      if (cancelled) return

      const maxIndex = Math.min(index + chunkSize, talentNames.length)
      for (; index < maxIndex; index++) {
        const talentName = talentNames[index]
        const wasSelected = selected.has(talentName)
        const nextAverage = calculateAverageDamageWithStatsDelta(
          averageDamageCache,
          computeTalentToggledDmgReadyStatsDelta(deltaCache, talentName, wasSelected),
        )

        computedChanges[talentName] = wasSelected
          ? currentAverage - nextAverage
          : nextAverage - currentAverage
      }

      if (index < talentNames.length) {
        timeoutId = window.setTimeout(computeChunk, 0)
        return
      }

      startTransition(() => {
        pendingAverageDamageComputationIdRef.current = computationId
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
    const pendingComputationId = pendingAverageDamageComputationIdRef.current

    if (pendingComputationId === null) {
      return
    }

    let cancelled = false

    requestAnimationFrame(() => {
      if (cancelled) {
        return
      }

      completedAverageDamageComputationIdRef.current = pendingComputationId
      setIsAverageDamageReady(true)
      pendingAverageDamageComputationIdRef.current = null
    })

    return () => {
      cancelled = true
    }
  }, [averageDamageChanges])

  usePagePerfBridge({
    pageId: "talents",
    pageLabel: "Talents",
    isReady: isHydrated && columnLayout.isReady && isAverageDamageReady,
    runBenchmarks: async () => {
      const benchmarkTalentName = talentNames[0]
      const samplesMs: number[] = []

      if (!benchmarkTalentName) {
        return []
      }

      for (let index = 0; index < 4; index += 1) {
        const previousComputationId = completedAverageDamageComputationIdRef.current
        const startedAt = performance.now()

        setSelected((currentSelected) => {
          const nextSelected = new Set(currentSelected)

          if (nextSelected.has(benchmarkTalentName)) {
            nextSelected.delete(benchmarkTalentName)
          } else {
            nextSelected.add(benchmarkTalentName)
          }

          return nextSelected
        })

        await waitForCondition(
          () => completedAverageDamageComputationIdRef.current > previousComputationId,
          8000,
        )
        await waitForAnimationFrames(1)
        samplesMs.push(performance.now() - startedAt)
      }

      return [
        summarizeBenchmark(
          "Talent toggle response",
          `Toggles ${benchmarkTalentName} and waits for average-damage deltas to finish recomputing.`,
          samplesMs,
        ),
      ]
    },
  })

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

      if (!matchesAverageDamageFilter(averageDamageChanges[talentName], viewState.averageDamageFilter)) {
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

  useEffect(() => {
    if (!isHydrated || !columnLayout.isReady) {
      return
    }

    const container = containerRef.current
    if (!container) {
      return
    }

    if (focusTalent) {
      const targetRow = rowRefs.current[focusTalent]
      if (!targetRow || lastHandledFocusRef.current === focusTalent) {
        return
      }

      lastHandledFocusRef.current = focusTalent
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
  }, [columnLayout.isReady, displayedTalentNames.length, focusTalent, isHydrated, pathname, router, searchParams])

  if (!isHydrated || !columnLayout.isReady) return <div className="p-4">Loading...</div>

  const spentTalentPoints = selected.size
  const availableTalentPoints = Math.floor(totalLevels / 2)
  const talentPointsOverSpent = spentTalentPoints > availableTalentPoints

  return (
    <div ref={containerRef} className="viewport-below-top-nav overflow-auto border rounded-md">
      <div className="min-w-full w-max">
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
                      talentPointsOverSpent
                        ? "border-rose-500/50 bg-rose-500/10 text-rose-200"
                        : "border-sky-500/40 bg-sky-500/10 text-sky-200"
                    }`}
                  >
                    {spentTalentPoints}/{availableTalentPoints}
                  </span>
                  <span className="truncate">{column.label}</span>
                </span>
              )
              : <span className="truncate">{column.label}</span>
          )}
        />

        <div className="space-y-0.5">
          {displayedTalentNames.map((name, rowIndex) => (
            <ToggleButton
              key={name}
              talentName={name}
              talent={talent_data[name]}
              rowRef={(node) => {
                rowRefs.current[name] = node
              }}
              selected={selected}
              setSelected={setSelected}
              totalLevels={totalLevels}
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

export default function TalentsPage() {
  return (
    <Suspense fallback={<div className="p-4">Loading...</div>}>
      <TalentsPageContent />
    </Suspense>
  )
}
