"use client"

import { startTransition, useDeferredValue, useEffect, useEffectEvent, useMemo, useState, type ReactNode } from "react"
import { BUILD_SNAPSHOT_UPDATED_EVENT } from "@/app/lib/buildEvents"
import { computeBuildStatStages, readBuildSnapshot } from "@/app/lib/buildStats"
import { calculateDamage, formatSignedDamageDelta, readDamageCalcState } from "@/app/lib/damageCalc"
import {
  buildRuneRequirements,
  buildSelectionEntries,
  getMissingScriptsForRuneword,
  plannerRunewords,
  plannerScripts,
  type PlannerStatsRange,
} from "@/app/lib/runewordPlanner"

const STORAGE_KEY_SELECTED_SCRIPTS = "runewordPlanner.selectedScripts"
const STORAGE_KEY_SELECTOR_SORT = "runewordPlanner.selectorSort"
const STORAGE_KEY_SELECTOR_SORT_DIRECTION = "runewordPlanner.selectorSortDirection"
const STORAGE_KEY_RUNE_SORT = "runewordPlanner.runeSort"
const STORAGE_KEY_UNSELECTED_SORT = "runewordPlanner.unselectedSort"
const STORAGE_KEY_UNSELECTED_FILTER = "runewordPlanner.unselectedFilter"

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" })

type SelectorSortMode = "name" | "dmg" | "effect" | "words"
type SortDirection = "asc" | "desc"
type RuneSortMode = "count-desc" | "count-asc" | "tier" | "name"
type UnselectedSortMode = "missing-dmg" | "dmg" | "name" | "type"
type UnselectedFilterMode = "all" | "scripts" | "runewords"

type SummaryRow = {
  key: string
  kind: "script" | "runeword"
  name: string
  description: string
  stats: PlannerStatsRange
  words: string
}

type UnselectedRow = {
  key: string
  kind: "script" | "runeword"
  name: string
  description: string
  stats: PlannerStatsRange
  missingScripts: string[]
  wordRecipe: string[]
  nextSelectedNames: string[]
  searchText: string
}

function formatValue(value: number): string {
  if (!Number.isFinite(value)) return "-"

  if (Math.abs(value) >= 1000) {
    return Math.round(value).toLocaleString("en-US")
  }

  if (Number.isInteger(value)) {
    return String(value)
  }

  const rounded = Math.round(value * 100) / 100
  return rounded.toFixed(2).replace(/\.?0+$/, "")
}

function serializeScriptNames(names: readonly string[]): string {
  return [...names].sort(collator.compare).join("|")
}

function getDefaultSelectorSortDirection(mode: SelectorSortMode): SortDirection {
  return mode === "dmg" ? "desc" : "asc"
}

function serializeStats(stats: Record<string, number>): string {
  return Object.entries(stats)
    .filter(([, value]) => Number.isFinite(value) && Math.abs(value) > 0.0001)
    .sort(([left], [right]) => collator.compare(left, right))
    .map(([stat, value]) => `${stat}:${Number.isInteger(value) ? value : value.toFixed(4)}`)
    .join("|")
}

function mergeScriptNames(baseNames: readonly string[], addedNames: readonly string[]): string[] {
  return Array.from(new Set([...baseNames, ...addedNames])).sort(collator.compare)
}

function getDamageClass(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "text-slate-400"
  }

  if (value > 0) {
    return "text-emerald-300"
  }

  if (value < 0) {
    return "text-rose-300"
  }

  return "text-slate-200"
}

function getStatChipLabel(stat: string, stats: PlannerStatsRange): string {
  const minValue = stats.min[stat] ?? stats.average[stat] ?? 0
  const maxValue = stats.max[stat] ?? stats.average[stat] ?? minValue

  return minValue === maxValue
    ? `${formatValue(minValue)} ${stat}`
    : `${formatValue(minValue)}-${formatValue(maxValue)} ${stat}`
}

function getWordsLabel(words: readonly string[]): string {
  return words.length > 0 ? words.join(", ") : "None"
}

function SectionCard({
  title,
  subtitle,
  actions,
  className = "",
  children,
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
  className?: string
  children: ReactNode
}) {
  return (
    <section
      className={`rounded-2xl border border-slate-800/80 bg-slate-950/70 shadow-[0_24px_80px_-40px_rgba(56,189,248,0.35)] backdrop-blur ${className}`}
    >
      <div className="flex flex-col gap-3 border-b border-slate-800/80 px-4 py-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-slate-50">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-slate-400">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
      <div className="p-4">{children}</div>
    </section>
  )
}

