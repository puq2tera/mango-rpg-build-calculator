"use client"

import { skill_data, type Skill } from "@/app/data/skill_data"
import stat_data from "@/app/data/stat_data"
import type { StoredBuildData, StoredBuildProfile } from "@/app/lib/buildStorage"
import { computeBuildStatStages, readBuildSnapshot } from "@/app/lib/buildStats"
import { computeSkillDisplayEffectStats } from "@/app/lib/debugComparisonSummary"
import {
  calculateDamage,
  defaultDamageCalcCustomSkillScaling,
  readDamageCalcState,
  type DamageCalcResult,
} from "@/app/lib/damageCalc"
import {
  getDamageCalcAttackPresets,
  type DamageCalcAttackPreset,
} from "@/app/lib/damageCalcAttackPresets"
import { calculateHealing, type HealingCalcResult } from "@/app/lib/healingCalc"
import {
  healingCalcSkillPresets,
  type HealingCalcSkillPreset,
  type HealingEffectType,
} from "@/app/lib/healingCalcSkillPresets"

type SavedBuildDamageComparisonMode =
  | "nonCrit"
  | "crit"
  | "average"
  | "maxcrit"
  | "dotNonCrit"
  | "dotCrit"
  | "dotMaxcrit"
  | "threat"

type SavedBuildHealingComparisonMode = "healNonCrit" | "healCrit" | "healAverage"

export type SavedBuildComparisonMode =
  | SavedBuildDamageComparisonMode
  | SavedBuildHealingComparisonMode
  | `buff:${string}`

export type SavedBuildSkillComparisonOption = {
  key: SavedBuildComparisonMode
  label: string
  source: "damage" | "healing" | "buff"
}

export type SavedBuildSkillOption = {
  name: string
  description: string
  note: string | null
  comparisonOptions: SavedBuildSkillComparisonOption[]
}

export type SavedBuildSkillCalculatedResult = {
  damageResult: DamageCalcResult | null
  healingResult: HealingCalcResult | null
  buffValues: Record<string, number>
}

export type SavedBuildCalculatedResult = {
  profile: StoredBuildProfile
  skills: SavedBuildSkillOption[]
  skillsByName: Map<string, SavedBuildSkillOption>
  presetsByName: Map<string, DamageCalcAttackPreset>
  healingPresetsByName: Map<string, HealingCalcSkillPreset>
  baseDamageState: ReturnType<typeof readDamageCalcState>
  snapshot: ReturnType<typeof readBuildSnapshot>
  stages: ReturnType<typeof computeBuildStatStages>
  stats: Record<string, number>
}

const savedBuildDamageComparisonModeOptions: Array<{
  key: SavedBuildDamageComparisonMode
  label: string
}> = [
  { key: "nonCrit", label: "Non-Crit" },
  { key: "crit", label: "Crit" },
  { key: "average", label: "Avg" },
  { key: "maxcrit", label: "Maximized" },
  { key: "dotNonCrit", label: "DOT (Non-Crit)" },
  { key: "dotCrit", label: "DOT (Crit)" },
  { key: "dotMaxcrit", label: "DOT (Maximized Crit)" },
  { key: "threat", label: "Threat" },
]

const savedBuildHealingComparisonModeOptions: Array<{
  key: SavedBuildHealingComparisonMode
  label: string
}> = [
  { key: "healNonCrit", label: "Non-Crit" },
  { key: "healCrit", label: "Crit" },
  { key: "healAverage", label: "Avg" },
]

export const savedBuildComparisonModeOptions: Array<{
  key: SavedBuildDamageComparisonMode | SavedBuildHealingComparisonMode
  label: string
}> = [
  ...savedBuildDamageComparisonModeOptions,
  ...savedBuildHealingComparisonModeOptions,
]

const savedBuildComparisonModeLabelByKey = new Map(
  savedBuildComparisonModeOptions.map((option) => [option.key, option.label]),
)

function isSavedBuildDamageComparisonMode(value: string): value is SavedBuildDamageComparisonMode {
  return savedBuildDamageComparisonModeOptions.some((option) => option.key === value)
}

function isSavedBuildHealingComparisonMode(value: string): value is SavedBuildHealingComparisonMode {
  return savedBuildHealingComparisonModeOptions.some((option) => option.key === value)
}

export function isSavedBuildComparisonMode(value: unknown): value is SavedBuildComparisonMode {
  return typeof value === "string"
    && (
      isSavedBuildDamageComparisonMode(value)
      || isSavedBuildHealingComparisonMode(value)
      || (value.startsWith("buff:") && value.length > "buff:".length)
    )
}

function createSavedBuildBuffComparisonMode(stat: string): SavedBuildComparisonMode {
  return `buff:${stat}`
}

function getSavedBuildBuffComparisonStat(mode: SavedBuildComparisonMode): string | null {
  return mode.startsWith("buff:") ? mode.slice("buff:".length) : null
}

