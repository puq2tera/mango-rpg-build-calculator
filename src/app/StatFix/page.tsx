"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import {
  ADDITIONAL_STAGE_STATS_STORAGE_KEY,
  STAGE_STAT_OVERRIDES_STORAGE_KEY,
  additionalStageStatNames,
  additionalStageStatStageOptions,
  normalizeAdditionalStageStatEntries,
  normalizeStageStatOverrideEntries,
  type AdditionalStageStatEntry,
  type AdditionalStageStatStage,
} from "@/app/lib/additionalStageStats"
import { dispatchBuildSnapshotUpdated } from "@/app/lib/buildEvents"
import {
  classMainStatOrder,
  createDefaultMainStatValues,
  parseStoredMainStatValues,
  type MainStatValues,
} from "@/app/lib/mainStatPoints"
import {
  createDefaultManualLevelRange,
  getManualRangeMaxTotalLevel,
  manualRangeClasses,
  normalizeManualLevelRanges,
  parseManualLevelTranscript,
  type ManualLevelRange,
  type ManualRangeClass,
} from "@/app/lib/manualLevelRanges"
import {
  MANUAL_TRAINING_SECTION_ID,
  createDefaultManualTrainingEntry,
  getEffectiveTrainingTotalsFromEntries,
  getManualTrainingEffectivePoints,
  getManualTrainingToken,
  normalizeManualTrainingEntries,
  parseManualTrainingTranscript,
  type ManualTrainingEntry,
} from "@/app/lib/manualTraining"

const STORAGE_KEYS = {
  levels: "SelectedLevels",
  training: "SelectedTraining",
  savedLevelOrder: "SelectedLevelOrder",
  manualLevelRanges: "SelectedManualLevelRanges",
  manualLevelRangesCollapsed: "SelectedManualLevelRangesCollapsed",
  manualTrainingEntries: "SelectedManualTrainingEntries",
  manualTrainingCollapsed: "SelectedManualTrainingCollapsed",
}

const pageCardClass =
  "overflow-hidden rounded-[28px] border border-slate-800/80 bg-slate-950/70 shadow-[0_24px_72px_rgba(2,6,23,0.4)] backdrop-blur"

const inputClass =
  "w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-sky-400/70"

const secondaryButtonClass =
  "rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm font-semibold text-slate-100 transition hover:border-sky-400/50 hover:text-sky-200 disabled:cursor-not-allowed disabled:opacity-50"

const primaryButtonClass =
  "rounded-lg border border-sky-400/50 bg-sky-500/10 px-3 py-2 text-sm font-semibold text-sky-100 transition hover:bg-sky-500/15 disabled:cursor-not-allowed disabled:opacity-50"

const dangerButtonClass =
  "rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-100 transition hover:bg-rose-500/15"

type EditableAdditionalStageStatEntry = AdditionalStageStatEntry
type EditableStageStatOverrideEntry = AdditionalStageStatEntry

type Notice = {
  tone: "success" | "warning" | "error"
  lines: string[]
}

type Cls = ManualRangeClass
type LevelsByClass = Record<Cls, number>

const classKeys: Cls[] = [...manualRangeClasses]
const classLabel: Record<Cls, string> = {
  tank: "Tank",
  warrior: "Warrior",
  caster: "Caster",
  healer: "Healer",
}

