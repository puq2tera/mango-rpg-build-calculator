"use client"

import { Fragment, startTransition, useDeferredValue, useEffect, useEffectEvent, useMemo, useRef, useState, type ReactNode } from "react"
import { BUILD_SNAPSHOT_UPDATED_EVENT } from "@/app/lib/buildEvents"
import { computeBuildStatStages, readBuildSnapshot } from "@/app/lib/buildStats"
import { calculateDamage, formatSignedDamageDelta, readDamageCalcState } from "@/app/lib/damageCalc"
import { useManagedColumns, type ManagedColumn, type ManagedColumnDefinition } from "@/app/lib/managedColumns"
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
const STORAGE_KEY_SELECTOR_COLUMNS = "runewordPlanner.selectorColumns"
const STORAGE_KEY_UNSELECTED_COLUMNS = "runewordPlanner.unselectedColumns"
const STORAGE_KEY_TOP_SPLIT = "runewordPlanner.topSplit"
const STORAGE_KEY_BOTTOM_SPLIT = "runewordPlanner.bottomSplit"

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" })

type SelectorSortMode = "name" | "dmg" | "effect" | "words"
type SortDirection = "asc" | "desc"
type RuneSortMode = "count-desc" | "count-asc" | "tier" | "name"
type UnselectedSortMode = "missing-dmg" | "dmg" | "name" | "type"
type UnselectedFilterMode = "all" | "scripts" | "runewords"
type SelectorColumnId = "name" | "dmg" | "effect" | "words"
type UnselectedColumnId = "name" | "dmg" | "description" | "recipe"

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

const selectorTableColumns: readonly ManagedColumnDefinition<SelectorColumnId>[] = [
  { id: "name", label: "Name", defaultWidth: 108, minWidth: 88 },
  { id: "dmg", label: "dmg", defaultWidth: 92, minWidth: 72 },
  { id: "effect", label: "Effect", defaultWidth: 340, minWidth: 140 },
  { id: "words", label: "Words", defaultWidth: 250, minWidth: 120 },
]

const unselectedTableColumns: readonly ManagedColumnDefinition<UnselectedColumnId>[] = [
  { id: "name", label: "Name", defaultWidth: 108, minWidth: 88 },
  { id: "dmg", label: "Dmg Increase", defaultWidth: 96, minWidth: 64 },
  { id: "description", label: "Description", defaultWidth: 320, minWidth: 140 },
  { id: "recipe", label: "Word Recipe", defaultWidth: 220, minWidth: 120 },
]

const TOP_MIN_SPLIT_PERCENT = 28
const TOP_MAX_SPLIT_PERCENT = 72
const BOTTOM_MIN_SPLIT_PERCENT = 55
const BOTTOM_MAX_SPLIT_PERCENT = 80
const DEFAULT_TOP_SPLIT = 46
const DEFAULT_BOTTOM_SPLIT = 74

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

function PlannerSection({
  title,
  subtitle,
  actions,
  className = "",
  bodyClassName = "",
  children,
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
  className?: string
  bodyClassName?: string
  children: ReactNode
}) {
  return (
    <section className={`min-w-0 ${className}`}>
      <div className="flex flex-col gap-3 border-b border-slate-800/70 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-slate-50">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-slate-400">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      <div className={`pt-4 ${bodyClassName}`}>{children}</div>
    </section>
  )
}

function useStoredSplitRatio(storageKey: string, defaultValue: number, minValue: number, maxValue: number) {
  const [value, setValue] = useState(defaultValue)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const storedValue = localStorage.getItem(storageKey)
    const parsedValue = storedValue === null ? Number.NaN : Number(storedValue)
    setValue(
      Number.isFinite(parsedValue)
        ? Math.min(maxValue, Math.max(minValue, parsedValue))
        : defaultValue,
    )
    setIsReady(true)
  }, [defaultValue, maxValue, minValue, storageKey])

  useEffect(() => {
    if (!isReady) return
    localStorage.setItem(storageKey, String(value))
  }, [isReady, storageKey, value])

  const reset = () => setValue(defaultValue)

  return { value, setValue, isReady, reset }
}

