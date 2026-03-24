"use client"

import { useEffect, useState, type ReactNode } from "react"
import { computeBuildStatStages, readBuildSnapshot } from "@/app/lib/buildStats"
import { BUILD_SNAPSHOT_UPDATED_EVENT } from "@/app/lib/buildEvents"
import { calculateHealing, type HealingCalcResult } from "@/app/lib/healingCalc"
import {
  healingBaseStats,
  healingCalcSkillPresets,
  type HealingBaseStat,
} from "@/app/lib/healingCalcSkillPresets"

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
    { label: "Flat Heal", value: formatTooltipValue(result.skillFlatHeal, 0) },
    { label: "Raw Heal", value: formatTooltipValue(result.breakdown.baseHealRaw, 2) },
    { label: "Rounded Heal", value: formatTooltipValue(result.breakdown.roundedBaseHeal, 0) },
  ]
}

function buildNonCritHealRows(result: HealingCalcResult): TooltipRow[] {
  const rows = buildHealingBaseRows(result)

  if (!result.canCrit) {
    rows.push({ label: "Can Crit Heal", value: "No" })
  }

  rows.push({ label: "Non-Crit Heal", value: formatTooltipValue(result.nonCrit, 0) })
  return rows
}

function buildCritHealRows(result: HealingCalcResult): TooltipRow[] {
  const rows = buildHealingBaseRows(result)

  if (!result.canCrit) {
    rows.push({ label: "Can Crit Heal", value: "No" })
    rows.push({ label: "Crit Heal", value: formatTooltipValue(result.crit, 0) })
    return rows
  }

  rows.push({ label: "Crit DMG%", value: formatPercent(result.critDamagePercent) })
  rows.push({ label: "Crit Multiplier", value: formatMultiplier(result.breakdown.critMultiplier) })
  rows.push({ label: "Crit Heal", value: formatTooltipValue(result.crit, 0) })

  return rows
}

function buildMaxCritHealRows(result: HealingCalcResult): TooltipRow[] {
  const rows = buildHealingBaseRows(result)

  if (!result.canCrit) {
    rows.push({ label: "Can Crit Heal", value: "No" })
    rows.push({ label: "Max Crit Heal", value: formatTooltipValue(result.maxcrit, 0) })
    return rows
  }

  rows.push({ label: "Crit Heal", value: formatTooltipValue(result.crit, 0) })
  rows.push({ label: "Overdrive%", value: formatPercent(result.overdrivePercent) })
  rows.push({ label: "Overdrive Mult", value: formatMultiplier(result.breakdown.overdriveMultiplier) })
  rows.push({ label: "Max Crit Heal", value: formatTooltipValue(result.maxcrit, 0) })

  return rows
}

