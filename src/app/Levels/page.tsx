"use client"

import { useEffect, useState } from "react"
import {
  heroPointGainsByRace,
  heroPointStats,
  heroPointStatsByGroup,
  type HeroPointStat,
} from "../data/heropoint_data"
import { skill_data } from "../data/skill_data"
import { talent_data } from "../data/talent_data"
import race_data, { race_data_by_tag, type RaceTag } from "../data/race_data"

const STORAGE_KEYS = {
  levels: "SelectedLevels",
  statPoints: "SelectedStatPoints",
  training: "SelectedTraining",
  heroPoints: "SelectedHeroPoints",
  savedLevelOrder: "SelectedLevelOrder",
  race: "SelectedRace",
}

const DEFAULT_RACE: RaceTag = race_data[0].tag
const isRaceTag = (value: string): value is RaceTag => value in race_data_by_tag
const TRAINING_GOLD_PER_POINT = 15

function parseStoredStringArray(raw: string | null): string[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === "string") : []
  } catch {
    return []
  }
}

function getXpToNextLevel(level: number): number {
  const lvl = Math.max(0, Math.floor(level))

  if (lvl <= 120) {
    return 60 + (4 * lvl) + (500 * Math.floor(lvl / 20))
  }

  if (lvl <= 259) {
    const extraAfter140 = lvl >= 140 ? 1000 * (Math.floor((lvl - 140) / 20) + 1) : 0
    return 6544 + (4 * (lvl - 121)) + extraAfter140
  }

  if (lvl <= 340) {
    return 21150 + (6 * (lvl - 260)) + (1500 * Math.floor((lvl - 260) / 20))
  }

  if (lvl <= 359) {
    return 41454 + (9 * (lvl - 341))
  }

  return 43875 + (9 * (lvl - 360)) + (2250 * Math.floor((lvl - 360) / 20))
}

function cumulativeLevelExpCost(levelCount: number): number {
  const levels = Math.max(0, Math.floor(levelCount))
  let totalExp = 0
  for (let lvl = 0; lvl < levels; lvl++) {
    totalExp += getXpToNextLevel(lvl)
  }
  return totalExp
}

function formatWhole(value: number): string {
  return Math.max(0, Math.round(value)).toLocaleString()
}

