"use client"

import { useState, useEffect } from "react"
import stat_data from "../data/stat_data"

const STORAGE_KEYS = {
  levels: "SelectedLevels",
  statPoints: "SelectedStatPoints",
  training: "SelectedTraining",
  heroPoints: "SelectedHeroPoints",
  order: "SelectedLevelOrder",
  blockOrder: "SelectedLevelBlockOrder",
}

export default function LevelsPage() {
  type Cls = "tank" | "warrior" | "caster" | "healer"
  type LevelsByClass = Record<Cls, number>
  const [levels, setLevels] = useState<LevelsByClass>({ tank: 0, warrior: 0, caster: 0, healer: 0 })
  const [statPoints, setStatPoints] = useState({ ATK: 0, DEF: 0, MATK: 0, HEAL: 0 })
  const [training, setTraining] = useState({ ATK: 0, DEF: 0, MATK: 0, HEAL: 0 })
  const [heroPoints, setHeroPoints] = useState<Record<string, number>>({})
  const [levelOrder, setLevelOrder] = useState<Cls[]>([])
  const [classOrder, setClassOrder] = useState<Cls[]>(["tank", "warrior", "caster", "healer"])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const storedLevels = localStorage.getItem(STORAGE_KEYS.levels)
    const storedStatPoints = localStorage.getItem(STORAGE_KEYS.statPoints)
    const storedTraining = localStorage.getItem(STORAGE_KEYS.training)
    const storedHeroPoints = localStorage.getItem(STORAGE_KEYS.heroPoints)
    const storedOrder = localStorage.getItem(STORAGE_KEYS.order)
    const storedBlockOrder = localStorage.getItem(STORAGE_KEYS.blockOrder)

    if (storedLevels) setLevels(JSON.parse(storedLevels))
    if (storedStatPoints) setStatPoints(JSON.parse(storedStatPoints))
    if (storedTraining) setTraining(JSON.parse(storedTraining))
    if (storedHeroPoints) setHeroPoints(JSON.parse(storedHeroPoints))
    if (storedOrder) setLevelOrder(JSON.parse(storedOrder))
    if (storedBlockOrder) setClassOrder(JSON.parse(storedBlockOrder))

    setLoaded(true)  // <- very important
  }, [])

  useEffect(() => {
    if (!loaded) return
    localStorage.setItem(STORAGE_KEYS.levels, JSON.stringify(levels))
    // If class counts changed, trim any excess from the order
    setLevelOrder(prev => {
      const counts: LevelsByClass = { tank: 0, warrior: 0, caster: 0, healer: 0 }
      const max: LevelsByClass = { ...levels }
      const next: typeof prev = []
      for (const c of prev) {
        if (counts[c] < max[c]) {
          counts[c]++
          next.push(c)
        }
      }
      return next
    })
  }, [levels, loaded])

  useEffect(() => {
    if (!loaded) return
    localStorage.setItem(STORAGE_KEYS.statPoints, JSON.stringify(statPoints))
  }, [statPoints, loaded])

  useEffect(() => {
    if (!loaded) return
    localStorage.setItem(STORAGE_KEYS.training, JSON.stringify(training))
  }, [training, loaded])

  useEffect(() => {
    if (!loaded) return
    localStorage.setItem(STORAGE_KEYS.heroPoints, JSON.stringify(heroPoints))
  }, [heroPoints, loaded])

  // Persist level order
  useEffect(() => {
    if (!loaded) return
    localStorage.setItem(STORAGE_KEYS.order, JSON.stringify(levelOrder))
  }, [levelOrder, loaded])

  // Persist class (block) order and derive full SelectedLevelOrder from it
  useEffect(() => {
    if (!loaded) return
    localStorage.setItem(STORAGE_KEYS.blockOrder, JSON.stringify(classOrder))
    // Expand to full sequence: all levels for each class, in chosen order
    const seq: Cls[] = []
    for (const c of classOrder) {
      const count = levels[c]
      for (let i = 0; i < Math.max(0, count); i++) seq.push(c)
    }
    setLevelOrder(seq)
    localStorage.setItem(STORAGE_KEYS.order, JSON.stringify(seq))
  }, [classOrder, levels, loaded])

  if (!loaded) {
    return <div className="p-4">Loading...</div>
  }

  const totalLevels = Object.values(levels).reduce((a, b) => a + b, 0)
  const isekaiLevel = Math.max(0, Math.ceil((totalLevels - 110) / 5))
  const totalStatPoints = totalLevels
  const usedStatPoints = Object.values(statPoints).reduce((a, b) => a + b, 0)
  const remainingStatPoints = totalStatPoints - usedStatPoints
  const totalTraining = Object.values(training).reduce((a, b) => a + b, 0)

  // (Manual per-level order UI removed; block order drives full sequence.)

  const totalHeroPoints = Object.entries(heroPoints).reduce((sum, [key, val]) => {
    const cost = stat_data.heroStats.find(([k]) => k === key)?.[1] ?? 1
    return sum + cost * val
  }, 0)

  const maxHeroPoints = 320

  const costClass = (cost: number) =>
    cost === 1 ? "bg-green-100" :
    cost === 2 ? "bg-orange-200" :
    cost === 3 ? "bg-red-300" : ""

  // Column reorder helpers
  const moveClass = (idx: number, dir: -1 | 1) => {
    setClassOrder(prev => {
      const i = idx
      const j = i + dir
      if (j < 0 || j >= prev.length) return prev
      const next = [...prev]
      const tmp = next[i]
      next[i] = next[j]
      next[j] = tmp
      return next
    })
  }

  const classLabel: Record<Cls, string> = { tank: "Tank", warrior: "Warrior", caster: "Caster", healer: "Healer" }
  const headerBg: Record<Cls, string> = { tank: "bg-green-100", warrior: "bg-red-100", caster: "bg-blue-100", healer: "bg-pink-100" }

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-xl font-bold">Level Summary</h1>

      <table className="table-fixed border text-center text-sm">
        <thead>
          <tr>
            {classOrder.map((c, idx) => (
              <th key={c} className={`${headerBg[c]} border px-2 py-1`}> 
                <div className="flex items-center justify-between gap-1">
                  <button className="px-1 py-0.5 border rounded text-xs" onClick={() => moveClass(idx, -1)} title="Move left" disabled={idx===0}>{"<"}</button>
                  <span className="font-semibold">{classLabel[c]}</span>
                  <button className="px-1 py-0.5 border rounded text-xs" onClick={() => moveClass(idx, 1)} title="Move right" disabled={idx===classOrder.length-1}>{">"}</button>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {classOrder.map(k => (
              <td key={k} className="border">
                <input
                  type="number"
                  value={levels[k]}
                  onChange={e => setLevels({ ...levels, [k]: +e.target.value })}
                  className="w-16 text-center"
                />
              </td>
            ))}
          </tr>
        </tbody>
      </table>

      <table className="table-fixed border text-sm text-center">
        <thead className="bg-gray-100">
          <tr>
            <th>Total Levels</th>
            <th>Levels Needed</th>
            <th>Isekai Level</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{totalLevels}</td>
            <td>(todo)</td>
            <td>{isekaiLevel}</td>
          </tr>
        </tbody>
      </table>

      <h2 className="text-lg font-bold">EXP / Gold Summary</h2>
      <table className="table-fixed border text-sm text-left">
        <tbody>
          <tr><td className="border px-2">Total EXP for Talents</td><td className="border px-2">(todo)</td></tr>
          <tr><td className="border px-2">Total EXP for Skills</td><td className="border px-2">(todo)</td></tr>
          <tr><td className="border px-2">Total EXP for Levels</td><td className="border px-2">(todo)</td></tr>
          <tr><td className="border px-2">Total EXP</td><td className="border px-2">(todo)</td></tr>
          <tr><td className="border px-2">Total Gold</td><td className="border px-2">(todo)</td></tr>
        </tbody>
      </table>

      <h2 className="text-lg font-bold">Stat Points</h2>
      <table className="text-center text-sm border">
        <thead>
          <tr>
            <th colSpan={2} className="bg-yellow-100 px-2 py-1 border">Chosen</th>
            <th colSpan={2} className="bg-yellow-100 px-2 py-1 border">Remaining</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan={2} className="border px-2 py-1">{usedStatPoints}</td>
            <td colSpan={2} className="border px-2 py-1">{remainingStatPoints}</td>
          </tr>
        </tbody>
        <thead>
          <tr>
            <th className="bg-green-200 border">T</th>
            <th className="bg-red-200 border">W</th>
            <th className="bg-blue-200 border">C</th>
            <th className="bg-pink-200 border">H</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            {(["ATK", "DEF", "MATK", "HEAL"] as const).map(k => (
              <td key={k} className="border">
                <input
                  type="number"
                  value={statPoints[k]}
                  onChange={e => setStatPoints({ ...statPoints, [k]: +e.target.value })}
                  className="w-16 text-center"
                />
              </td>
            ))}
          </tr>
        </tbody>
      </table>

      <h2 className="text-lg font-bold">Training</h2>
      <table className="text-center text-sm border">
        <thead>
          <tr>
            <th colSpan={4} className="bg-gray-100 border">Total Chosen: {totalTraining}</th>
          </tr>
          <tr>
            <th className="bg-green-200 border">T</th>
            <th className="bg-red-200 border">W</th>
            <th className="bg-blue-200 border">C</th>
            <th className="bg-pink-200 border">H</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            {(["DEF", "ATK", "MATK", "HEAL"] as const).map(k => (
              <td key={k} className="border">
                <input
                  type="number"
                  value={training[k]}
                  onChange={e => setTraining({ ...training, [k]: +e.target.value })}
                  className="w-16 text-center"
                />
              </td>
            ))}
          </tr>
        </tbody>
      </table>

      <h2 className="text-lg font-bold">Hero Points</h2>

      <table className="text-center text-sm border mb-2">
        <thead>
          <tr>
            <th className="bg-yellow-100 border">Chosen</th>
            <th className="bg-yellow-100 border">Remaining</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border px-2 py-1">{totalHeroPoints}</td>
            <td className="border px-2 py-1">{maxHeroPoints - totalHeroPoints}</td>
          </tr>
        </tbody>
      </table>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div>
          <h3 className="bg-green-300 text-center font-bold">Main Stats</h3>
          {stat_data.heroStats.filter(([k]) => k.endsWith("multi")).map(([stat, cost]) => (
            <div key={stat} className={`border ${costClass(cost)}`}>
              <label className="block font-mono text-xs text-gray-700">{stat}</label>
              <input
                type="number"
                value={heroPoints[stat] ?? 0}
                onChange={e => setHeroPoints({ ...heroPoints, [stat]: +e.target.value })}
                className="border px-1 text-center w-full"
              />
            </div>
          ))}
        </div>

        <div>
          <h3 className="bg-blue-200 text-center font-bold">Elemental Damage</h3>
          {stat_data.heroStats.filter(([k]) => k.startsWith("ele") && !k.includes("multi")).map(([stat, cost]) => (
            <div key={stat} className={`border ${costClass(cost)}`}>
              <label className="block font-mono text-xs text-gray-700">{stat}</label>
              <input
                type="number"
                value={heroPoints[stat] ?? 0}
                onChange={e => setHeroPoints({ ...heroPoints, [stat]: +e.target.value })}
                className="border px-1 text-center w-full"
              />
            </div>
          ))}
        </div>

        <div>
          <h3 className="bg-green-300 text-center font-bold">Elemental Resists</h3>
          {stat_data.heroStats.filter(([k]) => k.startsWith("res")).map(([stat, cost]) => (
            <div key={stat} className={`border ${costClass(cost)}`}>
              <label className="block font-mono text-xs text-gray-700">{stat}</label>
              <input
                type="number"
                value={heroPoints[stat] ?? 0}
                onChange={e => setHeroPoints({ ...heroPoints, [stat]: +e.target.value })}
                className="border px-1 text-center w-full"
              />
            </div>
          ))}
        </div>

        <div>
          <h3 className="bg-cyan-100 text-center font-bold">Ele Pen</h3>
          <div className={`border ${costClass(1)}`}>
            <label className="block font-mono text-xs text-gray-700">penvoid</label>
            <input
              type="number"
              value={heroPoints["penvoid"] ?? 0}
              onChange={e => setHeroPoints({ ...heroPoints, penvoid: +e.target.value })}
              className="border px-1 text-center w-full"
            />
          </div>
        </div>
      </div>

      <div className="w-40 border mt-4 text-sm">
        <div className="bg-gray-200 text-center font-bold">Key</div>
        <div className="bg-green-100 px-2">1 point</div>
        <div className="bg-orange-200 px-2">2 points</div>
        <div className="bg-red-300 px-2">3 points</div>
      </div>
    </div>
  )
}