export function getSavedBuildComparisonModeLabel(mode: SavedBuildComparisonMode): string {
  const buffStat = getSavedBuildBuffComparisonStat(mode)
  if (buffStat) {
    return buffStat
  }

  return (isSavedBuildDamageComparisonMode(mode) || isSavedBuildHealingComparisonMode(mode))
    ? savedBuildComparisonModeLabelByKey.get(mode) ?? mode
    : mode
}

function getHealingEffectLabel(effectType: HealingEffectType): string {
  switch (effectType) {
    case "heal":
      return "Healing"
    case "tempHp":
      return "Temp HP"
    case "overheal":
      return "Overheal"
  }
}

function isKnownBuffResultStat(stat: unknown): stat is string {
  return typeof stat === "string" && stat.length > 0 && stat in stat_data.StatsInfo
}

function collectSkillBuffResultStats(skill: Skill): string[] {
  const result: string[] = []
  const seen = new Set<string>()

  const addStat = (stat: unknown) => {
    if (!isKnownBuffResultStat(stat) || seen.has(stat)) {
      return
    }

    seen.add(stat)
    result.push(stat)
  }

  skill.conversions?.forEach(({ resulting_stat }) => addStat(resulting_stat))
  skill.stack_conversions?.forEach(({ resulting_stat }) => addStat(resulting_stat))
  Object.keys(skill.stats ?? {}).forEach(addStat)
  Object.keys(skill.stack_stats ?? {}).forEach(addStat)

  return result
}

function skillSupportsBuffStacks(skill: Skill): boolean {
  return (skill.stack_conversions?.length ?? 0) > 0 || Object.keys(skill.stack_stats ?? {}).length > 0
}

const buffResultStatsBySkillName = new Map(
  Object.entries(skill_data)
    .map(([name, skill]) => [name, collectSkillBuffResultStats(skill)] as const)
    .filter(([, stats]) => stats.length > 0),
)

function buildSavedBuildSkillOptions(
  damagePresets: readonly DamageCalcAttackPreset[],
  healingPresets: readonly HealingCalcSkillPreset[],
): SavedBuildSkillOption[] {
  const damagePresetsByName = new Map(damagePresets.map((preset) => [preset.name, preset]))
  const healingPresetsByName = new Map(healingPresets.map((preset) => [preset.name, preset]))

  return Object.entries(skill_data)
    .map(([name, skill]) => {
      const damagePreset = damagePresetsByName.get(name) ?? null
      const healingPreset = healingPresetsByName.get(name) ?? null
      const buffStats = buffResultStatsBySkillName.get(name) ?? []

      if (!damagePreset && !healingPreset && buffStats.length === 0) {
        return null
      }

      const comparisonOptions: SavedBuildSkillComparisonOption[] = [
        ...(damagePreset
          ? savedBuildDamageComparisonModeOptions.map((option) => ({
            key: option.key,
            label: option.label,
            source: "damage" as const,
          }))
          : []),
        ...(healingPreset
          ? savedBuildHealingComparisonModeOptions.map((option) => ({
            key: option.key,
            label: option.label,
            source: "healing" as const,
          }))
          : []),
        ...buffStats.map((stat) => ({
          key: createSavedBuildBuffComparisonMode(stat),
          label: stat,
          source: "buff" as const,
        })),
      ]
      const noteParts = [
        damagePreset?.note,
        healingPreset ? `${getHealingEffectLabel(healingPreset.effectType)}: ${healingPreset.baseStat}` : null,
        buffStats.length > 0 ? `Buff: ${buffStats.join(", ")}` : null,
      ].filter((value): value is string => Boolean(value))

      return {
        name,
        description: skill.description,
        note: noteParts.length > 0 ? noteParts.join(" · ") : null,
        comparisonOptions,
      }
    })
    .filter((skill): skill is SavedBuildSkillOption => skill !== null)
    .sort((left, right) => left.name.localeCompare(right.name))
}

function createStoredBuildDataStorage(data: StoredBuildData): Storage {
  const entries = new Map(Object.entries(data))

  return {
    get length() {
      return entries.size
    },
    clear() {
      entries.clear()
    },
    getItem(key: string) {
      return entries.get(key) ?? null
    },
    key(index: number) {
      return Array.from(entries.keys())[index] ?? null
    },
    removeItem(key: string) {
      entries.delete(key)
    },
    setItem(key: string, value: string) {
      entries.set(key, value)
    },
  } as Storage
}

export function buildSavedBuildCalculatedResults(
  profiles: readonly StoredBuildProfile[],
): SavedBuildCalculatedResult[] {
  return profiles.map((profile) => {
    const storage = createStoredBuildDataStorage(profile.data)
    const snapshot = readBuildSnapshot(storage)
    const stages = computeBuildStatStages(snapshot)
    const stats = stages.StatsDmgReady
    const baseDamageState = readDamageCalcState(storage)
    const damagePresets = getDamageCalcAttackPresets(stats)
    const skills = buildSavedBuildSkillOptions(damagePresets, healingCalcSkillPresets)

    return {
      profile,
      skills,
      skillsByName: new Map(skills.map((skill) => [skill.name, skill])),
      presetsByName: new Map(damagePresets.map((preset) => [preset.name, preset])),
      healingPresetsByName: new Map(healingCalcSkillPresets.map((preset) => [preset.name, preset])),
      baseDamageState,
      snapshot,
      stages,
      stats,
    }
  })
}

