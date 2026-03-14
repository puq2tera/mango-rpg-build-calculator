"use client"

import { useEffect, useState } from "react"
import { computeBuildStatStages, readBuildSnapshot } from "@/app/lib/buildStats"
import { BUILD_SNAPSHOT_UPDATED_EVENT } from "@/app/lib/buildEvents"
import {
  calculateWorldBossActions,
  defaultWorldBossUserStats,
  getWorldBossUserStatsFromBuildStages,
  worldBossStatKeys,
  type WorldBossStatKey,
  type WorldBossUserStats,
} from "@/app/lib/worldBoss"

const cardClass = "rounded-lg border bg-slate-900/60 p-4"
const inputClass = "w-full rounded border bg-slate-950/70 p-2"

const formatValue = (value: number): string =>
  value.toLocaleString("en-US", { maximumFractionDigits: 2 })

const parseInputValue = (value: string): number => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const loadBuildStats = (): WorldBossUserStats => {
  const snapshot = readBuildSnapshot(localStorage)
  const stages = computeBuildStatStages(snapshot)
  return getWorldBossUserStatsFromBuildStages(stages)
}

export default function WorldBoss() {
  const [userStats, setUserStats] = useState<WorldBossUserStats>({ ...defaultWorldBossUserStats })
  const [syncWithBuild, setSyncWithBuild] = useState(true)

  useEffect(() => {
    if (!syncWithBuild) {
      return
    }

    const refreshFromBuild = () => {
      setUserStats(loadBuildStats())
    }

    refreshFromBuild()

    const eventNames = [
      BUILD_SNAPSHOT_UPDATED_EVENT,
      "talentsUpdated",
      "equipmentUpdated",
      "runesUpdated",
    ]

    for (const eventName of eventNames) {
      window.addEventListener(eventName, refreshFromBuild)
    }

    return () => {
      for (const eventName of eventNames) {
        window.removeEventListener(eventName, refreshFromBuild)
      }
    }
  }, [syncWithBuild])

  const handleStatChange = (stat: WorldBossStatKey, value: string) => {
    setSyncWithBuild(false)
    setUserStats((prev) => ({
      ...prev,
      [stat]: parseInputValue(value),
    }))
  }

  const handleReloadFromBuild = () => {
    setUserStats(loadBuildStats())
    setSyncWithBuild(true)
  }

  const actionResults = calculateWorldBossActions(userStats)

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2 text-center">
      </div>

      <section className={cardClass}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <h2 className="font-semibold">Base Stats</h2>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {worldBossStatKeys.map((stat) => (
            <label key={stat} className="space-y-2">
              <span className="block font-semibold">{stat}</span>
              <input
                type="number"
                value={userStats[stat]}
                onChange={(event) => handleStatChange(stat, event.target.value)}
                className={inputClass}
              />
            </label>
          ))}
        </div>
      </section>

      <section className={cardClass}>
        <div className="space-y-1">
          <h2 className="font-semibold">Action Ranges</h2>
          <p className="text-sm text-slate-300">
            `Min = floor(Average x 0.9)`, `Max = floor(Average x 1.1)`, `Doctor = floor(Heal x 0.25)`.
          </p>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-2 text-sm">
            <thead>
              <tr className="text-left text-slate-300">
                <th className="px-3 py-2 font-semibold">Action</th>
                <th className="px-3 py-2 font-semibold">Formula</th>
                <th className="px-3 py-2 font-semibold">Min</th>
                <th className="px-3 py-2 font-semibold">Average</th>
                <th className="px-3 py-2 font-semibold">Max</th>
              </tr>
            </thead>
            <tbody>
              {actionResults.map((result) => (
                <tr key={result.name} className="bg-slate-950/60">
                  <td className="rounded-l-md px-3 py-3 font-semibold text-slate-100">{result.name}</td>
                  <td className="px-3 py-3 text-slate-300">{result.formula}</td>
                  <td className="px-3 py-3 text-slate-100">{formatValue(result.min)}</td>
                  <td className="px-3 py-3 text-slate-100">{formatValue(result.average)}</td>
                  <td className="rounded-r-md px-3 py-3 text-slate-100">{formatValue(result.max)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
