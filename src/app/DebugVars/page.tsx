"use client"

import { useEffect, useState } from "react"
import { talent_data, __allStatNames, __allConversionNames } from "../data/talent_data"

interface TalentRow {
  name: string
  category: string
  PreReq: string
  Tag: string
  BlockedTag: string
  gold: number
  exp: number
  tp_spent: number
  total_level: number
  class_levels: {
    tank_levels: number
    warrior_levels: number
    caster_levels: number
    healer_levels: number
  }
  description: string
  stats: Record<string, number>
  conversions?: Array<{ source: string; ratio: number; resulting_stat: string }>
}

export default function Skills() {
  const [selected, setSelected] = useState<string | null>(null)
  const [stats, setStats] = useState<string | null>(null)
  const [filtered, setFiltered] = useState<TalentRow[]>([])
  const [allTalents, setAllTalents] = useState<TalentRow[]>([])

  useEffect(() => {
    const raw = localStorage.getItem("selectedTalents")
    if (!raw) return
    try {
      const parsed: string[] = JSON.parse(raw)

      const output = parsed.map(id => {
        const data = talent_data[id]
        return {
          name: id,
          category: data.category,
          PreReq: Array.isArray(data.PreReq) ? data.PreReq.join(", ") : data.PreReq,
          Tag: data.Tag,
          BlockedTag: data.BlockedTag,
          gold: data.gold,
          exp: data.exp,
          tp_spent: data.tp_spent,
          total_level: data.total_level,
          class_levels: data.class_levels,
          description: data.description,
          stats: data.stats,
          conversions: data.conversions
        }
      })
      setFiltered(output)
    } catch (e) {
      console.error("Failed to parse selectedTalents", e)
    }
  }, [])

  useEffect(() => {
    const selectedTalents = localStorage.getItem("selectedTalents")
    const computedStats = localStorage.getItem("computedStats")
    console.log(computedStats)
    setSelected(selectedTalents)
    setStats(computedStats)

    const output = Object.entries(talent_data).map(([id, data]) => ({
      name: id,
      category: data.category,
      PreReq: Array.isArray(data.PreReq) ? data.PreReq.join(", ") : data.PreReq,
      Tag: data.Tag,
      BlockedTag: data.BlockedTag,
      gold: data.gold,
      exp: data.exp,
      tp_spent: data.tp_spent,
      total_level: data.total_level,
      class_levels: data.class_levels,
      description: data.description,
      stats: data.stats,
      conversions: data.conversions
    }))
    setAllTalents(output)
  }, [])

  const statOnly = Array.from(__allStatNames).sort()
  const convOnly = Array.from(__allConversionNames).sort()
  const maxLength = Math.max(statOnly.length, convOnly.length)

  return (
    <div className="p-4 space-y-4">
      <div>
        <h1 className="font-bold text-lg">Selected Talents Var</h1>
        <pre className="bg-gray-100 p-2 rounded whitespace-pre-wrap break-words">{selected}</pre>
        <div>
          <h1 className="font-bold text-lg">Talent Stats</h1>
          <pre className="bg-gray-100 p-2 rounded whitespace-pre-wrap break-words">{stats}</pre>
        </div>

        <h1 className="font-bold text-xl mt-4">Selected Talents Data</h1>
        <TalentTable data={filtered} />

        <h1 className="font-bold text-xl mt-8">All Talent Stat and Conversion Names</h1>
        <div className="overflow-x-auto">
          <table className="min-w-fit border border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-2 py-1">Stat Name</th>
                <th className="border px-2 py-1">Conversion Name</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: maxLength }).map((_, i) => (
                <tr key={i} className="odd:bg-white even:bg-gray-50">
                  <td className="border px-2 py-1 font-mono whitespace-nowrap">{statOnly[i] ?? ""}</td>
                  <td className="border px-2 py-1 font-mono whitespace-nowrap">{convOnly[i] ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h1 className="font-bold text-xl mt-8">All Talents Data</h1>
        <TalentTable data={allTalents} />
      </div>
    </div>
  )
}

function TalentTable({ data }: { data: TalentRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border border-collapse text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-2 py-1">Name</th>
            <th className="border px-2 py-1">Category</th>
            <th className="border px-2 py-1">PreReq</th>
            <th className="border px-2 py-1">Tag</th>
            <th className="border px-2 py-1">BlockedTag</th>
            <th className="border px-2 py-1">Gold</th>
            <th className="border px-2 py-1">EXP</th>
            <th className="border px-2 py-1">TP</th>
            <th className="border px-2 py-1">Level</th>
            <th className="border px-2 py-1">Class Levels</th>
            <th className="border px-2 py-1">Description</th>
            <th className="border px-2 py-1">Stats</th>
            <th className="border px-2 py-1">Conversions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((t, i) => (
            <tr key={i} className="odd:bg-white even:bg-gray-50">
              <td className="border px-2 py-1 whitespace-nowrap font-mono">{t.name}</td>
              <td className="border px-2 py-1">{t.category}</td>
              <td className="border px-2 py-1">{t.PreReq}</td>
              <td className="border px-2 py-1">{t.Tag}</td>
              <td className="border px-2 py-1">{t.BlockedTag}</td>
              <td className="border px-2 py-1 text-right">{t.gold}</td>
              <td className="border px-2 py-1 text-right">{t.exp}</td>
              <td className="border px-2 py-1 text-right">{t.tp_spent}</td>
              <td className="border px-2 py-1 text-right">{t.total_level}</td>
              <td className="border px-2 py-1 text-xs">
                t:{t.class_levels.tank_levels}, w:{t.class_levels.warrior_levels},<br />
                c:{t.class_levels.caster_levels}, h:{t.class_levels.healer_levels}
              </td>
              <td className="border px-2 py-1 max-w-[20rem] whitespace-pre-wrap">{t.description}</td>
              <td className="border px-2 py-1 font-mono text-xs">
                {Object.entries(t.stats).map(([k, v]) => `${k}: ${v}`).join(", ")}
              </td>
              <td className="border px-2 py-1 font-mono text-xs whitespace-pre-wrap">
                {t.conversions?.map(c => `${c.source} ⇒ ${c.ratio * 100}% ⇒ ${c.resulting_stat}`).join("\n")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
