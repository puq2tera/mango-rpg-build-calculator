"use client"

import { startTransition, useEffect, useMemo, useState } from "react"
import tarot_data from "@/app/data/tarot_data"
import { computeBuildStatStages, readBuildSnapshot } from "@/app/lib/buildStats"
import { calculateDamage, formatSignedDamageDelta, readDamageCalcState } from "@/app/lib/damageCalc"
import {
  getDefaultTableViewState,
  MANAGED_TABLE_VIEW_EVENT,
  readTableViewState,
  type ManagedTableViewChangeDetail,
  type TableViewState,
} from "@/app/lib/tableViewState"

const STORAGE_SELECTED = "selectedTarots"
const STORAGE_STACKS = "tarotStacks"
const tarotNames = Object.keys(tarot_data)
const gridTemplateColumns = "220px 110px 80px 220px 100px minmax(320px,1fr)"

const columns = [
  "Name",
  "Avg DMG Change",
  "Tier",
  "Skill",
  "Stack",
  "Description"
] as const

function getAverageDamageClass(value: number | null | undefined): string {
  if (value === undefined) return ""
  if (value === null) return "text-slate-400 font-mono tabular-nums"
  if (value > 0) return "text-emerald-300 font-mono tabular-nums"
  if (value < 0) return "text-rose-300 font-mono tabular-nums"
  return "text-slate-200 font-mono tabular-nums"
}

export default function TarotCardsPage() {
  const [isHydrated, setIsHydrated] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [stacks, setStacks] = useState<Record<string, number>>({})
  const [averageDamageChanges, setAverageDamageChanges] = useState<Record<string, number>>({})
  const [viewState, setViewState] = useState<TableViewState>(getDefaultTableViewState)

  // Load persisted selection and stacks
  useEffect(() => {
    try {
      const rawSel = localStorage.getItem(STORAGE_SELECTED)
      if (rawSel) setSelected(new Set<string>(JSON.parse(rawSel)))
    } catch {}
    try {
      const rawStacks = localStorage.getItem(STORAGE_STACKS)
      if (rawStacks) setStacks(JSON.parse(rawStacks))
    } catch {}
    setViewState(readTableViewState(localStorage, "tarot"))
    setIsHydrated(true)
  }, [])


  // Persist on change
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(STORAGE_SELECTED, JSON.stringify(Array.from(selected)))
    }
  }, [isHydrated, selected])
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(STORAGE_STACKS, JSON.stringify(stacks))
    }
  }, [isHydrated, stacks])

  useEffect(() => {
    if (!isHydrated) return

    let cancelled = false
    let timeoutId: number | null = null

    setAverageDamageChanges({})

    const snapshot = readBuildSnapshot(localStorage)
    const damageState = readDamageCalcState(localStorage)
    const selectedTarotNames = Array.from(selected)
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
        const toggledTarots = new Set(selectedTarotNames)

        if (toggledTarots.has(tarotName)) {
          toggledTarots.delete(tarotName)
        } else {
          toggledTarots.add(tarotName)
        }

        const nextAverage = calculateDamage(
          computeBuildStatStages(snapshot, { selectedTarots: toggledTarots, tarotStacks: stacks }).StatsDmgReady,
          damageState,
        ).average

        computedChanges[tarotName] = nextAverage - currentAverage
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
  }, [isHydrated, selected, stacks])

  useEffect(() => {
    const handleManagedTableViewChange = (event: Event) => {
      const detail = (event as CustomEvent<ManagedTableViewChangeDetail>).detail

      if (detail.page === "tarot") {
        setViewState(detail.viewState)
      }
    }

    window.addEventListener(MANAGED_TABLE_VIEW_EVENT, handleManagedTableViewChange)
    return () => {
      window.removeEventListener(MANAGED_TABLE_VIEW_EVENT, handleManagedTableViewChange)
    }
  }, [])

  // Tier counts among selected to flag constraints
  const tierCounts = useMemo(() => {
    const counts: Record<number, number> = {}
    for (const name of selected) {
      const t = tarot_data[name]?.tier ?? 0
      counts[t] = (counts[t] || 0) + 1
    }
    return counts
  }, [selected])

  // Constraints: red if over limits
  const tierLimits: Record<number, number> = { 5: 1, 4: 1, 3: 2 }

  const toggle = (name: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  const onChangeStack = (name: string, value: number) => {
    setStacks(prev => ({ ...prev, [name]: Math.max(0, Math.floor(value || 0)) }))
  }

  const rows = useMemo(() => (
    Object.entries(tarot_data)
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

        const isSelected = selected.has(row.name)
        if (viewState.selectionFilter === "selected" && !isSelected) {
          return false
        }

        if (viewState.selectionFilter === "unselected" && isSelected) {
          return false
        }

        return true
      })
  ), [selected, viewState])

  return (
    <div className="h-[calc(100vh-2.5rem)] overflow-auto border rounded-md">
      <div className="min-w-full w-max">
        <div className="sticky top-0 z-10 grid border-b bg-slate-900 py-2" style={{ gridTemplateColumns }}>
          {columns.map((c) => (
            <div key={c} className="box-border border-r border-slate-600 px-2 font-bold whitespace-nowrap last:border-r-0">{c}</div>
          ))}
        </div>

        <div className="space-y-0.5">
          {rows.map(row => {
            const isSelected = selected.has(row.name)
            const overLimit = (tierCounts[row.tier] ?? 0) > (tierLimits[row.tier] ?? Infinity)
            const canStack = Boolean(row.stack_stats || row.stack_conversions)
            const stackVal = stacks[row.name] ?? 0
            const averageDamageChange = averageDamageChanges[row.name] ?? null

            return (
              <div
                key={row.name}
                className={`grid min-w-full w-max cursor-pointer items-center px-0 py-1 ${isSelected ? "bg-sky-900/40 hover:bg-sky-800/45" : "hover:bg-slate-800/85"}`}
                style={{ gridTemplateColumns }}
                onClick={() => toggle(row.name)}
              >
                <span className="border-r border-slate-700 px-2 whitespace-nowrap">{row.name}</span>
                <span className={`border-r border-slate-700 px-2 whitespace-nowrap ${getAverageDamageClass(averageDamageChange)}`}>
                  {formatSignedDamageDelta(averageDamageChange)}
                </span>
                <span className={`border-r border-slate-700 px-2 whitespace-nowrap ${overLimit ? "font-semibold text-rose-300" : ""}`}>{row.tier}</span>
                <span className="overflow-hidden text-ellipsis border-r border-slate-700 px-2 whitespace-nowrap">{row.skill_name}</span>
                <span className="border-r border-slate-700 px-2">
                  {canStack ? (
                    <input
                      type="number"
                      className="w-20 border px-1"
                      value={stackVal}
                      onClick={e => e.stopPropagation()}
                      onChange={e => onChangeStack(row.name, +e.target.value)}
                      min={0}
                    />
                  ) : null}
                </span>
                <span className="overflow-hidden text-ellipsis px-2 whitespace-nowrap">{row.description}</span>
              </div>
            )
          })}
        </div>
      </div>
      <div className="p-2 text-xs text-slate-300 border-t">
        Limits: at most 1x Tier 5, 1x Tier 4, 2x Tier 3. Tier label turns red if exceeded.
      </div>
    </div>
  )
}
