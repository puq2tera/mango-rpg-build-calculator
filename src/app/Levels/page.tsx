"use client"

import { useState, useEffect } from "react"

const STORAGE_KEYS = {
  levels: "LevelsPage-levels",
  statPoints: "LevelsPage-statPoints",
  training: "LevelsPage-training",
  heroPoints: "LevelsPage-heroPoints"
}

export default function LevelsPage() {
  const [levels, setLevels] = useState({ tank: 0, warrior: 0, caster: 0, healer: 0 })
  const [statPoints, setStatPoints] = useState({ tank: 0, warrior: 0, caster: 0, healer: 0 })
  const [training, setTraining] = useState({ tank: 0, warrior: 0, caster: 0, healer: 0 })
  const [heroPoints, setHeroPoints] = useState<Record<string, number>>({})

  useEffect(() => {
    const storedLevels = localStorage.getItem(STORAGE_KEYS.levels)
    const storedStatPoints = localStorage.getItem(STORAGE_KEYS.statPoints)
    const storedTraining = localStorage.getItem(STORAGE_KEYS.training)
    const storedHeroPoints = localStorage.getItem(STORAGE_KEYS.heroPoints)

    if (storedLevels) setLevels(JSON.parse(storedLevels))
    if (storedStatPoints) setStatPoints(JSON.parse(storedStatPoints))
    if (storedTraining) setTraining(JSON.parse(storedTraining))
    if (storedHeroPoints) setHeroPoints(JSON.parse(storedHeroPoints))
  }, [])

  useEffect(() => { localStorage.setItem(STORAGE_KEYS.levels, JSON.stringify(levels)) }, [levels])
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.statPoints, JSON.stringify(statPoints)) }, [statPoints])
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.training, JSON.stringify(training)) }, [training])
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.heroPoints, JSON.stringify(heroPoints)) }, [heroPoints])

  const heroStats: [string, number][] = [
    ["atkmulti", 1], ["defmulti", 1], ["matkmulti", 1], ["healmulti", 1],
    ["elefire", 1], ["elelightning", 1], ["elewater", 1], ["eleearth", 1], ["elewind", 1], ["eletoxic", 2], ["elevoid", 2], ["elenegative", 1], ["eleholy", 1], ["eleblunt", 1], ["elepierce", 1], ["eleslash", 1],
    ["resfire", 2], ["reslightning", 2], ["reswater", 2], ["researth", 2], ["reswind", 2], ["restoxic", 3], ["resvoid", 3], ["resnegative", 2], ["resholy", 2], ["resblunt", 2], ["respierce", 2], ["resslash", 2],
    ["penvoid", 1]
  ]

  const totalLevels = Object.values(levels).reduce((a, b) => a + b, 0)
  const isekaiLevel = Math.max(0, Math.ceil((totalLevels - 110) / 5))
  const totalStatPoints = totalLevels
  const usedStatPoints = Object.values(statPoints).reduce((a, b) => a + b, 0)
  const remainingStatPoints = totalStatPoints - usedStatPoints
  const totalTraining = Object.values(training).reduce((a, b) => a + b, 0)

  const totalHeroPoints = Object.entries(heroPoints).reduce((sum, [key, val]) => {
    const cost = heroStats.find(([k]) => k === key)?.[1] ?? 1
    return sum + cost * val
  }, 0)

  const maxHeroPoints = 320

  const costClass = (cost: number) =>
    cost === 1 ? "bg-green-100" :
    cost === 2 ? "bg-orange-200" :
    cost === 3 ? "bg-red-300" : ""

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-xl font-bold">Level Summary</h1>

      <table className="table-fixed border text-center text-sm">
        <thead>
          <tr>
            <th className="bg-green-100 border px-2 py-1">Tank</th>
            <th className="bg-red-100 border px-2 py-1">Warrior</th>
            <th className="bg-blue-100 border px-2 py-1">Caster</th>
            <th className="bg-pink-100 border px-2 py-1">Healer</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            {(["tank", "warrior", "caster", "healer"] as const).map(k => (
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
            {(["tank", "warrior", "caster", "healer"] as const).map(k => (
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
            {(["tank", "warrior", "caster", "healer"] as const).map(k => (
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
          {heroStats.filter(([k]) => k.endsWith("multi")).map(([stat, cost]) => (
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
          {heroStats.filter(([k]) => k.startsWith("ele") && !k.includes("multi")).map(([stat, cost]) => (
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
          {heroStats.filter(([k]) => k.startsWith("res")).map(([stat, cost]) => (
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
