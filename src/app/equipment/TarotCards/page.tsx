"use client"

import { Suspense, startTransition, useEffect, useEffectEvent, useMemo, useRef, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { OverflowTitle } from "@/app/components/OverflowTitle"
import { InteractiveTableHeader } from "@/app/components/InteractiveTableHeader"
import tarot_data from "@/app/data/tarot_data"
import { computeBuildStatStages, readBuildSnapshot } from "@/app/lib/buildStats"
import { BUILD_SNAPSHOT_UPDATED_EVENT, dispatchBuildSnapshotUpdated } from "@/app/lib/buildEvents"
import { calculateDamage, formatSignedDamageDelta, readDamageCalcState } from "@/app/lib/damageCalc"
import {
  ENABLED_EQUIPMENT_STORAGE_KEY,
  EQUIPMENT_AUTO_LINKED_TAROTS_STORAGE_KEY,
  EQUIPMENT_SLOTS_STORAGE_KEY,
  getAutoManagedTarotNames,
  getEnabledEquipmentIndices,
  getEquipmentAutoLinkedTarots,
  getEquipmentTarotNames,
  hasAutoLinkedTarotEquipment,
  normalizeEquipmentSlots,
  setAutoLinkedTarotEquipmentEnabled,
} from "@/app/lib/equipmentSlots"
import { useManagedColumns } from "@/app/lib/managedColumns"
import { tarotTableColumns, type TarotColumnId } from "@/app/lib/tableColumnDefinitions"
import { TABLE_FOCUS_QUERY_PARAM } from "@/app/lib/tableNavigation"
import {
  filterManualTarotSelections,
  getEffectiveTarotSelectionSet,
  MANUAL_TAROT_SELECTION_STORAGE_KEY,
  readStoredManualTarotSelections,
} from "@/app/lib/tarotSelections"
import {
  getDefaultTableViewState,
  MANAGED_TABLE_VIEW_EVENT,
  matchesAverageDamageFilter,
  readTableViewState,
  type ManagedTableViewChangeDetail,
  type TableViewState,
} from "@/app/lib/tableViewState"

const STORAGE_SELECTED = MANUAL_TAROT_SELECTION_STORAGE_KEY
const STORAGE_STACKS = "tarotStacks"
const tarotNames = Object.keys(tarot_data)
const defaultTarotOrder = new Map(tarotNames.map((name, index) => [name, index]))

function areSelectionSetsEqual(left: ReadonlySet<string>, right: ReadonlySet<string>): boolean {
  if (left.size !== right.size) {
    return false
  }

  for (const value of left) {
    if (!right.has(value)) {
      return false
    }
  }

  return true
}

function getAverageDamageClass(value: number | null | undefined): string {
  if (value === undefined) return ""
  if (value === null) return "text-slate-400 font-mono tabular-nums"
  if (value > 0) return "text-emerald-300 font-mono tabular-nums"
  if (value < 0) return "text-rose-300 font-mono tabular-nums"
  return "text-slate-200 font-mono tabular-nums"
}

function getTarotRowClass(rowIndex: number, isSelected: boolean, overLimit: boolean): string {
  const isEven = Math.abs(rowIndex) % 2 === 0

  if (overLimit && isSelected) {
    return isEven
      ? "bg-amber-900/65 text-amber-50 ring-1 ring-inset ring-amber-300/55 hover:bg-amber-800/70"
      : "bg-orange-900/70 text-amber-50 ring-1 ring-inset ring-orange-300/55 hover:bg-orange-800/72"
  }

  if (overLimit) {
    return isEven
      ? "bg-amber-950/18 text-slate-200 ring-1 ring-inset ring-amber-700/20 hover:bg-amber-900/32"
      : "bg-orange-950/20 text-slate-200 ring-1 ring-inset ring-orange-700/22 hover:bg-orange-900/35"
  }

  if (isSelected) {
    return isEven
      ? "bg-cyan-900/55 text-cyan-50 ring-1 ring-inset ring-cyan-300/45 hover:bg-cyan-800/65"
      : "bg-sky-900/60 text-sky-50 ring-1 ring-inset ring-sky-300/45 hover:bg-sky-800/68"
  }

  return isEven
    ? "bg-slate-950/4 text-slate-200 hover:bg-slate-800/40"
    : "bg-slate-900/16 text-slate-200 hover:bg-slate-800/46"
}

function getTarotTierBadgeClass(tier: number, overLimit: boolean): string {
  if (overLimit) {
    return "bg-rose-400/15 text-rose-200 ring-1 ring-inset ring-rose-300/35"
  }

  if (tier === 5) {
    return "bg-amber-400/15 text-amber-100 ring-1 ring-inset ring-amber-300/35"
  }

  if (tier === 4) {
    return "bg-sky-400/15 text-sky-100 ring-1 ring-inset ring-sky-300/35"
  }

  return "bg-violet-400/15 text-violet-100 ring-1 ring-inset ring-violet-300/35"
}

function getTarotTypeBadgeClass(isActive: boolean): string {
  return isActive
    ? "bg-cyan-400/15 text-cyan-100 ring-1 ring-inset ring-cyan-300/30"
    : "bg-slate-400/10 text-slate-300 ring-1 ring-inset ring-slate-400/25"
}

function TarotCardsPageContent() {
  const [isHydrated, setIsHydrated] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [autoLinked, setAutoLinked] = useState<Set<string>>(new Set())
  const [equipmentTarotNames, setEquipmentTarotNames] = useState<Set<string>>(new Set())
  const [stacks, setStacks] = useState<Record<string, number>>({})
  const [averageDamageChanges, setAverageDamageChanges] = useState<Record<string, number>>({})
  const [viewState, setViewState] = useState<TableViewState>(getDefaultTableViewState)
  const columnLayout = useManagedColumns("tarotColumnLayout", tarotTableColumns)
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const focusTarot = searchParams.get(TABLE_FOCUS_QUERY_PARAM)
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const lastHandledFocusRef = useRef<string | null>(null)
  const effectiveSelected = useMemo(
    () => getEffectiveTarotSelectionSet(selected, autoLinked),
    [autoLinked, selected],
  )

  const readStoredEquipmentSlots = () => {
    try {
      return normalizeEquipmentSlots(JSON.parse(localStorage.getItem(EQUIPMENT_SLOTS_STORAGE_KEY) ?? "[]"))
    } catch {
      return []
    }
  }

  const refreshStoredSelections = useEffectEvent(() => {
    const storedSlots = readStoredEquipmentSlots()
    const enabledIndices = getEnabledEquipmentIndices(storedSlots)
    const autoManagedTarots = getAutoManagedTarotNames(storedSlots)
    const nextManualSelections = filterManualTarotSelections(
      readStoredManualTarotSelections(localStorage),
      autoManagedTarots,
    )
    const nextSelected = new Set(nextManualSelections)
    const nextAutoLinked = new Set(getEquipmentAutoLinkedTarots(storedSlots, enabledIndices))
    const nextEquipmentTarotNames = new Set(getEquipmentTarotNames(storedSlots))

    localStorage.setItem(STORAGE_SELECTED, JSON.stringify(nextManualSelections))
    setSelected((prev) => areSelectionSetsEqual(prev, nextSelected) ? prev : nextSelected)
    setAutoLinked((prev) => areSelectionSetsEqual(prev, nextAutoLinked) ? prev : nextAutoLinked)
    setEquipmentTarotNames((prev) => areSelectionSetsEqual(prev, nextEquipmentTarotNames) ? prev : nextEquipmentTarotNames)
  })

  const persistSyncedTarotEquipment = (nextSlots: ReturnType<typeof normalizeEquipmentSlots>) => {
    const enabledIndices = getEnabledEquipmentIndices(nextSlots)
    const autoManagedTarots = getAutoManagedTarotNames(nextSlots)
    const nextManualSelections = filterManualTarotSelections(
      readStoredManualTarotSelections(localStorage),
      autoManagedTarots,
    )
    const nextSelected = new Set(nextManualSelections)
    const nextAutoLinked = new Set(getEquipmentAutoLinkedTarots(nextSlots, enabledIndices))

    localStorage.setItem(EQUIPMENT_SLOTS_STORAGE_KEY, JSON.stringify(nextSlots))
    localStorage.setItem(ENABLED_EQUIPMENT_STORAGE_KEY, JSON.stringify(enabledIndices))
    localStorage.setItem(
      EQUIPMENT_AUTO_LINKED_TAROTS_STORAGE_KEY,
      JSON.stringify(Array.from(nextAutoLinked)),
    )
    localStorage.setItem(STORAGE_SELECTED, JSON.stringify(nextManualSelections))

    setSelected((prev) => areSelectionSetsEqual(prev, nextSelected) ? prev : nextSelected)
    setAutoLinked((prev) => areSelectionSetsEqual(prev, nextAutoLinked) ? prev : nextAutoLinked)
    dispatchBuildSnapshotUpdated()
  }

  // Load persisted selection and stacks
  useEffect(() => {
    refreshStoredSelections()
    try {
      const rawStacks = localStorage.getItem(STORAGE_STACKS)
      if (rawStacks) setStacks(JSON.parse(rawStacks))
    } catch {}
    setViewState(readTableViewState(localStorage, "tarot"))
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (!isHydrated) return

    const refreshAutoLinkedSelections = () => {
      refreshStoredSelections()
    }

    window.addEventListener(BUILD_SNAPSHOT_UPDATED_EVENT, refreshAutoLinkedSelections)
    window.addEventListener("storage", refreshAutoLinkedSelections)
    window.addEventListener("focus", refreshAutoLinkedSelections)
    return () => {
      window.removeEventListener(BUILD_SNAPSHOT_UPDATED_EVENT, refreshAutoLinkedSelections)
      window.removeEventListener("storage", refreshAutoLinkedSelections)
      window.removeEventListener("focus", refreshAutoLinkedSelections)
    }
  }, [isHydrated])

  // Persist on change
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(STORAGE_SELECTED, JSON.stringify(Array.from(selected)))
      dispatchBuildSnapshotUpdated()
    }
  }, [isHydrated, selected])
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(STORAGE_STACKS, JSON.stringify(stacks))
      dispatchBuildSnapshotUpdated()
    }
  }, [isHydrated, stacks])

  useEffect(() => {
    if (!isHydrated) return

    let cancelled = false
    let timeoutId: number | null = null

    setAverageDamageChanges({})

    const snapshot = readBuildSnapshot(localStorage)
    const damageState = readDamageCalcState(localStorage)
    const selectedTarotNames = Array.from(effectiveSelected)
    const currentAverage = calculateDamage(
      computeBuildStatStages(snapshot, { selectedTarots: selectedTarotNames, tarotStacks: stacks }).StatsDmgReady,
      damageState,
    ).average

    const computedChanges: Record<string, number> = {}
    let index = 0
    const chunkSize = 20

    const computeChunk = () => {
      if (cancelled) return

      const maxIndex = Math.min(index + chunkSize, tarotNames.length)
      for (; index < maxIndex; index++) {
        const tarotName = tarotNames[index]
        const wasSelected = effectiveSelected.has(tarotName)
        const toggledTarots = new Set(selectedTarotNames)

        if (wasSelected) {
          toggledTarots.delete(tarotName)
        } else {
          toggledTarots.add(tarotName)
        }

        const nextAverage = calculateDamage(
          computeBuildStatStages(snapshot, { selectedTarots: toggledTarots, tarotStacks: stacks }).StatsDmgReady,
          damageState,
        ).average

        computedChanges[tarotName] = wasSelected
          ? currentAverage - nextAverage
          : nextAverage - currentAverage
      }

      if (index < tarotNames.length) {
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
  }, [effectiveSelected, isHydrated, stacks])

  useEffect(() => {
    if (!columnLayout.isReady || !isHydrated || !focusTarot) {
      return
    }

    const targetRow = rowRefs.current[focusTarot]
    if (!targetRow || lastHandledFocusRef.current === focusTarot) {
      return
    }

    lastHandledFocusRef.current = focusTarot

    requestAnimationFrame(() => {
      targetRow.scrollIntoView({ block: "center", inline: "nearest" })
      const nextParams = new URLSearchParams(searchParams.toString())
      nextParams.delete(TABLE_FOCUS_QUERY_PARAM)
      const nextUrl = nextParams.size > 0 ? `${pathname}?${nextParams.toString()}` : pathname
      router.replace(nextUrl, { scroll: false })
    })
  }, [columnLayout.isReady, focusTarot, isHydrated, pathname, router, searchParams, viewState])

  useEffect(() => {
    const handleManagedTableViewChange = (event: Event) => {
      const detail = (event as CustomEvent<ManagedTableViewChangeDetail>).detail

      if (detail.page === "tarot") {
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

  // Tier counts among selected to flag constraints
  const tierCounts = useMemo(() => {
    const counts: Record<number, number> = {}
    for (const name of effectiveSelected) {
      const t = tarot_data[name]?.tier ?? 0
      counts[t] = (counts[t] || 0) + 1
    }
    return counts
  }, [effectiveSelected])

  // Constraints: red if over limits
  const tierLimits: Record<number, number> = { 5: 1, 4: 1, 3: 2 }

  const toggle = (name: string) => {
    const isCurrentlySelected = effectiveSelected.has(name)
    const nextSelected = !isCurrentlySelected
    const storedSlots = readStoredEquipmentSlots()

    if (hasAutoLinkedTarotEquipment(storedSlots, name)) {
      persistSyncedTarotEquipment(setAutoLinkedTarotEquipmentEnabled(storedSlots, name, nextSelected))
      return
    }

    setSelected(prev => {
      const next = new Set(prev)
      if (isCurrentlySelected) next.delete(name)
      else next.add(name)
      return next
    })
  }

  const onChangeStack = (name: string, value: number) => {
    setStacks(prev => ({ ...prev, [name]: Math.max(0, Math.floor(value || 0)) }))
  }

  const rows = useMemo(() => {
    const filteredRows = Object.entries(tarot_data)
      .map(([name, t]) => ({ name, ...t }))
      .filter((row) => {
        if (viewState.tarotTierFilter !== "all" && String(row.tier) !== viewState.tarotTierFilter) {
          return false
        }

        const isActive = row.is_active === true
        if (viewState.tarotTypeFilter === "active" && !isActive) {
          return false
        }

        if (viewState.tarotTypeFilter === "passive" && isActive) {
          return false
        }

        const isSelected = effectiveSelected.has(row.name)
        if (viewState.selectionFilter === "selected" && !isSelected) {
          return false
        }

        if (viewState.selectionFilter === "unselected" && isSelected) {
          return false
        }

        if (viewState.tarotEquipmentFilter === "inEquipment" && !equipmentTarotNames.has(row.name)) {
          return false
        }

        if (!matchesAverageDamageFilter(averageDamageChanges[row.name], viewState.averageDamageFilter)) {
          return false
        }

        return true
      })
    return [...filteredRows].sort((left, right) => {
      if (viewState.sortMode === "damage") {
        const difference = (averageDamageChanges[left.name] ?? 0) - (averageDamageChanges[right.name] ?? 0)

        if (difference !== 0) {
          return viewState.sortDirection === "asc" ? difference : -difference
        }
      }

      if (viewState.sortMode === "tier") {
        const difference = left.tier - right.tier

        if (difference !== 0) {
          return viewState.sortDirection === "asc" ? difference : -difference
        }
      }

      const defaultDifference = (defaultTarotOrder.get(left.name) ?? 0) - (defaultTarotOrder.get(right.name) ?? 0)
      return viewState.sortMode === "default" && viewState.sortDirection === "desc"
        ? -defaultDifference
        : defaultDifference
    })
  }, [averageDamageChanges, effectiveSelected, equipmentTarotNames, viewState])

  const tarotGridTemplateColumns = useMemo(() => (
    columnLayout.visibleColumns
      .map((column) => (
        column.id === "description" && !column.collapsed
          ? `minmax(${column.renderWidth}px, 1fr)`
          : `${column.renderWidth}px`
      ))
      .join(" ")
  ), [columnLayout.visibleColumns])

  if (!isHydrated || !columnLayout.isReady) return <div className="p-4">Loading...</div>

  const renderCell = (
    columnId: TarotColumnId,
    row: (typeof rows)[number],
    averageDamageChange: number | null,
    canStack: boolean,
    stackVal: number,
  ) => {
    switch (columnId) {
      case "name":
        return (
          <div className="flex items-center gap-2 overflow-hidden">
            <OverflowTitle
              tooltipText={row.name}
              className="min-w-0 truncate font-semibold"
            >
              {row.name}
            </OverflowTitle>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] ${getTarotTypeBadgeClass(row.is_active === true)}`}>
              {row.is_active === true ? "Active" : "Passive"}
            </span>
          </div>
        )
      case "avgDamageChange":
        return formatSignedDamageDelta(averageDamageChange)
      case "tier":
        return (
          <span className={`inline-flex min-w-9 justify-center rounded-full px-2 py-0.5 text-xs font-semibold ${getTarotTierBadgeClass(row.tier, false)}`}>
            T{row.tier}
          </span>
        )
      case "skillName":
        return (
          <OverflowTitle
            tooltipText={row.skill_name}
            className="block min-w-0 overflow-hidden text-ellipsis whitespace-nowrap font-medium text-slate-100"
          >
            {row.skill_name}
          </OverflowTitle>
        )
      case "stack":
        return canStack ? (
          <input
            type="number"
            className="w-20 rounded border border-slate-600 bg-slate-950/85 px-1 text-right shadow-inner outline-none transition focus:border-sky-400"
            value={stackVal}
            onClick={(event) => event.stopPropagation()}
            onChange={(event) => onChangeStack(row.name, +event.target.value)}
            min={0}
          />
        ) : ""
      case "description":
        return (
          <OverflowTitle
            tooltipText={row.description}
            className="block min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-slate-300"
          >
            {row.description}
          </OverflowTitle>
        )
      default:
        return ""
    }
  }

  return (
    <div className="viewport-below-top-nav overflow-auto border rounded-md">
      <div className="min-w-full w-max">
        <InteractiveTableHeader
          visibleColumns={columnLayout.visibleColumns}
          gridTemplateColumns={tarotGridTemplateColumns}
          onSetColumnCollapsed={columnLayout.setColumnCollapsed}
          onReorderColumns={columnLayout.reorderVisibleColumns}
          onSetColumnWidth={columnLayout.setColumnWidth}
        />

        <div className="space-y-0.5">
          {rows.map((row, rowIndex) => {
            const isSelected = effectiveSelected.has(row.name)
            const overLimit = (tierCounts[row.tier] ?? 0) > (tierLimits[row.tier] ?? Infinity)
            const canStack = Boolean(row.stack_stats || row.stack_conversions)
            const stackVal = stacks[row.name] ?? 0
            const averageDamageChange = averageDamageChanges[row.name] ?? null

            return (
              <div
                key={row.name}
                ref={(node) => {
                  rowRefs.current[row.name] = node
                }}
                className={`grid min-w-full w-max cursor-pointer items-center px-0 py-1 transition-colors ${getTarotRowClass(rowIndex, isSelected, overLimit)}`}
                style={{ gridTemplateColumns: tarotGridTemplateColumns }}
                onClick={() => toggle(row.name)}
              >
                {columnLayout.visibleColumns.map((column) => (
                  <span
                    key={column.id}
                    className={`${column.collapsed ? "px-0" : "px-2 whitespace-nowrap"} border-r border-slate-700 last:border-r-0 box-border overflow-hidden ${
                      column.id === "avgDamageChange"
                        ? getAverageDamageClass(averageDamageChange)
                        : ""
                    } ${
                      column.id === "tier" && overLimit
                        ? "font-semibold text-rose-300"
                        : ""
                    } ${
                      column.id === "name"
                        ? "font-medium"
                        : ""
                    } ${
                      column.id === "skillName" || column.id === "description"
                        ? "text-ellipsis"
                        : ""
                    } ${
                      column.id === "stack"
                        ? "flex items-center"
                        : ""
                    }`}
                  >
                    {column.collapsed ? "" : (
                      column.id === "tier"
                        ? (
                          <span className={`inline-flex min-w-9 justify-center rounded-full px-2 py-0.5 text-xs font-semibold ${getTarotTierBadgeClass(row.tier, overLimit)}`}>
                            T{row.tier}
                          </span>
                        )
                        : renderCell(column.id, row, averageDamageChange, canStack, stackVal)
                    )}
                  </span>
                ))}
              </div>
            )
          })}
        </div>
      </div>
      <div className="p-2 text-xs text-slate-300 border-t">
        Limits: at most 1x Tier 5, 1x Tier 4, 2x Tier 3. Tier label turns red if exceeded.
        {autoLinked.size > 0 ? ` Auto-linked tarots from equipment stay selected here.` : ""}
      </div>
    </div>
  )
}

export default function TarotCardsPage() {
  return (
    <Suspense fallback={<div className="p-4">Loading...</div>}>
      <TarotCardsPageContent />
    </Suspense>
  )
}