function DamageValue({ value, prefix = "" }: { value: number | null | undefined; prefix?: string }) {
  return (
    <span className={`font-mono text-sm tabular-nums ${getDamageClass(value)}`}>
      {prefix}
      {value === null || value === undefined || !Number.isFinite(value) ? "..." : formatSignedDamageDelta(value)}
    </span>
  )
}

function StatChips({ stats, limit = 3 }: { stats: PlannerStatsRange; limit?: number }) {
  const statKeys = Object.keys(stats.average).sort((left, right) => collator.compare(left, right))
  const visibleKeys = statKeys.slice(0, limit)
  const hiddenCount = Math.max(0, statKeys.length - visibleKeys.length)

  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {visibleKeys.map((stat) => (
        <span
          key={stat}
          className="rounded-full border border-slate-700/80 bg-slate-900/75 px-2 py-1 text-[11px] text-slate-200"
        >
          {getStatChipLabel(stat, stats)}
        </span>
      ))}
      {hiddenCount > 0 ? (
        <span className="rounded-full border border-slate-700/80 bg-slate-900/60 px-2 py-1 text-[11px] text-slate-400">
          +{hiddenCount} more
        </span>
      ) : null}
    </div>
  )
}

export default function RunewordsPage() {
  const [isHydrated, setIsHydrated] = useState(false)
  const [selectedScriptNames, setSelectedScriptNames] = useState<string[]>([])
  const [selectorQuery, setSelectorQuery] = useState("")
  const [showSelectedOnly, setShowSelectedOnly] = useState(false)
  const [selectorSortMode, setSelectorSortMode] = useState<SelectorSortMode>("name")
  const [selectorSortDirection, setSelectorSortDirection] = useState<SortDirection>(
    getDefaultSelectorSortDirection("name"),
  )
  const [unselectedQuery, setUnselectedQuery] = useState("")
  const [runeSortMode, setRuneSortMode] = useState<RuneSortMode>("count-desc")
  const [unselectedSortMode, setUnselectedSortMode] = useState<UnselectedSortMode>("missing-dmg")
  const [unselectedFilterMode, setUnselectedFilterMode] = useState<UnselectedFilterMode>("all")
  const [buildRevision, setBuildRevision] = useState(0)
  const [baseDamage, setBaseDamage] = useState<number | null>(null)
  const [selectionDamage, setSelectionDamage] = useState<number | null>(null)
  const [entryDamageByKey, setEntryDamageByKey] = useState<Record<string, number>>({})
  const [candidateDamageByKey, setCandidateDamageByKey] = useState<Record<string, number>>({})
  const deferredSelectorQuery = useDeferredValue(selectorQuery)
  const deferredUnselectedQuery = useDeferredValue(unselectedQuery)

  const selectedScriptKey = useMemo(
    () => serializeScriptNames(selectedScriptNames),
    [selectedScriptNames],
  )

  const selectionSummary = useMemo(
    () => buildSelectionEntries(selectedScriptNames),
    [selectedScriptKey, selectedScriptNames],
  )

  const summaryRows = useMemo<SummaryRow[]>(
    () => [
      ...selectionSummary.selectedScripts.map((script) => ({
        key: `script:${script.name}`,
        kind: "script" as const,
        name: script.name,
        description: script.description,
        stats: script.stats,
        words: getWordsLabel(script.contributingRunewords),
      })),
      ...selectionSummary.formedRunewords.map((runeword) => ({
        key: `runeword:${runeword.name}`,
        kind: "runeword" as const,
        name: runeword.name,
        description: runeword.description,
        stats: runeword.stats,
        words: "",
      })),
    ].sort((left, right) => collator.compare(left.name, right.name)),
    [selectionSummary],
  )

  const runeRequirements = useMemo(() => {
    const rows = buildRuneRequirements(selectedScriptNames)

    return rows.sort((left, right) => {
      switch (runeSortMode) {
        case "count-asc":
          return left.count - right.count || collator.compare(left.rune, right.rune)
        case "tier":
          return collator.compare(left.tier, right.tier) || collator.compare(left.rune, right.rune)
        case "name":
          return collator.compare(left.rune, right.rune)
        case "count-desc":
        default:
          return right.count - left.count || collator.compare(left.rune, right.rune)
      }
    })
  }, [runeSortMode, selectedScriptKey, selectedScriptNames])

  const effectSummaryRows = useMemo(
    () => [...selectionSummary.effectSummary].sort((left, right) =>
      Math.abs(right.average) - Math.abs(left.average) || collator.compare(left.stat, right.stat),
    ),
    [selectionSummary.effectSummary],
  )

  const selectorRows = useMemo(() => {
    const normalizedQuery = deferredSelectorQuery.trim().toLowerCase()
    const selectedSet = new Set(selectedScriptNames)

    return [...plannerScripts
      .filter((script) => {
        if (showSelectedOnly && !selectedSet.has(script.name)) {
          return false
        }

        if (!normalizedQuery) {
          return true
        }

        const searchText = `${script.name} ${script.description} ${script.contributingRunewords.join(" ")}`
          .toLowerCase()
        return searchText.includes(normalizedQuery)
      })]
      .sort((left, right) => {
        if (selectorSortMode === "dmg") {
          const leftDamage = entryDamageByKey[`script:${left.name}`]
          const rightDamage = entryDamageByKey[`script:${right.name}`]
          const leftHasDamage = typeof leftDamage === "number" && Number.isFinite(leftDamage)
          const rightHasDamage = typeof rightDamage === "number" && Number.isFinite(rightDamage)

          if (leftHasDamage !== rightHasDamage) {
            return leftHasDamage ? -1 : 1
          }

          if (leftHasDamage && rightHasDamage && leftDamage !== rightDamage) {
            return selectorSortDirection === "asc" ? leftDamage - rightDamage : rightDamage - leftDamage
          }
        }

        if (selectorSortMode === "effect") {
          const descriptionDifference = collator.compare(left.description, right.description)

          if (descriptionDifference !== 0) {
            return selectorSortDirection === "asc" ? descriptionDifference : -descriptionDifference
          }
        }

        if (selectorSortMode === "words") {
          const wordsDifference = collator.compare(
            getWordsLabel(left.contributingRunewords),
            getWordsLabel(right.contributingRunewords),
          )

          if (wordsDifference !== 0) {
            return selectorSortDirection === "asc" ? wordsDifference : -wordsDifference
          }
        }

        const nameDifference = collator.compare(left.name, right.name)

        return selectorSortMode === "name" && selectorSortDirection === "desc"
          ? -nameDifference
          : nameDifference
      })
  }, [
    deferredSelectorQuery,
    entryDamageByKey,
    selectedScriptNames,
    selectorSortDirection,
    selectorSortMode,
    showSelectedOnly,
  ])

  const unselectedRowsBase = useMemo(() => {
    const selectedSet = new Set(selectedScriptNames)
    const normalizedQuery = deferredUnselectedQuery.trim().toLowerCase()

    const scriptRows: UnselectedRow[] = plannerScripts
      .filter((script) => !selectedSet.has(script.name))
      .map((script) => ({
        key: `script:${script.name}`,
        kind: "script",
        name: script.name,
        description: script.description,
        stats: script.stats,
        missingScripts: [script.name],
        wordRecipe: [],
        nextSelectedNames: mergeScriptNames(selectedScriptNames, [script.name]),
        searchText: `${script.name} ${script.description} ${script.contributingRunewords.join(" ")}`.toLowerCase(),
      }))

    const runewordRows: UnselectedRow[] = plannerRunewords
      .filter((runeword) => runeword.componentWords.some((componentWord) => !selectedSet.has(componentWord)))
      .map((runeword) => {
        const missingScripts = getMissingScriptsForRuneword(runeword.name, selectedScriptNames)
        return {
          key: `runeword:${runeword.name}`,
          kind: "runeword",
          name: runeword.name,
          description: runeword.description,
          stats: runeword.stats,
          missingScripts,
          wordRecipe: runeword.componentWords,
          nextSelectedNames: mergeScriptNames(selectedScriptNames, missingScripts),
          searchText: `${runeword.name} ${runeword.description} ${runeword.componentWords.join(" ")}`.toLowerCase(),
        }
      })

    return [...scriptRows, ...runewordRows]
      .filter((row) => {
        if (unselectedFilterMode === "scripts" && row.kind !== "script") {
          return false
        }

        if (unselectedFilterMode === "runewords" && row.kind !== "runeword") {
          return false
        }

        if (!normalizedQuery) {
          return true
        }

        return row.searchText.includes(normalizedQuery)
      })
  }, [
    deferredUnselectedQuery,
    selectedScriptKey,
    selectedScriptNames,
    unselectedFilterMode,
  ])

  const unselectedRows = useMemo(
    () => [...unselectedRowsBase].sort((left, right) => {
      const leftDamage = candidateDamageByKey[left.key] ?? null
      const rightDamage = candidateDamageByKey[right.key] ?? null
      const leftDamageValue = leftDamage ?? Number.NEGATIVE_INFINITY
      const rightDamageValue = rightDamage ?? Number.NEGATIVE_INFINITY

      switch (unselectedSortMode) {
        case "dmg":
          return rightDamageValue - leftDamageValue || collator.compare(left.name, right.name)
        case "name":
          return collator.compare(left.name, right.name)
        case "type":
          return collator.compare(left.kind, right.kind) || collator.compare(left.name, right.name)
        case "missing-dmg":
        default:
          return (
            left.missingScripts.length - right.missingScripts.length
            || rightDamageValue - leftDamageValue
            || collator.compare(left.name, right.name)
          )
      }
    }),
    [candidateDamageByKey, unselectedRowsBase, unselectedSortMode],
  )

  useEffect(() => {
    try {
      const storedSelectedScripts = JSON.parse(localStorage.getItem(STORAGE_KEY_SELECTED_SCRIPTS) ?? "[]") as unknown
      if (Array.isArray(storedSelectedScripts)) {
        setSelectedScriptNames(
          storedSelectedScripts
            .filter((entry): entry is string => typeof entry === "string")
            .filter((entry) => plannerScripts.some((script) => script.name === entry))
            .sort(collator.compare),
        )
      }

      const storedRuneSort = localStorage.getItem(STORAGE_KEY_RUNE_SORT)
      if (
        storedRuneSort === "count-desc"
        || storedRuneSort === "count-asc"
        || storedRuneSort === "tier"
        || storedRuneSort === "name"
      ) {
        setRuneSortMode(storedRuneSort)
      }

      const storedSelectorSort = localStorage.getItem(STORAGE_KEY_SELECTOR_SORT)
      if (
        storedSelectorSort === "name"
        || storedSelectorSort === "dmg"
        || storedSelectorSort === "effect"
        || storedSelectorSort === "words"
      ) {
        setSelectorSortMode(storedSelectorSort)
      }

      const storedSelectorSortDirection = localStorage.getItem(STORAGE_KEY_SELECTOR_SORT_DIRECTION)
      if (storedSelectorSortDirection === "asc" || storedSelectorSortDirection === "desc") {
        setSelectorSortDirection(storedSelectorSortDirection)
      }

      const storedUnselectedSort = localStorage.getItem(STORAGE_KEY_UNSELECTED_SORT)
      if (
        storedUnselectedSort === "missing-dmg"
        || storedUnselectedSort === "dmg"
        || storedUnselectedSort === "name"
        || storedUnselectedSort === "type"
      ) {
        setUnselectedSortMode(storedUnselectedSort)
      }

      const storedUnselectedFilter = localStorage.getItem(STORAGE_KEY_UNSELECTED_FILTER)
      if (
        storedUnselectedFilter === "all"
        || storedUnselectedFilter === "scripts"
        || storedUnselectedFilter === "runewords"
      ) {
        setUnselectedFilterMode(storedUnselectedFilter)
      }
    } catch {}

    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (!isHydrated) return
    localStorage.setItem(STORAGE_KEY_SELECTED_SCRIPTS, JSON.stringify(selectedScriptNames))
  }, [isHydrated, selectedScriptKey, selectedScriptNames])

  useEffect(() => {
    if (!isHydrated) return
    localStorage.setItem(STORAGE_KEY_SELECTOR_SORT, selectorSortMode)
  }, [isHydrated, selectorSortMode])

  useEffect(() => {
    if (!isHydrated) return
    localStorage.setItem(STORAGE_KEY_SELECTOR_SORT_DIRECTION, selectorSortDirection)
  }, [isHydrated, selectorSortDirection])

  useEffect(() => {
    if (!isHydrated) return
    localStorage.setItem(STORAGE_KEY_RUNE_SORT, runeSortMode)
  }, [isHydrated, runeSortMode])

  useEffect(() => {
    if (!isHydrated) return
    localStorage.setItem(STORAGE_KEY_UNSELECTED_SORT, unselectedSortMode)
  }, [isHydrated, unselectedSortMode])

  useEffect(() => {
    if (!isHydrated) return
    localStorage.setItem(STORAGE_KEY_UNSELECTED_FILTER, unselectedFilterMode)
  }, [isHydrated, unselectedFilterMode])

  const refreshBuildRevision = useEffectEvent(() => {
    startTransition(() => {
      setBuildRevision((current) => current + 1)
    })
  })

  useEffect(() => {
    if (!isHydrated) return

    window.addEventListener(BUILD_SNAPSHOT_UPDATED_EVENT, refreshBuildRevision)
    window.addEventListener("storage", refreshBuildRevision)
    window.addEventListener("focus", refreshBuildRevision)

    return () => {
      window.removeEventListener(BUILD_SNAPSHOT_UPDATED_EVENT, refreshBuildRevision)
      window.removeEventListener("storage", refreshBuildRevision)
      window.removeEventListener("focus", refreshBuildRevision)
    }
  }, [isHydrated, refreshBuildRevision])

  useEffect(() => {
    if (!isHydrated) return

    let cancelled = false
    let timeoutId: number | null = null

    const snapshot = readBuildSnapshot(localStorage)
    const damageState = readDamageCalcState(localStorage)
    const baseStages = computeBuildStatStages(snapshot)
    const baseDamageValue = calculateDamage(baseStages.StatsDmgReady, damageState).average
    const statsDamageCache = new Map<string, number>()
    const selectionStatsCache = new Map<string, Record<string, number>>()
    const selectionDamageCache = new Map<string, number>()

    const getDamageForStats = (stats: Record<string, number>): number => {
      const key = serializeStats(stats)

      if (!key) {
        return baseDamageValue
      }

      const cached = statsDamageCache.get(key)
      if (cached !== undefined) {
        return cached
      }

      const nextDamage = calculateDamage(
        computeBuildStatStages(snapshot, { extraRawStats: stats }).StatsDmgReady,
        damageState,
      ).average

      statsDamageCache.set(key, nextDamage)
      return nextDamage
    }

    const getSelectionDamage = (scriptNames: readonly string[]): number => {
      const selectionKey = serializeScriptNames(scriptNames)
      const cachedDamage = selectionDamageCache.get(selectionKey)
      if (cachedDamage !== undefined) {
        return cachedDamage
      }

      let selectionStats = selectionStatsCache.get(selectionKey)
      if (!selectionStats) {
        selectionStats = buildSelectionEntries(scriptNames).averageStats
        selectionStatsCache.set(selectionKey, selectionStats)
      }

      const nextDamage = getDamageForStats(selectionStats)
      selectionDamageCache.set(selectionKey, nextDamage)
      return nextDamage
    }

    const currentSelectionDamageValue = getSelectionDamage(selectedScriptNames)
    const nextEntryDamageByKey: Record<string, number> = {}
    const nextCandidateDamageByKey: Record<string, number> = {}

    setBaseDamage(baseDamageValue)
    setSelectionDamage(currentSelectionDamageValue)

    const tasks: Array<
      | {
          kind: "entry"
          key: string
          stats: Record<string, number>
        }
      | {
          kind: "candidate"
          key: string
          nextSelectedNames: string[]
        }
    > = [
      ...plannerScripts.map((script) => ({
        kind: "entry" as const,
        key: `script:${script.name}`,
        stats: script.stats.average,
      })),
      ...selectionSummary.formedRunewords.map((runeword) => ({
        kind: "entry" as const,
        key: `runeword:${runeword.name}`,
        stats: runeword.stats.average,
      })),
      ...unselectedRowsBase.map((row) => ({
        kind: "candidate" as const,
        key: row.key,
        nextSelectedNames: row.nextSelectedNames,
      })),
    ]

    let index = 0
    const chunkSize = 12

    const processChunk = () => {
      if (cancelled) return

      const maxIndex = Math.min(index + chunkSize, tasks.length)

      for (; index < maxIndex; index += 1) {
        const task = tasks[index]

        if (task.kind === "entry") {
          nextEntryDamageByKey[task.key] = getDamageForStats(task.stats) - baseDamageValue
          continue
        }

        nextCandidateDamageByKey[task.key] = getSelectionDamage(task.nextSelectedNames) - currentSelectionDamageValue
      }

      if (index < tasks.length) {
        timeoutId = window.setTimeout(processChunk, 0)
        return
      }

      startTransition(() => {
        setEntryDamageByKey(nextEntryDamageByKey)
        setCandidateDamageByKey(nextCandidateDamageByKey)
      })
    }

    processChunk()

    return () => {
      cancelled = true
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId)
      }
    }
  }, [buildRevision, isHydrated, selectedScriptKey, selectedScriptNames, selectionSummary, unselectedRowsBase])

  const totalSelectionDamage = useMemo(() => {
    if (baseDamage === null || selectionDamage === null) {
      return null
    }

    return selectionDamage - baseDamage
  }, [baseDamage, selectionDamage])

  const toggleScript = (name: string) => {
    startTransition(() => {
      setSelectedScriptNames((current) => {
        if (current.includes(name)) {
          return current.filter((entry) => entry !== name)
        }

        return [...current, name].sort(collator.compare)
      })
    })
  }

  const handleSelectorSort = (mode: SelectorSortMode) => {
    if (selectorSortMode === mode) {
      setSelectorSortDirection((current) => current === "asc" ? "desc" : "asc")
      return
    }

    setSelectorSortMode(mode)
    setSelectorSortDirection(getDefaultSelectorSortDirection(mode))
  }

  const renderSelectorHeader = (
    label: string,
    mode: SelectorSortMode,
    className: string,
    align: "left" | "right" = "left",
  ) => {
    const isActive = selectorSortMode === mode

    return (
      <th
        className={className}
        aria-sort={isActive ? (selectorSortDirection === "asc" ? "ascending" : "descending") : "none"}
      >
        <button
          type="button"
          onClick={() => handleSelectorSort(mode)}
          className={`flex w-full items-center gap-2 ${align === "right" ? "justify-end" : "justify-start"} font-medium text-inherit transition hover:text-slate-200`}
          title={`Sort by ${label.toLowerCase()}`}
        >
          <span>{label}</span>
          <span className={isActive ? "text-cyan-200" : "text-slate-600"}>
            {isActive ? (selectorSortDirection === "asc" ? "↑" : "↓") : "↕"}
          </span>
        </button>
      </th>
    )
  }

  if (!isHydrated) {
    return <div className="p-6 text-sm text-slate-300">Loading runeword planner...</div>
  }

  return (
    <div className="min-h-[calc(100vh-var(--top-nav-height))] bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.16),transparent_30%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.1),transparent_22%),radial-gradient(circle_at_bottom_left,rgba(249,115,22,0.1),transparent_26%)]">
      <div className="mx-auto max-w-[1700px] px-4 py-6">
        <div className="mb-6 flex flex-col gap-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-50">Runeword Planner</h1>
              <p className="mt-1 max-w-3xl text-sm text-slate-300">
                Select scripts, see which runewords they complete, review rune requirements, and compare the next best
                scripts or words to chase from your current build. Damage estimates use the average roll for each
                script and runeword range.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-2xl border border-slate-800/80 bg-slate-950/70 px-3 py-2">
                <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Scripts</div>
                <div className="mt-1 text-lg font-semibold text-slate-50">{selectionSummary.selectedScripts.length}</div>
              </div>
              <div className="rounded-2xl border border-slate-800/80 bg-slate-950/70 px-3 py-2">
                <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Words</div>
                <div className="mt-1 text-lg font-semibold text-slate-50">{selectionSummary.formedRunewords.length}</div>
              </div>
              <div className="rounded-2xl border border-slate-800/80 bg-slate-950/70 px-3 py-2">
                <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Total Dmg</div>
                <div className={`mt-1 text-lg font-semibold ${getDamageClass(totalSelectionDamage)}`}>
                  {totalSelectionDamage === null ? "..." : formatSignedDamageDelta(totalSelectionDamage)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.95fr)]">
          <div className="space-y-6">
            <SectionCard
              title="Script Selector"
              subtitle="Toggle scripts from the table below. Click a column header to sort by name, damage, effect, or words."
              actions={(
                <>
                  <button
                    type="button"
                    onClick={() => setShowSelectedOnly((current) => !current)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                      showSelectedOnly
                        ? "border-cyan-400/60 bg-cyan-400/12 text-cyan-100"
                        : "border-slate-700/80 bg-slate-900/70 text-slate-300"
                    }`}
                  >
                    {showSelectedOnly ? "Showing selected" : "Show selected only"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedScriptNames([])}
                    className="rounded-full border border-slate-700/80 bg-slate-900/70 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800/80"
                  >
                    Clear all
                  </button>
                </>
              )}
            >
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                <input
                  type="text"
                  value={selectorQuery}
                  onChange={(event) => setSelectorQuery(event.target.value)}
                  placeholder="Search script, stat, or runeword"
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-900/75 px-3 py-2 text-sm"
                />
                <div className="shrink-0 rounded-full border border-slate-700/80 bg-slate-900/70 px-3 py-2 text-xs text-slate-300">
                  {selectorRows.length} visible
                </div>
              </div>
              {selectorRows.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/55 px-4 py-6 text-sm text-slate-400">
                  No scripts match the current search and filter.
                </div>
              ) : (
                <div className="max-h-[58rem] overflow-auto rounded-2xl border border-slate-800/80 bg-slate-950/35">
                  <table className="min-w-[980px] w-full table-fixed text-left text-sm">
                    <colgroup>
                      <col className="w-[14rem]" />
                      <col className="w-[9rem]" />
                      <col className="w-[23rem]" />
                      <col className="w-[18rem]" />
                    </colgroup>
                    <thead className="sticky top-0 z-10 bg-slate-950/95 text-[11px] uppercase tracking-[0.18em] text-slate-500 backdrop-blur">
                      <tr>
                        {renderSelectorHeader("Name", "name", "px-3 py-3")}
                        {renderSelectorHeader("dmg", "dmg", "w-[9rem] px-3 py-3", "right")}
                        {renderSelectorHeader("effect", "effect", "px-3 py-3")}
                        {renderSelectorHeader("words", "words", "px-3 py-3")}
                      </tr>
                    </thead>
                    <tbody>
                      {selectorRows.map((script) => {
                        const isSelected = selectedScriptNames.includes(script.name)
                        const wordsLabel = getWordsLabel(script.contributingRunewords)

                        return (
                          <tr
                            key={script.name}
                            tabIndex={0}
                            aria-selected={isSelected}
                            onClick={() => toggleScript(script.name)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault()
                                toggleScript(script.name)
                              }
                            }}
                            className={`cursor-pointer border-t border-slate-800/70 align-top transition focus-visible:outline-2 focus-visible:outline-cyan-400/60 ${
                              isSelected
                                ? "bg-cyan-400/10 hover:bg-cyan-400/14"
                                : "hover:bg-slate-900/65"
                            }`}
                          >
                            <td className="px-3 py-3 align-top">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-slate-50">{script.name}</span>
                                {isSelected ? (
                                  <span className="rounded-full bg-cyan-400/18 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-cyan-100">
                                    Selected
                                  </span>
                                ) : null}
                              </div>
                            </td>
                            <td className="w-[9rem] px-3 py-3 text-right align-top">
                              <div className="flex justify-end">
                                <div className="w-[7.5rem] text-right">
                                  <DamageValue value={entryDamageByKey[`script:${script.name}`] ?? null} />
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-3 align-top break-words text-slate-300">{script.description}</td>
                            <td className="px-3 py-3 align-top break-words text-slate-300">{wordsLabel}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </SectionCard>

            <div className="grid gap-6 2xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <SectionCard
                title="Rune Requirements"
                subtitle="Combined rune totals for the scripts you currently have selected."
                actions={(
                  <select
                    value={runeSortMode}
                    onChange={(event) => setRuneSortMode(event.target.value as RuneSortMode)}
                    className="rounded-xl border border-slate-700/80 bg-slate-900/75 px-3 py-2 text-sm"
                  >
                    <option value="count-desc">Count high to low</option>
                    <option value="count-asc">Count low to high</option>
                    <option value="tier">Tier then name</option>
                    <option value="name">Name A-Z</option>
                  </select>
                )}
              >
                {runeRequirements.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/55 px-4 py-6 text-sm text-slate-400">
                    Select scripts to see the rune totals needed to craft them.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {runeRequirements.map((requirement) => (
                      <div
                        key={requirement.rune}
                        className="grid gap-2 rounded-2xl border border-slate-800/80 bg-slate-900/40 px-3 py-3 sm:grid-cols-[minmax(0,1fr)_auto]"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-100">{requirement.rune}</span>
                            <span className="rounded-full bg-slate-800/80 px-2 py-1 text-[11px] text-slate-300">
                              {requirement.tier}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-slate-400">{requirement.description || "No description"}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Count</div>
                          <div className="mt-1 font-mono text-lg text-slate-100">{requirement.count}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>

              <SectionCard
                title="Effects Summary"
                subtitle="Full combined effect totals from your selected scripts and completed runewords."
              >
                {effectSummaryRows.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/55 px-4 py-6 text-sm text-slate-400">
                    Select scripts to see min, max, and average effect totals.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead className="text-xs uppercase tracking-[0.18em] text-slate-500">
                        <tr>
                          <th className="pb-3 pr-4 font-medium">Stat</th>
                          <th className="pb-3 pr-4 font-medium">Min</th>
                          <th className="pb-3 pr-4 font-medium">Max</th>
                          <th className="pb-3 font-medium">Average</th>
                        </tr>
                      </thead>
                      <tbody>
                        {effectSummaryRows.map((row) => (
                          <tr key={row.stat} className="border-t border-slate-800/70">
                            <td className="py-2 pr-4 font-medium text-slate-100">{row.stat}</td>
                            <td className="py-2 pr-4 font-mono text-slate-300">{formatValue(row.min)}</td>
                            <td className="py-2 pr-4 font-mono text-slate-300">{formatValue(row.max)}</td>
                            <td className="py-2 font-mono text-slate-100">{formatValue(row.average)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </SectionCard>
            </div>
          </div>

          <SectionCard
            title="Current Summary"
            subtitle="Selected scripts and completed runewords in one table. Damage values use your saved build and damage calc settings."
            className="h-full"
          >
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-800/80 bg-slate-900/45 p-3">
                <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Build Damage</div>
                <div className="mt-2 font-mono text-lg text-slate-50">
                  {baseDamage === null ? "..." : Math.trunc(baseDamage).toLocaleString("en-US")}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-800/80 bg-slate-900/45 p-3">
                <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">With Selection</div>
                <div className="mt-2 font-mono text-lg text-slate-50">
                  {selectionDamage === null ? "..." : Math.trunc(selectionDamage).toLocaleString("en-US")}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-800/80 bg-slate-900/45 p-3">
                <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Total Delta</div>
                <div className={`mt-2 font-mono text-lg ${getDamageClass(totalSelectionDamage)}`}>
                  {totalSelectionDamage === null ? "..." : formatSignedDamageDelta(totalSelectionDamage)}
                </div>
              </div>
            </div>

            <div className="mt-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-slate-100">Selected Summary</h3>
                <span className="rounded-full bg-slate-900/70 px-2 py-1 text-[11px] text-slate-300">
                  {summaryRows.length}
                </span>
              </div>
              {summaryRows.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/55 px-4 py-6 text-sm text-slate-400">
                  No scripts selected yet.
                </div>
              ) : (
                <div className="overflow-auto rounded-2xl border border-slate-800/80 bg-slate-950/35">
                  <table className="min-w-[980px] w-full text-left text-sm">
                    <thead className="bg-slate-950/95 text-[11px] uppercase tracking-[0.18em] text-slate-500">
                      <tr>
                        <th className="px-3 py-3 font-medium">Name</th>
                        <th className="px-3 py-3 text-right font-medium">dmg</th>
                        <th className="px-3 py-3 font-medium">effect</th>
                        <th className="px-3 py-3 font-medium">words</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summaryRows.map((row) => (
                        <tr key={row.key} className="border-t border-slate-800/70 align-top">
                          <td className="px-3 py-3 align-top">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-50">{row.name}</span>
                              {row.kind === "runeword" ? (
                                <span className="rounded-full bg-emerald-400/12 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-emerald-100">
                                  Runeword
                                </span>
                              ) : null}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-right align-top">
                            <DamageValue value={entryDamageByKey[row.key] ?? null} />
                          </td>
                          <td className="px-3 py-3 align-top text-slate-300">{row.description}</td>
                          <td className="px-3 py-3 align-top text-slate-300">{row.words}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </SectionCard>
        </div>

        <div className="mt-6">
          <SectionCard
            title="Unselected Scripts And Runewords"
            subtitle="Rows are sorted by scripts missing, then by estimated damage gain from your current selection."
            actions={(
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  value={unselectedQuery}
                  onChange={(event) => setUnselectedQuery(event.target.value)}
                  placeholder="Search unselected rows"
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-900/75 px-3 py-2 text-sm sm:min-w-[14rem]"
                />
                <select
                  value={unselectedFilterMode}
                  onChange={(event) => setUnselectedFilterMode(event.target.value as UnselectedFilterMode)}
                  className="rounded-xl border border-slate-700/80 bg-slate-900/75 px-3 py-2 text-sm"
                >
                  <option value="all">All rows</option>
                  <option value="scripts">Scripts only</option>
                  <option value="runewords">Runewords only</option>
                </select>
                <select
                  value={unselectedSortMode}
                  onChange={(event) => setUnselectedSortMode(event.target.value as UnselectedSortMode)}
                  className="rounded-xl border border-slate-700/80 bg-slate-900/75 px-3 py-2 text-sm"
                >
                  <option value="missing-dmg">Missing then damage</option>
                  <option value="dmg">Damage high to low</option>
                  <option value="name">Name A-Z</option>
                  <option value="type">Type then name</option>
                </select>
              </div>
            )}
          >
            {unselectedRows.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/55 px-4 py-6 text-sm text-slate-400">
                Everything in the current filter is already selected or completed.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div className="min-w-[1080px]">
                  <div className="grid grid-cols-[100px_160px_140px_230px_minmax(260px,1fr)_220px] gap-4 border-b border-slate-800/80 pb-3 text-[11px] uppercase tracking-[0.18em] text-slate-500">
                    <div>Type</div>
                    <div>Name</div>
                    <div>Dmg Increase</div>
                    <div>Scripts Missing</div>
                    <div>Description</div>
                    <div>Word Recipe</div>
                  </div>
                  <div className="divide-y divide-slate-800/70">
                    {unselectedRows.map((row) => (
                      <div
                        key={row.key}
                        className="grid grid-cols-[100px_160px_140px_230px_minmax(260px,1fr)_220px] gap-4 py-3"
                      >
                        <div>
                          <span
                            className={`rounded-full px-2 py-1 text-[11px] font-medium ${
                              row.kind === "runeword"
                                ? "bg-emerald-400/12 text-emerald-100"
                                : "bg-sky-400/12 text-sky-100"
                            }`}
                          >
                            {row.kind}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-slate-100">{row.name}</div>
                          <StatChips stats={row.stats} limit={2} />
                        </div>
                        <div className="pt-0.5">
                          <DamageValue value={candidateDamageByKey[row.key] ?? null} />
                        </div>
                        <div className="text-sm text-slate-300">
                          <div className="font-mono text-xs text-slate-500">{row.missingScripts.length} missing</div>
                          <div className="mt-1">{row.missingScripts.join(", ")}</div>
                        </div>
                        <div className="text-sm text-slate-300">{row.description}</div>
                        <div className="text-sm text-slate-300">
                          {row.kind === "runeword" ? row.wordRecipe.join(" + ") : <span className="text-slate-500">—</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  )
}
