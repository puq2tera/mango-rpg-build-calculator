"use client"

import { useEffect, useState } from "react"
import { computeBuildStatStages, readBuildSnapshot } from "@/app/lib/buildStats"
import { BUILD_SNAPSHOT_UPDATED_EVENT } from "@/app/lib/buildEvents"
import {
  healingBaseStats,
  healingCalcSkillPresets,
  type HealingBaseStat,
} from "@/app/lib/healingCalcSkillPresets"

type HealingStatSnapshot = {
  effective: Record<string, number>
  total: Record<string, number>
}

export default function HealingPage() {
  const [selectedSkill, setSelectedSkill] = useState("")
  const [baseStat, setBaseStat] = useState<HealingBaseStat>("HEAL")
  const [skillHealPercent, setSkillHealPercent] = useState(0)
  const [skillFlatHeal, setSkillFlatHeal] = useState(0)
  const [effectiveStat, setEffectiveStat] = useState(0)
  const [totalStat, setTotalStat] = useState(0)
  const [threatPercent, setThreatPercent] = useState(0)
  const [statSnapshot, setStatSnapshot] = useState<HealingStatSnapshot>({ effective: {}, total: {} })
  const selectedSkillPreset = healingCalcSkillPresets.find((preset) => preset.name === selectedSkill) ?? null

  const calcAverageHeal = () => {
    const baseHeal = (totalStat * (skillHealPercent / 100)) + skillFlatHeal
    const critHeal = baseHeal * 1
    const average = baseHeal * (1 - 1) + critHeal * 1
    return { baseHeal, critHeal, average }
  }

  const { baseHeal, critHeal, average } = calcAverageHeal()
  const formatHeal = (value: number) => Math.round(value).toLocaleString("en-US")

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

      <div className="grid grid-cols-4 gap-4 bg-slate-900/60 border rounded-lg p-4">
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
      </div>

      <div className="grid grid-cols-3 gap-4 bg-slate-900 border rounded-lg p-4 text-center">
        <div className="space-y-1">
          <h2 className="font-bold">Non-Crit Heal</h2>
          <p>{formatHeal(baseHeal)}</p>
        </div>
        <div className="space-y-1">
          <h2 className="font-bold">Crit Heal</h2>
          <p>{formatHeal(critHeal)}</p>
        </div>
        <div className="space-y-1">
          <h2 className="font-bold">Average Heal</h2>
          <p>{formatHeal(average)}</p>
        </div>
      </div>
    </div>
  )
}
