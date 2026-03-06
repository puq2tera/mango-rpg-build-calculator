"use client"

import { useEffect, useState } from "react"
import stat_data from "../data/stat_data"
import {
  calculateDamage,
  defaultDamageCalcState,
  persistDamageCalcState,
  readDamageCalcState,
  type DamageCalcInputs,
} from "@/app/lib/damageCalc"

export default function DamageCalc() {
  const [stats, setStats] = useState<Record<string, number>>({})
  const [isHydrated, setIsHydrated] = useState(false)
  const [mainStat, setMainStat] = useState(defaultDamageCalcState.mainStat)
  const [secondStat, setSecondStat] = useState(defaultDamageCalcState.secondStat)
  const [element, setElement] = useState(defaultDamageCalcState.element)
  const [penElement, setPenElement] = useState(defaultDamageCalcState.penElement)
  const [skillType, setSkillType] = useState(defaultDamageCalcState.skillType)
  const [inputs, setInputs] = useState<DamageCalcInputs>(defaultDamageCalcState.inputs)

  useEffect(() => {
    window.dispatchEvent(new Event("computeDmgReadyStats"))

    const rawStats = localStorage.getItem("StatsDmgReady")
    const storedState = readDamageCalcState(localStorage)

    if (rawStats) {
      try {
        setStats(JSON.parse(rawStats))
      } catch {}
    }

    setMainStat(storedState.mainStat)
    setSecondStat(storedState.secondStat)
    setElement(storedState.element)
    setPenElement(storedState.penElement)
    setSkillType(storedState.skillType)
    setInputs(storedState.inputs)
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (!isHydrated) return

    persistDamageCalcState(localStorage, {
      mainStat,
      secondStat,
      element,
      penElement,
      skillType,
      inputs,
    })
    window.dispatchEvent(new Event("damageCalcUpdated"))
  }, [element, inputs, isHydrated, mainStat, penElement, secondStat, skillType])

  const {
    nonCrit,
    crit,
    maxcrit,
    average,
    dotNonCrit,
    dotCrit,
    threatNonCrit,
    threatCrit,
    threatAverage,
  } = calculateDamage(stats, {
    mainStat,
    secondStat,
    element,
    penElement,
    skillType,
    inputs,
  })

  const formatNumber = (value: number): string => value.toLocaleString("en-US")

  const handleChange = (field: keyof DamageCalcInputs, value: number) => {
    setInputs((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-center">Damage Calculator</h1>

      <div className="grid grid-cols-4 gap-4 bg-slate-900/60 border rounded-lg p-4">
        <div className="space-y-2">
          <label className="font-semibold">Primary Stat</label>
          <select value={mainStat} onChange={(e) => setMainStat(e.target.value)} className="w-full p-1 border rounded">
            {stat_data.Mainstats.map((stat) => <option key={stat}>{stat}</option>)}
          </select>

          <label className="font-semibold">Element</label>
          <select value={element} onChange={(e) => setElement(e.target.value)} className="w-full p-1 border rounded">
            {stat_data.AllElements.map((entry) => <option key={entry}>{entry}</option>)}
          </select>

          <label className="font-semibold">Pen Element</label>
          <select value={penElement} onChange={(e) => setPenElement(e.target.value)} className="w-full p-1 border rounded">
            {stat_data.AllElements.map((entry) => <option key={entry}>{entry}</option>)}
          </select>
        </div>

        <div className="space-y-2">
          <label className="font-semibold">Skill Type</label>
          <select value={skillType} onChange={(e) => setSkillType(e.target.value)} className="w-full p-1 border rounded">
            {stat_data.SkillTypes.map((entry) => <option key={entry}>{entry}</option>)}
          </select>

          <label className="font-semibold">Skill DMG%</label>
          <input type="number" value={inputs.skillDmg} onChange={(e) => handleChange("skillDmg", +e.target.value)} className="w-full p-1 border rounded" />

          <label className="font-semibold">Skill Crit DMG%</label>
          <input type="number" value={inputs.skillCritDmg} onChange={(e) => handleChange("skillCritDmg", +e.target.value)} className="w-full p-1 border rounded" />
        </div>

        <div className="space-y-2">
          <label className="font-semibold">Skill Pen%</label>
          <input type="number" value={inputs.skillPen} onChange={(e) => handleChange("skillPen", +e.target.value)} className="w-full p-1 border rounded" />

          <label className="font-semibold">Crit Chance%</label>
          <input type="number" value={inputs.skillCritChance} onChange={(e) => handleChange("skillCritChance", +e.target.value)} className="w-full p-1 border rounded" />

          <label className="font-semibold">Threat Def%</label>
          <input type="number" value={inputs.threatDef} onChange={(e) => handleChange("threatDef", +e.target.value)} className="w-full p-1 border rounded" />
        </div>

        <div className="space-y-2">
          <label className="font-semibold">Armor Ignore%</label>
          <input type="number" value={inputs.armorIgnore} onChange={(e) => handleChange("armorIgnore", +e.target.value)} className="w-full p-1 border rounded" />

          <label className="font-semibold">Res Ignore%</label>
          <input type="number" value={inputs.resIgnore} onChange={(e) => handleChange("resIgnore", +e.target.value)} className="w-full p-1 border rounded" />

          <label className="font-semibold">DOT%</label>
          <input type="number" value={inputs.dot} onChange={(e) => handleChange("dot", +e.target.value)} className="w-full p-1 border rounded" />
        </div>

        <div className="space-y-2">
          <label className="font-semibold">2nd Stat</label>
          <select value={secondStat} onChange={(e) => setSecondStat(e.target.value)} className="w-full p-1 border rounded">
            {stat_data.Mainstats.map((stat) => <option key={stat}>{stat}</option>)}
          </select>

          <label className="font-semibold">2nd Skill DMG%</label>
          <input type="number" value={inputs.secondSkillDmg} onChange={(e) => handleChange("secondSkillDmg", +e.target.value)} className="w-full p-1 border rounded" />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 bg-slate-900/60 border rounded-lg p-4">
        <div className="space-y-1">
          <label className="font-semibold">Enemy Armor</label>
          <input type="number" value={inputs.enemyArmor} onChange={(e) => handleChange("enemyArmor", +e.target.value)} className="w-full p-1 border rounded" />

          <label className="font-semibold">Enemy Resistance</label>
          <input type="number" value={inputs.enemyRes} onChange={(e) => handleChange("enemyRes", +e.target.value)} className="w-full p-1 border rounded" />
        </div>

        <div className="space-y-1">
          <label className="font-semibold">Player Level</label>
          <input type="number" value={inputs.playerLevel} onChange={(e) => handleChange("playerLevel", +e.target.value)} className="w-full p-1 border rounded" />

          <label className="font-semibold">Dungeon Level</label>
          <input type="number" value={inputs.dungeonLevel} onChange={(e) => handleChange("dungeonLevel", +e.target.value)} className="w-full p-1 border rounded" />

          <label className="font-semibold">Boss DEF Pen%</label>
          <input type="number" value={inputs.bossDefPen} onChange={(e) => handleChange("bossDefPen", +e.target.value)} className="w-full p-1 border rounded" />
        </div>

        <div className="space-y-1">
          <label className="font-semibold">Your Defense</label>
          <input type="number" value={inputs.defense} onChange={(e) => handleChange("defense", +e.target.value)} className="w-full p-1 border rounded" />

          <label className="font-semibold">Damage Reduction%</label>
          <input type="number" value={inputs.dmgReduction} onChange={(e) => handleChange("dmgReduction", +e.target.value)} className="w-full p-1 border rounded" />
        </div>

        <div className="space-y-1">
          <label className="font-semibold">Defense Cap</label>
          <input type="number" value={inputs.defCap} onChange={(e) => handleChange("defCap", +e.target.value)} className="w-full p-1 border rounded" />

          <label className="font-semibold">Effective {mainStat}</label>
          <input type="number" value={inputs.baseStat} onChange={(e) => handleChange("baseStat", +e.target.value)} className="w-full p-1 border rounded" />

          <label className="font-semibold">Total {mainStat} (buffed)</label>
          <input type="number" value={inputs.buffedStat} onChange={(e) => handleChange("buffedStat", +e.target.value)} className="w-full p-1 border rounded" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 text-center border rounded-lg p-4 bg-slate-900">
        <div className="space-y-2">
          <h2 className="font-semibold text-lg">Damage</h2>
          <div className="mx-auto inline-grid w-fit grid-cols-[max-content_max-content] gap-x-3 gap-y-1">
            <strong className="text-right">Non-Crit:</strong>
            <span className="text-right font-mono tabular-nums">{formatNumber(nonCrit)}</span>
            <strong className="text-right">Crit:</strong>
            <span className="text-right font-mono tabular-nums">{formatNumber(crit)}</span>
            <strong className="text-right">Maximized Crit:</strong>
            <span className="text-right font-mono tabular-nums">{formatNumber(maxcrit)}</span>
            <strong className="text-right">Avg:</strong>
            <span className="text-right font-mono tabular-nums">{formatNumber(average)}</span>
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="font-semibold text-lg">DOT & Threat</h2>
          <div><strong>DOT (Non-Crit):</strong> {formatNumber(dotNonCrit)}</div>
          <div><strong>DOT (Crit):</strong> {formatNumber(dotCrit)}</div>
          <div><strong>Threat (Non-Crit):</strong> {formatNumber(threatNonCrit)}</div>
          <div><strong>Threat (Crit):</strong> {formatNumber(threatCrit)}</div>
          <div><strong>Threat Avg:</strong> {formatNumber(threatAverage)}</div>
        </div>
      </div>
    </div>
  )
}
