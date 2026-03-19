"use client"

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react"
import stat_data from "../data/stat_data"
import { BUILD_SNAPSHOT_UPDATED_EVENT } from "@/app/lib/buildEvents"
import { computeBuildStatStages, readBuildSnapshot } from "@/app/lib/buildStats"
import {
  calculatePlayerDamageReduction,
  calculateDamage,
  DAMAGE_CALC_CUSTOM_SKILL_SCALING_CUSTOM_SOURCE,
  damageCalcCustomSkillScalingSources,
  defaultDamageCalcCustomSkillScaling,
  defaultDamageCalcState,
  getDamageCalcCustomSkillScalingSourceValue,
  getDamageCalcEffectiveSkillDmgPercent,
  persistDamageCalcState,
  readDamageCalcState,
  type DamageCalcCustomSkillScaling,
  type DamageCalcInputs,
} from "@/app/lib/damageCalc"
import { attackPresetInputKeys, getDamageCalcAttackPresets } from "@/app/lib/damageCalcAttackPresets"

const attackPresetInputKeySet = new Set<keyof DamageCalcInputs>(attackPresetInputKeys)
const defaultLearnedSkillNames = ["Punch", "Wait", "Focus"] as const
const ATTACK_PRESET_LISTBOX_ID = "damage-calc-attack-presets"

function normalizeSearchValue(value: string): string {
  return value.trim().toLocaleLowerCase()
}