function buildAverageHealRows(result: HealingCalcResult): TooltipRow[] {
  const rows = buildHealingBaseRows(result)

  if (!result.canCrit) {
    rows.push({ label: "Can Crit Heal", value: "No" })
    rows.push({ label: "Average Heal", value: formatTooltipValue(result.average, 0) })
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

  return rows
}

export default function HealingPage() {
  const [selectedSkill, setSelectedSkill] = useState("")
  const [baseStat, setBaseStat] = useState<HealingBaseStat>("HEAL")
  const [skillHealPercent, setSkillHealPercent] = useState(0)
  const [skillFlatHeal, setSkillFlatHeal] = useState(0)
  const [critChancePercent, setCritChancePercent] = useState(0)
  const [critDamagePercent, setCritDamagePercent] = useState(0)
  const [overdrivePercent, setOverdrivePercent] = useState(0)
  const [canCrit, setCanCrit] = useState(true)
  const [effectiveStat, setEffectiveStat] = useState(0)
  const [totalStat, setTotalStat] = useState(0)
  const [threatPercent, setThreatPercent] = useState(0)
  const [statSnapshot, setStatSnapshot] = useState<HealingStatSnapshot>({ effective: {}, total: {} })
  const selectedSkillPreset = healingCalcSkillPresets.find((preset) => preset.name === selectedSkill) ?? null

  const healingResult = calculateHealing({
    baseStat,
    totalStat,
    skillHealPercent,
    skillFlatHeal,
    critChancePercent,
    critDamagePercent,
    overdrivePercent,
    canCrit,
  })
  const { nonCrit: baseHeal, crit: critHeal, maxcrit: maxCritHeal, average } = healingResult
  const formatHeal = (value: number) => value.toLocaleString("en-US")

  useEffect(() => {
    const refreshStats = () => {
      const snapshot = readBuildSnapshot(localStorage)
      const stages = computeBuildStatStages(snapshot)

      setStatSnapshot({
        effective: stages.StatsBase,
        total: stages.StatsDmgReady,
      })
    }

    window.dispatchEvent(new Event("computeDmgReadyStats"))
    refreshStats()

    const eventNames = [
      BUILD_SNAPSHOT_UPDATED_EVENT,
      "talentsUpdated",
      "equipmentUpdated",
      "runesUpdated",
    ]

    for (const eventName of eventNames) {
      window.addEventListener(eventName, refreshStats)
    }

    return () => {
      for (const eventName of eventNames) {
        window.removeEventListener(eventName, refreshStats)
      }
    }
  }, [])

  useEffect(() => {
    setEffectiveStat(statSnapshot.effective[baseStat] ?? statSnapshot.total[baseStat] ?? 0)
    setTotalStat(statSnapshot.total[baseStat] ?? statSnapshot.effective[baseStat] ?? 0)
  }, [baseStat, statSnapshot])

  useEffect(() => {
    setCritChancePercent(statSnapshot.total["Crit Chance%"] ?? 0)
    setCritDamagePercent(statSnapshot.total["Crit DMG%"] ?? 0)
    setOverdrivePercent(statSnapshot.total["Overdrive%"] ?? 0)
  }, [statSnapshot])

  const handleSkillChange = (nextSkill: string) => {
    setSelectedSkill(nextSkill)

    if (!nextSkill) {
      return
    }

    const preset = healingCalcSkillPresets.find((entry) => entry.name === nextSkill)

    if (!preset) {
      return
    }

    setBaseStat(preset.baseStat)
    setSkillHealPercent(preset.skillHealPercent)
    setSkillFlatHeal(preset.skillFlatHeal)
    setThreatPercent(preset.threatPercent)
    setCanCrit(preset.canCrit)
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-center">Healing Calculator</h1>

      <div className="rounded-lg border bg-slate-900/60 p-4">
        <div className="grid items-stretch gap-4 md:grid-cols-[minmax(0,18rem)_1fr]">
          <div className="flex h-full items-center">
            <select
              value={selectedSkill}
              onChange={(event) => handleSkillChange(event.target.value)}
              className="w-full p-1 border rounded"
            >
              <option value="">Custom Skill</option>
              {healingCalcSkillPresets.map((preset) => (
                <option key={preset.name} value={preset.name}>
                  {preset.name}
                </option>
              ))}
            </select>
          </div>

          {selectedSkillPreset ? (
            <div className="flex h-full flex-col justify-center space-y-2">
              <p className="text-sm text-slate-100">{selectedSkillPreset.description}</p>
            </div>
          ) : (
            <div className="flex h-full flex-col justify-center space-y-2">
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
              setSelectedSkill("")
              setBaseStat(event.target.value as HealingBaseStat)
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
              setSelectedSkill("")
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
              setSelectedSkill("")
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
              setSelectedSkill("")
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
            onChange={e => setCritChancePercent(+e.target.value)}
            className="w-full p-1 border rounded"
          />
        </div>
        <div className="space-y-1">
          <label className="font-semibold">Crit DMG %</label>
          <input
            type="number"
            value={critDamagePercent}
            onChange={e => setCritDamagePercent(+e.target.value)}
            className="w-full p-1 border rounded"
          />
        </div>
        <div className="space-y-1">
          <label className="font-semibold">Overdrive %</label>
          <input
            type="number"
            value={overdrivePercent}
            onChange={e => setOverdrivePercent(+e.target.value)}
            className="w-full p-1 border rounded"
          />
        </div>
        <div className="space-y-1">
          <label className="font-semibold">Effective {baseStat}</label>
          <input
            type="number"
            value={effectiveStat}
            onChange={e => setEffectiveStat(+e.target.value)}
            className="w-full p-1 border rounded"
          />
        </div>
        <div className="space-y-1">
          <label className="font-semibold">Total {baseStat} (Buffed)</label>
          <input
            type="number"
            value={totalStat}
            onChange={e => setTotalStat(+e.target.value)}
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
                setSelectedSkill("")
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
