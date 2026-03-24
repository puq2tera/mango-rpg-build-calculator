"use client"

import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react"
import { computeBuildStatStages, readBuildSnapshot } from "@/app/lib/buildStats"
import { BUILD_SNAPSHOT_UPDATED_EVENT } from "@/app/lib/buildEvents"
import {
  calculateHealing,
  defaultHealingCalcState,
  persistHealingCalcState,
  readHealingCalcState,
  type HealingCalcManualOverrides,
  type HealingCalcResult,
} from "@/app/lib/healingCalc"
import { getThreatBonusMultiplier } from "@/app/lib/threat"
import {
  healingBaseStats,
  healingCalcSkillPresets,
  type HealingBaseStat,
} from "@/app/lib/healingCalcSkillPresets"

const HEALING_PRESET_LISTBOX_ID = "healing-calc-skill-presets"

function normalizeSearchValue(value: string): string {
  return value.trim().toLocaleLowerCase()
}

type HealingStatSnapshot = {
  effective: Record<string, number>
  total: Record<string, number>
}

type TooltipRow = {
  label: string
  value: string
}

type TooltipValueProps = {
  children: ReactNode
  title: string
  rows: TooltipRow[]
}

function TooltipValue({ children, title, rows }: TooltipValueProps) {
  return (
    <span
      tabIndex={0}
      className="group relative inline-flex cursor-help font-mono tabular-nums underline decoration-dotted underline-offset-2 outline-none"
    >
      <span>{children}</span>
      <span className="pointer-events-none invisible absolute bottom-full left-1/2 z-20 mb-2 w-max min-w-[18rem] max-w-[24rem] -translate-x-1/2 rounded-lg border border-slate-700 bg-slate-950/95 px-3 py-2 text-left text-[11px] leading-4 text-slate-100 opacity-0 shadow-[0_18px_40px_rgba(2,6,23,0.55)] transition group-hover:visible group-hover:opacity-100 group-focus-visible:visible group-focus-visible:opacity-100">
        <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-300">{title}</span>
        <span className="grid grid-cols-[max-content_max-content] gap-x-3 gap-y-1">
          {rows.map((row, index) => (
            <span key={`${row.label}-${index}`} className="contents">
              <span className="text-slate-400">{row.label}</span>
              <span className="text-right text-slate-100">{row.value}</span>
            </span>
          ))}
        </span>
      </span>
    </span>
  )
}

function formatPercent(value: number, maximumFractionDigits = 2): string {
  return `${value.toLocaleString("en-US", { maximumFractionDigits })}%`
}

function formatMultiplier(value: number, maximumFractionDigits = 4): string {
  return `x${value.toLocaleString("en-US", { maximumFractionDigits })}`
}

function formatTooltipValue(value: number, maximumFractionDigits = 2): string {
  return value.toLocaleString("en-US", { maximumFractionDigits })
}

function buildHealingBaseRows(result: HealingCalcResult): TooltipRow[] {
  return [
    { label: `Total ${result.baseStat}`, value: formatTooltipValue(result.totalStat, 0) },
    { label: "Skill Heal%", value: formatPercent(result.skillHealPercent) },
    { label: "Flat Heal", value: formatTooltipValue(result.breakdown.flatHeal, 0) },
    { label: "Scaling Heal Raw", value: formatTooltipValue(result.breakdown.scalingHealRaw, 2) },
    { label: "Scaling Heal", value: formatTooltipValue(result.breakdown.scalingHeal, 0) },
    { label: "Final Non-Crit Heal", value: formatTooltipValue(result.nonCrit, 0) },
  ]
}

function appendThreatRows(rows: TooltipRow[], title: string, threatAmount: number, result: HealingCalcResult): void {
  rows.push({ label: `${title} Threat`, value: formatTooltipValue(threatAmount, 0) })
  rows.push({ label: "Threat Base Mult", value: formatMultiplier(result.threatBreakdown.baseThreatMultiplier, 0) })
  rows.push({ label: "Threat Skill%", value: formatPercent(result.threatBreakdown.skillThreatPercent) })
  rows.push({ label: "Threat Bonus Mult", value: formatMultiplier(result.threatBreakdown.bonusThreatMultiplier) })
}

function buildNonCritHealRows(result: HealingCalcResult): TooltipRow[] {
  const rows = buildHealingBaseRows(result)

  if (!result.canCrit) {
    rows.push({ label: "Can Crit Heal", value: "No" })
  }

  appendThreatRows(rows, "Non-Crit", result.threatNonCrit, result)
  return rows
}

