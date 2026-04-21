"use client"

import { race_data_by_tag } from "@/app/data/race_data"
import { skill_data } from "@/app/data/skill_data"
import stat_data from "@/app/data/stat_data"
import tarot_data from "@/app/data/tarot_data"
import { groupAdditionalStageStatEntries } from "@/app/lib/additionalStageStats"
import {
  computeBuildStatStages,
  expandCompoundStats,
  getOrderedBuffPercentBeforeByName,
  readBuildSnapshot,
  type BuildSnapshot,
  type BuildStatStages,
} from "@/app/lib/buildStats"
import {
  THREAT_BONUS_DISPLAY_STAT,
  THREAT_LEVELS_STAT,
  getDisplayedThreatBonusModifierPercent,
  getDisplayedThreatLevelModifierPercent,
  getDisplayedThreatModifierPercent,
  isInternalThreatStat,
} from "@/app/lib/threat"
import { truncateTowardZero } from "@/app/lib/statRounding"

type ClassKey = "tank" | "warrior" | "caster" | "healer"

type SummaryProfile = {
  raceName: string
  rebirthLevel: number
}

export type SummaryState = {
  profile: SummaryProfile
  snapshot: BuildSnapshot
  stages: BuildStatStages
  charcardStages: BuildStatStages
  dungeonMainStats: Record<string, number>
  displayBaseStats: Record<string, number>
  displayDungeonStats: Record<string, number>
  totalLevels: number
  raceName: string
  nextLevelExp: number
  availableSkillPoints: number
  usedSkillPoints: number
  remainingSkillPoints: number
  availableTalentPoints: number
  usedTalentPoints: number
  remainingTalentPoints: number
  activeEffects: ActiveEffect[]
}

export type ActiveEffect = {
  id: string
  title: string
  sourceType: "skill" | "tarot"
  description: string
  deltas: EffectDelta[]
}

export type EffectDelta = {
  stat: string
  delta: number
  label?: string
}

type EffectSourceData = {
  description: string
  conversions?: Array<{
    source: string
    ratio: number
    resulting_stat: string
  }>
  stack_conversions?: Array<{
    source: string
    ratio: number
    resulting_stat: string
  }>
  stats?: Record<string, number>
  stack_stats?: Record<string, number>
}

export type TerminalMainRow = {
  label: string
  value: string
  modifier?: string
}

export type TerminalDetailRow = {
  label: string
  value: string
}

export type TypeBonusRow = {
  label: string
  dmg: string
  xDmg: string
  pen: string
  xPen: string
}

export type ElementRow = {
  label: string
  dmg: string
  res: string
  pen: string
}

export type LabelValueRow = {
  label: string
  value: string
}

export type TerminalCardData = {
  mainRows: TerminalMainRow[]
  detailRows: TerminalDetailRow[]
  typeRows: TypeBonusRow[]
  elementRows: ElementRow[]
}

export type CalcSkillBuff = {
  name: string
  effects: Array<{
    stat: string
    value: number
    label: string
  }>
}

const profileDefaults: SummaryProfile = {
  raceName: "Northern Human",
  rebirthLevel: 75,
}

const classKeys: ClassKey[] = ["tank", "warrior", "caster", "healer"]

const effectPriority = [
  "ATK",
  "DEF",
  "MATK",
  "HEAL",
  "HP",
  "MP",
  "Focus",
  "Threat%",
  "All Res%",
  "Dmg%",
  "DMG Res%",
  "Crit Chance%",
  "Crit DMG%",
  "Bow Crit Chance%",
  "Bow Crit DMG%",
  "Phys%",
  "Phys Pen%",
  "Elemental%",
  "Elemental Pen%",
  "Divine%",
  "Divine Pen%",
  "Void%",
  "Void Pen%",
  "Bow%",
  "Bow DMG%",
  "Blunt%",
  "Pierce%",
  "Slash%",
  "Fire%",
  "Lightning%",
  "Water%",
  "Earth%",
  "Wind%",
  "Toxic%",
  "Neg%",
  "Holy%",
] as const

const effectPriorityIndex = new Map<string, number>(effectPriority.map((stat, index) => [stat, index]))

const dungeonDisplayElements = [
  { key: "Fire", family: "Elemental" },
  { key: "Lightning", family: "Elemental" },
  { key: "Water", family: "Elemental" },
  { key: "Earth", family: "Elemental" },
  { key: "Wind", family: "Elemental" },
  { key: "Toxic", family: "Elemental" },
  { key: "Void", family: "Void" },
  { key: "Neg", family: "Divine" },
  { key: "Holy", family: "Divine" },
  { key: "Blunt", family: "Phys" },
  { key: "Pierce", family: "Phys" },
  { key: "Slash", family: "Phys" },
] as const