function parseStoredJson<T>(raw: string | null, fallback: T): T {
  if (!raw) {
    return fallback
  }

  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function parseStoredBoolean(raw: string | null, fallback = false): boolean {
  if (!raw) {
    return fallback
  }

  try {
    return JSON.parse(raw) === true
  } catch {
    return fallback
  }
}

function createRowId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function createEmptyLevelsByClass(): LevelsByClass {
  return {
    tank: 0,
    warrior: 0,
    caster: 0,
    healer: 0,
  }
}

function createEmptyAdditionalStageStatRow(stage: AdditionalStageStatStage = "equipment"): EditableAdditionalStageStatEntry {
  return {
    id: createRowId(),
    stage,
    stat: "",
    value: 0,
  }
}

function createEmptyStageStatOverrideRow(stage: AdditionalStageStatStage = "levels"): EditableStageStatOverrideEntry {
  return {
    id: createRowId(),
    stage,
    stat: "",
    value: 0,
  }
}

function readStoredAdditionalStageStatRows(storage: Storage): EditableAdditionalStageStatEntry[] {
  try {
    const parsed = JSON.parse(storage.getItem(ADDITIONAL_STAGE_STATS_STORAGE_KEY) ?? "[]") as unknown
    return normalizeAdditionalStageStatEntries(parsed)
  } catch {
    return []
  }
}

function readStoredStageStatOverrideRows(storage: Storage): EditableStageStatOverrideEntry[] {
  try {
    const parsed = JSON.parse(storage.getItem(STAGE_STAT_OVERRIDES_STORAGE_KEY) ?? "[]") as unknown
    return normalizeStageStatOverrideEntries(parsed)
  } catch {
    return []
  }
}

function normalizeStoredClassOrder(raw: string | null): Cls[] {
  const parsed = parseStoredJson<string[]>(raw, [])
  const seen = new Set<Cls>()
  const ordered = parsed
    .filter((value): value is Cls => manualRangeClasses.includes(value as Cls))
    .filter((value) => {
      if (seen.has(value)) {
        return false
      }

      seen.add(value)
      return true
    })

  return ordered.length === manualRangeClasses.length ? ordered : [...manualRangeClasses]
}

function getDefaultLevelClassSequence(levels: LevelsByClass, classOrder: readonly Cls[]): Cls[] {
  const sequence: Cls[] = []

  for (const className of classOrder) {
    const classLevels = Math.max(0, Math.floor(levels[className] ?? 0))
    for (let index = 0; index < classLevels; index++) {
      sequence.push(className)
    }
  }

  return sequence
}

function getManualRangeOverride(ranges: readonly ManualLevelRange[], totalLevel: number): ManualLevelRange | null {
  for (let index = ranges.length - 1; index >= 0; index--) {
    const range = ranges[index]
    if (totalLevel >= range.startLevel && totalLevel <= range.endLevel) {
      return range
    }
  }

  return null
}

function getSyncedLevelsFromManualRanges(
  ranges: readonly ManualLevelRange[],
  currentLevels: LevelsByClass,
  classOrder: readonly Cls[],
): LevelsByClass {
  const maxTotalLevel = getManualRangeMaxTotalLevel(ranges)
  const defaultSequence = getDefaultLevelClassSequence(currentLevels, classOrder)
  const targetTotalLevel = Math.max(maxTotalLevel, defaultSequence.length)
  const syncedLevels = createEmptyLevelsByClass()
  let lastResolvedClass: Cls = defaultSequence[0] ?? classOrder[0] ?? "healer"

  for (let totalLevel = 1; totalLevel <= targetTotalLevel; totalLevel++) {
    const override = getManualRangeOverride(ranges, totalLevel)
    const resolvedClass = override?.className ?? defaultSequence[totalLevel - 1] ?? lastResolvedClass

    syncedLevels[resolvedClass] += 1
    lastResolvedClass = resolvedClass
  }

  return syncedLevels
}

function countManualLevelsByClass(ranges: readonly ManualLevelRange[]): LevelsByClass {
  const counts = createEmptyLevelsByClass()
  const maxTotalLevel = getManualRangeMaxTotalLevel(ranges)

  for (let totalLevel = 1; totalLevel <= maxTotalLevel; totalLevel += 1) {
    const override = getManualRangeOverride(ranges, totalLevel)
    if (!override) {
      continue
    }

    counts[override.className] += 1
  }

  return counts
}

function formatWhole(value: number): string {
  return Math.max(0, Math.round(value)).toLocaleString()
}

function formatClassLevelCounts(levelCounts: LevelsByClass): string {
  return `${levelCounts.tank}/${levelCounts.warrior}/${levelCounts.caster}/${levelCounts.healer}`
}

function getNoticeClass(tone: Notice["tone"]): string {
  if (tone === "error") {
    return "border-rose-700/70 bg-rose-950/35 text-rose-100"
  }

  if (tone === "warning") {
    return "border-amber-700/70 bg-amber-950/30 text-amber-100"
  }

  return "border-emerald-700/70 bg-emerald-950/25 text-emerald-100"
}

export default function StatFixPage() {
  const [isHydrated, setIsHydrated] = useState(false)
  const [levels, setLevels] = useState<LevelsByClass>(createEmptyLevelsByClass())
  const [training, setTraining] = useState<MainStatValues>(createDefaultMainStatValues())
  const [classOrder, setClassOrder] = useState<Cls[]>([...manualRangeClasses])
  const [manualLevelRanges, setManualLevelRanges] = useState<ManualLevelRange[]>([])
  const [manualRangesCollapsed, setManualRangesCollapsed] = useState(false)
  const [manualRangeImportNotice, setManualRangeImportNotice] = useState<Notice | null>(null)
  const [manualTrainingEntries, setManualTrainingEntries] = useState<ManualTrainingEntry[]>([])
  const [manualTrainingCollapsed, setManualTrainingCollapsed] = useState(false)
  const [manualTrainingImportNotice, setManualTrainingImportNotice] = useState<Notice | null>(null)
  const [stageStatOverrideRows, setStageStatOverrideRows] = useState<EditableStageStatOverrideEntry[]>([])
  const [additionalStageStatRows, setAdditionalStageStatRows] = useState<EditableAdditionalStageStatEntry[]>([])

  useEffect(() => {
    setLevels(parseStoredJson(localStorage.getItem(STORAGE_KEYS.levels), createEmptyLevelsByClass()))
    setTraining(parseStoredMainStatValues(localStorage.getItem(STORAGE_KEYS.training)))
    setClassOrder(normalizeStoredClassOrder(localStorage.getItem(STORAGE_KEYS.savedLevelOrder)))
    setManualLevelRanges(normalizeManualLevelRanges(parseStoredJson(localStorage.getItem(STORAGE_KEYS.manualLevelRanges), [])))
    setManualRangesCollapsed(parseStoredBoolean(localStorage.getItem(STORAGE_KEYS.manualLevelRangesCollapsed)))
    setManualTrainingEntries(
      normalizeManualTrainingEntries(parseStoredJson(localStorage.getItem(STORAGE_KEYS.manualTrainingEntries), [])),
    )
    setManualTrainingCollapsed(parseStoredBoolean(localStorage.getItem(STORAGE_KEYS.manualTrainingCollapsed)))
    setStageStatOverrideRows(readStoredStageStatOverrideRows(localStorage))
    setAdditionalStageStatRows(readStoredAdditionalStageStatRows(localStorage))
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (!isHydrated) {
      return
    }

    localStorage.setItem(STORAGE_KEYS.levels, JSON.stringify(levels))
    dispatchBuildSnapshotUpdated()
  }, [isHydrated, levels])

  useEffect(() => {
    if (!isHydrated) {
      return
    }

    localStorage.setItem(STORAGE_KEYS.training, JSON.stringify(training))
    dispatchBuildSnapshotUpdated()
  }, [isHydrated, training])

  useEffect(() => {
    if (!isHydrated) {
      return
    }

    localStorage.setItem(STORAGE_KEYS.manualLevelRanges, JSON.stringify(manualLevelRanges))
    dispatchBuildSnapshotUpdated()
  }, [isHydrated, manualLevelRanges])

  useEffect(() => {
    if (!isHydrated) {
      return
    }

    localStorage.setItem(STORAGE_KEYS.manualLevelRangesCollapsed, JSON.stringify(manualRangesCollapsed))
  }, [isHydrated, manualRangesCollapsed])

  useEffect(() => {
    if (!isHydrated) {
      return
    }

    localStorage.setItem(STORAGE_KEYS.manualTrainingEntries, JSON.stringify(manualTrainingEntries))
  }, [isHydrated, manualTrainingEntries])

  useEffect(() => {
    if (!isHydrated) {
      return
    }

    localStorage.setItem(STORAGE_KEYS.manualTrainingCollapsed, JSON.stringify(manualTrainingCollapsed))
  }, [isHydrated, manualTrainingCollapsed])

  useEffect(() => {
    if (!isHydrated) {
      return
    }

    localStorage.setItem(STAGE_STAT_OVERRIDES_STORAGE_KEY, JSON.stringify(stageStatOverrideRows))
    dispatchBuildSnapshotUpdated()
  }, [isHydrated, stageStatOverrideRows])

  useEffect(() => {
    if (!isHydrated) {
      return
    }

    localStorage.setItem(ADDITIONAL_STAGE_STATS_STORAGE_KEY, JSON.stringify(additionalStageStatRows))
    dispatchBuildSnapshotUpdated()
  }, [additionalStageStatRows, isHydrated])

  const totalLevels = Object.values(levels).reduce((sum, value) => sum + value, 0)
  const totalTraining = Object.values(training).reduce((sum, value) => sum + value, 0)
  const manualTrainingTotals = useMemo(
    () => getEffectiveTrainingTotalsFromEntries(manualTrainingEntries),
    [manualTrainingEntries],
  )
  const totalManualTraining = Object.values(manualTrainingTotals).reduce((sum, value) => sum + value, 0)
  const needsManualTrainingSync = manualTrainingEntries.length > 0 && classMainStatOrder.some(
    (key) => training[key] !== manualTrainingTotals[key],
  )
  const syncedLevels = useMemo(
    () => getSyncedLevelsFromManualRanges(manualLevelRanges, levels, classOrder),
    [classOrder, levels, manualLevelRanges],
  )
  const maxManualRangeLevel = getManualRangeMaxTotalLevel(manualLevelRanges)
  const manuallyAccountedLevels = useMemo(
    () => countManualLevelsByClass(manualLevelRanges),
    [manualLevelRanges],
  )
  const needsManualLevelSync = manualLevelRanges.length > 0 && classKeys.some(
    (className) => syncedLevels[className] !== levels[className],
  )
  const classOrderSummary = classOrder.map((className) => classLabel[className]).join(" -> ")
  const currentLevelsSummary = classKeys.map((className) => `${classLabel[className]} ${levels[className]}`).join(" / ")

  const addManualRange = () => {
    setManualLevelRanges((current) => [...current, createDefaultManualLevelRange()])
  }

  const updateManualRange = <Key extends keyof ManualLevelRange>(
    index: number,
    key: Key,
    value: ManualLevelRange[Key],
  ) => {
    setManualLevelRanges((current) =>
      current.map((range, currentIndex) => currentIndex === index ? { ...range, [key]: value } : range),
    )
  }

  const removeManualRange = (index: number) => {
    setManualLevelRanges((current) => current.filter((_, currentIndex) => currentIndex !== index))
  }

  const importManualRangesFromText = (rawTranscript: string) => {
    const transcript = rawTranscript.trim()

    if (transcript.length === 0) {
      setManualRangeImportNotice({
        tone: "error",
        lines: ["Paste a Guild Card and one or more `xlevelup` results into the import box."],
      })
      return
    }

    const { ranges, warnings } = parseManualLevelTranscript(
      transcript,
      getManualRangeMaxTotalLevel(manualLevelRanges),
    )

    if (ranges.length === 0) {
      setManualRangeImportNotice({
        tone: "error",
        lines: warnings.length > 0 ? warnings : ["The pasted text did not produce any ranges."],
      })
      return
    }

    setManualLevelRanges((current) => [...current, ...ranges])
    const importedLevelCounts = countManualLevelsByClass(ranges)
    setManualRangeImportNotice({
      tone: warnings.length > 0 ? "warning" : "success",
      lines: [
        `Imported ${ranges.length} manual range${ranges.length === 1 ? "" : "s"}. Accounted T/W/C/H ${formatClassLevelCounts(importedLevelCounts)}.`,
        ...warnings,
      ],
    })
  }

  const syncLevelsToManualRanges = () => {
    setLevels(syncedLevels)
    setManualRangeImportNotice({
      tone: "success",
      lines: [`Synced chosen levels to ${getManualRangeMaxTotalLevel(manualLevelRanges)} total levels from manual ranges.`],
    })
  }

  const addManualTrainingEntry = () => {
    setManualTrainingEntries((current) => [...current, createDefaultManualTrainingEntry()])
  }

  const updateManualTrainingEntry = <Key extends keyof ManualTrainingEntry>(
    index: number,
    key: Key,
    value: ManualTrainingEntry[Key],
  ) => {
    setManualTrainingEntries((current) =>
      current.map((entry, currentIndex) => currentIndex === index ? { ...entry, [key]: value } : entry),
    )
  }

  const removeManualTrainingEntry = (index: number) => {
    setManualTrainingEntries((current) => current.filter((_, currentIndex) => currentIndex !== index))
  }

  const importManualTrainingFromText = (rawTranscript: string) => {
    const transcript = rawTranscript.trim()

    if (transcript.length === 0) {
      setManualTrainingImportNotice({
        tone: "error",
        lines: ["Paste one or more `xtraining` results into the import box."],
      })
      return
    }

    const { entries, warnings } = parseManualTrainingTranscript(transcript)

    if (entries.length === 0) {
      setManualTrainingImportNotice({
        tone: "error",
        lines: warnings.length > 0 ? warnings : ["The pasted text did not produce any manual training rows."],
      })
      return
    }

    setManualTrainingEntries((current) => [...current, ...entries])
    setManualTrainingImportNotice({
      tone: warnings.length > 0 ? "warning" : "success",
      lines: [`Imported ${entries.length} manual training row${entries.length === 1 ? "" : "s"}.`, ...warnings],
    })
  }

  const syncTrainingToManualEntries = () => {
    setTraining(manualTrainingTotals)
    setManualTrainingImportNotice({
      tone: "success",
      lines: [`Synced chosen training to ${totalManualTraining} imported point${totalManualTraining === 1 ? "" : "s"}.`],
    })
  }

  const handleStageStatOverrideChange = (
    rowId: string,
    field: "stage" | "stat" | "value",
    value: AdditionalStageStatStage | string | number,
  ) => {
    setStageStatOverrideRows((current) =>
      current.map((row) => row.id === rowId ? { ...row, [field]: value } : row),
    )
  }

  const handleAddStageStatOverrideRow = () => {
    setStageStatOverrideRows((current) => [...current, createEmptyStageStatOverrideRow()])
  }

  const handleRemoveStageStatOverrideRow = (rowId: string) => {
    setStageStatOverrideRows((current) => current.filter((row) => row.id !== rowId))
  }

  const handleClearStageStatOverrideRows = () => {
    setStageStatOverrideRows([])
  }

  const handleAdditionalStageStatChange = (
    rowId: string,
    field: "stage" | "stat" | "value",
    value: AdditionalStageStatStage | string | number,
  ) => {
    setAdditionalStageStatRows((current) =>
      current.map((row) => row.id === rowId ? { ...row, [field]: value } : row),
    )
  }

  const handleAddAdditionalStageStatRow = () => {
    setAdditionalStageStatRows((current) => [...current, createEmptyAdditionalStageStatRow()])
  }

  const handleRemoveAdditionalStageStatRow = (rowId: string) => {
    setAdditionalStageStatRows((current) => current.filter((row) => row.id !== rowId))
  }

  const handleClearAdditionalStageStatRows = () => {
    setAdditionalStageStatRows([])
  }

  if (!isHydrated) {
    return <div className="p-4">Loading...</div>
  }

  return (
    <div className="min-h-[calc(100vh-var(--top-nav-height))] bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.12),transparent_30%),radial-gradient(circle_at_top_right,rgba(249,115,22,0.1),transparent_28%),linear-gradient(180deg,rgba(2,6,23,0.98),rgba(15,23,42,0.96))]">
      <div className="w-full px-4 py-4">
        <section className={`${pageCardClass} px-5 py-5`}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-4xl space-y-2">
              <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-sky-300">
                Stat Fix
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-50 sm:text-[2rem]">
                Manual stat fixes, transcript imports, and stage overrides
              </h1>
              <p className="max-w-3xl text-sm leading-6 text-slate-400">
                Use this page when the calculator needs a manual correction. Training, manual levelup ranges, and the
                old stat-test additions now live together here with stage replacements, and they still write to the
                same shared build snapshot.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 px-4 py-3 text-sm text-slate-300 shadow-[0_16px_40px_rgba(2,6,23,0.22)]">
              <div>Total Levels: {totalLevels}</div>
              <div>Total Training: {totalTraining}</div>
              <div>Manual Ranges: {manualLevelRanges.length}</div>
              <div>Stage Replacements: {stageStatOverrideRows.length}</div>
              <div>Stage Additions: {additionalStageStatRows.length}</div>
            </div>
          </div>
        </section>

        <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <section className={`${pageCardClass} px-5 py-5`}>
            <div className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-300">
                    Training
                  </div>
                  <h2 className="text-xl font-semibold text-slate-50">Chosen training and transcript fixes</h2>
                  <p className="max-w-2xl text-sm text-slate-400">
                    Update the shared `SelectedTraining` totals directly, or import `xtraining` output and sync it over.
                  </p>
                </div>
                <div className="rounded-full border border-slate-700/80 bg-slate-950/70 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">
                  {totalTraining} Chosen
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {classMainStatOrder.map((statKey) => (
                  <label key={statKey} className="space-y-1 rounded-2xl border border-slate-800/80 bg-slate-950/55 px-4 py-3">
                    <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{statKey}</div>
                    <input
                      type="number"
                      value={training[statKey]}
                      onChange={(event) => setTraining({ ...training, [statKey]: Number(event.target.value) || 0 })}
                      className={`${inputClass} text-center`}
                    />
                  </label>
                ))}
              </div>

              <section
                id={MANUAL_TRAINING_SECTION_ID}
                className="overflow-hidden rounded-[24px] border border-slate-800/80 bg-slate-950/35"
              >
                <div className={`flex flex-wrap items-center justify-between gap-3 ${manualTrainingCollapsed ? "px-4 py-2.5 sm:px-5" : "px-5 py-4 sm:px-6"}`}>
                  <div className="space-y-1">
                    <div className="text-lg font-semibold text-slate-50">Manual Training</div>
                    {!manualTrainingCollapsed ? (
                      <div className="text-sm text-slate-400">
                        Import `xtraining` transcripts, keep blank command counts blank, and sync the derived totals into the calculator.
                      </div>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="rounded-full border border-slate-700/80 bg-slate-950/70 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">
                      {manualTrainingEntries.length} Saved
                    </div>
                    <button
                      type="button"
                      onClick={() => setManualTrainingCollapsed((current) => !current)}
                      aria-expanded={!manualTrainingCollapsed}
                      aria-controls="manual-training-panel"
                      className="rounded-full border border-slate-700/80 bg-slate-900/80 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-200 transition hover:border-sky-300/40 hover:text-sky-100"
                    >
                      {manualTrainingCollapsed ? "Show" : "Hide"}
                    </button>
                  </div>
                </div>

                {!manualTrainingCollapsed ? (
                  <div id="manual-training-panel" className="space-y-3 border-t border-slate-800/70 p-4 sm:p-6">
                    <div className="max-w-5xl rounded-2xl border border-slate-800/80 bg-slate-900/60 p-3">
                      <label className="block space-y-2">
                        <span className="text-sm font-semibold text-slate-100">Paste training transcript</span>
                        <input
                          type="text"
                          placeholder="Paste xtraining transcript here"
                          onPaste={(event) => {
                            event.preventDefault()
                            const text = event.clipboardData.getData("text")
                            importManualTrainingFromText(text)
                            event.currentTarget.value = ""
                          }}
                          className={inputClass}
                        />
                      </label>
                      <p className="mt-2 text-xs text-slate-400">
                        Blank Training cells are treated as a full-stat snapshot from the reported gain.
                        Example: `[ atk ] Training` with `+321` resolves to 80 ATK training.
                      </p>
                      {manualTrainingImportNotice ? (
                        <div className={`mt-3 space-y-1 rounded-xl border px-3 py-2 text-sm ${getNoticeClass(manualTrainingImportNotice.tone)}`}>
                          {manualTrainingImportNotice.lines.map((line, index) => (
                            <div key={`${line}-${index}`}>{line}</div>
                          ))}
                        </div>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        className={secondaryButtonClass}
                        onClick={addManualTrainingEntry}
                      >
                        Add Row
                      </button>
                      {needsManualTrainingSync ? (
                        <button
                          type="button"
                          className={primaryButtonClass}
                          onClick={syncTrainingToManualEntries}
                        >
                          Sync Training
                        </button>
                      ) : null}
                      <div className="text-xs text-slate-300">
                        Imported totals: {classMainStatOrder.map((key) => `${key} ${manualTrainingTotals[key]}`).join(" / ")}
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="min-w-full table-fixed border border-slate-800 text-xs text-center md:text-sm">
                        <thead className="bg-slate-800/85">
                          <tr>
                            <th className="border border-slate-700 px-2 py-1">Stat</th>
                            <th className="border border-slate-700 px-2 py-1">Training</th>
                            <th className="border border-slate-700 px-2 py-1">Reported Gain</th>
                            <th className="border border-slate-700 px-2 py-1">Effective</th>
                            <th className="border border-slate-700 px-2 py-1">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {manualTrainingEntries.map((entry, index) => (
                            <tr key={`${entry.stat}-${index}`}>
                              <td className="border border-slate-800 px-1 py-1">
                                <select
                                  value={entry.stat}
                                  onChange={(event) => updateManualTrainingEntry(index, "stat", event.target.value as ManualTrainingEntry["stat"])}
                                  className={inputClass}
                                >
                                  {classMainStatOrder.map((statKey) => (
                                    <option key={statKey} value={statKey}>{statKey}</option>
                                  ))}
                                </select>
                              </td>
                              <td className="border border-slate-800 px-1 py-1">
                                <input
                                  type="number"
                                  min={0}
                                  value={entry.trainingPoints ?? ""}
                                  onChange={(event) => updateManualTrainingEntry(
                                    index,
                                    "trainingPoints",
                                    event.target.value === "" ? null : Math.max(0, Math.floor(Number(event.target.value) || 0)),
                                  )}
                                  placeholder={getManualTrainingToken(entry.stat)}
                                  className={`${inputClass} text-center`}
                                />
                              </td>
                              <td className="border border-slate-800 px-1 py-1">
                                <input
                                  type="number"
                                  min={0}
                                  value={entry.reportedGain}
                                  onChange={(event) => updateManualTrainingEntry(
                                    index,
                                    "reportedGain",
                                    Math.max(0, Math.floor(Number(event.target.value) || 0)),
                                  )}
                                  className={`${inputClass} text-center`}
                                />
                              </td>
                              <td className="border border-slate-800 px-2 py-1">{formatWhole(getManualTrainingEffectivePoints(entry))}</td>
                              <td className="border border-slate-800 px-1 py-1">
                                <button
                                  type="button"
                                  className={dangerButtonClass}
                                  onClick={() => removeManualTrainingEntry(index)}
                                >
                                  Remove
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <p className="text-xs text-slate-400">
                      A blank Training value means "this result already reflects all training for that stat."
                      Later blank rows replace earlier totals for the same stat; numbered rows add on top.
                    </p>
                  </div>
                ) : null}
              </section>
            </div>
          </section>

          <section className={`${pageCardClass} px-5 py-5`}>
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-300">
                      Stage Replacements
                    </div>
                    <h2 className="text-xl font-semibold text-slate-50">Stage stat replacements</h2>
                    <p className="max-w-2xl text-sm text-slate-400">
                      Replace a stage stat with an exact value instead of adding to it. Use this for fixes like setting
                      Levels `Overdrive%` to a fixed value.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={handleAddStageStatOverrideRow} className={secondaryButtonClass}>
                      Add Replacement
                    </button>
                    <button
                      type="button"
                      onClick={handleClearStageStatOverrideRows}
                      className={secondaryButtonClass}
                      disabled={stageStatOverrideRows.length === 0}
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full border-separate border-spacing-y-2">
                    <thead>
                      <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        <th className="px-3 py-2">Stage</th>
                        <th className="px-3 py-2">Stat Name</th>
                        <th className="px-3 py-2">Replacement Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stageStatOverrideRows.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/60 px-4 py-10 text-center text-sm text-slate-400">
                            No stage replacements yet. Add a row to replace a stage stat with a fixed value.
                          </td>
                        </tr>
                      ) : stageStatOverrideRows.map((row) => (
                        <tr key={row.id} className="align-top">
                          <td className="rounded-l-2xl border border-r-0 border-slate-800 bg-slate-950/60 px-3 py-3">
                            <div className="flex items-start gap-2">
                              <select
                                value={row.stage}
                                onChange={(event) => handleStageStatOverrideChange(
                                  row.id,
                                  "stage",
                                  event.target.value as AdditionalStageStatStage,
                                )}
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
                                onClick={() => handleRemoveStageStatOverrideRow(row.id)}
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
                              onChange={(event) => handleStageStatOverrideChange(row.id, "stat", event.target.value)}
                              list="stat-fix-stat-names"
                              placeholder="Select or type a stat"
                              className={inputClass}
                            />
                          </td>
                          <td className="rounded-r-2xl border border-slate-800 bg-slate-950/60 px-3 py-3">
                            <input
                              type="number"
                              step="any"
                              value={row.value}
                              onChange={(event) => handleStageStatOverrideChange(row.id, "value", Number(event.target.value))}
                              className={inputClass}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-300">
                      Stage Additions
                    </div>
                    <h2 className="text-xl font-semibold text-slate-50">Additional stage stats</h2>
                    <p className="max-w-2xl text-sm text-slate-400">
                      These are the old Stat Test entries. Add stage-specific fixes here when the live build needs a
                      manual stat injection on top of the original value.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={handleAddAdditionalStageStatRow} className={secondaryButtonClass}>
                      Add Stat
                    </button>
                    <button
                      type="button"
                      onClick={handleClearAdditionalStageStatRows}
                      className={secondaryButtonClass}
                      disabled={additionalStageStatRows.length === 0}
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full border-separate border-spacing-y-2">
                    <thead>
                      <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        <th className="px-3 py-2">Stage</th>
                        <th className="px-3 py-2">Stat Name</th>
                        <th className="px-3 py-2">Added Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {additionalStageStatRows.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/60 px-4 py-10 text-center text-sm text-slate-400">
                            No stage additions yet. Add a row to inject a stat into Equipment, Tarots, Buffs, Talents, or another build stage.
                          </td>
                        </tr>
                      ) : additionalStageStatRows.map((row) => (
                        <tr key={row.id} className="align-top">
                          <td className="rounded-l-2xl border border-r-0 border-slate-800 bg-slate-950/60 px-3 py-3">
                            <div className="flex items-start gap-2">
                              <select
                                value={row.stage}
                                onChange={(event) => handleAdditionalStageStatChange(
                                  row.id,
                                  "stage",
                                  event.target.value as AdditionalStageStatStage,
                                )}
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
                                onClick={() => handleRemoveAdditionalStageStatRow(row.id)}
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
                              onChange={(event) => handleAdditionalStageStatChange(row.id, "stat", event.target.value)}
                              list="stat-fix-stat-names"
                              placeholder="Select or type a stat"
                              className={inputClass}
                            />
                          </td>
                          <td className="rounded-r-2xl border border-slate-800 bg-slate-950/60 px-3 py-3">
                            <input
                              type="number"
                              step="any"
                              value={row.value}
                              onChange={(event) => handleAdditionalStageStatChange(row.id, "value", Number(event.target.value))}
                              className={inputClass}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>
        </div>

        <section className={`${pageCardClass} mt-4`}>
          <div className={`flex flex-wrap items-center justify-between gap-3 ${manualRangesCollapsed ? "px-4 py-2.5 sm:px-5" : "px-5 py-4 sm:px-6"}`}>
            <div className="space-y-1">
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-300">
                Manual Levels
              </div>
              <div className="text-xl font-semibold text-slate-50">Manual levelup ranges</div>
              {!manualRangesCollapsed ? (
                <div className="text-sm text-slate-400">
                  Import `xlevelup` transcripts and manage total-level overrides. Use stage stat replacements if you
                  want to replace a computed level stat like `Overdrive%`.
                </div>
              ) : null}
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-full border border-slate-700/80 bg-slate-950/70 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">
                {manualLevelRanges.length} Saved
              </div>
              <button
                type="button"
                onClick={() => setManualRangesCollapsed((current) => !current)}
                aria-expanded={!manualRangesCollapsed}
                aria-controls="manual-levelup-ranges-panel"
                className="rounded-full border border-slate-700/80 bg-slate-900/80 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-200 transition hover:border-sky-300/40 hover:text-sky-100"
              >
                {manualRangesCollapsed ? "Show" : "Hide"}
              </button>
            </div>
          </div>

          {!manualRangesCollapsed ? (
            <div id="manual-levelup-ranges-panel" className="space-y-4 border-t border-slate-800/70 p-4 sm:p-6">
              <div className="grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
                <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-3">
                  <label className="block space-y-2">
                    <span className="text-sm font-semibold text-slate-100">Paste level-up transcript</span>
                    <input
                      type="text"
                      placeholder="Paste level-up transcript here"
                      onPaste={(event) => {
                        event.preventDefault()
                        const text = event.clipboardData.getData("text")
                        importManualRangesFromText(text)
                        event.currentTarget.value = ""
                      }}
                      className={inputClass}
                    />
                  </label>
                  <p className="mt-2 text-xs text-slate-400">
                    Paste a `xlevelup` transcript directly into the box to import it, including class scaling lines.
                  </p>
                  {manualRangeImportNotice ? (
                    <div className={`mt-3 space-y-1 rounded-xl border px-3 py-2 text-sm ${getNoticeClass(manualRangeImportNotice.tone)}`}>
                      {manualRangeImportNotice.lines.map((line, index) => (
                        <div key={`${line}-${index}`}>{line}</div>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="space-y-3 rounded-2xl border border-slate-800/80 bg-slate-950/55 p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Current Level Snapshot</div>
                  <div className="text-sm text-slate-200">{currentLevelsSummary}</div>
                  <div className="text-xs text-slate-400">
                    Manual accounted T/W/C/H: {formatClassLevelCounts(manuallyAccountedLevels)}
                  </div>
                  <div className="text-xs text-slate-400">Class order from Levels: {classOrderSummary}</div>
                  <div className="text-xs text-slate-400">Highest manual total level: {maxManualRangeLevel}</div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      className={secondaryButtonClass}
                      onClick={addManualRange}
                    >
                      Add Range
                    </button>
                    {needsManualLevelSync ? (
                      <button
                        type="button"
                        className={primaryButtonClass}
                        onClick={syncLevelsToManualRanges}
                      >
                        Sync Levels
                      </button>
                    ) : null}
                    <Link href="/Levels" className={secondaryButtonClass}>
                      Open Levels
                    </Link>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full table-fixed border border-slate-800 text-xs text-center md:text-sm">
                  <thead className="bg-slate-800/85">
                    <tr>
                      <th className="border border-slate-700 px-2 py-1">Class</th>
                      <th className="border border-slate-700 px-2 py-1">Start</th>
                      <th className="border border-slate-700 px-2 py-1">End</th>
                      <th className="border border-slate-700 px-2 py-1">HP</th>
                      <th className="border border-slate-700 px-2 py-1">ATK</th>
                      <th className="border border-slate-700 px-2 py-1">DEF</th>
                      <th className="border border-slate-700 px-2 py-1">MATK</th>
                      <th className="border border-slate-700 px-2 py-1">HEAL</th>
                      <th className="border border-slate-700 px-2 py-1">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {manualLevelRanges.map((range, index) => (
                      <tr key={`${range.className}-${range.startLevel}-${range.endLevel}-${index}`}>
                        <td className="border border-slate-800 px-1 py-1">
                          <select
                            value={range.className}
                            onChange={(event) => updateManualRange(index, "className", event.target.value as Cls)}
                            className={inputClass}
                          >
                            {classKeys.map((className) => (
                              <option key={className} value={className}>{className}</option>
                            ))}
                          </select>
                        </td>
                        <td className="border border-slate-800 px-1 py-1">
                          <input
                            type="number"
                            min={1}
                            value={range.startLevel}
                            onChange={(event) => updateManualRange(index, "startLevel", Math.max(1, Number(event.target.value) || 1))}
                            className={`${inputClass} text-center`}
                          />
                        </td>
                        <td className="border border-slate-800 px-1 py-1">
                          <input
                            type="number"
                            min={1}
                            value={range.endLevel}
                            onChange={(event) => updateManualRange(index, "endLevel", Math.max(1, Number(event.target.value) || 1))}
                            className={`${inputClass} text-center`}
                          />
                        </td>
                        <td className="border border-slate-800 px-1 py-1">
                          <input
                            type="number"
                            value={range.hpGain}
                            onChange={(event) => updateManualRange(index, "hpGain", Number(event.target.value) || 0)}
                            className={`${inputClass} text-center`}
                          />
                        </td>
                        <td className="border border-slate-800 px-1 py-1">
                          <input
                            type="number"
                            value={range.atkGain}
                            onChange={(event) => updateManualRange(index, "atkGain", Number(event.target.value) || 0)}
                            className={`${inputClass} text-center`}
                          />
                        </td>
                        <td className="border border-slate-800 px-1 py-1">
                          <input
                            type="number"
                            value={range.defGain}
                            onChange={(event) => updateManualRange(index, "defGain", Number(event.target.value) || 0)}
                            className={`${inputClass} text-center`}
                          />
                        </td>
                        <td className="border border-slate-800 px-1 py-1">
                          <input
                            type="number"
                            value={range.matkGain}
                            onChange={(event) => updateManualRange(index, "matkGain", Number(event.target.value) || 0)}
                            className={`${inputClass} text-center`}
                          />
                        </td>
                        <td className="border border-slate-800 px-1 py-1">
                          <input
                            type="number"
                            value={range.healGain}
                            onChange={(event) => updateManualRange(index, "healGain", Number(event.target.value) || 0)}
                            className={`${inputClass} text-center`}
                          />
                        </td>
                        <td className="border border-slate-800 px-1 py-1">
                          <button
                            type="button"
                            className={dangerButtonClass}
                            onClick={() => removeManualRange(index)}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="text-xs text-slate-400">
                Start and end always refer to total level. Transcript imports can still bring in class scaling totals,
                but manual replacement values like Levels `Overdrive%` should go in Stage Stat Replacements above.
              </p>
            </div>
          ) : null}
        </section>
      </div>

      <datalist id="stat-fix-stat-names">
        {additionalStageStatNames.map((statName) => (
          <option key={statName} value={statName} />
        ))}
      </datalist>
    </div>
  )
}