export default function LevelsPage() {
  type Cls = "tank" | "warrior" | "caster" | "healer"
  type LevelsByClass = Record<Cls, number>

  const [levels, setLevels] = useState<LevelsByClass>({ tank: 0, warrior: 0, caster: 0, healer: 0 })
  const [statPoints, setStatPoints] = useState({ ATK: 0, DEF: 0, MATK: 0, HEAL: 0 })
  const [training, setTraining] = useState({ ATK: 0, DEF: 0, MATK: 0, HEAL: 0 })
  const [heroPoints, setHeroPoints] = useState<Record<string, number>>({})
  const [selectedTalents, setSelectedTalents] = useState<string[]>([])
  const [selectedBuffs, setSelectedBuffs] = useState<string[]>([])
  const [classOrder, setClassOrder] = useState<Cls[]>(["tank", "warrior", "caster", "healer"])
  const [selectedRace, setSelectedRace] = useState<RaceTag>(DEFAULT_RACE)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const storedLevels = localStorage.getItem(STORAGE_KEYS.levels)
    const storedStatPoints = localStorage.getItem(STORAGE_KEYS.statPoints)
    const storedTraining = localStorage.getItem(STORAGE_KEYS.training)
    const storedHeroPoints = localStorage.getItem(STORAGE_KEYS.heroPoints)
    const storedLevelOrder = localStorage.getItem(STORAGE_KEYS.savedLevelOrder)
    const storedRace = localStorage.getItem(STORAGE_KEYS.race)
    const storedSelectedTalents = localStorage.getItem("selectedTalents")
    const storedSelectedBuffs = localStorage.getItem("selectedBuffs")

    if (storedLevels) setLevels(JSON.parse(storedLevels))
    if (storedStatPoints) setStatPoints(JSON.parse(storedStatPoints))
    if (storedTraining) setTraining(JSON.parse(storedTraining))
    if (storedHeroPoints) setHeroPoints(JSON.parse(storedHeroPoints))
    if (storedLevelOrder) setClassOrder(JSON.parse(storedLevelOrder))
    if (storedRace && isRaceTag(storedRace)) setSelectedRace(storedRace)
    setSelectedTalents(parseStoredStringArray(storedSelectedTalents))
    setSelectedBuffs(parseStoredStringArray(storedSelectedBuffs))

    setLoaded(true)
  }, [])

  useEffect(() => {
    if (!loaded) return
    localStorage.setItem(STORAGE_KEYS.levels, JSON.stringify(levels))
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

  useEffect(() => {
    if (!loaded) return
    localStorage.setItem(STORAGE_KEYS.savedLevelOrder, JSON.stringify(classOrder))
  }, [classOrder, loaded])

  useEffect(() => {
    if (!loaded) return
    localStorage.setItem(STORAGE_KEYS.race, selectedRace)
  }, [selectedRace, loaded])

  if (!loaded) {
    return <div className="p-4">Loading...</div>
  }

  const totalLevels = Object.values(levels).reduce((a, b) => a + b, 0)
  const availableSkillPoints = Math.ceil(totalLevels / 2)
  const availableTalentPoints = Math.floor(totalLevels / 2)
  const totalStatPoints = totalLevels
  const usedStatPoints = Object.values(statPoints).reduce((a, b) => a + b, 0)
  const remainingStatPoints = totalStatPoints - usedStatPoints
  const totalTraining = Object.values(training).reduce((a, b) => a + b, 0)

  const totalHeroPoints = heroPointStats.reduce((sum, { id, cost }) => {
    return sum + (heroPoints[id] ?? 0) * cost
  }, 0)

  const classKeys: Cls[] = ["tank", "warrior", "caster", "healer"]
  const requiredLevelsByClass: LevelsByClass = { tank: 0, warrior: 0, caster: 0, healer: 0 }
  let requiredTotalLevel = 0
  let totalExpForTalents = 0
  let totalExpForSkills = 0
  let totalGoldForTalents = 0
  let totalGoldForSkills = 0
  let totalTalentPointsUsed = 0
  let totalSkillPointsUsed = 0

  for (const talentName of selectedTalents) {
    const talent = talent_data[talentName]
    if (!talent) continue

    requiredTotalLevel = Math.max(requiredTotalLevel, talent.total_level ?? 0)
    requiredLevelsByClass.tank = Math.max(requiredLevelsByClass.tank, talent.class_levels.tank_levels ?? 0)
    requiredLevelsByClass.warrior = Math.max(requiredLevelsByClass.warrior, talent.class_levels.warrior_levels ?? 0)
    requiredLevelsByClass.caster = Math.max(requiredLevelsByClass.caster, talent.class_levels.caster_levels ?? 0)
    requiredLevelsByClass.healer = Math.max(requiredLevelsByClass.healer, talent.class_levels.healer_levels ?? 0)

    totalExpForTalents += talent.exp ?? 0
    totalGoldForTalents += talent.gold ?? 0
    totalTalentPointsUsed += 1
  }

  for (const buffName of selectedBuffs) {
    const skill = skill_data[buffName]
    if (!skill) continue

    requiredLevelsByClass.tank = Math.max(requiredLevelsByClass.tank, skill.class_levels.tank_levels ?? 0)
    requiredLevelsByClass.warrior = Math.max(requiredLevelsByClass.warrior, skill.class_levels.warrior_levels ?? 0)
    requiredLevelsByClass.caster = Math.max(requiredLevelsByClass.caster, skill.class_levels.caster_levels ?? 0)
    requiredLevelsByClass.healer = Math.max(requiredLevelsByClass.healer, skill.class_levels.healer_levels ?? 0)

    totalExpForSkills += skill.exp ?? 0
    totalGoldForSkills += skill.gold ?? 0
    totalSkillPointsUsed += skill.sp ?? 0
  }

  const classLevelDeficit: LevelsByClass = {
    tank: Math.max(0, requiredLevelsByClass.tank - levels.tank),
    warrior: Math.max(0, requiredLevelsByClass.warrior - levels.warrior),
    caster: Math.max(0, requiredLevelsByClass.caster - levels.caster),
    healer: Math.max(0, requiredLevelsByClass.healer - levels.healer),
  }

  const classLevelsNeeded = classKeys.reduce((sum, className) => sum + classLevelDeficit[className], 0)
  const requiredLevelForTalentPoints = totalTalentPointsUsed * 2
  const totalSkillPointsRequired = totalSkillPointsUsed + totalTraining
  const requiredLevelForSkillPoints = Math.max(0, (totalSkillPointsRequired * 2) - 1)
  const pointBasedRequiredLevel = Math.max(requiredLevelForTalentPoints, requiredLevelForSkillPoints)
  const totalRequiredLevel = Math.max(requiredTotalLevel, pointBasedRequiredLevel)
  const totalLevelDeficit = Math.max(0, totalRequiredLevel - totalLevels)
  const levelsNeeded = Math.max(totalLevelDeficit, classLevelsNeeded)
  const targetTotalLevels = totalLevels + levelsNeeded
  const requiredIsekaiLevel = Math.max(0, Math.ceil((targetTotalLevels - 110) / 5))

  const skillPointDeficit = Math.max(0, totalSkillPointsRequired - availableSkillPoints)
  const talentPointDeficit = Math.max(0, totalTalentPointsUsed - availableTalentPoints)

  const totalExpForLevels = cumulativeLevelExpCost(targetTotalLevels)
  const totalGoldForTraining = totalTraining * TRAINING_GOLD_PER_POINT
  const totalExp = totalExpForTalents + totalExpForSkills + totalExpForLevels
  const totalGold = totalGoldForTalents + totalGoldForSkills + totalGoldForTraining

  const maxHeroPoints = 320

  const costClass = (cost: number) =>
    cost === 1 ? "bg-green-100" :
    cost === 2 ? "bg-orange-200" :
    cost === 3 ? "bg-red-300" : ""

  // Column reorder helpers
  const moveClass = (idx: number, dir: -1 | 1) => {
    setClassOrder((prev) => {
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

  const selectedRaceData = race_data_by_tag[selectedRace]
  const selectedRaceHeroPointGains = heroPointGainsByRace[selectedRace]

  const renderHeroPointInput = ({ id, cost }: HeroPointStat) => (
    <div key={id} className={`border ${costClass(cost)}`}>
      <label className="block font-mono text-xs text-gray-700 px-1">{id}</label>
      <div className="text-[11px] text-gray-500 text-center">Gain: {selectedRaceHeroPointGains[id]}</div>
      <input
        type="number"
        value={heroPoints[id] ?? 0}
        onChange={(e) => setHeroPoints({ ...heroPoints, [id]: +e.target.value })}
        className="border px-1 text-center w-full"
      />
    </div>
  )

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-xl font-bold">Level Summary</h1>

      <h2 className="text-lg font-bold">Race</h2>
      <div className="max-w-3xl border p-3 space-y-2 bg-gray-50">
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <label htmlFor="race-select" className="font-semibold">Selected Race</label>
          <select
            id="race-select"
            value={selectedRace}
            onChange={(e) => {
              if (isRaceTag(e.target.value)) setSelectedRace(e.target.value)
            }}
            className="border px-2 py-1 bg-white"
          >
            {race_data.map((race) => (
              <option key={race.tag} value={race.tag}>{race.name}</option>
            ))}
          </select>
          <span className="text-xs text-gray-600">Tag: {selectedRaceData.tag}</span>
        </div>
        <p className="text-sm text-gray-800">{selectedRaceData.description}</p>
      </div>

      <table className="table-fixed border text-center text-sm">
        <thead>
          <tr>
            {classOrder.map((c, idx) => (
              <th key={c} className={`${headerBg[c]} border px-2 py-1`}>
                <div className="flex items-center justify-between gap-1">
                  <button className="px-1 py-0.5 border rounded text-xs" onClick={() => moveClass(idx, -1)} title="Move left" disabled={idx === 0}>{"<"}</button>
                  <span className="font-semibold">{classLabel[c]}</span>
                  <button className="px-1 py-0.5 border rounded text-xs" onClick={() => moveClass(idx, 1)} title="Move right" disabled={idx === classOrder.length - 1}>{">"}</button>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {classOrder.map((k) => (
              <td key={k} className="border">
                <input
                  type="number"
                  value={levels[k]}
                  onChange={(e) => setLevels({ ...levels, [k]: +e.target.value })}
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
            <th>Class</th>
            <th>Chosen</th>
            <th>Required</th>
            <th>Needed</th>
          </tr>
        </thead>
        <tbody>
          {classOrder.map((classKey) => (
            <tr key={classKey}>
              <td className="border px-2 py-1 font-semibold">{classLabel[classKey]}</td>
              <td className="border px-2 py-1">{levels[classKey]}</td>
              <td className="border px-2 py-1">{requiredLevelsByClass[classKey]}</td>
              <td className="border px-2 py-1">{classLevelDeficit[classKey]}</td>
            </tr>
          ))}
          <tr>
            <th colSpan={2} className="border px-2 py-1">Total Levels</th>
            <th className="border px-2 py-1">Levels Needed</th>
            <th className="border px-2 py-1">Isekai Level Required</th>
          </tr>
          <tr>
            <td colSpan={2} className="border px-2 py-1">{totalLevels}</td>
            <td className="border px-2 py-1">{levelsNeeded}</td>
            <td className="border px-2 py-1">{requiredIsekaiLevel}</td>
          </tr>
        </tbody>
      </table>

      <table className="table-fixed border text-sm text-center">
        <thead className="bg-gray-100">
          <tr>
            <th>Point Type</th>
            <th>Used</th>
            <th>Available</th>
            <th>Needed</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border px-2 py-1">Skill Points (Odd Levels, Skills + Training)</td>
            <td className="border px-2 py-1">{totalSkillPointsRequired}</td>
            <td className="border px-2 py-1">{availableSkillPoints}</td>
            <td className="border px-2 py-1">{skillPointDeficit}</td>
          </tr>
          <tr>
            <td className="border px-2 py-1">Talent Points (Even Levels)</td>
            <td className="border px-2 py-1">{totalTalentPointsUsed}</td>
            <td className="border px-2 py-1">{availableTalentPoints}</td>
            <td className="border px-2 py-1">{talentPointDeficit}</td>
          </tr>
        </tbody>
      </table>

      <h2 className="text-lg font-bold">EXP / Gold Summary</h2>
      <table className="table-fixed border text-sm text-left">
        <tbody>
          <tr><td className="border px-2">Total EXP for Talents</td><td className="border px-2">{formatWhole(totalExpForTalents)}</td></tr>
          <tr><td className="border px-2">Total EXP for Skills</td><td className="border px-2">{formatWhole(totalExpForSkills)}</td></tr>
          <tr><td className="border px-2">Total EXP for Levels</td><td className="border px-2">{formatWhole(totalExpForLevels)}</td></tr>
          <tr><td className="border px-2">Total EXP</td><td className="border px-2">{formatWhole(totalExp)}</td></tr>
          <tr><td className="border px-2">Total Gold</td><td className="border px-2">{formatWhole(totalGold)}</td></tr>
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
            {(["ATK", "DEF", "MATK", "HEAL"] as const).map((k) => (
              <td key={k} className="border">
                <input
                  type="number"
                  value={statPoints[k]}
                  onChange={(e) => setStatPoints({ ...statPoints, [k]: +e.target.value })}
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
            {(["DEF", "ATK", "MATK", "HEAL"] as const).map((k) => (
              <td key={k} className="border">
                <input
                  type="number"
                  value={training[k]}
                  onChange={(e) => setTraining({ ...training, [k]: +e.target.value })}
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
          {heroPointStatsByGroup.main.map(renderHeroPointInput)}
        </div>

        <div>
          <h3 className="bg-blue-200 text-center font-bold">Elemental Damage</h3>
          {heroPointStatsByGroup.damage.map(renderHeroPointInput)}
        </div>

        <div>
          <h3 className="bg-green-300 text-center font-bold">Elemental Resists</h3>
          {heroPointStatsByGroup.resist.map(renderHeroPointInput)}
        </div>

        <div>
          <h3 className="bg-cyan-100 text-center font-bold">Ele Pen</h3>
          {heroPointStatsByGroup.penetration.map(renderHeroPointInput)}
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