const characterCardSeparateCompoundStats = [
  "All%",
  "All Res%",
  "Phys%",
  "Phys Pen%",
  "Phys xDmg%",
  "Phys xPen%",
  "Elemental%",
  "Elemental Pen%",
  "Elemental xDmg%",
  "Elemental xPen%",
  "Divine%",
  "Divine Pen%",
  "Divine xDmg%",
  "Divine xPen%",
] as const

function getXpToNextLevel(level: number): number {
  const normalizedLevel = Math.max(0, Math.floor(level))

  if (normalizedLevel <= 120) {
    return 60 + (4 * normalizedLevel) + (500 * Math.floor(normalizedLevel / 20))
  }

  if (normalizedLevel <= 259) {
    const extraAfter140 = normalizedLevel >= 140 ? 1000 * (Math.floor((normalizedLevel - 140) / 20) + 1) : 0
    return 6544 + (4 * (normalizedLevel - 121)) + extraAfter140
  }

  if (normalizedLevel <= 340) {
    return 21150 + (6 * (normalizedLevel - 260)) + (1500 * Math.floor((normalizedLevel - 260) / 20))
  }

  if (normalizedLevel <= 359) {
    return 41454 + (9 * (normalizedLevel - 341))
  }

  return 43875 + (9 * (normalizedLevel - 360)) + (2250 * Math.floor((normalizedLevel - 360) / 20))
}

export function formatWhole(value: number): string {
  if (!Number.isFinite(value)) {
    return "0"
  }

  return Math.round(value).toLocaleString("en-US")
}

