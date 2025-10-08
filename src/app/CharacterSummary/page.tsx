"use client"

import { useEffect, useState } from "react"

export default function CharacterSummary() {
  const [talentStats, setTalentStats] = useState<Record<string, number>>({})
  const [equipStats, setEquipStats] = useState<Record<string, number>>({})
  const [dmgStats, setDmgStats] = useState<Record<string, number>>({})


  useEffect(() => {
    window.dispatchEvent(new Event("talentsUpdated"))
    window.dispatchEvent(new Event("equipmentUpdated"))
    window.dispatchEvent(new Event("computeDmgReadyStats"))
    

    const rawTalents = localStorage.getItem("StatsTalents")
    const rawEquip = localStorage.getItem("StatsEquipment")
    const rawDmgReady = localStorage.getItem("StatsDmgReady")

    try {
      if (rawTalents) setTalentStats(JSON.parse(rawTalents))
      if (rawEquip) setEquipStats(JSON.parse(rawEquip))
      if (rawDmgReady) setDmgStats(JSON.parse(rawDmgReady))
    } catch {}
  }, [])

  const statStyle = (value: number) =>
    `border px-2 py-1 ${value === 0 ? "bg-gray-200 text-gray-400" : ""}`

  const get = (stats: Record<string, number>, key: string, multiplier = 1) => ((stats[key] ?? 0) * multiplier).toFixed(0)

  const renderStatsTable = (title: string, stats: Record<string, number>) => (
    <div className="overflow-x-auto space-y-4 whitespace-nowrap">
      <h1 className="text-xl font-bold">{title}</h1>
      <table className="table-fixed border-separate border-spacing-1 text-sm">
        <thead>
          <tr className="font-bold text-center">
            {["ATK", "DEF", "MATK", "HEAL", "HP"].map((stat, i) => (
              <th key={i} className={`px-2 py-1 ${["bg-red-200", "bg-green-200", "bg-blue-200", "bg-pink-200", "bg-green-200"][i]}`}>{stat}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="text-center">
            {["ATK", "DEF", "MATK", "HEAL", "HP"].map(stat => (
              <td key={stat} className={statStyle(stats[stat] ?? 0)}>{get(stats, stat)}</td>
            ))}
          </tr>
          <tr className="font-bold text-center">
            {["ATK%", "DEF%", "MATK%", "HEAL%"].map((stat, i) => (
              <th key={i} className={`px-2 py-1 ${["bg-red-200", "bg-green-200", "bg-blue-200", "bg-pink-200"][i]}`}>{stat}</th>
            ))}
          </tr>
          <tr className="text-center">
            {["ATK%", "DEF%", "MATK%", "HEAL%"].map(stat => (
              <td key={stat} className={statStyle(stats[stat] ?? 0)}>{get(stats, stat, 100)}%</td>
            ))}
          </tr>
          <tr className="text-center font-bold">
            {["Global ATK%", "Global DEF%", "Global MATK%", "Global HEAL%"].map((stat, i) => (
              <th key={i} className={`px-2 py-1 ${["bg-red-200", "bg-green-200", "bg-blue-200", "bg-pink-200"][i]}`}>{stat}</th>
            ))}</tr>
          <tr className="text-center">
            {["Global ATK%", "Global DEF%", "Global MATK%", "Global HEAL%"].map(stat => (
              <td key={stat} className={statStyle(stats[stat] ?? 0)}>{get(stats, stat, 100)}%</td>
            ))}
          </tr>
        </tbody>
      </table>
      <table className="table-fixed border-separate border-spacing-1 text-sm">
        <thead>
          <tr className="font-bold text-center">
            {["Crit Chance%", "Crit DMG%", "Global DMG%", "Global HealEffect", "Damage Res", "Global HP%", "Extra Threat%", "Threat%"].map((stat, i) => (
              <th key={i} className="px-2 py-1 bg-gray-200">{stat}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="text-center">
            {["Crit Chance%", "Crit DMG%", "Global DMG%", "Global HealEffect", "Damage Res", "Global HP%", "Extra Threat%", "Threat%"].map(stat => (
              <td key={stat} className={statStyle(stats[stat] ?? 0)}>{get(stats, stat, 100)}%</td>
            ))}
          </tr>
        </tbody>
      </table>
      <table className="table-fixed border-separate border-spacing-1 text-sm">
        <thead>
          <tr className="font-bold text-center">
            <th className="px-2 py-1">Type</th>
            <th>Dmg%</th>
            <th>Pen%</th>
            <th>Res%</th>
            <th>xDmg%</th>
            <th>xPen%</th>
            <th>Skill%</th>
          </tr>
        </thead>
        <tbody>
          {["Blunt", "Pierce", "Slash", "Fire", "Water", "Lightning", "Wind", "Earth", "Toxic", "Neg", "Holy", "Void"].map(type => (
            <tr key={type} className="text-center">
              <td className="border px-2 py-1 text-left">{type}</td>
              <td className={statStyle(stats[`${type}%`] ?? 0)}>{get(stats, `${type}%`, 100)}%</td>
              <td className={statStyle(stats[`${type} Pen%`] ?? 0)}>{get(stats, `${type} Pen%`, 100)}%</td>
              <td className={statStyle(stats[`${type} Res%`] ?? 0)}>{get(stats, `${type} Res%`, 100)}%</td>
              <td className={statStyle(stats[`x${type}%`] ?? 0)}>{get(stats, `x${type}%`, 100)}%</td>
              <td className={statStyle(stats[`${type} xPen%`] ?? 0)}>{get(stats, `${type} xPen%`, 100)}%</td>
              <td className={statStyle(stats[`${type} Skill%`] ?? 0)}>{get(stats, `${type} Skill%`, 100)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Character Summary</h1>
      {renderStatsTable("Overall Stats", dmgStats)}
      {renderStatsTable("Stats from Talents", talentStats)}
      {renderStatsTable("Stats from Equipment", equipStats)}
    </div>
  )
}
