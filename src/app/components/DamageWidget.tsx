"use client"

import { useEffect, useState } from "react"
import { computeBuildStatStages, readBuildSnapshot } from "@/app/lib/buildStats"
import { BUILD_SNAPSHOT_UPDATED_EVENT } from "@/app/lib/buildEvents"
import { calculateDamage, type DamageCalcResult, readDamageCalcState } from "@/app/lib/damageCalc"

type DamageWidgetMode = "average" | "nonCrit" | "crit" | "maxcrit"

const DAMAGE_WIDGET_MODE_STORAGE_KEY = "DamageWidgetMode"
const widgetModes: Array<{ key: DamageWidgetMode; label: string }> = [
  { key: "average", label: "Average" },
  { key: "nonCrit", label: "Non-Crit" },
  { key: "crit", label: "Crit" },
  { key: "maxcrit", label: "Maximized Crit" },
]

function isDamageWidgetMode(value: string | null): value is DamageWidgetMode {
  return widgetModes.some((mode) => mode.key === value)
}

function formatNumber(value: number | null): string {
  if (value === null || !Number.isFinite(value)) {
    return "..."
  }

  return Math.trunc(value).toLocaleString("en-US")
}

function getCurrentValue(result: DamageCalcResult | null, mode: DamageWidgetMode): number | null {
  if (!result) {
    return null
  }

  return result[mode]
}

export default function DamageWidget() {
  const [mode, setMode] = useState<DamageWidgetMode>("average")
  const [result, setResult] = useState<DamageCalcResult | null>(null)

  useEffect(() => {
    const refreshDamage = () => {
      const snapshot = readBuildSnapshot(localStorage)
      const stats = computeBuildStatStages(snapshot).StatsDmgReady
      const state = readDamageCalcState(localStorage)
      setResult(calculateDamage(stats, state))
    }

    const storedMode = localStorage.getItem(DAMAGE_WIDGET_MODE_STORAGE_KEY)
    if (isDamageWidgetMode(storedMode)) {
      setMode(storedMode)
    }

    refreshDamage()

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshDamage()
      }
    }

    window.addEventListener(BUILD_SNAPSHOT_UPDATED_EVENT, refreshDamage)
    window.addEventListener("damageCalcUpdated", refreshDamage)
    window.addEventListener("focus", refreshDamage)
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      window.removeEventListener(BUILD_SNAPSHOT_UPDATED_EVENT, refreshDamage)
      window.removeEventListener("damageCalcUpdated", refreshDamage)
      window.removeEventListener("focus", refreshDamage)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [])

  const currentValue = getCurrentValue(result, mode)

  const handleModeChange = (nextMode: string) => {
    if (!isDamageWidgetMode(nextMode)) {
      return
    }

    setMode(nextMode)
    localStorage.setItem(DAMAGE_WIDGET_MODE_STORAGE_KEY, nextMode)
  }

  return (
    <div className="flex items-center gap-2 px-1 py-0.5">
      <div className="flex min-w-0 items-baseline gap-1.5 leading-none">
        <div className="shrink-0 text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
          Damage
        </div>
        <div className="font-mono text-sm font-semibold tabular-nums text-slate-50">
          {formatNumber(currentValue)}
        </div>
      </div>

      <div className="relative shrink-0">
        <select
          aria-label="Select damage value"
          value={mode}
          onChange={(event) => handleModeChange(event.target.value)}
          className="min-w-[7.5rem] appearance-none bg-transparent py-0.5 pr-4 pl-0 text-[11px] leading-none text-slate-300 outline-none transition hover:text-sky-200"
        >
          {widgetModes.map((entry) => (
            <option key={entry.key} value={entry.key}>
              {entry.label}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-[9px] text-slate-500">
          ▾
        </span>
      </div>
    </div>
  )
}