function formatFixed(value: number, digits = 1): string {
  if (!Number.isFinite(value)) {
    return "0"
  }

  return value.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

function formatSignedPercent(value: number, digits = 0): string {
  const absolute = digits === 0 ? formatWhole(Math.abs(value)) : formatFixed(Math.abs(value), digits)
  return `${value >= 0 ? "+" : "-"}${absolute}%`
}

function formatPercent(value: number, digits = 0): string {
  const formatted = digits === 0 ? formatWhole(value) : formatFixed(value, digits)
  return `${formatted}%`
}

function formatCharacterCardOverdriveScalingPercent(value: number): string {
  if (!Number.isFinite(value)) {
    return "0%"
  }

  return `${formatFixed(value, 5)}%`
}

function formatDungeonOverdriveScalingPercent(value: number): string {
  if (!Number.isFinite(value)) {
    return "0%"
  }

  return `${String(value / 100)}%`
}

function getStat(stats: Record<string, number>, key: string): number {
  if (key === "Threat%") {
    return getDisplayedThreatModifierPercent(stats)
  }

  if (key === THREAT_LEVELS_STAT) {
    return getDisplayedThreatLevelModifierPercent(stats)
  }

  if (key === THREAT_BONUS_DISPLAY_STAT) {
    return getDisplayedThreatBonusModifierPercent(stats)
  }

  return stats[key] ?? 0
}

function getRaceName(snapshot: BuildSnapshot): string {
  if (snapshot.selectedRace && snapshot.selectedRace in race_data_by_tag) {
    return race_data_by_tag[snapshot.selectedRace as keyof typeof race_data_by_tag].name
  }

  return profileDefaults.raceName
}

function getUsedSkillPoints(snapshot: BuildSnapshot): number {
  const selectedSkillPoints = snapshot.selectedSkills.reduce((total, skillName) => total + (skill_data[skillName]?.sp ?? 0), 0)
  const trainingPointsSpent = Object.values(snapshot.selectedTraining).reduce((total, value) => {
    return total + (Number.isFinite(value) ? value : 0)
  }, 0)

  return selectedSkillPoints + trainingPointsSpent
}

function isTarotEquipmentSlot(slot: BuildSnapshot["equipmentSlots"][number] | undefined): boolean {
  return slot?.type === "Tarot"
}

function getCharcardSnapshot(snapshot: BuildSnapshot): BuildSnapshot {
  return {
    ...snapshot,
    enabledEquipment: snapshot.enabledEquipment.filter((index) => !isTarotEquipmentSlot(snapshot.equipmentSlots[index])),
  }
}

function mergeStats(...sources: Record<string, number>[]): Record<string, number> {
  const merged: Record<string, number> = {}

  for (const source of sources) {
    for (const [stat, value] of Object.entries(source)) {
      merged[stat] = (merged[stat] ?? 0) + value
    }
  }

  return merged
}

function addExpandedStat(target: Record<string, number>, stat: string, value: number): void {
  if (!Number.isFinite(value) || Math.abs(value) < 0.0001) {
    return
  }

  target[stat] = (target[stat] ?? 0) + value
  const info = stat_data.StatsInfo[stat as keyof typeof stat_data.StatsInfo]
  if (!info?.sub_stats) {
    return
  }

  for (const subStat of info.sub_stats) {
    target[subStat] = (target[subStat] ?? 0) + value
  }
}

function getMergedDisplayStatValue(
  sourceStats: Record<string, number>,
  activeExpandedStats: Record<string, number>,
  stat: string,
): number {
  return (sourceStats[stat] ?? 0) + (activeExpandedStats[stat] ?? 0)
}

function getHighestDisplayStatValue(
  sourceStats: Record<string, number>,
  activeExpandedStats: Record<string, number>,
  stats: readonly string[],
): number {
  return stats.reduce(
    (highest, stat) => Math.max(highest, getMergedDisplayStatValue(sourceStats, activeExpandedStats, stat)),
    0,
  )
}

function getDisplayConversionSourceValue(
  sourceStats: Record<string, number>,
  activeExpandedStats: Record<string, number>,
  sourceStat: string,
): number {
  switch (sourceStat) {
    case "Highest Phys%":
      return getHighestDisplayStatValue(sourceStats, activeExpandedStats, ["Slash%", "Pierce%", "Blunt%"])
    case "Highest Phys Pen%":
      return getHighestDisplayStatValue(sourceStats, activeExpandedStats, ["Slash Pen%", "Pierce Pen%", "Blunt Pen%"])
    case "Highest Magic%":
      return getHighestDisplayStatValue(sourceStats, activeExpandedStats, [
        "Fire%",
        "Water%",
        "Lightning%",
        "Wind%",
        "Earth%",
        "Toxic%",
        "Neg%",
        "Holy%",
        "Void%",
      ])
    case "Highest Magic Pen%":
      return getHighestDisplayStatValue(sourceStats, activeExpandedStats, [
        "Fire Pen%",
        "Water Pen%",
        "Lightning Pen%",
        "Wind Pen%",
        "Earth Pen%",
        "Toxic Pen%",
        "Neg Pen%",
        "Holy Pen%",
        "Void Pen%",
      ])
    case "Post Crit Chance%":
      return getMergedDisplayStatValue(sourceStats, activeExpandedStats, "Crit Chance%")
    default:
      return sourceStats[sourceStat] ?? 0
  }
}

function addDisplayEffectStat(
  rawStats: Record<string, number>,
  expandedStats: Record<string, number>,
  stat: string,
  value: number,
): void {
  const info = stat_data.StatsInfo[stat as keyof typeof stat_data.StatsInfo]
  if (!info || !Number.isFinite(value) || Math.abs(value) < 0.0001) {
    return
  }

  rawStats[stat] = (rawStats[stat] ?? 0) + value
  addExpandedStat(expandedStats, stat, value)
}

function applyDisplayFlatEffectStat(
  rawStats: Record<string, number>,
  expandedStats: Record<string, number>,
  sourceStats: Record<string, number>,
  targetStat: string,
  targetValue: number,
  stackCount = 1,
  flatStatScale = 1,
  buffPercentOverride?: number,
): void {
  const info = stat_data.StatsInfo[targetStat as keyof typeof stat_data.StatsInfo]
  if (!info) {
    return
  }

  const buffPercent = buffPercentOverride ?? getMergedDisplayStatValue(sourceStats, expandedStats, "Buff%")
  const normalizedTargetValue = info.multi === 0.01
    ? targetValue * flatStatScale
    : targetValue
  const resultValue = Math.floor(normalizedTargetValue * stackCount * (1 + (buffPercent / 100)))

  addDisplayEffectStat(rawStats, expandedStats, targetStat, resultValue)
}

function applyDisplayConversionEffect(
  rawStats: Record<string, number>,
  expandedStats: Record<string, number>,
  sourceStats: Record<string, number>,
  sourceStat: string,
  ratio: number,
  targetStat: string,
  stackCount = 1,
  buffPercentOverride?: number,
): void {
  const info = stat_data.StatsInfo[targetStat as keyof typeof stat_data.StatsInfo]
  if (!info) {
    return
  }

  const buffPercent = buffPercentOverride ?? getMergedDisplayStatValue(sourceStats, expandedStats, "Buff%")
  const sourceValue = getDisplayConversionSourceValue(sourceStats, expandedStats, sourceStat)
  const resultValue = truncateTowardZero(sourceValue * ratio * stackCount * (1 + (buffPercent / 100)))

  addDisplayEffectStat(rawStats, expandedStats, targetStat, resultValue)
}

function computeDisplayEffectStats(
  selectedNames: readonly string[],
  stackDict: Record<string, number>,
  sourceStats: Record<string, number>,
  sourceData: Record<string, EffectSourceData | undefined>,
  flatStatScale = 1,
  buffPercentOverridesByName?: Record<string, number>,
): Record<string, number> {
  const rawStats: Record<string, number> = {}
  const expandedStats: Record<string, number> = {}

  for (const name of selectedNames) {
    const effectData = sourceData[name]
    if (!effectData) {
      continue
    }
    const buffPercentOverride = buffPercentOverridesByName?.[name]

    if (effectData.conversions) {
      for (const { source, ratio, resulting_stat } of effectData.conversions) {
        applyDisplayConversionEffect(
          rawStats,
          expandedStats,
          sourceStats,
          source,
          ratio,
          resulting_stat,
          1,
          buffPercentOverride,
        )
      }
    }

    if (effectData.stack_conversions) {
      for (const { source, ratio, resulting_stat } of effectData.stack_conversions) {
        applyDisplayConversionEffect(
          rawStats,
          expandedStats,
          sourceStats,
          source,
          ratio,
          resulting_stat,
          stackDict[name] ?? 0,
          buffPercentOverride,
        )
      }
    }

    if (effectData.stats) {
      for (const [stat, value] of Object.entries(effectData.stats)) {
        applyDisplayFlatEffectStat(
          rawStats,
          expandedStats,
          sourceStats,
          stat,
          value ?? 0,
          1,
          flatStatScale,
          buffPercentOverride,
        )
      }
    }

    if (effectData.stack_stats) {
      for (const [stat, value] of Object.entries(effectData.stack_stats)) {
        applyDisplayFlatEffectStat(
          rawStats,
          expandedStats,
          sourceStats,
          stat,
          value ?? 0,
          stackDict[name] ?? 0,
          flatStatScale,
          buffPercentOverride,
        )
      }
    }
  }

  return rawStats
}

export function computeSkillDisplayEffectStats(
  skillName: string,
  sourceStats: Record<string, number>,
  stackDict: Record<string, number>,
  selectedBuffNames?: readonly string[],
): Record<string, number> {
  const effectiveSelectedBuffNames = Array.from(new Set([...(selectedBuffNames ?? []), skillName]))
  const buffPercentOverridesByName = getOrderedBuffPercentBeforeByName(
    effectiveSelectedBuffNames,
    stackDict,
    sourceStats,
    skill_data as Record<string, EffectSourceData | undefined>,
    100,
  )

  return computeDisplayEffectStats(
    [skillName],
    stackDict,
    sourceStats,
    skill_data as Record<string, EffectSourceData | undefined>,
    100,
    { [skillName]: buffPercentOverridesByName[skillName] ?? (sourceStats["Buff%"] ?? 0) },
  )
}

export function computeTarotDisplayEffectStats(
  tarotName: string,
  sourceStats: Record<string, number>,
  stackDict: Record<string, number>,
): Record<string, number> {
  return computeDisplayEffectStats(
    [tarotName],
    stackDict,
    sourceStats,
    tarot_data as Record<string, EffectSourceData | undefined>,
  )
}

function getRawBaseDisplayStats(stages: BuildStatStages): Record<string, number> {
  return mergeStats(
    stages.StatsTalents,
    stages.StatsLevels,
    stages.StatsEquipment,
    stages.StatsRunes,
    stages.StatsArtifact,
    stages.StatsConverted,
  )
}

function getRawCharacterCardDisplayStats(stages: BuildStatStages): Record<string, number> {
  return mergeStats(
    stages.StatsTalents,
    stages.StatsLevels,
    stages.StatsEquipment,
    stages.StatsRunes,
    stages.StatsArtifact,
  )
}

function getDisplayBaseStats(stages: BuildStatStages): Record<string, number> {
  return stages.StatsBase
}

function getRawDungeonDisplayStats(snapshot: BuildSnapshot, stages: BuildStatStages): Record<string, number> {
  const additionalStageStats = groupAdditionalStageStatEntries(snapshot.additionalStageStats)
  const buffPercentOverridesByName = getOrderedBuffPercentBeforeByName(
    snapshot.selectedBuffs,
    snapshot.selectedBuffStacks,
    stages.StatsBuffReady,
    skill_data as Record<string, EffectSourceData | undefined>,
    100,
  )
  const buffStats = computeDisplayEffectStats(
    snapshot.selectedBuffs,
    snapshot.selectedBuffStacks,
    stages.StatsBuffReady,
    skill_data as Record<string, EffectSourceData | undefined>,
    100,
    buffPercentOverridesByName,
  )
  const tarotStats = computeDisplayEffectStats(
    snapshot.selectedTarots,
    snapshot.tarotStacks,
    stages.StatsBuffReady,
    tarot_data as Record<string, EffectSourceData | undefined>,
  )

  return mergeStats(
    getRawBaseDisplayStats(stages),
    buffStats,
    additionalStageStats.buffs,
    tarotStats,
    additionalStageStats.tarots,
  )
}

function getDungeonMainStats(snapshot: BuildSnapshot, stages: BuildStatStages): Record<string, number> {
  const dungeonMainStats = { ...stages.StatsDmgReady }

  if (snapshot.selectedBuffs.includes("Focus")) {
    dungeonMainStats.Focus = stages.StatsBuffReady.Focus ?? dungeonMainStats.Focus
  }

  return dungeonMainStats
}

function subtractSharedResist(totalResist: number, allResist: number): number {
  return Math.max(0, totalResist - allResist)
}

function getCalculatedOutDungeonStats(rawStats: Record<string, number>): Record<string, number> {
  const calculatedStats: Record<string, number> = { ...rawStats }

  calculatedStats["All%"] = 0
  calculatedStats["All Pen%"] = 0
  calculatedStats["All Res%"] = 0
  calculatedStats["Phys%"] = 0
  calculatedStats["Phys Pen%"] = 0
  calculatedStats["Phys Res%"] = 0
  calculatedStats["Phys xPen%"] = 0
  calculatedStats["Elemental%"] = 0
  calculatedStats["Elemental Pen%"] = 0
  calculatedStats["Elemental Res%"] = 0
  calculatedStats["Elemental xPen%"] = 0
  calculatedStats["Divine%"] = 0
  calculatedStats["Divine Pen%"] = 0
  calculatedStats["Divine Res%"] = 0
  calculatedStats["Divine xPen%"] = 0
  calculatedStats["Void xPen%"] = 0

  for (const { key, family } of dungeonDisplayElements) {
    const damageFamilyBonus = family === "Void" ? 0 : getStat(rawStats, `${family}%`)
    const resistFamilyBonus = family === "Void" ? 0 : getStat(rawStats, `${family} Res%`)
    const penFamilyBonus = family === "Void" ? 0 : getStat(rawStats, `${family} Pen%`)
    const xPenFamilyBonus = getStat(rawStats, `${family} xPen%`)
    const specificPen = getStat(rawStats, `${key} Pen%`) + getStat(rawStats, "All Pen%") + penFamilyBonus
    const xPen = getStat(rawStats, `${key} xPen%`) + xPenFamilyBonus

    calculatedStats[`${key}%`] = getStat(rawStats, `${key}%`) + getStat(rawStats, "All%") + damageFamilyBonus
    calculatedStats[`${key} Res%`] = getStat(rawStats, `${key} Res%`) + getStat(rawStats, "All Res%") + resistFamilyBonus
    calculatedStats[`${key} Pen%`] = Math.floor(specificPen * (1 + (xPen / 100)))
  }

  return calculatedStats
}

function getDisplayDungeonStats(snapshot: BuildSnapshot, stages: BuildStatStages): Record<string, number> {
  const displayStats: Record<string, number> = { ...stages.StatsDmgReady }

  displayStats["All%"] = 0
  displayStats["All Pen%"] = 0
  displayStats["All Res%"] = 0
  displayStats["Phys%"] = 0
  displayStats["Phys Pen%"] = 0
  displayStats["Phys Res%"] = 0
  displayStats["Phys xPen%"] = 0
  displayStats["Elemental%"] = 0
  displayStats["Elemental Pen%"] = 0
  displayStats["Elemental Res%"] = 0
  displayStats["Elemental xPen%"] = 0
  displayStats["Divine%"] = 0
  displayStats["Divine Pen%"] = 0
  displayStats["Divine Res%"] = 0
  displayStats["Divine xPen%"] = 0
  displayStats["Void xPen%"] = 0

  return displayStats
}

function getCharacterCardElementStats(rawStats: Record<string, number>): Record<string, number> {
  return expandCompoundStats(rawStats, {
    retainCompoundStats: characterCardSeparateCompoundStats,
  })
}

function getReadableStatLabel(stat: string): string {
  switch (stat) {
    case "HP":
      return "Health"
    case "MP":
      return "Mana"
    case "HEAL":
      return "Healpower"
    case "Dmg%":
      return "Global Damage"
    case "All Res%":
      return "All Resist"
    case "DMG Res%":
      return "Damage Resist"
    case "Crit Chance%":
      return "Crit Chance"
    case "Crit DMG%":
      return "Crit Damage"
    case "Bow Crit Chance%":
      return "Bow Crit Chance"
    case "Bow Crit DMG%":
      return "Bow Crit Damage"
    case "Threat%":
      return "Threat Modifier"
    case THREAT_LEVELS_STAT:
      return "Threat From Levels"
    case THREAT_BONUS_DISPLAY_STAT:
      return "Threat Modifier"
    case "Neg%":
      return "Negative DMG"
    case "Holy%":
      return "Holy DMG"
    case "Phys%":
      return "Physical DMG"
    case "Elemental%":
      return "Elemental DMG"
    case "Elemental Pen%":
      return "Elemental Pen"
    case "Divine%":
      return "Divine DMG"
    case "Divine Pen%":
      return "Divine Pen"
    case "Void%":
      return "Void DMG"
    case "Void Pen%":
      return "Void Pen"
    case "Bow%":
      return "Elebow"
    case "All%":
      return "All Damage"
    default:
      return stat.replace(/%/g, "").trim()
  }
}

function getEffectDeltas(stats: Record<string, number>): EffectDelta[] {
  const result: EffectDelta[] = []

  for (const [key, delta] of Object.entries(stats)) {
    if (isInternalThreatStat(key) || Math.abs(delta) < 0.0001) {
      continue
    }

    result.push({ stat: key, delta })
  }

  result.sort((left, right) => {
    const leftPriority = effectPriorityIndex.get(left.stat) ?? Number.MAX_SAFE_INTEGER
    const rightPriority = effectPriorityIndex.get(right.stat) ?? Number.MAX_SAFE_INTEGER

    if (leftPriority !== rightPriority) {
      return leftPriority - rightPriority
    }

    const deltaDifference = Math.abs(right.delta) - Math.abs(left.delta)
    if (deltaDifference !== 0) {
      return deltaDifference
    }

    return left.stat.localeCompare(right.stat)
  })

  return result.slice(0, 6)
}

function getActiveEffects(snapshot: BuildSnapshot, stages: BuildStatStages): ActiveEffect[] {
  const effects: ActiveEffect[] = []
  const sourceStats = stages.StatsBuffReady
  const buffPercentOverridesByName = getOrderedBuffPercentBeforeByName(
    snapshot.selectedBuffs,
    snapshot.selectedBuffStacks,
    sourceStats,
    skill_data as Record<string, EffectSourceData | undefined>,
    100,
  )

  for (const skillName of snapshot.selectedBuffs) {
    const skill = skill_data[skillName]
    if (!skill) continue

    const deltas = getEffectDeltas(
      computeDisplayEffectStats(
        [skillName],
        snapshot.selectedBuffStacks,
        sourceStats,
        skill_data as Record<string, EffectSourceData | undefined>,
        100,
        { [skillName]: buffPercentOverridesByName[skillName] ?? (sourceStats["Buff%"] ?? 0) },
      ),
    )
    if (deltas.length === 0) continue

    effects.push({
      id: `skill:${skillName}`,
      title: skillName,
      sourceType: "skill",
      description: skill.description,
      deltas,
    })
  }

  for (const tarotName of snapshot.selectedTarots) {
    const tarot = tarot_data[tarotName]
    if (!tarot) continue

    const deltas = getEffectDeltas(
      computeDisplayEffectStats(
        [tarotName],
        snapshot.tarotStacks,
        sourceStats,
        tarot_data as Record<string, EffectSourceData | undefined>,
      ),
    )
    if (deltas.length === 0) continue

    effects.push({
      id: `tarot:${tarotName}`,
      title: tarot.skill_name,
      sourceType: "tarot",
      description: tarot.description,
      deltas,
    })
  }

  return effects
}

export function buildDebugSummary(storage: Storage): SummaryState {
  const snapshot = readBuildSnapshot(storage)
  const stages = computeBuildStatStages(snapshot)
  const charcardStages = computeBuildStatStages(getCharcardSnapshot(snapshot))
  const dungeonMainStats = getDungeonMainStats(snapshot, stages)
  const displayBaseStats = getDisplayBaseStats(charcardStages)
  const displayDungeonStats = getDisplayDungeonStats(snapshot, stages)
  const totalLevels = classKeys.reduce((total, classKey) => total + (snapshot.selectedLevels[classKey] ?? 0), 0)
  const availableSkillPoints = Math.max(0, Math.ceil(totalLevels / 2))
  const usedSkillPoints = getUsedSkillPoints(snapshot)
  const availableTalentPoints = Math.floor(totalLevels / 2)
  const usedTalentPoints = snapshot.selectedTalents.length

  return {
    profile: profileDefaults,
    snapshot,
    stages,
    charcardStages,
    dungeonMainStats,
    displayBaseStats,
    displayDungeonStats,
    totalLevels,
    raceName: getRaceName(snapshot),
    nextLevelExp: getXpToNextLevel(totalLevels),
    availableSkillPoints,
    usedSkillPoints,
    remainingSkillPoints: Math.max(0, availableSkillPoints - usedSkillPoints),
    availableTalentPoints,
    usedTalentPoints,
    remainingTalentPoints: Math.max(0, availableTalentPoints - usedTalentPoints),
    activeEffects: getActiveEffects(snapshot, stages),
  }
}

export function getGuildCardRows(summary: SummaryState): LabelValueRow[] {
  const baseStats = summary.charcardStages.StatsBase

  return [
    { label: "Race", value: summary.raceName },
    { label: "Total Levels", value: `${formatWhole(summary.totalLevels)} / 485` },
    {
      label: "T/W/C/H Levels",
      value: classKeys.map((classKey) => formatWhole(summary.snapshot.selectedLevels[classKey] ?? 0)).join("/"),
    },
    { label: "Health", value: formatWhole(getStat(baseStats, "HP")) },
    { label: "Mana", value: formatWhole(getStat(baseStats, "MP")) },
    { label: "ATK", value: formatWhole(getStat(baseStats, "ATK")) },
    { label: "DEF", value: formatWhole(getStat(baseStats, "DEF")) },
    { label: "MATK", value: formatWhole(getStat(baseStats, "MATK")) },
    { label: "Healpower", value: formatWhole(getStat(baseStats, "HEAL")) },
    {
      label: "Skill/Talent Points",
      value: `${formatWhole(summary.remainingSkillPoints)} / ${formatWhole(summary.remainingTalentPoints)}`,
    },
    { label: "Rebirth LvL", value: formatWhole(summary.profile.rebirthLevel) },
  ]
}

function getTypeBonusRows(
  stats: Record<string, number>,
  options?: {
    maskVoidDamage?: boolean
    maskVoidPen?: boolean
  },
): TypeBonusRow[] {
  const categories = [
    { label: "PHYS", dmg: "Phys%", xDmg: "Phys xDmg%", pen: "Phys Pen%", xPen: "Phys xPen%" },
    { label: "ELE", dmg: "Elemental%", xDmg: "Elemental xDmg%", pen: "Elemental Pen%", xPen: "Elemental xPen%" },
    { label: "DIV", dmg: "Divine%", xDmg: "Divine xDmg%", pen: "Divine Pen%", xPen: "Divine xPen%" },
    { label: "VOID", dmg: "Void%", xDmg: "Void xDmg%", pen: "Void Pen%", xPen: "Void xPen%" },
  ] as const

  return categories.map((category) => ({
    label: category.label,
    dmg: category.label === "VOID" && options?.maskVoidDamage
      ? "X"
      : category.label === "VOID" && getStat(stats, category.dmg) === 0
        ? "X"
        : formatWhole(getStat(stats, category.dmg)),
    xDmg: formatWhole(getStat(stats, category.xDmg)),
    pen: category.label === "VOID" && options?.maskVoidPen
      ? "X"
      : category.label === "VOID" && getStat(stats, category.pen) === 0
        ? "X"
        : formatWhole(getStat(stats, category.pen)),
    xPen: formatWhole(getStat(stats, category.xPen)),
  }))
}

function getElementRows(
  stats: Record<string, number>,
  options?: {
    addAllDamage?: boolean
    omitAllDamageFor?: string[]
    subtractAllResist?: boolean
  },
): ElementRow[] {
  const elements = [
    { label: "Fire", key: "Fire" },
    { label: "Lightning", key: "Lightning" },
    { label: "Water", key: "Water" },
    { label: "Earth", key: "Earth" },
    { label: "Wind", key: "Wind" },
    { label: "Toxic", key: "Toxic" },
    { label: "Void", key: "Void" },
    { label: "Negative", key: "Neg" },
    { label: "Holy", key: "Holy" },
    { label: "Blunt", key: "Blunt" },
    { label: "Pierce", key: "Pierce" },
    { label: "Slash", key: "Slash" },
  ] as const
  const allDamage = options?.addAllDamage ? getStat(stats, "All%") : 0
  const omitAllDamageFor = new Set(options?.omitAllDamageFor ?? [])
  const allResist = options?.subtractAllResist ? getStat(stats, "All Res%") : 0

  return elements.map((element) => ({
    label: element.label,
    dmg: formatWhole(getStat(stats, `${element.key}%`) + (omitAllDamageFor.has(element.label) ? 0 : allDamage)),
    res: formatWhole(subtractSharedResist(getStat(stats, `${element.key} Res%`), allResist)),
    pen: formatWhole(getStat(stats, `${element.key} Pen%`)),
  }))
}

function getBaseMainRows(
  valueStats: Record<string, number>,
  modifierStats: Record<string, number>,
): TerminalMainRow[] {
  return [
    {
      label: "Health",
      value: formatWhole(getStat(valueStats, "HP")),
    },
    { label: "Mana", value: formatWhole(getStat(valueStats, "MP")) },
    { label: "Focus", value: formatWhole(getStat(valueStats, "Focus")) },
    { label: "ATK", value: formatWhole(getStat(valueStats, "ATK")), modifier: formatSignedPercent(getStat(modifierStats, "ATK%")) },
    { label: "MATK", value: formatWhole(getStat(valueStats, "MATK")), modifier: formatSignedPercent(getStat(modifierStats, "MATK%")) },
    { label: "DEF", value: formatWhole(getStat(valueStats, "DEF")), modifier: formatSignedPercent(getStat(modifierStats, "DEF%")) },
    { label: "HEAL", value: formatWhole(getStat(valueStats, "HEAL")), modifier: formatSignedPercent(getStat(modifierStats, "HEAL%")) },
  ]
}

function getDungeonMainRows(stats: Record<string, number>): TerminalMainRow[] {
  return [
    { label: "Health", value: formatWhole(getStat(stats, "HP")) },
    { label: "Mana", value: `${formatWhole(getStat(stats, "MP"))} / ${formatWhole(getStat(stats, "MP"))}` },
    { label: "Focus", value: `${formatWhole(getStat(stats, "Focus"))} / ${formatWhole(getStat(stats, "Focus"))}` },
    { label: "ATK", value: formatWhole(getStat(stats, "ATK")) },
    { label: "MATK", value: formatWhole(getStat(stats, "MATK")) },
    { label: "DEF", value: formatWhole(getStat(stats, "DEF")) },
    { label: "HEAL", value: formatWhole(getStat(stats, "HEAL")) },
  ]
}

function getBaseDetailRows(baseStats: Record<string, number>): TerminalDetailRow[] {
  return [
    {
      label: "Crit Chance/Damage",
      value: `${formatPercent(getStat(baseStats, "Crit Chance%"))} / ${formatPercent(getStat(baseStats, "Crit DMG%"))}`,
    },
    {
      label: "Overdrive Scaling",
      value: formatCharacterCardOverdriveScalingPercent(getStat(baseStats, "Overdrive%")),
    },
    {
      label: "HP Regen/Rate",
      value: `${formatWhole(getStat(baseStats, "HP Regen"))} / ${formatPercent(getStat(baseStats, "HP Regen%"), 1)}`,
    },
    {
      label: "Global Damage",
      value: formatSignedPercent(getStat(baseStats, "Dmg%")),
    },
    {
      label: "All Resist",
      value: formatSignedPercent(getStat(baseStats, "All Res%")),
    },
    {
      label: "Threat Modifier",
      value: formatPercent(getStat(baseStats, THREAT_BONUS_DISPLAY_STAT)),
    },
  ]
}

function getDungeonDetailRows(stats: Record<string, number>): TerminalDetailRow[] {
  return [
    {
      label: "Crit Chance/Damage",
      value: `${formatPercent(getStat(stats, "Crit Chance%"))} / ${formatPercent(getStat(stats, "Crit DMG%"))}`,
    },
    {
      label: "Overdrive Scaling",
      value: formatDungeonOverdriveScalingPercent(getStat(stats, "Overdrive%")),
    },
    {
      label: "HP Regen/Rate",
      value: `${formatWhole(getStat(stats, "HP Regen"))} / ${formatPercent(getStat(stats, "HP Regen%"), 1)}`,
    },
    {
      label: "MP/Focus Regen",
      value: `${formatWhole(getStat(stats, "MP Regen"))} / ${formatWhole(getStat(stats, "Focus Regen"))}`,
    },
    {
      label: "Global Damage",
      value: formatSignedPercent(getStat(stats, "Dmg%")),
    },
    {
      label: "All Resist",
      value: formatSignedPercent(getStat(stats, "All Res%")),
    },
    {
      label: "Threat Modifier",
      value: formatPercent(getStat(stats, THREAT_BONUS_DISPLAY_STAT)),
    },
  ]
}

export function getCharacterCardData(summary: SummaryState): TerminalCardData {
  const baseStats = summary.charcardStages.StatsBase
  const displayBaseStats = summary.displayBaseStats
  const rawBaseCardStats = getRawCharacterCardDisplayStats(summary.charcardStages)
  const characterCardElementStats = getCharacterCardElementStats(rawBaseCardStats)

  return {
    mainRows: getBaseMainRows(baseStats, displayBaseStats),
    detailRows: getBaseDetailRows(rawBaseCardStats),
    typeRows: getTypeBonusRows(rawBaseCardStats, { maskVoidDamage: true, maskVoidPen: true }),
    elementRows: getElementRows(characterCardElementStats, {
      addAllDamage: true,
    }),
  }
}

export function getDungeonCardData(summary: SummaryState): TerminalCardData {
  return {
    mainRows: getDungeonMainRows(summary.dungeonMainStats),
    detailRows: getDungeonDetailRows(summary.displayDungeonStats),
    typeRows: getTypeBonusRows(summary.displayDungeonStats, { maskVoidDamage: true, maskVoidPen: true }),
    elementRows: getElementRows(summary.displayDungeonStats),
  }
}

function formatEffectDelta(delta: number, stat: string, label?: string): string {
  const digits = Math.abs(delta) < 1 && delta !== 0 ? 2 : 0
  const absolute = digits === 0 ? formatWhole(Math.abs(delta)) : formatFixed(Math.abs(delta), digits)
  const suffix = stat.includes("%") ? "%" : ""
  return `${delta >= 0 ? "+" : "-"}${absolute}${suffix} ${label ?? getReadableStatLabel(stat)}`
}

export function getCalcSkillBuffs(summary: SummaryState): CalcSkillBuff[] {
  const skillEffectsByName = new Map(
    summary.activeEffects
      .filter((effect) => effect.sourceType === "skill")
      .map((effect) => [effect.title, effect]),
  )

  return summary.snapshot.selectedBuffs.map((name) => {
    const effect = skillEffectsByName.get(name)

    return {
      name,
      effects: (effect?.deltas ?? []).map((delta) => ({
        stat: delta.stat,
        value: delta.delta,
        label: formatEffectDelta(delta.delta, delta.stat, delta.label),
      })),
    }
  })
}
