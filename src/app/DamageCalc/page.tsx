"use client"

import { useEffect, useState } from "react"
import stat_data from "../data/stat_data"

export default function DamageCalc() {
  const [stats, setStats] = useState<Record<string, number>>({})

  useEffect(() => {
    window.dispatchEvent(new Event("computeDmgReadyStats"))
    const raw = localStorage.getItem("StatsDmgReady")
    if (raw) {
      try {
        const parsed = JSON.parse(raw)
        setStats(parsed)
      } catch {}
    }
    
  }, [])

  const [mainStat, setMainStat] = useState("ATK")
  const [secondStat, setSecondStat] = useState("DEF")
  const [element, setElement] = useState("Blunt")
  const [penElement, setPenElement] = useState("Blunt")
  const [skillType, setSkillType] = useState("Sword")
  const [inputs, setInputs] = useState({
    skillDmg: 25,
    skillCritDmg: 100,
    skillPen: 0,
    skillCritChance: 0,
    threatDef: 0,
    armorIgnore: 0,
    resIgnore: 0,
    dot: 0,
    secondSkillDmg: 0,
    enemyArmor: 0,
    enemyRes: 0,
    playerLevel: 1,
    dungeonLevel: 1,
    bossDefPen: 0,
    baseStat: 0,
    buffedStat: 0,
    defense: 0,
    dmgReduction: 0,
    defCap: 0
  })

  const toMult = (v: number | undefined) => 1 + ((v ?? 0) / 100)

  // Stepwise floors to mirror in-game rounding
  const baseRaw = (stats[mainStat] ?? 0) * (inputs["skillDmg"] / 100)
  const base = Math.floor(baseRaw)

  const armorBlock = Math.floor((inputs["enemyArmor"] ?? 0) * ((inputs["armorIgnore"] ?? 0) / 100))
  const armorBreak = Math.floor(((stats["ATK"] ?? 0) + (stats["DEF"] ?? 0) + (stats["MATK"] ?? 0) + (stats["HEAL"] ?? 0)) / 4)
  const mitigated = Math.max(0, Math.floor(base - (armorBlock - armorBreak)))
 
  // Apply multipliers with floors after each stage
  let dmg = mitigated
  // Group element and xDmg before flooring to reduce rounding loss
  const elemMult = toMult(stats[`${element}%`]) * toMult(stats[`${element} xDmg%`])
  dmg = Math.floor(dmg * elemMult)
  const penResMult = 1 + ((stats[`${penElement} Pen%`] ?? 0) / 100) - ((inputs["enemyRes"] ?? 0) * ((inputs["resIgnore"] ?? 0) / 100))
  dmg = Math.floor(dmg * penResMult)
  dmg = Math.floor(dmg * toMult(stats[`${skillType} DMG%`]))
  dmg = Math.floor(dmg * toMult(stats["Dmg%"]))

  const nonCrit = Math.max(0, dmg)

  // Crit and overdrive with step floors
  const critStage = Math.floor(nonCrit * ((inputs['skillCritDmg'] ?? 0) / 100))
  const crit = Math.floor(critStage * ((stats['Crit DMG%'] ?? 0) / 100))
  const maxcrit = Math.floor(crit * ((stats['Overdrive%'] ?? 0) / 100))
  const average = "Todo"

  const handleChange = (field: string, value: number) => {
    setInputs(prev => ({ ...prev, [field]: value }))
    console.log(inputs)
    console.log(stats)
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-center">Damage Calculator</h1>

      <div className="grid grid-cols-4 gap-4 bg-gray-50 border rounded-lg p-4">
        <div className="space-y-2">
          <label className="font-semibold">Primary Stat</label>
          <select value={mainStat} onChange={e => setMainStat(e.target.value)} className="w-full p-1 border rounded">
            {stat_data.Mainstats.map(s => <option key={s}>{s}</option>)}
          </select>

          <label className="font-semibold">Element</label>
          <select value={element} onChange={e => setElement(e.target.value)} className="w-full p-1 border rounded">
            {stat_data.AllElements.map(e => <option key={e}>{e}</option>)}
          </select>

          <label className="font-semibold">Pen Element</label>
          <select value={penElement} onChange={e => setPenElement(e.target.value)} className="w-full p-1 border rounded">
            {stat_data.AllElements.map(e => <option key={e}>{e}</option>)}
          </select>
        </div>

        <div className="space-y-2">
          <label className="font-semibold">Skill Type</label>
          <select value={skillType} onChange={e => setSkillType(e.target.value)} className="w-full p-1 border rounded">
            {stat_data.SkillTypes.map(s => <option key={s}>{s}</option>)}
          </select>

          <label className="font-semibold">Skill DMG%</label>
          <input type="number" defaultValue={25} onChange={e => handleChange("skillDmg", +e.target.value)} className="w-full p-1 border rounded" />

          <label className="font-semibold">Skill Crit DMG%</label>
          <input type="number" onChange={e => handleChange("skillCritDmg", +e.target.value)} className="w-full p-1 border rounded" />
        </div>

        <div className="space-y-2">
          <label className="font-semibold">Skill Pen%</label>
          <input type="number" onChange={e => handleChange("skillPen", +e.target.value)} className="w-full p-1 border rounded" />

          <label className="font-semibold">Crit Chance%</label>
          <input type="number" onChange={e => handleChange("skillCritChance", +e.target.value)} className="w-full p-1 border rounded" />

          <label className="font-semibold">Threat Def%</label>
          <input type="number" onChange={e => handleChange("threatDef", +e.target.value)} className="w-full p-1 border rounded" />
        </div>

        <div className="space-y-2">
          <label className="font-semibold">Armor Ignore%</label>
          <input type="number" onChange={e => handleChange("armorIgnore", +e.target.value)} className="w-full p-1 border rounded" />

          <label className="font-semibold">Res Ignore%</label>
          <input type="number" onChange={e => handleChange("resIgnore", +e.target.value)} className="w-full p-1 border rounded" />

          <label className="font-semibold">DOT%</label>
          <input type="number" onChange={e => handleChange("dot", +e.target.value)} className="w-full p-1 border rounded" />
        </div>

        <div className="space-y-2">
          <label className="font-semibold">2nd Stat</label>
          <select value={secondStat} onChange={e => setSecondStat(e.target.value)} className="w-full p-1 border rounded">
            {stat_data.Mainstats.map(s => <option key={s}>{s}</option>)}
          </select>

          <label className="font-semibold">2nd Skill DMG%</label>
          <input type="number" onChange={e => handleChange("secondSkillDmg", +e.target.value)} className="w-full p-1 border rounded" />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 bg-gray-50 border rounded-lg p-4">
        <div className="space-y-1">
          <label className="font-semibold">Enemy Armor</label>
          <input type="number" onChange={e => handleChange("enemyArmor", +e.target.value)} className="w-full p-1 border rounded" />

          <label className="font-semibold">Enemy Resistance</label>
          <input type="number" onChange={e => handleChange("enemyRes", +e.target.value)} className="w-full p-1 border rounded" />
        </div>

        <div className="space-y-1">
          <label className="font-semibold">Player Level</label>
          <input type="number" onChange={e => handleChange("playerLevel", +e.target.value)} className="w-full p-1 border rounded" />

          <label className="font-semibold">Dungeon Level</label>
          <input type="number" onChange={e => handleChange("dungeonLevel", +e.target.value)} className="w-full p-1 border rounded" />

          <label className="font-semibold">Boss DEF Pen%</label>
          <input type="number" onChange={e => handleChange("bossDefPen", +e.target.value)} className="w-full p-1 border rounded" />
        </div>

        <div className="space-y-1">
          <label className="font-semibold">Your Defense</label>
          <input type="number" onChange={e => handleChange("defense", +e.target.value)} className="w-full p-1 border rounded" />

          <label className="font-semibold">Damage Reduction%</label>
          <input type="number" onChange={e => handleChange("dmgReduction", +e.target.value)} className="w-full p-1 border rounded" />
        </div>

        <div className="space-y-1">
          <label className="font-semibold">Defense Cap</label>
          <input type="number" onChange={e => handleChange("defCap", +e.target.value)} className="w-full p-1 border rounded" />

          <label className="font-semibold">Effective {mainStat}</label>
          <input type="number" onChange={e => handleChange("baseStat", +e.target.value)} className="w-full p-1 border rounded" />

          <label className="font-semibold">Total {mainStat} (buffed)</label>
          <input type="number" onChange={e => handleChange("buffedStat", +e.target.value)} className="w-full p-1 border rounded" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 text-center border rounded-lg p-4 bg-white">
        <div className="space-y-2">
          <h2 className="font-semibold text-lg">Average Damage</h2>
          <div><strong>Non-Crit:</strong> { nonCrit }</div>
          <div><strong>Crit:</strong> { crit }</div>
          <div><strong>Maximized Crit:</strong> { maxcrit }</div>
          <div><strong>Overall:</strong> {average}</div>
        </div>
        <div className="space-y-2">
          <h2 className="font-semibold text-lg">Damage Over Time</h2>
          <div><strong>DOT (Non-Crit):</strong> TBD</div>
          <div><strong>DOT (Crit):</strong> TBD</div>
          <div><strong>Threat Gen:</strong> TBD</div>
        </div>
      </div>
    </div>
  )
}