function buildCritHealRows(result: HealingCalcResult): TooltipRow[] {
  const rows = buildHealingBaseRows(result)

  if (!result.canCrit) {
    rows.push({ label: "Can Crit Heal", value: "No" })
    rows.push({ label: "Crit Heal", value: formatTooltipValue(result.crit, 0) })
    appendThreatRows(rows, "Crit", result.threatCrit, result)
    return rows
  }

  rows.push({ label: "Crit DMG%", value: formatPercent(result.critDamagePercent) })
  rows.push({ label: "Crit Bonus%", value: formatPercent(result.breakdown.critBonusPercent) })
  rows.push({ label: "Crit Multiplier", value: formatMultiplier(result.breakdown.critMultiplier) })
  rows.push({ label: "Crit Heal", value: formatTooltipValue(result.crit, 0) })
  appendThreatRows(rows, "Crit", result.threatCrit, result)

  return rows
}

function buildMaxCritHealRows(result: HealingCalcResult): TooltipRow[] {
  const rows = buildHealingBaseRows(result)

  if (!result.canCrit) {
    rows.push({ label: "Can Crit Heal", value: "No" })
    rows.push({ label: "Max Crit Heal", value: formatTooltipValue(result.maxcrit, 0) })
    appendThreatRows(rows, "Max Crit", result.threatMaxcrit, result)
    return rows
  }

  rows.push({ label: "Crit Heal", value: formatTooltipValue(result.crit, 0) })
  rows.push({ label: "Overdrive%", value: formatPercent(result.overdrivePercent) })
  rows.push({ label: "Overdrive Mult", value: formatMultiplier(result.breakdown.overdriveMultiplier) })
  rows.push({ label: "Max Crit Heal", value: formatTooltipValue(result.maxcrit, 0) })
  appendThreatRows(rows, "Max Crit", result.threatMaxcrit, result)

  return rows
}

function buildAverageHealRows(result: HealingCalcResult): TooltipRow[] {
  const rows = buildHealingBaseRows(result)

  if (!result.canCrit) {
    rows.push({ label: "Can Crit Heal", value: "No" })
    rows.push({ label: "Average Heal", value: formatTooltipValue(result.average, 0) })
    rows.push({ label: "Threat Avg", value: formatTooltipValue(result.threatAverage, 0) })
    return rows
  }

  rows.push({ label: "Crit Chance%", value: formatPercent(result.critChancePercent) })
  rows.push({ label: "Effective Crit%", value: formatPercent(result.breakdown.effectiveCritChancePercent) })
  rows.push({ label: "Crit DMG%", value: formatPercent(result.critDamagePercent) })
  rows.push({ label: "Overdrive%", value: formatPercent(result.overdrivePercent) })
  rows.push({ label: "Non-Crit Share", value: formatPercent(result.breakdown.nonCritWeight * 100) })
  rows.push({ label: "Crit Share", value: formatPercent(result.breakdown.critWeight * 100) })
  rows.push({ label: "Max Crit Share", value: formatPercent(result.breakdown.maxCritWeight * 100) })
  rows.push({ label: "Non-Crit Heal", value: formatTooltipValue(result.nonCrit, 0) })
  rows.push({ label: "Crit Heal", value: formatTooltipValue(result.crit, 0) })
  rows.push({ label: "Max Crit Heal", value: formatTooltipValue(result.maxcrit, 0) })
  rows.push({ label: "Average Heal", value: formatTooltipValue(result.average, 0) })
  rows.push({ label: "Threat Avg", value: formatTooltipValue(result.threatAverage, 0) })

  return rows
}