type ManagedHeaderProps<T extends string> = {
  columns: ManagedColumn<T>[]
  gridTemplateColumns: string
  onSetColumnCollapsed: (id: T, collapsed: boolean) => void
  onSetColumnWidth: (id: T, width: number) => void
  renderHeaderCell: (column: ManagedColumn<T>) => ReactNode
}

function ManagedGridHeader<T extends string>({
  columns,
  gridTemplateColumns,
  onSetColumnCollapsed,
  onSetColumnWidth,
  renderHeaderCell,
}: ManagedHeaderProps<T>) {
  const [resizeState, setResizeState] = useState<{ id: T; startX: number; startWidth: number } | null>(null)
  const expandedCount = columns.filter((column) => !column.collapsed).length

  useEffect(() => {
    if (!resizeState) return

    const previousUserSelect = document.body.style.userSelect
    const previousCursor = document.body.style.cursor
    document.body.style.userSelect = "none"
    document.body.style.cursor = "col-resize"

    const handlePointerMove = (event: PointerEvent) => {
      const nextWidth = resizeState.startWidth + (event.clientX - resizeState.startX)
      onSetColumnWidth(resizeState.id, nextWidth)
    }

    const stopResizing = () => setResizeState(null)

    window.addEventListener("pointermove", handlePointerMove)
    window.addEventListener("pointerup", stopResizing)
    window.addEventListener("pointercancel", stopResizing)

    return () => {
      document.body.style.userSelect = previousUserSelect
      document.body.style.cursor = previousCursor
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup", stopResizing)
      window.removeEventListener("pointercancel", stopResizing)
    }
  }, [onSetColumnWidth, resizeState])

  return (
    <div className="sticky top-0 z-10 border-b border-slate-800/80 bg-slate-950/95 backdrop-blur">
      <div className="grid min-w-full w-max gap-x-0 text-[11px] uppercase tracking-[0.18em] text-slate-500" style={{ gridTemplateColumns }}>
        {columns.map((column) => {
          if (column.collapsed) {
            return (
              <button
                key={column.id}
                type="button"
                onClick={() => onSetColumnCollapsed(column.id, false)}
                className="flex items-center justify-center border-r border-slate-800/80 py-3 text-[10px] text-slate-300 last:border-r-0 hover:bg-slate-900/70"
                title={`Expand ${column.label}`}
              >
                +
              </button>
            )
          }

          return (
            <div key={column.id} className="relative flex min-w-0 items-stretch border-r border-slate-800/80 last:border-r-0">
              <div className="flex min-w-0 flex-1 items-center px-3 py-3">{renderHeaderCell(column)}</div>
              <button
                type="button"
                onClick={() => onSetColumnCollapsed(column.id, true)}
                disabled={expandedCount <= 1}
                className="shrink-0 px-2 text-[10px] text-slate-500 transition hover:text-slate-200 disabled:cursor-not-allowed disabled:text-slate-700"
                title={`Collapse ${column.label}`}
              >
                -
              </button>
              <div
                className="absolute right-0 top-0 h-full w-2 cursor-col-resize hover:bg-cyan-400/20"
                onPointerDown={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  setResizeState({ id: column.id, startX: event.clientX, startWidth: column.width })
                }}
                title={`Resize ${column.label}`}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ResizableSectionPair({
  left,
  right,
  splitRatio,
  onChangeSplitRatio,
  minSplitRatio,
  maxSplitRatio,
  className = "",
  leftClassName = "",
  rightClassName = "",
}: {
  left: ReactNode
  right: ReactNode
  splitRatio: number
  onChangeSplitRatio: (value: number) => void
  minSplitRatio: number
  maxSplitRatio: number
  className?: string
  leftClassName?: string
  rightClassName?: string
}) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    if (!isDragging) return

    const previousUserSelect = document.body.style.userSelect
    const previousCursor = document.body.style.cursor
    document.body.style.userSelect = "none"
    document.body.style.cursor = "col-resize"

    const handlePointerMove = (event: PointerEvent) => {
      const container = containerRef.current
      if (!container) return

      const bounds = container.getBoundingClientRect()
      if (bounds.width <= 0) return

      const nextRatio = ((event.clientX - bounds.left) / bounds.width) * 100
      onChangeSplitRatio(Math.min(maxSplitRatio, Math.max(minSplitRatio, nextRatio)))
    }

    const stopDragging = () => setIsDragging(false)

    window.addEventListener("pointermove", handlePointerMove)
    window.addEventListener("pointerup", stopDragging)
    window.addEventListener("pointercancel", stopDragging)

    return () => {
      document.body.style.userSelect = previousUserSelect
      document.body.style.cursor = previousCursor
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup", stopDragging)
      window.removeEventListener("pointercancel", stopDragging)
    }
  }, [isDragging, maxSplitRatio, minSplitRatio, onChangeSplitRatio])

  return (
    <div ref={containerRef} className={`flex flex-col gap-y-8 xl:flex-row xl:items-stretch xl:gap-y-0 ${className}`}>
      <div className={`min-w-0 xl:shrink-0 ${leftClassName}`} style={{ flexBasis: `${splitRatio}%` }}>
        {left}
      </div>
      <div className="hidden xl:flex w-2 shrink-0 items-stretch justify-center">
        <button
          type="button"
          onPointerDown={(event) => {
            event.preventDefault()
            setIsDragging(true)
          }}
          className="group relative w-full cursor-col-resize"
          aria-label="Resize sections"
          title="Drag to resize sections"
        >
          <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-slate-800/80 transition group-hover:bg-cyan-400/70" />
          <span className="absolute inset-y-0 left-1/2 w-2 -translate-x-1/2" />
        </button>
      </div>
      <div className={`min-w-0 flex-1 ${rightClassName}`}>{right}</div>
    </div>
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
  const selectorColumnLayout = useManagedColumns(STORAGE_KEY_SELECTOR_COLUMNS, selectorTableColumns)
  const unselectedColumnLayout = useManagedColumns(STORAGE_KEY_UNSELECTED_COLUMNS, unselectedTableColumns)
  const topSplit = useStoredSplitRatio(
    STORAGE_KEY_TOP_SPLIT,
    DEFAULT_TOP_SPLIT,
    TOP_MIN_SPLIT_PERCENT,
    TOP_MAX_SPLIT_PERCENT,
  )
  const bottomSplit = useStoredSplitRatio(
    STORAGE_KEY_BOTTOM_SPLIT,
    DEFAULT_BOTTOM_SPLIT,
    BOTTOM_MIN_SPLIT_PERCENT,
    BOTTOM_MAX_SPLIT_PERCENT,
  )
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
  const formedRunewordNameSet = useMemo(
    () => new Set(selectionSummary.formedRunewords.map((runeword) => runeword.name)),
    [selectionSummary],
  )
  const selectedScriptNameSet = useMemo(() => new Set(selectedScriptNames), [selectedScriptKey, selectedScriptNames])

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

  useEffect(() => {
    const handleResetUi = () => {
      selectorColumnLayout.reset()
      unselectedColumnLayout.reset()
      topSplit.reset()
      bottomSplit.reset()
      setSelectorQuery("")
      setUnselectedQuery("")
      setShowSelectedOnly(false)
      setSelectorSortMode("name")
      setSelectorSortDirection(getDefaultSelectorSortDirection("name"))
      setRuneSortMode("count-desc")
      setUnselectedSortMode("missing-dmg")
      setUnselectedFilterMode("all")
    }

    window.addEventListener("resetManagedTableUi", handleResetUi)

    return () => {
      window.removeEventListener("resetManagedTableUi", handleResetUi)
    }
  }, [bottomSplit, selectorColumnLayout, topSplit, unselectedColumnLayout])

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

  if (
    !isHydrated ||
    !selectorColumnLayout.isReady ||
    !unselectedColumnLayout.isReady ||
    !topSplit.isReady ||
    !bottomSplit.isReady
  ) {
    return <div className="p-6 text-sm text-slate-300">Loading runeword planner...</div>
  }

  return (
    <div className="min-h-[calc(100vh-var(--top-nav-height))] bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.16),transparent_30%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.1),transparent_22%),radial-gradient(circle_at_bottom_left,rgba(249,115,22,0.1),transparent_26%)]">
      <div className="w-full px-4 py-6">
        <ResizableSectionPair
          splitRatio={topSplit.value}
          onChangeSplitRatio={topSplit.setValue}
          minSplitRatio={TOP_MIN_SPLIT_PERCENT}
          maxSplitRatio={TOP_MAX_SPLIT_PERCENT}
          leftClassName="xl:pr-3"
          rightClassName="xl:pl-3"
          left={(
            <PlannerSection
              title="Script Selector"
              className="flex h-full flex-col xl:h-[58rem]"
              bodyClassName="flex min-h-0 flex-1 flex-col"
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
                <div className="relative w-full">
                  <input
                    type="text"
                    value={selectorQuery}
                    onChange={(event) => setSelectorQuery(event.target.value)}
                    placeholder="Search script, stat, or runeword"
                    className="w-full rounded-xl border border-slate-700/80 bg-slate-900/75 px-3 py-2 pr-9 text-sm"
                  />
                  {selectorQuery ? (
                    <button
                      type="button"
                      onClick={() => setSelectorQuery("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full px-1.5 py-0.5 text-xs text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
                      aria-label="Clear selector search"
                      title="Clear search"
                    >
                      x
                    </button>
                  ) : null}
                </div>
                <div className="shrink-0 rounded-full border border-slate-700/80 bg-slate-900/70 px-3 py-2 text-xs text-slate-300">
                  {selectorRows.length} visible
                </div>
              </div>
              {selectorRows.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/55 px-4 py-6 text-sm text-slate-400">
                  No scripts match the current search and filter.
                </div>
              ) : (
                <div className="flex-1 overflow-auto rounded-2xl border border-slate-800/80 bg-slate-950/35">
                  <div className="min-w-full w-max">
                    <ManagedGridHeader
                      columns={selectorColumnLayout.visibleColumns}
                      gridTemplateColumns={selectorColumnLayout.gridTemplateColumns}
                      onSetColumnCollapsed={selectorColumnLayout.setColumnCollapsed}
                      onSetColumnWidth={selectorColumnLayout.setColumnWidth}
                      renderHeaderCell={(column) => {
                        const mode = column.id as SelectorSortMode
                        const isActive = selectorSortMode === mode
                        const isRightAligned = column.id === "dmg"

                        return (
                          <button
                            type="button"
                            onClick={() => handleSelectorSort(mode)}
                            className={`flex w-full min-w-0 items-center gap-2 font-medium text-inherit transition hover:text-slate-200 ${
                              isRightAligned ? "justify-end text-right" : "justify-start text-left"
                            }`}
                            title={`Sort by ${column.label.toLowerCase()}`}
                          >
                            <span className="truncate">{column.label}</span>
                            <span className={isActive ? "text-cyan-200" : "text-slate-600"}>
                              {isActive ? (selectorSortDirection === "asc" ? "↑" : "↓") : "↕"}
                            </span>
                          </button>
                        )
                      }}
                    />

                    <div className="space-y-0">
                      {selectorRows.map((script) => {
                        const isSelected = selectedScriptNames.includes(script.name)

                        return (
                          <div
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
                            className={`grid min-w-full w-max border-t border-slate-800/70 text-sm transition focus-visible:outline-2 focus-visible:outline-cyan-400/60 ${
                              isSelected
                                ? "bg-cyan-400/10 hover:bg-cyan-400/14"
                                : "hover:bg-slate-900/65"
                            }`}
                            style={{ gridTemplateColumns: selectorColumnLayout.gridTemplateColumns }}
                          >
                            {selectorColumnLayout.visibleColumns.map((column) => (
                              <div
                                key={column.id}
                                className={`${column.collapsed ? "px-0" : "px-3 py-3"} overflow-hidden border-r border-slate-800/60 last:border-r-0 ${
                                  column.id === "dmg" ? "text-right" : ""
                                }`}
                              >
                                {column.collapsed ? null : column.id === "name" ? (
                                  <span className="font-semibold text-slate-50">{script.name}</span>
                                ) : column.id === "dmg" ? (
                                  <div className="flex justify-end">
                                    <div className="w-[5rem] text-right">
                                      <DamageValue value={entryDamageByKey[`script:${script.name}`] ?? null} />
                                    </div>
                                  </div>
                                ) : column.id === "effect" ? (
                                  <div className="break-words text-slate-300">{script.description}</div>
                                ) : (
                                  <div className="flex flex-wrap gap-1.5">
                                    {script.contributingRunewords.length > 0 ? (
                                      script.contributingRunewords.map((word) => {
                                        const isFormed = formedRunewordNameSet.has(word)

                                        return (
                                          <span
                                            key={`${script.name}:${word}`}
                                            className={`rounded-full px-2 py-1 text-[11px] font-medium ${
                                              isFormed
                                                ? "bg-emerald-400/15 text-emerald-200 ring-1 ring-emerald-500/30"
                                                : "bg-rose-400/12 text-rose-200 ring-1 ring-rose-500/25"
                                            }`}
                                          >
                                            {word}
                                          </span>
                                        )
                                      })
                                    ) : (
                                      <span className="text-slate-500">None</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </PlannerSection>
          )}
          right={(
            <PlannerSection
              title="Unselected Scripts And Runewords"
              className="flex h-full flex-col xl:h-[58rem]"
              bodyClassName="flex min-h-0 flex-1 flex-col"
              actions={(
                <div className="flex flex-col gap-2 sm:flex-row">
                  <div className="relative w-full">
                    <input
                      type="text"
                      value={unselectedQuery}
                      onChange={(event) => setUnselectedQuery(event.target.value)}
                      placeholder="Search unselected rows"
                      className="w-full rounded-xl border border-slate-700/80 bg-slate-900/75 px-3 py-2 pr-9 text-sm sm:min-w-[14rem]"
                    />
                    {unselectedQuery ? (
                      <button
                        type="button"
                        onClick={() => setUnselectedQuery("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full px-1.5 py-0.5 text-xs text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
                        aria-label="Clear unselected search"
                        title="Clear search"
                      >
                        x
                      </button>
                    ) : null}
                  </div>
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
                <div className="flex-1 overflow-auto rounded-2xl border border-slate-800/80 bg-slate-950/35">
                  <div className="min-w-full w-max">
                    <ManagedGridHeader
                      columns={unselectedColumnLayout.visibleColumns}
                      gridTemplateColumns={unselectedColumnLayout.gridTemplateColumns}
                      onSetColumnCollapsed={unselectedColumnLayout.setColumnCollapsed}
                      onSetColumnWidth={unselectedColumnLayout.setColumnWidth}
                      renderHeaderCell={(column) => <span className={column.id === "dmg" ? "w-full text-right" : "truncate"}>{column.label}</span>}
                    />

                    <div className="space-y-0">
                      {unselectedRows.map((row) => (
                        <div
                          key={row.key}
                          className="grid min-w-full w-max items-center border-t border-slate-800/70 text-sm"
                          style={{ gridTemplateColumns: unselectedColumnLayout.gridTemplateColumns }}
                        >
                          {unselectedColumnLayout.visibleColumns.map((column) => (
                            <div
                              key={column.id}
                              className={`${column.collapsed ? "px-0" : "px-3 py-3"} overflow-hidden border-r border-slate-800/60 last:border-r-0 ${
                                column.id === "dmg" ? "text-right" : ""
                              }`}
                            >
                              {column.collapsed ? null : column.id === "name" ? (
                                <span className="truncate font-medium text-slate-100">{row.name}</span>
                              ) : column.id === "dmg" ? (
                                <DamageValue value={candidateDamageByKey[row.key] ?? null} />
                              ) : column.id === "description" ? (
                                <div className="truncate text-slate-300" title={row.description}>
                                  {row.description}
                                </div>
                              ) : (
                                <div className="flex flex-wrap items-center gap-1.5 text-slate-300">
                                  {row.kind === "runeword" ? (
                                    row.wordRecipe.map((word, index) => {
                                      const isSelected = selectedScriptNameSet.has(word)

                                      return (
                                        <Fragment key={`${row.key}:${word}`}>
                                          {index > 0 ? <span className="text-slate-500">+</span> : null}
                                          <span
                                            className={`rounded-full px-2 py-1 text-[11px] font-medium ${
                                              isSelected
                                                ? "bg-emerald-400/15 text-emerald-200 ring-1 ring-emerald-500/30"
                                                : "bg-rose-400/12 text-rose-200 ring-1 ring-rose-500/25"
                                            }`}
                                          >
                                            {word}
                                          </span>
                                        </Fragment>
                                      )
                                    })
                                  ) : (
                                    <span />
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </PlannerSection>
          )}
        />

        <div className="mt-8 border-t border-slate-800/80 pt-8">
          <ResizableSectionPair
            splitRatio={bottomSplit.value}
            onChangeSplitRatio={bottomSplit.setValue}
            minSplitRatio={BOTTOM_MIN_SPLIT_PERCENT}
            maxSplitRatio={BOTTOM_MAX_SPLIT_PERCENT}
            leftClassName="xl:pr-3"
            rightClassName="xl:pl-3"
            left={(
              <PlannerSection
            title="Current Summary"
            subtitle="Selected scripts and completed runewords in one table. Damage values use your saved build and damage calc settings."
            className="flex h-full flex-col xl:h-[52rem]"
            bodyClassName="flex min-h-0 flex-1 flex-col"
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

            <div className="mt-5 flex min-h-0 flex-1 flex-col">
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
                <div className="flex-1 overflow-auto rounded-2xl border border-slate-800/80 bg-slate-950/35">
                  <table className="min-w-[980px] w-full text-left text-sm">
                    <thead className="sticky top-0 bg-slate-950/95 text-[11px] uppercase tracking-[0.18em] text-slate-500">
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
              </PlannerSection>
            )}
            right={(
              <PlannerSection
            title="Effects Summary"
            subtitle="Full combined effect totals from your selected scripts and completed runewords."
            className="h-full"
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
              </PlannerSection>
            )}
          />
        </div>

        <div className="mt-8 border-t border-slate-800/80 pt-8">
          <PlannerSection
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
              <div className="overflow-auto rounded-2xl border border-slate-800/80 bg-slate-950/35">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-950/95 text-[11px] uppercase tracking-[0.18em] text-slate-500">
                    <tr>
                      <th className="px-3 py-3 font-medium">Rune</th>
                      <th className="px-3 py-3 font-medium">Tier</th>
                      <th className="px-3 py-3 font-medium">Description</th>
                      <th className="px-3 py-3 text-right font-medium">Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {runeRequirements.map((requirement) => (
                      <tr key={requirement.rune} className="border-t border-slate-800/70 align-top">
                        <td className="px-3 py-3 font-medium text-slate-100">{requirement.rune}</td>
                        <td className="px-3 py-3 text-slate-300">{requirement.tier}</td>
                        <td className="px-3 py-3 text-slate-300">{requirement.description || "No description"}</td>
                        <td className="px-3 py-3 text-right font-mono text-slate-100">{requirement.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </PlannerSection>
        </div>
      </div>
    </div>
  )
}