export function calculateSavedBuildSkillResult(
  build: SavedBuildCalculatedResult,
  skillName: string,
  options?: {
    buffStackOverride?: number | null
  },
): SavedBuildSkillCalculatedResult | null {
  const skill = build.skillsByName.get(skillName)
  if (!skill) {
    return null
  }

  const damagePreset = build.presetsByName.get(skillName) ?? null
  const healingPreset = build.healingPresetsByName.get(skillName) ?? null
  const damageResult = damagePreset
    ? calculateDamage(build.stats, {
      ...build.baseDamageState,
      attackPreset: damagePreset.name,
      mainStat: damagePreset.mainStat,
      secondStat: damagePreset.secondStat,
      element: damagePreset.element,
      penElement: damagePreset.penElement,
      skillType: damagePreset.skillType,
      customSkillScaling: {
        ...defaultDamageCalcCustomSkillScaling,
        enabled: false,
      },
      inputs: {
        ...build.baseDamageState.inputs,
        ...damagePreset.inputs,
      },
    })
    : null
  const healingResult = healingPreset
    ? calculateHealing({
      baseStat: healingPreset.baseStat,
      totalStat: build.stats[healingPreset.baseStat] ?? build.stages.StatsBase[healingPreset.baseStat] ?? 0,
      skillHealPercent: healingPreset.skillHealPercent,
      skillFlatHeal: healingPreset.skillFlatHeal,
    })
    : null
  const buffStackOverride = options?.buffStackOverride
  const buffValues = skill.comparisonOptions.some((option) => option.source === "buff")
    ? computeSkillDisplayEffectStats(
      skillName,
      build.stages.StatsBuffReady,
      buffStackOverride === null || buffStackOverride === undefined
        ? build.snapshot.selectedBuffStacks
        : {
          ...build.snapshot.selectedBuffStacks,
          [skillName]: buffStackOverride,
        },
    )
    : {}

  return {
    damageResult,
    healingResult,
    buffValues,
  }
}

export function getSavedBuildSkillComparisonOptions(
  build: SavedBuildCalculatedResult,
  skillName: string,
): SavedBuildSkillComparisonOption[] {
  return build.skillsByName.get(skillName)?.comparisonOptions ?? []
}

export function doesSavedBuildSkillSupportBuffStacks(
  build: SavedBuildCalculatedResult,
  skillName: string,
): boolean {
  if (!build.skillsByName.has(skillName)) {
    return false
  }

  const skill = skill_data[skillName]
  return Boolean(skill) && skillSupportsBuffStacks(skill)
}

export function getSavedBuildSkillDefaultStackCount(
  build: SavedBuildCalculatedResult,
  skillName: string,
): number {
  return build.snapshot.selectedBuffStacks[skillName] ?? 0
}

export function getDefaultSavedBuildSkillComparisonMode(
  build: SavedBuildCalculatedResult,
  skillName: string,
): SavedBuildComparisonMode | null {
  return getSavedBuildSkillComparisonOptions(build, skillName)[0]?.key ?? null
}

export function isSavedBuildSkillComparisonModeAvailable(
  build: SavedBuildCalculatedResult,
  skillName: string,
  mode: SavedBuildComparisonMode,
): boolean {
  return getSavedBuildSkillComparisonOptions(build, skillName).some((option) => option.key === mode)
}

export function getSavedBuildCalculatedValue(
  result: SavedBuildSkillCalculatedResult,
  mode: SavedBuildComparisonMode,
): number | null {
  if (isSavedBuildDamageComparisonMode(mode)) {
    if (!result.damageResult) {
      return null
    }

    switch (mode) {
      case "nonCrit":
        return result.damageResult.nonCrit
      case "crit":
        return result.damageResult.crit
      case "average":
        return result.damageResult.average
      case "maxcrit":
        return result.damageResult.maxcrit
      case "dotNonCrit":
        return result.damageResult.dotNonCrit
      case "dotCrit":
        return result.damageResult.dotCrit
      case "dotMaxcrit":
        return result.damageResult.dotMaxcrit
      case "threat":
        return result.damageResult.threatMaxcrit
    }
  }

  if (isSavedBuildHealingComparisonMode(mode)) {
    if (!result.healingResult) {
      return null
    }

    switch (mode) {
      case "healNonCrit":
        return result.healingResult.nonCrit
      case "healCrit":
        return result.healingResult.crit
      case "healAverage":
        return result.healingResult.average
    }
  }

  const buffStat = getSavedBuildBuffComparisonStat(mode)
  if (!buffStat) {
    return null
  }

  return result.buffValues[buffStat] ?? 0
}