export default function DamageCalc() {
  const [stats, setStats] = useState<Record<string, number>>({})
  const [learnedSkillNames, setLearnedSkillNames] = useState<string[]>([...defaultLearnedSkillNames])
  const [isHydrated, setIsHydrated] = useState(false)
  const [attackPreset, setAttackPreset] = useState(defaultDamageCalcState.attackPreset)
  const [attackPresetInputValue, setAttackPresetInputValue] = useState("")
  const [showLearnedOnly, setShowLearnedOnly] = useState(false)
  const [isAttackPresetDropdownOpen, setIsAttackPresetDropdownOpen] = useState(false)
  const [highlightedAttackPresetIndex, setHighlightedAttackPresetIndex] = useState(0)
  const [mainStat, setMainStat] = useState(defaultDamageCalcState.mainStat)
  const [secondStat, setSecondStat] = useState(defaultDamageCalcState.secondStat)
  const [element, setElement] = useState(defaultDamageCalcState.element)
  const [penElement, setPenElement] = useState(defaultDamageCalcState.penElement)
  const [skillType, setSkillType] = useState(defaultDamageCalcState.skillType)
  const [customSkillScaling, setCustomSkillScaling] = useState<DamageCalcCustomSkillScaling>(
    defaultDamageCalcCustomSkillScaling,
  )
  const [inputs, setInputs] = useState<DamageCalcInputs>(defaultDamageCalcState.inputs)
  const attackPresetFieldRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const storedState = readDamageCalcState(localStorage)
    const refreshBuildStats = () => {
      const snapshot = readBuildSnapshot(localStorage)
      const stages = computeBuildStatStages(snapshot)
      const nextLearnedSkillNames = Array.from(new Set([
        ...defaultLearnedSkillNames,
        ...snapshot.selectedSkills,
      ]))

      setStats(stages.StatsDmgReady)
      setLearnedSkillNames(nextLearnedSkillNames)
    }
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshBuildStats()
      }
    }

    setAttackPreset(storedState.attackPreset)
    setAttackPresetInputValue(storedState.attackPreset)
    setMainStat(storedState.mainStat)
    setSecondStat(storedState.secondStat)
    setElement(storedState.element)
    setPenElement(storedState.penElement)
    setSkillType(storedState.skillType)
    setCustomSkillScaling(storedState.customSkillScaling)
    setInputs(storedState.inputs)
    refreshBuildStats()
    setIsHydrated(true)

    window.addEventListener(BUILD_SNAPSHOT_UPDATED_EVENT, refreshBuildStats)
    window.addEventListener("focus", refreshBuildStats)
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      window.removeEventListener(BUILD_SNAPSHOT_UPDATED_EVENT, refreshBuildStats)
      window.removeEventListener("focus", refreshBuildStats)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [])

  useEffect(() => {
    if (!isHydrated) return

    persistDamageCalcState(localStorage, {
      attackPreset,
      mainStat,
      secondStat,
      element,
      penElement,
      skillType,
      customSkillScaling,
      inputs,
    })
    window.dispatchEvent(new Event("damageCalcUpdated"))
  }, [attackPreset, customSkillScaling, element, inputs, isHydrated, mainStat, penElement, secondStat, skillType])

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Node)) {
        return
      }

      if (attackPresetFieldRef.current?.contains(target)) {
        return
      }

      setIsAttackPresetDropdownOpen(false)
    }

    document.addEventListener("mousedown", handlePointerDown)
    return () => {
      document.removeEventListener("mousedown", handlePointerDown)
    }
  }, [])

  const attackPresets = getDamageCalcAttackPresets(stats)
  const selectedAttackPreset = attackPresets.find((entry) => entry.name === attackPreset) ?? null
  const learnedSkillNameSet = new Set(learnedSkillNames)
  const normalizedAttackPresetInputValue = normalizeSearchValue(attackPresetInputValue)
  const normalizedSelectedAttackPreset = normalizeSearchValue(attackPreset)
  const normalizedAttackPresetFilterValue =
    attackPreset.length > 0 && normalizedAttackPresetInputValue === normalizedSelectedAttackPreset
      ? ""
      : normalizedAttackPresetInputValue
  const filteredAttackPresets = useMemo(() => {
    return attackPresets.filter((preset) => {
      if (showLearnedOnly && !learnedSkillNameSet.has(preset.name)) {
        return false
      }

      if (normalizedAttackPresetFilterValue.length === 0) {
        return true
      }

      const searchableText = [
        preset.name,
        preset.description,
        preset.note ?? "",
      ].join("\n").toLocaleLowerCase()

      return searchableText.includes(normalizedAttackPresetFilterValue)
    })
  }, [attackPresets, learnedSkillNameSet, normalizedAttackPresetFilterValue, showLearnedOnly])
  const selectedPresetHiddenByFilters = selectedAttackPreset !== null && showLearnedOnly && !learnedSkillNameSet.has(selectedAttackPreset.name)

  useEffect(() => {
    if (filteredAttackPresets.length === 0) {
      setHighlightedAttackPresetIndex(0)
      return
    }

    setHighlightedAttackPresetIndex((current) => Math.min(current, filteredAttackPresets.length - 1))
  }, [filteredAttackPresets])

  const {
    nonCrit,
    crit,
    maxcrit,
    average,
    dotNonCrit,
    dotCrit,
    threatNonCrit,
    threatCrit,
    threatMaxcrit,
    threatAverage,
  } = calculateDamage(stats, {
    attackPreset,
    mainStat,
    secondStat,
    element,
    penElement,
    skillType,
    customSkillScaling,
    inputs,
  })
  const playerDefense = stats.DEF ?? 0
  const playerDamageReduction = calculatePlayerDamageReduction({
    defense: playerDefense,
    dungeonLevel: inputs.dungeonLevel,
    bossDefPen: inputs.bossDefPen,
  })

  const formatNumber = (value: number): string => value.toLocaleString("en-US")
  const formatDerivedValue = (value: number, maximumFractionDigits = 2): string => (
    Number.isFinite(value)
      ? value.toLocaleString("en-US", { maximumFractionDigits })
      : "Infinity"
  )
  const effectiveSkillDmg = getDamageCalcEffectiveSkillDmgPercent(stats, inputs, customSkillScaling)
  const customSkillScalingSourceValue = getDamageCalcCustomSkillScalingSourceValue(stats, customSkillScaling)

  const clearAttackPresetSelection = () => {
    setAttackPreset("")
    setAttackPresetInputValue("")
    setIsAttackPresetDropdownOpen(false)
  }

  const handleChange = (field: keyof DamageCalcInputs, value: number) => {
    if (attackPresetInputKeySet.has(field)) {
      clearAttackPresetSelection()
    }

    setInputs((prev) => ({ ...prev, [field]: value }))
  }

  const handleCustomSkillScalingChange = (nextValue: Partial<DamageCalcCustomSkillScaling>) => {
    clearAttackPresetSelection()
    setCustomSkillScaling((prev) => ({ ...prev, ...nextValue }))
  }

  const handleAttackPresetChange = (nextPreset: string) => {
    setAttackPresetInputValue(nextPreset)

    if (!nextPreset) {
      setAttackPreset("")
      return
    }

    const preset = attackPresets.find((entry) => entry.name === nextPreset)
    if (!preset) {
      setAttackPreset("")
      return
    }

    setAttackPreset(nextPreset)
    setMainStat(preset.mainStat)
    setSecondStat(preset.secondStat)
    setElement(preset.element)
    setPenElement(preset.penElement)
    setSkillType(preset.skillType)
    setCustomSkillScaling(defaultDamageCalcCustomSkillScaling)
    setInputs((prev) => ({ ...prev, ...preset.inputs }))
    setIsAttackPresetDropdownOpen(false)
  }

  const handleAttackPresetInputChange = (nextValue: string) => {
    setAttackPresetInputValue(nextValue)
    setIsAttackPresetDropdownOpen(true)

    if (!nextValue) {
      setAttackPreset("")
      return
    }

    const preset = attackPresets.find((entry) => entry.name === nextValue)
    if (!preset) {
      setAttackPreset("")
      return
    }

    handleAttackPresetChange(nextValue)
  }

  const handleAttackPresetKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault()
      if (!isAttackPresetDropdownOpen) {
        setIsAttackPresetDropdownOpen(true)
        return
      }

      if (filteredAttackPresets.length > 0) {
        setHighlightedAttackPresetIndex((current) => Math.min(current + 1, filteredAttackPresets.length - 1))
      }
      return
    }

    if (event.key === "ArrowUp") {
      event.preventDefault()
      if (!isAttackPresetDropdownOpen) {
        setIsAttackPresetDropdownOpen(true)
        return
      }

      if (filteredAttackPresets.length > 0) {
        setHighlightedAttackPresetIndex((current) => Math.max(current - 1, 0))
      }
      return
    }

    if (event.key === "Enter" && isAttackPresetDropdownOpen) {
      const highlightedPreset = filteredAttackPresets[highlightedAttackPresetIndex]
      if (highlightedPreset) {
        event.preventDefault()
        handleAttackPresetChange(highlightedPreset.name)
      }
      return
    }

    if (event.key === "Escape") {
      setIsAttackPresetDropdownOpen(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-center">Damage Calculator</h1>

      <div className="rounded-lg border bg-slate-900/60 p-4">
        <div className="grid gap-x-4 gap-y-2 md:grid-cols-[minmax(0,18rem)_1fr]">
          <div className="flex items-center justify-between gap-3">
            <label className="font-semibold text-slate-100">Skill Preset</label>
            <label className="inline-flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={showLearnedOnly}
                onChange={(e) => setShowLearnedOnly(e.target.checked)}
              />
              <span>Only show learned skills</span>
            </label>
          </div>

          <div ref={attackPresetFieldRef} className="relative">
            <div className="flex overflow-hidden rounded border bg-slate-950">
              <input
                type="text"
                value={attackPresetInputValue}
                onChange={(e) => handleAttackPresetInputChange(e.target.value)}
                onFocus={() => setIsAttackPresetDropdownOpen(true)}
                onKeyDown={handleAttackPresetKeyDown}
                placeholder="Custom Skill"
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={isAttackPresetDropdownOpen}
                aria-controls={ATTACK_PRESET_LISTBOX_ID}
                className="w-full bg-transparent p-1 outline-none"
              />
              <button
                type="button"
                onClick={() => setIsAttackPresetDropdownOpen((current) => !current)}
                aria-label={isAttackPresetDropdownOpen ? "Hide skill presets" : "Show skill presets"}
                aria-expanded={isAttackPresetDropdownOpen}
                aria-controls={ATTACK_PRESET_LISTBOX_ID}
                className="border-l border-slate-700 px-2 text-slate-300 transition hover:bg-slate-800 hover:text-slate-100"
              >
                v
              </button>
            </div>

            {isAttackPresetDropdownOpen ? (
              <div
                id={ATTACK_PRESET_LISTBOX_ID}
                role="listbox"
                className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded border border-slate-700 bg-slate-950 shadow-[0_18px_40px_rgba(2,6,23,0.45)]"
              >
                {filteredAttackPresets.length > 0 ? (
                  filteredAttackPresets.map((preset, index) => (
                    <button
                      key={preset.name}
                      type="button"
                      role="option"
                      aria-selected={preset.name === attackPreset}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => handleAttackPresetChange(preset.name)}
                      onMouseEnter={() => setHighlightedAttackPresetIndex(index)}
                      className={`block w-full px-3 py-2 text-left text-sm transition ${
                        index === highlightedAttackPresetIndex
                          ? "bg-sky-500/20 text-sky-100"
                          : preset.name === attackPreset
                            ? "bg-slate-800 text-slate-100"
                            : "text-slate-200 hover:bg-slate-800"
                      }`}
                    >
                      <div className="font-medium">{preset.name}</div>
                      <div className="truncate text-xs text-slate-400">{preset.description}</div>
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-2 text-sm text-slate-400">
                    No presets match the current filter.
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {selectedAttackPreset ? (
            <div className="flex h-full flex-col justify-center space-y-2 md:col-start-2 md:row-start-2">
              <p className="text-sm text-slate-100">{selectedAttackPreset.description}</p>
              {selectedAttackPreset.note ? (
                <p className="text-xs uppercase tracking-[0.12em] text-slate-400">
                  {selectedAttackPreset.note}
                </p>
              ) : null}
            </div>
          ) : // If an invalid skill is selected (or "Custom Skill")
          <div className="flex h-full flex-col justify-center space-y-2 md:col-start-2 md:row-start-2">
            <p className="text-sm text-slate-100">{"Select a skill to autofill the fields below"}</p>
          </div>}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 bg-slate-900/60 border rounded-lg p-4">
        <div className="space-y-2">
          <label className="font-semibold">Primary Stat</label>
          <select
            value={mainStat}
            onChange={(e) => {
              clearAttackPresetSelection()
              setMainStat(e.target.value)
            }}
            className="w-full p-1 border rounded"
          >
            {stat_data.Mainstats.map((stat) => <option key={stat}>{stat}</option>)}
          </select>

          <label className="font-semibold">Element</label>
          <select
            value={element}
            onChange={(e) => {
              clearAttackPresetSelection()
              setElement(e.target.value)
            }}
            className="w-full p-1 border rounded"
          >
            {stat_data.AllElements.map((entry) => <option key={entry}>{entry}</option>)}
          </select>

          <label className="font-semibold">Pen Element</label>
          <select
            value={penElement}
            onChange={(e) => {
              clearAttackPresetSelection()
              setPenElement(e.target.value)
            }}
            className="w-full p-1 border rounded"
          >
            {stat_data.AllElements.map((entry) => <option key={entry}>{entry}</option>)}
          </select>
        </div>

        <div className="space-y-2">
          <label className="font-semibold">Skill Type</label>
          <select
            value={skillType}
            onChange={(e) => {
              clearAttackPresetSelection()
              setSkillType(e.target.value)
            }}
            className="w-full p-1 border rounded"
          >
            {stat_data.SkillTypes.map((entry) => <option key={entry}>{entry}</option>)}
          </select>

          <label className="font-semibold">Skill DMG%</label>
          <input
            type="number"
            value={inputs.skillDmg}
            onChange={(e) => handleChange("skillDmg", +e.target.value)}
            disabled={customSkillScaling.enabled}
            className="w-full p-1 border rounded disabled:cursor-not-allowed disabled:opacity-60"
          />

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
          <select
            value={secondStat}
            onChange={(e) => {
              clearAttackPresetSelection()
              setSecondStat(e.target.value)
            }}
            className="w-full p-1 border rounded"
          >
            {stat_data.Mainstats.map((stat) => <option key={stat}>{stat}</option>)}
          </select>

          <label className="font-semibold">2nd Skill DMG%</label>
          <input type="number" value={inputs.secondSkillDmg} onChange={(e) => handleChange("secondSkillDmg", +e.target.value)} className="w-full p-1 border rounded" />
        </div>

        <div className="space-y-2">
          <label className="inline-flex items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              checked={customSkillScaling.enabled}
              onChange={(e) => handleCustomSkillScalingChange({ enabled: e.target.checked })}
            />
            <span>Custom skill scaling</span>
          </label>

          {customSkillScaling.enabled ? (
            <div className="space-y-2 rounded border border-slate-700 bg-slate-950/50 p-2">
              <div className="space-y-1">
                <label className="block text-sm font-semibold">Scaling Stat</label>
                <select
                  value={customSkillScaling.stat}
                  onChange={(e) => handleCustomSkillScalingChange({ stat: e.target.value })}
                  className="w-full p-1 border rounded"
                >
                  {damageCalcCustomSkillScalingSources.map((stat) => <option key={stat}>{stat}</option>)}
                </select>
              </div>

              {customSkillScaling.stat === DAMAGE_CALC_CUSTOM_SKILL_SCALING_CUSTOM_SOURCE ? (
                <div className="space-y-1">
                  <label className="block text-sm font-semibold">Custom Stat Value</label>
                  <input
                    type="number"
                    value={customSkillScaling.customValue}
                    onChange={(e) => handleCustomSkillScalingChange({ customValue: +e.target.value })}
                    className="w-full p-1 border rounded"
                  />
                </div>
              ) : null}

              <div className="space-y-1">
                <label className="block text-sm font-semibold">Scaling %</label>
                <input
                  type="number"
                  value={customSkillScaling.percent}
                  onChange={(e) => handleCustomSkillScalingChange({ percent: +e.target.value })}
                  className="w-full p-1 border rounded"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-semibold">Resolved Stat Value</label>
                <div className="w-full rounded border bg-slate-950/60 px-2 py-1 font-mono tabular-nums">
                  {formatDerivedValue(customSkillScalingSourceValue, 2)}
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-semibold">Effective Skill DMG%</label>
                <div className="w-full rounded border bg-slate-950/60 px-2 py-1 font-mono tabular-nums">
                  {formatDerivedValue(effectiveSkillDmg, 2)}
                </div>
              </div>
            </div>
          ) : null}
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
          <label className="font-semibold">Dungeon Level</label>
          <input type="number" value={inputs.dungeonLevel} onChange={(e) => handleChange("dungeonLevel", +e.target.value)} className="w-full p-1 border rounded" />

          <label className="font-semibold">Boss DEF Pen%</label>
          <input type="number" value={inputs.bossDefPen} onChange={(e) => handleChange("bossDefPen", +e.target.value)} className="w-full p-1 border rounded" />
        </div>

        <div className="space-y-1">
          <label className="font-semibold">Defense</label>
          <div className="w-full rounded border bg-slate-950/60 px-2 py-1 font-mono tabular-nums">
            {formatDerivedValue(playerDefense, 0)}
          </div>

          <label className="font-semibold">Damage Reduction%</label>
          <div className="w-full rounded border bg-slate-950/60 px-2 py-1 font-mono tabular-nums">
            {formatDerivedValue(playerDamageReduction.effectiveReductionPercent, 3)}
          </div>
        </div>

        <div className="space-y-1">
          <label className="font-semibold">Defense Cap</label>
          <div className="w-full rounded border bg-slate-950/60 px-2 py-1 font-mono tabular-nums">
            {formatDerivedValue(playerDamageReduction.defenseCap, 2)}
          </div>
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
          <div><strong>Threat (Maximized Crit):</strong> {formatNumber(threatMaxcrit)}</div>
          <div><strong>Threat Avg:</strong> {formatNumber(threatAverage)}</div>
        </div>
      </div>
    </div>
  )
}
