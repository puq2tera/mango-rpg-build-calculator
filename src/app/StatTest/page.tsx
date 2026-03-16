"use client"

import { useEffect, useState } from "react"
import { dispatchBuildSnapshotUpdated } from "@/app/lib/buildEvents"
import {
  ADDITIONAL_STAGE_STATS_STORAGE_KEY,
  additionalStageStatNames,
  additionalStageStatStageOptions,
  normalizeAdditionalStageStatEntries,
  type AdditionalStageStatEntry,
  type AdditionalStageStatStage,
} from "@/app/lib/additionalStageStats"

type EditableAdditionalStageStatEntry = AdditionalStageStatEntry

const cardClass =
  "rounded-[24px] border border-slate-800/80 bg-slate-950/75 shadow-[0_24px_72px_rgba(2,6,23,0.4)] backdrop-blur"

const inputClass =
  "w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-sky-400/70"

const secondaryButtonClass =
  "rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm font-semibold text-slate-100 transition hover:border-sky-400/50 hover:text-sky-200"

const dangerButtonClass =
  "rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-100 transition hover:bg-rose-500/15"

function createRowId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function createEmptyRow(stage: AdditionalStageStatStage = "equipment"): EditableAdditionalStageStatEntry {
  return {
    id: createRowId(),
    stage,
    stat: "",
    value: 0,
  }
}

function readStoredRows(storage: Storage): EditableAdditionalStageStatEntry[] {
  try {
    const parsed = JSON.parse(storage.getItem(ADDITIONAL_STAGE_STATS_STORAGE_KEY) ?? "[]") as unknown
    return normalizeAdditionalStageStatEntries(parsed)
  } catch {
    return []
  }
}

export default function StatTestPage() {
  const [isHydrated, setIsHydrated] = useState(false)
  const [rows, setRows] = useState<EditableAdditionalStageStatEntry[]>([])

  useEffect(() => {
    setRows(readStoredRows(localStorage))
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (!isHydrated) {
      return
    }

    localStorage.setItem(ADDITIONAL_STAGE_STATS_STORAGE_KEY, JSON.stringify(rows))
    dispatchBuildSnapshotUpdated()
  }, [isHydrated, rows])

  const handleRowChange = (
    rowId: string,
    field: "stage" | "stat" | "value",
    value: AdditionalStageStatStage | string | number,
  ) => {
    setRows((current) => current.map((row) => row.id === rowId ? { ...row, [field]: value } : row))
  }

  const handleAddRow = () => {
    setRows((current) => [...current, createEmptyRow()])
  }

  const handleRemoveRow = (rowId: string) => {
    setRows((current) => current.filter((row) => row.id !== rowId))
  }

  const handleClear = () => {
    setRows([])
  }

  return (
    <div className="min-h-[calc(100vh-var(--top-nav-height))] bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.12),transparent_30%),radial-gradient(circle_at_top_right,rgba(234,88,12,0.10),transparent_28%),linear-gradient(180deg,rgba(2,6,23,0.98),rgba(15,23,42,0.96))]">
      <div className="mx-auto max-w-6xl px-4 py-4">
        <section className={`${cardClass} px-5 py-5`}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl space-y-2">
              <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-sky-300">
                Stat Test
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-50 sm:text-[2rem]">
                Inject custom stats into a build stage
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-slate-400">
                Add stage-specific test stats here. They are applied to the shared build snapshot and used by Damage and
                Character Summary automatically. Enter percent stats as whole percents, for example `15` for `15%`.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={handleAddRow} className={secondaryButtonClass}>
                Add Stat
              </button>
              <button type="button" onClick={handleClear} className={secondaryButtonClass} disabled={rows.length === 0}>
                Clear All
              </button>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-2">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  <th className="px-3 py-2">Stage</th>
                  <th className="px-3 py-2">Stat Name</th>
                  <th className="px-3 py-2">Value</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/60 px-4 py-10 text-center text-sm text-slate-400">
                      No test stats yet. Add a row to inject a stat into Equipment, Tarots, Buffs, Talents, or another build stage.
                    </td>
                  </tr>
                ) : rows.map((row) => (
                  <tr key={row.id} className="align-top">
                    <td className="rounded-l-2xl border border-r-0 border-slate-800 bg-slate-950/60 px-3 py-3">
                      <div className="flex items-start gap-2">
                        <select
                          value={row.stage}
                          onChange={(event) => handleRowChange(row.id, "stage", event.target.value as AdditionalStageStatStage)}
                          className={inputClass}
                        >
                          {additionalStageStatStageOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(row.id)}
                          className={dangerButtonClass}
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                    <td className="border border-r-0 border-slate-800 bg-slate-950/60 px-3 py-3">
                      <input
                        type="text"
                        value={row.stat}
                        onChange={(event) => handleRowChange(row.id, "stat", event.target.value)}
                        list="stat-test-stat-names"
                        placeholder="Select or type a stat"
                        className={inputClass}
                      />
                    </td>
                    <td className="rounded-r-2xl border border-slate-800 bg-slate-950/60 px-3 py-3">
                      <input
                        type="number"
                        step="any"
                        value={row.value}
                        onChange={(event) => handleRowChange(row.id, "value", Number(event.target.value))}
                        className={inputClass}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <datalist id="stat-test-stat-names">
        {additionalStageStatNames.map((statName) => (
          <option key={statName} value={statName} />
        ))}
      </datalist>
    </div>
  )
}
