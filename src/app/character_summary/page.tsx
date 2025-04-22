"use client"

import { useEffect, useState } from "react"
import talent_data from "@/app/data/talent_data"

const STORAGE_KEY = "selectedTalents"

export default function TalentsPage() {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [totalStats, setTotalStats] = useState<Record<string, number>>({})
  const [conversions, setConversions] = useState<Record<string, { ratio: number, to: string }[]>>({})

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = new Set<string>(JSON.parse(stored))
        setSelected(parsed)
      } catch {}
    }
  }, [])

  useEffect(() => {
    const stats: Record<string, number> = {}
    const convs: Record<string, { ratio: number, to: string }[]> = {}
    for (const [name, data] of Object.entries(talent_data)) {
      if (!selected.has(name)) continue
      for (const [stat, value] of Object.entries(data.stats)) {
        stats[stat] = (stats[stat] || 0) + value
      }
      if (data.conversions) {
        for (const [source, conv] of Object.entries(data.conversions)) {
          if (!convs[source]) convs[source] = []
          convs[source].push({ ratio: conv.ratio, to: conv.resulting_stat })
        }
      }
    }
    setTotalStats(stats)
    setConversions(convs)
  }, [selected])

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Character Summary</h1>
      <div className="overflow-x-auto space-y-4 whitespace-nowrap">
  
        {/* Primary Stats */}
        <table className="table-fixed border-separate border-spacing-1 text-sm">
          <thead>
            <tr className="font-bold text-center">
              {["ATK", "DEF", "MATK", "HEAL", "HP", "HP Regen", "MP", "MP Regen"].map((stat, i) => (
                <th key={i} className={`px-2 py-1 ${
                  ["bg-red-200", "bg-green-200", "bg-purple-200", "bg-pink-200",
                   "bg-lime-300", "bg-lime-100", "bg-cyan-300", "bg-cyan-100"][i]
                }`}>
                  {stat}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="text-center">
              {["ATK", "DEF", "MATK", "HEAL", "HP", "HP Regen", "MP", "MP Regen"].map(stat => (
                <td key={stat} className="border px-2 py-1">{totalStats[stat] ?? 0}</td>
              ))}
            </tr>
          </tbody>
        </table>
  
        {/* Percent Stats */}
        <table className="table-fixed border-separate border-spacing-1 text-sm">
          <thead>
            <tr className="font-bold text-center">
              {["ATK%", "DEF%", "MATK%", "HEAL%", "Crit Chance%", "Crit DMG%", "Focus", "Focus Regen"].map((stat, i) => (
                <th key={i} className={`px-2 py-1 ${
                  ["bg-red-100", "bg-green-100", "bg-purple-100", "bg-pink-100",
                   "bg-orange-200", "bg-orange-300", "bg-yellow-200", "bg-yellow-100"][i]
                }`}>
                  {stat}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="text-center">
              {["ATK%", "DEF%", "MATK%", "HEAL%", "Crit Chance%", "Crit DMG%", "Focus", "Focus Regen"].map(stat => (
                <td key={stat} className="border px-2 py-1">{((totalStats[stat] ?? 0) * 100).toFixed(0)}%</td>
              ))}
            </tr>
          </tbody>
        </table>
  
        {/* Global Mods */}
        <table className="table-fixed border-separate border-spacing-1 text-sm">
          <thead>
            <tr className="font-bold text-center">
              {["GATK%", "GDEF%", "GMATK%", "GHEAL%", "GDMG%", "GHEAL Bonus", "Damage Res", "Extra Threat%", "Threat%"].map((stat, i) => (
                <th key={i} className={`px-2 py-1 ${
                  ["bg-red-100", "bg-green-100", "bg-purple-100", "bg-pink-100",
                   "bg-rose-400", "bg-indigo-100", "bg-slate-400", "bg-green-100", "bg-green-200"][i]
                }`}>
                  {stat}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="text-center">
              {["GATK%", "GDEF%", "GMATK%", "GHEAL%", "GDMG%", "GHEAL Bonus", "Damage Res", "Extra Threat%", "Threat%"].map(stat => (
                <td key={stat} className="border px-2 py-1">{((totalStats[stat] ?? 0) * 100).toFixed(0)}%</td>
              ))}
            </tr>
          </tbody>
        </table>
  
        {/* Elemental + Physical Damage */}
        <table className="table-fixed border-separate border-spacing-1 text-sm">
          <thead>
            <tr className="font-bold text-center">
              <th className="text-left bg-gray-100">Type</th>
              <th>DMG</th>
              <th>Pen</th>
              <th>Res</th>
              <th>%</th>
            </tr>
          </thead>
          <tbody>
            {[
              "Physical", "Slash", "Pierce", "Blunt",
              "Fire", "Water", "Lightning", "Wind",
              "Earth", "Toxic", "Neg", "Holy", "Void"
            ].map((type) => (
              <tr key={type} className="text-center">
                <td className="border px-2 py-1 text-left">{type}</td>
                <td className="border px-2 py-1">{((totalStats[`${type} DMG`] ?? 0) * 100).toFixed(0)}%</td>
                <td className="border px-2 py-1">{((totalStats[`${type} Pen%`] ?? 0) * 100).toFixed(0)}%</td>
                <td className="border px-2 py-1">{((totalStats[`${type} Res%`] ?? 0) * 100).toFixed(0)}%</td>
                <td className="border px-2 py-1">{((totalStats[`${type}%`] ?? 0) * 100).toFixed(0)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
  
        {/* Conversions */}
        {Object.entries(conversions).map(([from, targets]) => {
          const base = totalStats[from] ?? 0
          return (
            <div key={from} className="text-sm">
              <div className="font-mono text-base">◘ {from} : {base.toLocaleString()}</div>
              {targets.map((entry, idx) => {
                const result = base * entry.ratio
                return (
                  <div key={idx} className="ml-6 font-mono">
                    ⇒  {(entry.ratio * 100).toFixed(0)}%  ⇒  {Math.round(result).toLocaleString()} {entry.to}
                  </div>
                )
              })}
            </div>
          )
        })}

        {/* Misc */}
        {"Fire Skill%" in totalStats && (
          <div className="flex gap-2 text-sm">
            <span className="font-mono">Fire Skill%</span>
            <span className="font-bold">{((totalStats["Fire Skill%"] ?? 0) * 100).toFixed(0)}%</span>
          </div>
        )}
      </div>
    </div>
  )
  
  
  
}
