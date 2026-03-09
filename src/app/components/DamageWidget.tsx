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
    <div className="flex items-center gap-2 rounded-md border border-slate-700 bg-slate-950/90 px-2 py-1 shadow-sm shadow-black/25">
      <div className="min-w-0">
        <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
          Damage
        </div>
        <div className="font-mono text-sm font-semibold tabular-nums text-slate-50">
          {formatNumber(currentValue)}
        </div>
      </div>

      <select
        aria-label="Select damage value"
        value={mode}
        onChange={(event) => handleModeChange(event.target.value)}
        className="min-w-[8.5rem] rounded border border-slate-700 bg-slate-900 px-2 py-1 text-[11px]"
      >
        {widgetModes.map((entry) => (
          <option key={entry.key} value={entry.key}>
            {entry.label}
          </option>
        ))}
      </select>
    </div>
  )
}