export default function HealingPage() {
  const [isHydrated, setIsHydrated] = useState(false)
  const [selectedSkill, setSelectedSkill] = useState(defaultHealingCalcState.selectedSkill)
  const [skillInputValue, setSkillInputValue] = useState(defaultHealingCalcState.selectedSkill)
  const [isSkillDropdownOpen, setIsSkillDropdownOpen] = useState(false)
  const [highlightedSkillIndex, setHighlightedSkillIndex] = useState(0)
  const [baseStat, setBaseStat] = useState<HealingBaseStat>(defaultHealingCalcState.baseStat)
  const [skillHealPercent, setSkillHealPercent] = useState(defaultHealingCalcState.skillHealPercent)
  const [skillFlatHeal, setSkillFlatHeal] = useState(defaultHealingCalcState.skillFlatHeal)
  const [critChancePercent, setCritChancePercent] = useState(defaultHealingCalcState.critChancePercent)
  const [critDamagePercent, setCritDamagePercent] = useState(defaultHealingCalcState.critDamagePercent)
  const [overdrivePercent, setOverdrivePercent] = useState(defaultHealingCalcState.overdrivePercent)
  const [canCrit, setCanCrit] = useState(defaultHealingCalcState.canCrit)
  const [effectiveStat, setEffectiveStat] = useState(defaultHealingCalcState.effectiveStat)
  const [totalStat, setTotalStat] = useState(defaultHealingCalcState.totalStat)
  const [threatPercent, setThreatPercent] = useState(defaultHealingCalcState.threatPercent)
  const [manualOverrides, setManualOverrides] = useState<HealingCalcManualOverrides>(
    defaultHealingCalcState.manualOverrides,
  )
  const [statSnapshot, setStatSnapshot] = useState<HealingStatSnapshot>({ effective: {}, total: {} })
  const skillFieldRef = useRef<HTMLDivElement | null>(null)
  const selectedSkillPreset = useMemo(
    () => healingCalcSkillPresets.find((preset) => preset.name === selectedSkill) ?? null,
    [selectedSkill],
  )
  const normalizedSkillInputValue = normalizeSearchValue(skillInputValue)
  const normalizedSelectedSkill = normalizeSearchValue(selectedSkill)
  const normalizedSkillFilterValue =
    selectedSkill.length > 0 && normalizedSkillInputValue === normalizedSelectedSkill
      ? ""
      : normalizedSkillInputValue
  const filteredSkillPresets = useMemo(() => {
    return healingCalcSkillPresets.filter((preset) => {
      if (normalizedSkillFilterValue.length === 0) {
        return true
      }

      const searchableText = [
        preset.name,
        preset.description,
        preset.baseStat,
        preset.effectType,
        preset.canCrit ? "can crit" : "cannot crit",
      ].join("\n").toLocaleLowerCase()

      return searchableText.includes(normalizedSkillFilterValue)
    })
  }, [normalizedSkillFilterValue])

  const healingResult = calculateHealing({
    baseStat,
    totalStat,
    skillHealPercent,
    skillFlatHeal,
    critChancePercent,
    critDamagePercent,
    overdrivePercent,
    canCrit,
    threatPercent,
    threatBonusMultiplier: getThreatBonusMultiplier(statSnapshot.total),
  })
  const { nonCrit: baseHeal, crit: critHeal, maxcrit: maxCritHeal, average } = healingResult
  const formatHeal = (value: number) => value.toLocaleString("en-US")

  useEffect(() => {
    const storedState = readHealingCalcState(localStorage)
    const refreshStats = () => {
      const snapshot = readBuildSnapshot(localStorage)
      const stages = computeBuildStatStages(snapshot)

      setStatSnapshot({
        effective: stages.StatsBase,
        total: stages.StatsDmgReady,
      })
    }
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshStats()
      }
    }

    setSelectedSkill(storedState.selectedSkill)
    setSkillInputValue(storedState.selectedSkill)
    setBaseStat(storedState.baseStat)
    setSkillHealPercent(storedState.skillHealPercent)
    setSkillFlatHeal(storedState.skillFlatHeal)
    setCritChancePercent(storedState.critChancePercent)
    setCritDamagePercent(storedState.critDamagePercent)
    setOverdrivePercent(storedState.overdrivePercent)
    setCanCrit(storedState.canCrit)
    setEffectiveStat(storedState.effectiveStat)
    setTotalStat(storedState.totalStat)
    setThreatPercent(storedState.threatPercent)
    setManualOverrides(storedState.manualOverrides)

    window.dispatchEvent(new Event("computeDmgReadyStats"))
    refreshStats()

    const eventNames = [
      BUILD_SNAPSHOT_UPDATED_EVENT,
      "talentsUpdated",
      "equipmentUpdated",
      "runesUpdated",
      "focus",
    ]

    for (const eventName of eventNames) {
      window.addEventListener(eventName, refreshStats)
    }
    document.addEventListener("visibilitychange", handleVisibilityChange)
    setIsHydrated(true)

    return () => {
      for (const eventName of eventNames) {
        window.removeEventListener(eventName, refreshStats)
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [])

  useEffect(() => {
    if (!isHydrated) {
      return
    }

    if (!manualOverrides.effectiveStat) {
      setEffectiveStat(statSnapshot.effective[baseStat] ?? statSnapshot.total[baseStat] ?? 0)
    }

    if (!manualOverrides.totalStat) {
      setTotalStat(statSnapshot.total[baseStat] ?? statSnapshot.effective[baseStat] ?? 0)
    }
  }, [baseStat, isHydrated, manualOverrides.effectiveStat, manualOverrides.totalStat, statSnapshot])

  useEffect(() => {
    if (!isHydrated) {
      return
    }

    if (!manualOverrides.critChancePercent) {
      setCritChancePercent(statSnapshot.total["Crit Chance%"] ?? 0)
    }

    if (!manualOverrides.critDamagePercent) {
      setCritDamagePercent(statSnapshot.total["Crit DMG%"] ?? 0)
    }

    if (!manualOverrides.overdrivePercent) {
      setOverdrivePercent(statSnapshot.total["Overdrive%"] ?? 0)
    }
  }, [
    isHydrated,
    manualOverrides.critChancePercent,
    manualOverrides.critDamagePercent,
    manualOverrides.overdrivePercent,
    statSnapshot,
  ])

  useEffect(() => {
    if (!isHydrated) {
      return
    }

    persistHealingCalcState(localStorage, {
      selectedSkill,
      baseStat,
      skillHealPercent,
      skillFlatHeal,
      critChancePercent,
      critDamagePercent,
      overdrivePercent,
      canCrit,
      effectiveStat,
      totalStat,
      threatPercent,
      manualOverrides,
    })
  }, [
    baseStat,
    canCrit,
    critChancePercent,
    critDamagePercent,
    effectiveStat,
    isHydrated,
    manualOverrides,
    overdrivePercent,
    selectedSkill,
    skillFlatHeal,
    skillHealPercent,
    threatPercent,
    totalStat,
  ])

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Node)) {
        return
      }

      if (skillFieldRef.current?.contains(target)) {
        return
      }

      setIsSkillDropdownOpen(false)
    }

    document.addEventListener("mousedown", handlePointerDown)
    return () => {
      document.removeEventListener("mousedown", handlePointerDown)
    }
  }, [])

  useEffect(() => {
    if (filteredSkillPresets.length === 0) {
      setHighlightedSkillIndex(0)
      return
    }

    setHighlightedSkillIndex((current) => Math.min(current, filteredSkillPresets.length - 1))
  }, [filteredSkillPresets])

  const clearSelectedSkill = () => {
    setSelectedSkill("")
    setSkillInputValue("")
    setIsSkillDropdownOpen(false)
  }

  const resetBaseStatOverridesIfNeeded = (nextBaseStat: HealingBaseStat) => {
    if (nextBaseStat === baseStat) {
      return
    }

    setManualOverrides((current) => (
      current.effectiveStat || current.totalStat
        ? {
          ...current,
          effectiveStat: false,
          totalStat: false,
        }
        : current
    ))
  }

  const handleSkillChange = (nextSkill: string) => {
    setSkillInputValue(nextSkill)

    if (!nextSkill) {
      setSelectedSkill("")
      return
    }

    const preset = healingCalcSkillPresets.find((entry) => entry.name === nextSkill)

    if (!preset) {
      setSelectedSkill("")
      return
    }

    setSelectedSkill(nextSkill)
    resetBaseStatOverridesIfNeeded(preset.baseStat)
    setBaseStat(preset.baseStat)
    setSkillHealPercent(preset.skillHealPercent)
    setSkillFlatHeal(preset.skillFlatHeal)
    setThreatPercent(preset.threatPercent)
    setCanCrit(preset.canCrit)
    setIsSkillDropdownOpen(false)
  }

  const handleSkillInputChange = (nextValue: string) => {
    setSkillInputValue(nextValue)
    setIsSkillDropdownOpen(true)

    if (!nextValue) {
      setSelectedSkill("")
      return
    }

    const preset = healingCalcSkillPresets.find((entry) => entry.name === nextValue)
    if (!preset) {
      setSelectedSkill("")
      return
    }

    handleSkillChange(nextValue)
  }

  const handleSkillKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault()
      if (!isSkillDropdownOpen) {
        setIsSkillDropdownOpen(true)
        return
      }

      if (filteredSkillPresets.length > 0) {
        setHighlightedSkillIndex((current) => Math.min(current + 1, filteredSkillPresets.length - 1))
      }
      return
    }

    if (event.key === "ArrowUp") {
      event.preventDefault()
      if (!isSkillDropdownOpen) {
        setIsSkillDropdownOpen(true)
        return
      }

      if (filteredSkillPresets.length > 0) {
        setHighlightedSkillIndex((current) => Math.max(current - 1, 0))
      }
      return
    }

    if (event.key === "Enter" && isSkillDropdownOpen) {
      const highlightedPreset = filteredSkillPresets[highlightedSkillIndex]
      if (highlightedPreset) {
        event.preventDefault()
        handleSkillChange(highlightedPreset.name)
      }
      return
    }

    if (event.key === "Escape") {
      setIsSkillDropdownOpen(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-center">Healing Calculator</h1>

      <div className="rounded-lg border bg-slate-900/60 p-4">
        <div className="grid gap-x-4 gap-y-2 md:grid-cols-[minmax(0,18rem)_1fr]">
          <label className="font-semibold text-slate-100">Skill Preset</label>

          <div ref={skillFieldRef} className="relative">
            <div className="flex overflow-hidden rounded border bg-slate-950">
              <input
                type="text"
                value={skillInputValue}
                onChange={(event) => handleSkillInputChange(event.target.value)}
                onFocus={() => setIsSkillDropdownOpen(true)}
                onKeyDown={handleSkillKeyDown}
                placeholder="Custom Skill"
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={isSkillDropdownOpen}
                aria-controls={HEALING_PRESET_LISTBOX_ID}
                className="w-full bg-transparent p-1 outline-none"
              />
              <button
                type="button"
                onClick={() => setIsSkillDropdownOpen((current) => !current)}
                aria-label={isSkillDropdownOpen ? "Hide healing presets" : "Show healing presets"}
                aria-expanded={isSkillDropdownOpen}
                aria-controls={HEALING_PRESET_LISTBOX_ID}
                className="border-l border-slate-700 px-2 text-slate-300 transition hover:bg-slate-800 hover:text-slate-100"
              >
                v
              </button>
            </div>

            {isSkillDropdownOpen ? (
              <div
                id={HEALING_PRESET_LISTBOX_ID}
                role="listbox"
                className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded border border-slate-700 bg-slate-950 shadow-[0_18px_40px_rgba(2,6,23,0.45)]"
              >
                {filteredSkillPresets.length > 0 ? (
                  filteredSkillPresets.map((preset, index) => (
                    <button
                      key={preset.name}
                      type="button"
                      role="option"
                      aria-selected={preset.name === selectedSkill}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => handleSkillChange(preset.name)}
                      onMouseEnter={() => setHighlightedSkillIndex(index)}
                      className={`block w-full px-3 py-2 text-left text-sm transition ${
                        index === highlightedSkillIndex
                          ? "bg-sky-500/20 text-sky-100"
                          : preset.name === selectedSkill
                            ? "bg-slate-800 text-slate-100"
                            : "text-slate-200 hover:bg-slate-800"
                      }`}
                    >
                      <div className="font-medium">{preset.name}</div>
                      <div className="truncate text-xs text-slate-400">{preset.description}</div>
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-2 text-sm text-slate-400">
                    No presets match the current filter.
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {selectedSkillPreset ? (
            <div className="flex h-full flex-col justify-center space-y-2 md:col-start-2">
              <p className="text-sm text-slate-100">{selectedSkillPreset.description}</p>
            </div>
          ) : (
            <div className="flex h-full flex-col justify-center space-y-2 md:col-start-2">
              <p className="text-sm text-slate-100">Select a skill to autofill the fields below</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 rounded-lg border bg-slate-900/60 p-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="space-y-1">
          <label className="font-semibold">Base Stat</label>
          <select
            value={baseStat}
            onChange={(event) => {
              const nextBaseStat = event.target.value as HealingBaseStat
              clearSelectedSkill()
              resetBaseStatOverridesIfNeeded(nextBaseStat)
              setBaseStat(nextBaseStat)
            }}
            className="w-full p-1 border rounded"
          >
            {healingBaseStats.map((stat) => <option key={stat}>{stat}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="font-semibold">Skill Heal %</label>
          <input
            type="number"
            value={skillHealPercent}
            onChange={(event) => {
              clearSelectedSkill()
              setSkillHealPercent(+event.target.value)
            }}
            className="w-full p-1 border rounded"
          />
        </div>
        <div className="space-y-1">
          <label className="font-semibold">Skill Flat Heal</label>
          <input
            type="number"
            value={skillFlatHeal}
            onChange={(event) => {
              clearSelectedSkill()
              setSkillFlatHeal(+event.target.value)
            }}
            className="w-full p-1 border rounded"
          />
        </div>
        <div className="space-y-1">
          <label className="font-semibold">Threat %</label>
          <input
            type="number"
            value={threatPercent}
            onChange={(event) => {
              clearSelectedSkill()
              setThreatPercent(+event.target.value)
            }}
            className="w-full p-1 border rounded"
          />
        </div>
        <div className="space-y-1">
          <label className="font-semibold">Crit Chance %</label>
          <input
            type="number"
            value={critChancePercent}
            onChange={(event) => {
              setManualOverrides((current) => (
                current.critChancePercent
                  ? current
                  : {
                    ...current,
                    critChancePercent: true,
                  }
              ))
              setCritChancePercent(+event.target.value)
            }}
            className="w-full p-1 border rounded"
          />
        </div>
        <div className="space-y-1">
          <label className="font-semibold">Crit DMG %</label>
          <input
            type="number"
            value={critDamagePercent}
            onChange={(event) => {
              setManualOverrides((current) => (
                current.critDamagePercent
                  ? current
                  : {
                    ...current,
                    critDamagePercent: true,
                  }
              ))
              setCritDamagePercent(+event.target.value)
            }}
            className="w-full p-1 border rounded"
          />
        </div>
        <div className="space-y-1">
          <label className="font-semibold">Overdrive %</label>
          <input
            type="number"
            value={overdrivePercent}
            onChange={(event) => {
              setManualOverrides((current) => (
                current.overdrivePercent
                  ? current
                  : {
                    ...current,
                    overdrivePercent: true,
                  }
              ))
              setOverdrivePercent(+event.target.value)
            }}
            className="w-full p-1 border rounded"
          />
        </div>
        <div className="space-y-1">
          <label className="font-semibold">Effective {baseStat}</label>
          <input
            type="number"
            value={effectiveStat}
            onChange={(event) => {
              setManualOverrides((current) => (
                current.effectiveStat
                  ? current
                  : {
                    ...current,
                    effectiveStat: true,
                  }
              ))
              setEffectiveStat(+event.target.value)
            }}
            className="w-full p-1 border rounded"
          />
        </div>
        <div className="space-y-1">
          <label className="font-semibold">Total {baseStat} (Buffed)</label>
          <input
            type="number"
            value={totalStat}
            onChange={(event) => {
              setManualOverrides((current) => (
                current.totalStat
                  ? current
                  : {
                    ...current,
                    totalStat: true,
                  }
              ))
              setTotalStat(+event.target.value)
            }}
            className="w-full p-1 border rounded"
          />
        </div>
        <label className="space-y-1">
          <span className="font-semibold">Can Crit Heal</span>
          <span className="flex h-[34px] items-center rounded border px-3">
            <input
              type="checkbox"
              checked={canCrit}
              onChange={(event) => {
                clearSelectedSkill()
                setCanCrit(event.target.checked)
              }}
              className="h-4 w-4"
            />
          </span>
        </label>
      </div>

      <div className="grid gap-4 rounded-lg border bg-slate-900 p-4 text-center sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1">
          <h2 className="font-bold">Non-Crit Heal</h2>
          <p>
            <TooltipValue title="Non-Crit Heal Inputs" rows={buildNonCritHealRows(healingResult)}>
              {formatHeal(baseHeal)}
            </TooltipValue>
          </p>
        </div>
        <div className="space-y-1">
          <h2 className="font-bold">Crit Heal</h2>
          <p>
            <TooltipValue title="Crit Heal Inputs" rows={buildCritHealRows(healingResult)}>
              {formatHeal(critHeal)}
            </TooltipValue>
          </p>
        </div>
        <div className="space-y-1">
          <h2 className="font-bold">Max Crit Heal</h2>
          <p>
            <TooltipValue title="Max Crit Heal Inputs" rows={buildMaxCritHealRows(healingResult)}>
              {formatHeal(maxCritHeal)}
            </TooltipValue>
          </p>
        </div>
        <div className="space-y-1">
          <h2 className="font-bold">Average Heal</h2>
          <p>
            <TooltipValue title="Average Heal Inputs" rows={buildAverageHealRows(healingResult)}>
              {formatHeal(average)}
            </TooltipValue>
          </p>
        </div>
      </div>
    </div>
  )
}
