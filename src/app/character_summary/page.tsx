"use client"

import { useEffect, useState } from "react"
import talent_data from "@/app/data/talent_data"

const STORAGE_KEY = "selectedTalents"

export default function TalentsPage() {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [totalStats, setTotalStats] = useState<Record<string, number>>({})

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
    for (const [name, data] of Object.entries(talent_data)) {
      if (!selected.has(name)) continue
      for (const [stat, value] of Object.entries(data.stats)) {
        stats[stat] = (stats[stat] || 0) + value
      }
    }
    setTotalStats(stats)
  }, [selected])

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Character Summary</h1>

      <h1 className="text-xl font-bold">Stats from Talents</h1>
      <div className="overflow-x-auto space-y-4">

        {/* Primary Stats */}
        <table className="table-auto border-separate border-spacing-1 text-sm">
          <thead>
            <tr className="text-center font-bold">
              {["ATK", "DEF", "MATK", "HEAL", "HP", "HP Regen", "MP", "MP Regen"].map((label, i) => (
                <th key={i} className={`px-2 py-1 ${
                  ["bg-red-200", "bg-green-200", "bg-purple-200", "bg-pink-200",
                   "bg-lime-300", "bg-lime-100", "bg-cyan-300", "bg-cyan-100"][i]
                }`}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="text-center">
              {["ATK", "DEF", "MATK", "HEAL", "HP", "HP Regen", "MP", "MP Regen"].map((stat) => (
                <td key={stat} className="border px-2 py-1">{totalStats[stat] ?? 0}</td>
              ))}
            </tr>
          </tbody>
        </table>
  
        {/* Percent-based Offense/Support */}
        <table className="table-auto border-separate border-spacing-1 text-sm">
          <thead>
            <tr className="text-center font-bold">
              {["ATK%", "DEF%", "MATK%", "HEAL%", "Crit Chance", "Crit DMG%", "Focus", "Focus Regen"].map((label, i) => (
                <th key={i} className={`px-2 py-1 ${
                  ["bg-red-100", "bg-green-100", "bg-purple-100", "bg-pink-100",
                   "bg-orange-200", "bg-orange-300", "bg-yellow-200", "bg-yellow-100"][i]
                }`}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="text-center">
              {["ATK%", "DEF%", "MATK%", "HEAL%", "Crit Chance", "Crit DMG%", "Focus", "Focus Regen"].map((stat) => (
                <td key={stat} className="border px-2 py-1">{((totalStats[stat] ?? 0) * 100).toFixed(0)}%</td>
              ))}
            </tr>
          </tbody>
        </table>
  
        {/* Global Modifiers + Extra Threat% */}
        <table className="table-auto border-separate border-spacing-1 text-sm">
          <thead>
            <tr className="text-center font-bold">
              {["GATK%", "GDEF%", "GMATK%", "GHEAL%", "GDMG%", "GHEAL Bonus", "Damage Res", "Extra Threat%"].map((label, i) => (
                <th key={i} className={`px-2 py-1 ${
                  ["bg-red-100", "bg-green-100", "bg-purple-100", "bg-pink-100",
                   "bg-rose-400", "bg-indigo-100", "bg-slate-400", "bg-green-100"][i]
                }`}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="text-center">
              {["GATK%", "GDEF%", "GMATK%", "GHEAL%", "GDMG%", "GHEAL Bonus", "Damage Res", "Extra Threat%"].map((stat) => (
                <td key={stat} className="border px-2 py-1">{((totalStats[stat] ?? 0) * 100).toFixed(0)}%</td>
              ))}
            </tr>
          </tbody>
        </table>
  
        {/* Elemental / Damage Type Table */}
        <table className="table-fixed border-separate border-spacing-1 text-sm whitespace-nowrap">
          <thead>
            <tr className="bg-gray-100 font-bold text-center">
              <th className="text-left bg-gray-200 w-32">Type</th>
              <th>DMG</th>
              <th>PEN</th>
              <th>RES</th>
            </tr>
          </thead>
          <tbody>
            {[
              "Physical", "Slash", "Pierce", "Blunt",
              "Fire", "Water", "Lightning", "Wind",
              "Earth", "Toxic", "Neg", "Holy", "Void"
            ].map((type) => (
              <tr key={type} className="text-center">
                <td className="border px-2 py-1 text-left bg-gray-50">{type}</td>
                {["DMG", "PEN", "RES"].map((suffix) => (
                  <td key={suffix} className="border px-2 py-1">
                    {((totalStats[`${type} ${suffix}`] ?? 0) * 100).toFixed(0)}%
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
  
  
}
