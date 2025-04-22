"use client"

import { useState } from "react"

const statOptions = ["ATK", "MATK", "HEAL", "DEF"]

export default function HealingPage() {
  const [baseStat, setBaseStat] = useState("HEAL")
  const [skillHealPercent, setSkillHealPercent] = useState(0)
  const [skillFlatHeal, setSkillFlatHeal] = useState(0)
  const [effectiveStat, setEffectiveStat] = useState(0)
  const [totalStat, setTotalStat] = useState(0)
  const [threatPercent, setThreatPercent] = useState(0)
  const [critChance, setCritChance] = useState(0.2)

  const calcAverageHeal = () => {
    const baseHeal = (totalStat * (skillHealPercent / 100)) + skillFlatHeal
    const critHeal = baseHeal * 1
    const average = baseHeal * (1 - critChance) + critHeal * critChance
    return { baseHeal, critHeal, average }
  }

  const { baseHeal, critHeal, average } = calcAverageHeal()

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-center">Healing Calculator</h1>
      <div className="grid grid-cols-4 gap-4 bg-gray-50 border rounded-lg p-4">
        <div className="space-y-1">
          <label className="font-semibold">Base Stat</label>
          <select value={baseStat} onChange={e => setBaseStat(e.target.value)} className="w-full p-1 border rounded">
            {statOptions.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="font-semibold">Skill Heal %</label>
          <input
            type="number"
            value={skillHealPercent}
            onChange={e => setSkillHealPercent(+e.target.value)}
            className="w-full p-1 border rounded"
          />
        </div>
        <div className="space-y-1">
          <label className="font-semibold">Skill Flat Heal</label>
          <input
            type="number"
            value={skillFlatHeal}
            onChange={e => setSkillFlatHeal(+e.target.value)}
            className="w-full p-1 border rounded"
          />
        </div>
        <div className="space-y-1">
          <label className="font-semibold">Threat %</label>
          <input
            type="number"
            value={threatPercent}
            onChange={e => setThreatPercent(+e.target.value)}
            className="w-full p-1 border rounded"
          />
        </div>
        <div className="space-y-1">
          <label className="font-semibold">Effective Stat</label>
          <input
            type="number"
            value={effectiveStat}
            onChange={e => setEffectiveStat(+e.target.value)}
            className="w-full p-1 border rounded"
          />
        </div>
        <div className="space-y-1">
          <label className="font-semibold">Total Stat (Buffed)</label>
          <input
            type="number"
            value={totalStat}
            onChange={e => setTotalStat(+e.target.value)}
            className="w-full p-1 border rounded"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 bg-white border rounded-lg p-4 text-center">
        <div className="space-y-1">
          <h2 className="font-bold">Non-Crit Heal</h2>
          <p>{Math.round(baseHeal).toLocaleString()}</p>
        </div>
        <div className="space-y-1">
          <h2 className="font-bold">Crit Heal</h2>
          <p>{Math.round(critHeal).toLocaleString()}</p>
        </div>
        <div className="space-y-1">
          <h2 className="font-bold">Average Heal</h2>
          <p>{Math.round(average).toLocaleString()}</p>
        </div>
      </div>
    </div>
  )
}
