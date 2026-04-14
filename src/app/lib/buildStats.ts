import { heroPointGainsByRace, heroPointStats } from "@/app/data/heropoint_data"
import { race_data_by_tag } from "@/app/data/race_data"
import rune_data from "@/app/data/rune_data"
import { skill_data } from "@/app/data/skill_data"
import stat_data from "@/app/data/stat_data"
import { talent_data } from "@/app/data/talent_data"
import tarot_data from "@/app/data/tarot_data"
import { getMainStatTrainingGain } from "@/app/lib/mainStatPoints"
import {
  ADDITIONAL_STAGE_STATS_STORAGE_KEY,
  STAGE_STAT_OVERRIDES_STORAGE_KEY,
  groupAdditionalStageStatEntries,
  groupStageStatOverrideEntries,
  normalizeAdditionalStageStatEntries,
  normalizeStageStatOverrideEntries,
  type AdditionalStageStatEntry,
  type StageStatOverrideEntry,
} from "@/app/lib/additionalStageStats"
import { normalizeArtifact } from "@/app/lib/artifactState"
import {
  EQUIPMENT_SCRIPT_GROUPS_STORAGE_KEY,
  buildAppliedEquipmentScriptCounts,
  normalizeEquipmentScriptGroups,
  type EquipmentScriptGroup,
} from "@/app/lib/equipmentScripts"
import {
  getTarotScalingValue,
  isTarotEquipmentSlot,
  normalizeEquipmentSlots,
  type EquipmentSlot,
} from "@/app/lib/equipmentSlots"
import { readStoredStatPoints } from "@/app/lib/mainStatPoints"
import { buildAverageStatsForScriptCounts } from "@/app/lib/runewordPlanner"
import { readStoredEffectiveTarotSelections } from "@/app/lib/tarotSelections"
import { THREAT_BASE_STAT, THREAT_LEVELS_STAT } from "@/app/lib/threat"
import {
  getManualRangeGain,
  normalizeManualLevelRanges,
  type ManualLevelRange,
} from "@/app/lib/manualLevelRanges"
import { BUFF_SELECTION_STORAGE_KEY, readSelectedSkills } from "@/app/lib/learnCommands"
import { truncateTowardZero } from "@/app/lib/statRounding"

type RuneSelection = { rune: string; count: number }
const DAMAGE_CALC_PLAYER_LEVEL_STAT = "__Player Level"

export type BuildSnapshot = {
  selectedTalents: string[]
  selectedSkills: string[]
  selectedBuffs: string[]
  selectedBuffStacks: Record<string, number>
  selectedTarots: string[]
  tarotStacks: Record<string, number>
  selectedRace: string | null
  selectedLevels: Record<string, number>
  selectedLevelOrder: string[]
  selectedStatPoints: Record<string, number>
  selectedTraining: Record<string, number>
  selectedHeroPoints: Record<string, number>
  selectedManualLevelRanges: ManualLevelRange[]
  selectedRunes: Record<string, RuneSelection[]>
  equipmentSlots: EquipmentSlot[]
  enabledEquipment: number[]
  equipmentScriptGroups: EquipmentScriptGroup[]
  artifact: Record<string, number>
  additionalStageStats: AdditionalStageStatEntry[]
  stageStatOverrides: StageStatOverrideEntry[]
}

export type NamedStageStats = Record<string, Record<string, number>>
export type ConversionPercentMap = Record<string, Record<string, number>>
export type NamedConversionPercentMap = Record<string, ConversionPercentMap>
type EffectSourceData = {
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
  stats?: Partial<Record<string, number>>
  stack_stats?: Partial<Record<string, number>>
}

export type BuildStatStages = {
  StatsTalents: Record<string, number>
  StatsTalentStats: NamedStageStats
  StatsTalentConversionPercents: NamedConversionPercentMap
  StatsConversionPercents: ConversionPercentMap
  StatsLevels: Record<string, number>
  StatsEquipment: Record<string, number>
  StatsRunes: Record<string, number>
  StatsArtifact: Record<string, number>
  StatsBase: Record<string, number>
  StatsXPen: Record<string, number>
  StatsConversionReady: Record<string, number>
  StatsConverted: Record<string, number>
  StatsBuffReady: Record<string, number>
  StatsBuffPercents: Record<string, number>
  StatsBuffOutputsBeforeByName: NamedStageStats
  StatsBuffs: Record<string, number>
  StatsTarotPercents: Record<string, number>
  StatsTarotOutputsBeforeByName: NamedStageStats
  StatsTarots: Record<string, number>
  StatsDmgReady: Record<string, number>
}

const jsonParse = <T>(raw: string | null, fallback: T): T => {
  if (!raw) return fallback

  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

const asFiniteNumber = (value: unknown, fallback = 0): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback

const asStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : []

const asRecord = (value: unknown): Record<string, number> => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return {}

  return Object.entries(value).reduce<Record<string, number>>((result, [key, entry]) => {
    if (typeof entry === "number" && Number.isFinite(entry)) {
      result[key] = entry
    }
    return result
  }, {})
}

const asRuneSelections = (value: unknown): Record<string, RuneSelection[]> => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return {}

  return Object.entries(value).reduce<Record<string, RuneSelection[]>>((result, [tier, entries]) => {
    if (!Array.isArray(entries)) return result

    result[tier] = entries
      .filter((entry): entry is Partial<RuneSelection> => typeof entry === "object" && entry !== null)
      .map((entry) => ({
        rune: typeof entry.rune === "string" ? entry.rune : "",
        count: asFiniteNumber(entry.count, 0),
      }))

    return result
  }, {})
}

const asEnabledEquipment = (value: unknown): number[] =>
  Array.isArray(value)
    ? value.filter((entry): entry is number => typeof entry === "number" && Number.isFinite(entry))
    : []

const asManualLevelRanges = (value: unknown): ManualLevelRange[] => normalizeManualLevelRanges(value)

export function readBuildSnapshot(storage: Storage): BuildSnapshot {
  return {
    selectedTalents: asStringArray(jsonParse(storage.getItem("selectedTalents"), [])),
    selectedSkills: readSelectedSkills(storage),
    selectedBuffs: asStringArray(jsonParse(storage.getItem(BUFF_SELECTION_STORAGE_KEY), [])),
    selectedBuffStacks: asRecord(jsonParse(storage.getItem("selectedBuffStacks"), {})),
    selectedTarots: readStoredEffectiveTarotSelections(storage),
    tarotStacks: asRecord(jsonParse(storage.getItem("tarotStacks"), {})),
    selectedRace: (() => {
      const value = storage.getItem("SelectedRace")
      return typeof value === "string" && value.length > 0 ? value : null
    })(),
    selectedLevels: asRecord(jsonParse(storage.getItem("SelectedLevels"), {})),
    selectedLevelOrder: asStringArray(jsonParse(storage.getItem("SelectedLevelOrder"), [])),
    selectedStatPoints: readStoredStatPoints(storage),
    selectedTraining: asRecord(jsonParse(storage.getItem("SelectedTraining"), {})),
    selectedHeroPoints: asRecord(jsonParse(storage.getItem("SelectedHeroPoints"), {})),
    selectedManualLevelRanges: asManualLevelRanges(jsonParse(storage.getItem("SelectedManualLevelRanges"), [])),
    selectedRunes: asRuneSelections(jsonParse(storage.getItem("SelectedRunes"), {})),
    equipmentSlots: normalizeEquipmentSlots(jsonParse(storage.getItem("EquipmentSlots"), [])),
    enabledEquipment: asEnabledEquipment(jsonParse(storage.getItem("EnabledEquipment"), [])),
    equipmentScriptGroups: normalizeEquipmentScriptGroups(
      jsonParse(storage.getItem(EQUIPMENT_SCRIPT_GROUPS_STORAGE_KEY), []),
    ),
    artifact: normalizeArtifact(jsonParse(storage.getItem("Artifact"), null)),
    additionalStageStats: normalizeAdditionalStageStatEntries(
      jsonParse(storage.getItem(ADDITIONAL_STAGE_STATS_STORAGE_KEY), []),
    ),
    stageStatOverrides: normalizeStageStatOverrideEntries(
      jsonParse(storage.getItem(STAGE_STAT_OVERRIDES_STORAGE_KEY), []),
    ),
  }
}

function addRawStageStat(targetDict: Record<string, number>, stat: string, value: number): void {
  if (!Number.isFinite(value) || Math.abs(value) < 0.0001) {
    return
  }

  targetDict[stat] = (targetDict[stat] ?? 0) + value
}

function addNonRetainedCompoundStageStat(targetDict: Record<string, number>, stat: string, value: number): boolean {
  if (stat !== "MAIN%") {
    return false
  }

  const info = stat_data.StatsInfo[stat as keyof typeof stat_data.StatsInfo]
  if (!info?.sub_stats) {
    return false
  }

  for (const subStat of info.sub_stats) {
    addRawStageStat(targetDict, subStat, value)
  }

  return true
}

function addExpandedStageStat(targetDict: Record<string, number>, stat: string, value: number): void {
  if (!Number.isFinite(value) || Math.abs(value) < 0.0001) {
    return
  }

  if (addNonRetainedCompoundStageStat(targetDict, stat, value)) {
    return
  }

  addRawStageStat(targetDict, stat, value)

  const info = stat_data.StatsInfo[stat as keyof typeof stat_data.StatsInfo]
  if (!info?.sub_stats) {
    return
  }

  for (const subStat of info.sub_stats) {
    addRawStageStat(targetDict, subStat, value)
  }
}

function normalizeRawStageStats(sourceStats: Record<string, number>): Record<string, number> {
  const normalized: Record<string, number> = {}

  for (const [stat, value] of Object.entries(sourceStats)) {
    if (addNonRetainedCompoundStageStat(normalized, stat, value)) {
      continue
    }

    addRawStageStat(normalized, stat, value)
  }

  return normalized
}

function mergeRawStageStats(baseStats: Record<string, number>, addedStats: Record<string, number>): Record<string, number> {
  const merged = normalizeRawStageStats(baseStats)

  for (const [stat, value] of Object.entries(addedStats)) {
    if (addNonRetainedCompoundStageStat(merged, stat, value)) {
      continue
    }
    addRawStageStat(merged, stat, value)
  }

  return merged
}

function mergeExpandedStageStats(
  baseStats: Record<string, number>,
  addedStats: Record<string, number>,
): Record<string, number> {
  if (Object.keys(addedStats).length === 0) {
    return baseStats
  }

  const merged = { ...baseStats }

  for (const [stat, value] of Object.entries(addedStats)) {
    addExpandedStageStat(merged, stat, value)
  }

  return merged
}

function applyRawStageStatOverrides(
  baseStats: Record<string, number>,
  overrideStats: Record<string, number>,
): Record<string, number> {
  if (Object.keys(overrideStats).length === 0) {
    return baseStats
  }

  return {
    ...baseStats,
    ...overrideStats,
  }
}

function buildExpandedStageStatOverrideMap(overrideStats: Record<string, number>): Record<string, number> {
  const expandedOverrides: Record<string, number> = {}

  for (const [stat, value] of Object.entries(overrideStats)) {
    const info = stat_data.StatsInfo[stat as keyof typeof stat_data.StatsInfo]

    if (stat === "MAIN%" && info?.sub_stats) {
      for (const subStat of info.sub_stats) {
        expandedOverrides[subStat] = value
      }
      continue
    }

    expandedOverrides[stat] = value

    if (!info?.sub_stats) {
      continue
    }

    for (const subStat of info.sub_stats) {
      expandedOverrides[subStat] = value
    }
  }

  return expandedOverrides
}

function applyExpandedStageStatOverrides(
  baseStats: Record<string, number>,
  overrideStats: Record<string, number>,
): Record<string, number> {
  if (Object.keys(overrideStats).length === 0) {
    return baseStats
  }

  const expandedOverrides = buildExpandedStageStatOverrideMap(overrideStats)
  const merged = { ...baseStats }

  for (const [stat, value] of Object.entries(expandedOverrides)) {
    merged[stat] = value
  }

  return merged
}

function scaleStageStats(sourceStats: Record<string, number>, multiplier: number): Record<string, number> {
  if (multiplier === 1) {
    return sourceStats
  }

  if (multiplier === 0) {
    return {}
  }

  const scaled: Record<string, number> = {}

  for (const [stat, value] of Object.entries(sourceStats)) {
    addRawStageStat(scaled, stat, value * multiplier)
  }

  return scaled
}

function addConversionPercent(
  targetMap: ConversionPercentMap,
  sourceStat: string,
  resultingStat: string,
  ratio: number,
): void {
  if (!Number.isFinite(ratio) || Math.abs(ratio) < 0.0000001) {
    return
  }

  const sourceEntry = targetMap[sourceStat] ?? {}
  const nextRatio = (sourceEntry[resultingStat] ?? 0) + ratio

  if (Math.abs(nextRatio) < 0.0000001) {
    delete sourceEntry[resultingStat]
  } else {
    sourceEntry[resultingStat] = nextRatio
  }

  if (Object.keys(sourceEntry).length === 0) {
    delete targetMap[sourceStat]
    return
  }

  targetMap[sourceStat] = sourceEntry
}

function cloneConversionPercentMap(sourceMap: ConversionPercentMap): ConversionPercentMap {
  return Object.entries(sourceMap).reduce<ConversionPercentMap>((result, [sourceStat, resultingStats]) => {
    if (Object.keys(resultingStats).length > 0) {
      result[sourceStat] = { ...resultingStats }
    }
    return result
  }, {})
}

function mergeConversionPercentMaps(
  baseMap: ConversionPercentMap,
  addedMap: ConversionPercentMap,
): ConversionPercentMap {
  if (Object.keys(addedMap).length === 0) {
    return baseMap
  }

  const merged = cloneConversionPercentMap(baseMap)

  for (const [sourceStat, resultingStats] of Object.entries(addedMap)) {
    for (const [resultingStat, ratio] of Object.entries(resultingStats)) {
      addConversionPercent(merged, sourceStat, resultingStat, ratio)
    }
  }

  return merged
}

function scaleConversionPercentMap(sourceMap: ConversionPercentMap, multiplier: number): ConversionPercentMap {
  if (multiplier === 1) {
    return sourceMap
  }

  if (multiplier === 0) {
    return {}
  }

  const scaled: ConversionPercentMap = {}

  for (const [sourceStat, resultingStats] of Object.entries(sourceMap)) {
    for (const [resultingStat, ratio] of Object.entries(resultingStats)) {
      addConversionPercent(scaled, sourceStat, resultingStat, ratio * multiplier)
    }
  }

  return scaled
}

export function expandCompoundStats(
  sourceStats: Record<string, number>,
  options?: {
    retainCompoundStats?: Iterable<string>
  },
): Record<string, number> {
  const expanded: Record<string, number> = {}
  const retainedCompoundStats = new Set(options?.retainCompoundStats ?? [])

  for (const [stat, value] of Object.entries(sourceStats)) {
    if (retainedCompoundStats.has(stat)) {
      addRawStageStat(expanded, stat, value)
      continue
    }

    if (addNonRetainedCompoundStageStat(expanded, stat, value)) {
      continue
    }

    addExpandedStageStat(expanded, stat, value)
  }

  return expanded
}

function buildTalentConversionPercentMap(
  conversions: Array<{
    source: string
    ratio: number
    resulting_stat: string
  }> | undefined,
): ConversionPercentMap {
  const result: ConversionPercentMap = {}

  for (const { source, ratio, resulting_stat } of conversions ?? []) {
    addConversionPercent(result, source, resulting_stat, ratio)
  }

  return result
}

function buildTalentStageStatsByName(): NamedStageStats {
  return Object.entries(talent_data).reduce<NamedStageStats>((result, [name, data]) => {
    const normalizedStats = normalizeRawStageStats(
      Object.entries(data.stats ?? {}).reduce<Record<string, number>>((stats, [stat, value]) => {
        if (typeof value === "number" && Number.isFinite(value)) {
          stats[stat] = value
        }
        return stats
      }, {}),
    )

    if (Object.keys(normalizedStats).length > 0) {
      result[name] = normalizedStats
    }

    return result
  }, {})
}

function buildTalentConversionPercentsByName(): NamedConversionPercentMap {
  return Object.entries(talent_data).reduce<NamedConversionPercentMap>((result, [name, data]) => {
    const conversionPercents = buildTalentConversionPercentMap(data.conversions)

    if (Object.keys(conversionPercents).length > 0) {
      result[name] = conversionPercents
    }

    return result
  }, {})
}

const allTalentStageStatsByName = buildTalentStageStatsByName()
const allTalentConversionPercentsByName = buildTalentConversionPercentsByName()

const convertedSkillSpecificStats = new Set([
  "Sword DMG%",
  "Spear DMG%",
  "Hammer DMG%",
  "Fist DMG%",
  "Dagger DMG%",
  "Fire DMG%",
  "Shadow Break DMG%",
  "Bow Crit DMG%",
  "Fist Crit DMG%",
  "Dagger Crit DMG%",
])

type EffectPipelineCache = {
  outputs: Record<string, number>
  percentBeforeByName: Record<string, number>
  outputsBeforeByName: NamedStageStats
}

type EffectPipelineDeltaResult = {
  outputsDelta: Record<string, number>
  outputsBeforeByName: NamedStageStats
}

function applyConversionResultValue(targetDict: Record<string, number>, targetStat: string, resultValue: number): void {
  if (!Number.isFinite(resultValue) || Math.abs(resultValue) < 0.0001) {
    return
  }

  const affixInfo = stat_data.StatsInfo[targetStat as keyof typeof stat_data.StatsInfo]
  const substats = affixInfo?.sub_stats

  if (substats) {
    for (const substat of substats) {
      addRawStageStat(targetDict, substat, resultValue)
    }
  } else if (affixInfo) {
    addRawStageStat(targetDict, targetStat, resultValue)
  }

  if (convertedSkillSpecificStats.has(targetStat)) {
    addRawStageStat(targetDict, `__Converted ${targetStat}`, resultValue)
  }
}

function applyFlatResultValue(targetDict: Record<string, number>, targetStat: string, resultValue: number): void {
  if (!Number.isFinite(resultValue) || Math.abs(resultValue) < 0.0001) {
    return
  }

  const affixInfo = stat_data.StatsInfo[targetStat as keyof typeof stat_data.StatsInfo]
  const substats = affixInfo?.sub_stats

  if (substats) {
    for (const substat of substats) {
      addRawStageStat(targetDict, substat, resultValue)
    }
  } else if (affixInfo) {
    addRawStageStat(targetDict, targetStat, resultValue)
  }
}

function getMergedEffectStatValue(
  sourceStats: Record<string, number>,
  outputsBefore: Record<string, number>,
  sourceDelta: Record<string, number>,
  outputsDeltaBefore: Record<string, number>,
  stat: string,
): { base: number; next: number } {
  const base = (sourceStats[stat] ?? 0) + (outputsBefore[stat] ?? 0)
  return {
    base,
    next: base + (sourceDelta[stat] ?? 0) + (outputsDeltaBefore[stat] ?? 0),
  }
}

function getEffectSourceValues(
  sourceStat: string,
  sourceStats: Record<string, number>,
  outputsBefore: Record<string, number>,
  sourceDelta: Record<string, number>,
  outputsDeltaBefore: Record<string, number>,
): { base: number; next: number } {
  const highest = (stats: readonly string[]) => stats.reduce(
    (currentHighest, stat) => {
      const value = getMergedEffectStatValue(sourceStats, outputsBefore, sourceDelta, outputsDeltaBefore, stat)
      return {
        base: Math.max(currentHighest.base, value.base),
        next: Math.max(currentHighest.next, value.next),
      }
    },
    { base: Number.NEGATIVE_INFINITY, next: Number.NEGATIVE_INFINITY },
  )

  switch (sourceStat) {
    case "Highest Phys%":
      return highest(["Slash%", "Pierce%", "Blunt%"])
    case "Highest Phys Pen%":
      return highest(["Slash Pen%", "Pierce Pen%", "Blunt Pen%"])
    case "Highest Magic%":
      return highest(["Fire%", "Water%", "Lightning%", "Wind%", "Earth%", "Toxic%", "Neg%", "Holy%", "Void%"])
    case "Highest Magic Pen%":
      return highest([
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
      return getMergedEffectStatValue(sourceStats, outputsBefore, sourceDelta, outputsDeltaBefore, "Crit Chance%")
    default: {
      return getMergedEffectStatValue(sourceStats, outputsBefore, sourceDelta, outputsDeltaBefore, sourceStat)
    }
  }
}

function updateConversionSubStats(
  targetDict: Record<string, number>,
  sourceDict: Record<string, number>,
  sourceStat: string,
  ratio: number,
  targetStat: string,
  stackCount = 1,
  buffPercentOverride?: number,
): void {
  const buffPercent = buffPercentOverride ?? ((sourceDict["Buff%"] ?? 0) + (targetDict["Buff%"] ?? 0))
  const getMergedStatValue = (stat: string) => (sourceDict[stat] ?? 0) + (targetDict[stat] ?? 0)
  const highest = (stats: readonly string[]) =>
    stats.reduce((currentHighest, stat) => Math.max(currentHighest, getMergedStatValue(stat)), 0)

  const sourceValue = (() => {
    switch (sourceStat) {
      case "Highest Phys%":
        return highest(["Slash%", "Pierce%", "Blunt%"])
      case "Highest Phys Pen%":
        return highest(["Slash Pen%", "Pierce Pen%", "Blunt Pen%"])
      case "Highest Magic%":
        return highest(["Fire%", "Water%", "Lightning%", "Wind%", "Earth%", "Toxic%", "Neg%", "Holy%", "Void%"])
      case "Highest Magic Pen%":
        return highest([
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
        return getMergedStatValue("Crit Chance%")
      default:
        return sourceDict[sourceStat] ?? 0
    }
  })()

  const resultValue = truncateTowardZero(sourceValue * (ratio * stackCount) * (1 + (buffPercent / 100)))
  applyConversionResultValue(targetDict, targetStat, resultValue)
}

function updateFlatSubStats(
  targetDict: Record<string, number>,
  sourceDict: Record<string, number>,
  targetStat: string,
  targetValue: number,
  stackCount = 1,
  flatStatScale = 1,
  buffPercentOverride?: number,
): void {
  const buffPercent = buffPercentOverride ?? ((sourceDict["Buff%"] ?? 0) + (targetDict["Buff%"] ?? 0))
  const affixInfo = stat_data.StatsInfo[targetStat as keyof typeof stat_data.StatsInfo]
  const normalizedTargetValue = affixInfo?.multi === 0.01
    ? targetValue * flatStatScale
    : targetValue
  const resultValue = Math.floor(normalizedTargetValue * stackCount * (1 + (buffPercent / 100)))
  applyFlatResultValue(targetDict, targetStat, resultValue)
}

function updateStats(
  targetDict: Record<string, number>,
  sourceDict: Record<string, number>,
  stackDict: Record<string, number>,
  sourceSkillName: string,
  sourceSkillData?: EffectSourceData,
  flatStatScale = 1,
  buffPercentOverride?: number,
): void {
  if (!sourceSkillData) return

  if (sourceSkillData.conversions) {
    for (const { source, ratio, resulting_stat } of sourceSkillData.conversions) {
      updateConversionSubStats(targetDict, sourceDict, source, ratio, resulting_stat, 1, buffPercentOverride)
    }
  }

  if (sourceSkillData.stack_conversions) {
    for (const { source, ratio, resulting_stat } of sourceSkillData.stack_conversions) {
      updateConversionSubStats(
        targetDict,
        sourceDict,
        source,
        ratio,
        resulting_stat,
        stackDict[sourceSkillName] ?? 0,
        buffPercentOverride,
      )
    }
  }

  if (sourceSkillData.stats) {
    for (const [stat, statAmount] of Object.entries(sourceSkillData.stats)) {
      updateFlatSubStats(targetDict, sourceDict, stat, statAmount ?? 0, 1, flatStatScale, buffPercentOverride)
    }
  }

  if (sourceSkillData.stack_stats) {
    for (const [stat, statAmount] of Object.entries(sourceSkillData.stack_stats)) {
      updateFlatSubStats(
        targetDict,
        sourceDict,
        stat,
        statAmount ?? 0,
        stackDict[sourceSkillName] ?? 0,
        flatStatScale,
        buffPercentOverride,
      )
    }
  }
}

function buildEffectPipelineCache(
  selectedNames: readonly string[],
  stackDict: Record<string, number>,
  sourceStats: Record<string, number>,
  sourceData: Record<string, EffectSourceData | undefined>,
  flatStatScale = 1,
  fixedPercentsByName?: Record<string, number>,
): EffectPipelineCache {
  const outputs: Record<string, number> = {}
  const percentBeforeByName: Record<string, number> = {}
  const outputsBeforeByName: NamedStageStats = {}
  let currentBuffPercent = sourceStats["Buff%"] ?? 0

  for (const name of selectedNames) {
    outputsBeforeByName[name] = { ...outputs }

    const effectPercent = fixedPercentsByName?.[name] ?? currentBuffPercent
    percentBeforeByName[name] = effectPercent

    const effectStats: Record<string, number> = {}
    updateStats(effectStats, sourceStats, stackDict, name, sourceData[name], flatStatScale, effectPercent)

    for (const [stat, value] of Object.entries(effectStats)) {
      addRawStageStat(outputs, stat, value)
    }

    currentBuffPercent += effectStats["Buff%"] ?? 0
  }

  return {
    outputs,
    percentBeforeByName,
    outputsBeforeByName,
  }
}

function computeEffectDeltaStats(
  selectedNames: readonly string[],
  stackDict: Record<string, number>,
  sourceStats: Record<string, number>,
  sourceDelta: Record<string, number>,
  sourceData: Record<string, EffectSourceData | undefined>,
  pipelineCache: Pick<EffectPipelineCache, "percentBeforeByName" | "outputsBeforeByName">,
): Record<string, number> {
  return applyEffectPipelineDelta(
    selectedNames,
    stackDict,
    sourceStats,
    sourceDelta,
    sourceData,
    pipelineCache,
  ).outputsDelta
}

function applyEffectPipelineDelta(
  selectedNames: readonly string[],
  stackDict: Record<string, number>,
  sourceStats: Record<string, number>,
  sourceDelta: Record<string, number>,
  sourceData: Record<string, EffectSourceData | undefined>,
  pipelineCache: Pick<EffectPipelineCache, "percentBeforeByName" | "outputsBeforeByName">,
): EffectPipelineDeltaResult {
  const outputsDelta: Record<string, number> = {}
  const outputsBeforeByName: NamedStageStats = {}

  for (const name of selectedNames) {
    const effectSourceData = sourceData[name]
    outputsBeforeByName[name] = mergeRawStageStats(
      pipelineCache.outputsBeforeByName[name] ?? {},
      outputsDelta,
    )

    if (!effectSourceData) {
      continue
    }

    const effectPercent = pipelineCache.percentBeforeByName[name] ?? (sourceStats["Buff%"] ?? 0)
    const outputsBefore = pipelineCache.outputsBeforeByName[name] ?? {}
    const effectDelta: Record<string, number> = {}

    for (const { source, ratio, resulting_stat } of effectSourceData.conversions ?? []) {
      const values = getEffectSourceValues(source, sourceStats, outputsBefore, sourceDelta, outputsDelta)
      if (values.base === values.next) {
        continue
      }

      const multiplier = ratio * (1 + (effectPercent / 100))
      const deltaValue =
        truncateTowardZero(values.next * multiplier) - truncateTowardZero(values.base * multiplier)

      applyConversionResultValue(effectDelta, resulting_stat, deltaValue)
    }

    for (const { source, ratio, resulting_stat } of effectSourceData.stack_conversions ?? []) {
      const stackCount = stackDict[name] ?? 0
      if (stackCount === 0) {
        continue
      }

      const values = getEffectSourceValues(source, sourceStats, outputsBefore, sourceDelta, outputsDelta)
      if (values.base === values.next) {
        continue
      }

      const multiplier = ratio * stackCount * (1 + (effectPercent / 100))
      const deltaValue =
        truncateTowardZero(values.next * multiplier) - truncateTowardZero(values.base * multiplier)

      applyConversionResultValue(effectDelta, resulting_stat, deltaValue)
    }

    for (const [stat, value] of Object.entries(effectDelta)) {
      addRawStageStat(outputsDelta, stat, value)
    }
  }

  return {
    outputsDelta,
    outputsBeforeByName,
  }
}

function combineBaseStats(...sources: Record<string, number>[]): Record<string, number> {
  const statsBase: Record<string, number> = {}

  for (const source of sources) {
    for (const [stat, value] of Object.entries(source)) {
      addExpandedStageStat(statsBase, stat, value)
    }
  }

  return statsBase
}

function computeTalentStats(snapshot: BuildSnapshot, selectedTalentNames: readonly string[]): Record<string, number> {
  const stats: Record<string, number> = {}

  for (const name of selectedTalentNames) {
    const talentStats = allTalentStageStatsByName[name]
    if (!talentStats) continue

    for (const [stat, value] of Object.entries(talentStats)) {
      stats[stat] = (stats[stat] ?? 0) + value
    }
  }

  if (snapshot.selectedRace && snapshot.selectedRace in race_data_by_tag) {
    const raceStats = race_data_by_tag[snapshot.selectedRace as keyof typeof race_data_by_tag].stats
    for (const [stat, value] of Object.entries(raceStats)) {
      stats[stat] = (stats[stat] ?? 0) + (value ?? 0)
    }
  }

  return stats
}

type LevelingClass = keyof typeof stat_data.ClassMainStatValues

function isLevelingClass(className: string): className is LevelingClass {
  return className in stat_data.ClassMainStatValues && className in stat_data.ClassScalingStats
}

function getManualLevelRangeOverride(ranges: readonly ManualLevelRange[], totalLevel: number): ManualLevelRange | null {
  for (let i = ranges.length - 1; i >= 0; i--) {
    const range = ranges[i]
    if (totalLevel < range.startLevel || totalLevel > range.endLevel) continue
    return range
  }

  return null
}

function getDefaultLevelClassOrder(snapshot: BuildSnapshot): LevelingClass[] {
  const classOrder: LevelingClass[] = []

  for (const classNameRaw of snapshot.selectedLevelOrder) {
    if (!isLevelingClass(classNameRaw)) continue

    const classLevels = Math.max(0, Math.floor(snapshot.selectedLevels[classNameRaw] ?? 0))
    for (let i = 0; i < classLevels; i++) {
      classOrder.push(classNameRaw)
    }
  }

  return classOrder
}

function truncateToDecimalPlaces(value: number, digits: number): number {
  const multiplier = 10 ** digits
  return Math.trunc(value * multiplier) / multiplier
}

const WARRIOR_TRANSCRIPT_OVERDRIVE_CARRY_PER_LEVEL = 0.0000002
const WARRIOR_OVERDRIVE_CAP_TOTAL_LEVEL = 400

function getComputedClassScalingGain(className: LevelingClass, totalLevel: number): number {
  const scalingStat = stat_data.ClassScalingStats[className]

  switch (className) {
    case "tank":
      return stat_data.ClassMainStatValues[className][scalingStat]
        + Math.floor(stat_data.ClassMainStatValues[className][`${scalingStat} Scaling`] * totalLevel)
    case "warrior":
      return Math.min(
        0.155,
        // `xlevelup warrior` transcript totals match truncating each per-level
        // overdrive gain to 4 decimals before summing the range total.
        truncateToDecimalPlaces(
          stat_data.ClassMainStatValues[className][scalingStat]
            + (stat_data.ClassMainStatValues[className][`${scalingStat} Scaling`] * totalLevel),
          4,
        ),
      )
    case "caster":
      return stat_data.ClassMainStatValues[className][scalingStat]
        + Math.floor(stat_data.ClassMainStatValues[className][`${scalingStat} Scaling`] * totalLevel)
    case "healer":
      return stat_data.ClassMainStatValues[className][scalingStat]
        + (stat_data.ClassMainStatValues[className][`${scalingStat} Scaling`] * totalLevel)
  }

  return 0
}

function computeLevelStats(snapshot: BuildSnapshot): Record<string, number> {
  const statsLevels: Record<string, number> = {}

  statsLevels["Crit DMG%"] = 120
  statsLevels["Crit Chance%"] = 10
  statsLevels["Overdrive%"] = 110
  statsLevels["Focus Regen"] = 5

  let hp = 50
  const mainstatLevelGains: Record<string, number> = { ATK: 0, DEF: 0, MATK: 0, HEAL: 0 }
  const defaultClassOrder = getDefaultLevelClassOrder(snapshot)

  for (const [levelIndex, fallbackClassName] of defaultClassOrder.entries()) {
    const totalLevel = levelIndex + 1
    const rangeOverride = getManualLevelRangeOverride(snapshot.selectedManualLevelRanges, totalLevel)
    const className = rangeOverride?.className ?? fallbackClassName
    const hpMultiplier = stat_data.ClassMainStatValues[className].HP

    if (rangeOverride) {
      hp += getManualRangeGain(rangeOverride, totalLevel, "hpGain")
      mainstatLevelGains.ATK += getManualRangeGain(rangeOverride, totalLevel, "atkGain")
      mainstatLevelGains.DEF += getManualRangeGain(rangeOverride, totalLevel, "defGain")
      mainstatLevelGains.MATK += getManualRangeGain(rangeOverride, totalLevel, "matkGain")
      mainstatLevelGains.HEAL += getManualRangeGain(rangeOverride, totalLevel, "healGain")
    } else {
      hp += Math.floor(hpMultiplier * (1 + 0.1 * (totalLevel - 1))) + 4 * totalLevel
      for (const stat of stat_data.Mainstats) {
        mainstatLevelGains[stat] = (mainstatLevelGains[stat] ?? 0) + (stat_data.ClassMainStatValues[className][stat] ?? 0)
      }
    }

    const scalingStat = stat_data.ClassScalingStats[className]
    const hasManualScalingGain = rangeOverride !== null && rangeOverride.scalingGain !== 0
    const scalingGain = hasManualScalingGain
      ? (totalLevel === rangeOverride.endLevel ? rangeOverride.scalingGain : 0)
      : getComputedClassScalingGain(className, totalLevel)

    statsLevels[scalingStat] = (statsLevels[scalingStat] ?? 0) + scalingGain
  }

  const warriorTranscriptCarryLevels = snapshot.selectedManualLevelRanges.reduce((total, range) => {
    if (range.className !== "warrior" || range.scalingGain === 0) {
      return total
    }

    const uncappedEndLevel = Math.min(range.endLevel, WARRIOR_OVERDRIVE_CAP_TOTAL_LEVEL - 1)
    if (uncappedEndLevel < range.startLevel) {
      return total
    }

    return total + (uncappedEndLevel - range.startLevel + 1)
  }, 0)

  if (warriorTranscriptCarryLevels > 0) {
    // Warrior transcript totals match the displayed 4-decimal scaling sum, but combat
    // still lands slightly above that total until the per-level gain reaches the 0.155 cap.
    statsLevels["Overdrive%"] += warriorTranscriptCarryLevels * WARRIOR_TRANSCRIPT_OVERDRIVE_CARRY_PER_LEVEL
  }

  statsLevels.HP = hp

  const tankLevels = snapshot.selectedLevels.tank ?? 0
  const warriorLevels = snapshot.selectedLevels.warrior ?? 0
  const casterLevels = snapshot.selectedLevels.caster ?? 0
  const healerLevels = snapshot.selectedLevels.healer ?? 0

  statsLevels.MP = 8
    + (tankLevels * stat_data.ClassMainStatValues.tank.MP)
    + (warriorLevels * stat_data.ClassMainStatValues.warrior.MP)
    + (casterLevels * stat_data.ClassMainStatValues.caster.MP)
    + (healerLevels * stat_data.ClassMainStatValues.healer.MP)

  statsLevels.Focus = 100 + (warriorLevels * stat_data.ClassMainStatValues.warrior.Focus)
  const threatLevelBonus = tankLevels >= Math.max(...Object.values(snapshot.selectedLevels), 0) ? 10 : 2
  statsLevels[THREAT_LEVELS_STAT] = tankLevels
  statsLevels[THREAT_BASE_STAT] = 100 + (tankLevels * threatLevelBonus)

  for (const stat of stat_data.Mainstats) {
    const trainingPoints = snapshot.selectedTraining[stat] ?? 0

    statsLevels[stat] = 5
      + (snapshot.selectedStatPoints[stat] ?? 0)
      + getMainStatTrainingGain(trainingPoints)
      + (mainstatLevelGains[stat] ?? 0)
  }

  statsLevels["DEF%"] = (statsLevels["DEF%"] ?? 0) + (tankLevels * 2)
  statsLevels["ATK%"] = (statsLevels["ATK%"] ?? 0) + (warriorLevels * 2)
  statsLevels["MATK%"] = (statsLevels["MATK%"] ?? 0) + (casterLevels * 2)
  statsLevels["HEAL%"] = (statsLevels["HEAL%"] ?? 0) + (healerLevels * 2)

  const selectedRaceKey = (snapshot.selectedRace && snapshot.selectedRace in heroPointGainsByRace)
    ? snapshot.selectedRace as keyof typeof heroPointGainsByRace
    : "Skeleton"
  const raceHeroPointGains = heroPointGainsByRace[selectedRaceKey]

  for (const { id } of heroPointStats) {
    const spentPoints = Number(snapshot.selectedHeroPoints[id] ?? 0)
    if (!Number.isFinite(spentPoints) || spentPoints === 0) continue

    const mappedStat = id === "penvoid" ? "Void Pen%" : stat_data.inGameNames[id]
    if (!mappedStat) continue

    const gainPerPoint = raceHeroPointGains[id] ?? 0
    if (gainPerPoint === 0) continue

    statsLevels[mappedStat] = (statsLevels[mappedStat] ?? 0) + gainPerPoint * spentPoints
  }

  return statsLevels
}

function computeEquipmentStats(snapshot: BuildSnapshot): Record<string, number> {
  const enabledIndices = new Set(snapshot.enabledEquipment)
  const stats: Record<string, number> = {}

  for (const [index, slot] of snapshot.equipmentSlots.entries()) {
    if (!enabledIndices.has(index)) continue

    if (!isTarotEquipmentSlot(slot) && slot.mainstat && slot.mainstat_value) {
      stats[slot.mainstat] = (stats[slot.mainstat] || 0) + slot.mainstat_value
    }

    if (slot.tarotScalingStat) {
      const tarotScalingValue = getTarotScalingValue(slot.name, slot.tarotLevel)

      if (tarotScalingValue !== null) {
        stats[slot.tarotScalingStat] = (stats[slot.tarotScalingStat] ?? 0) + tarotScalingValue
      }
    }

    for (const affix of slot.affixes) {
      if (!affix.stat) continue
      const affixInfo = stat_data.StatsInfo[affix.stat as keyof typeof stat_data.StatsInfo]
      if (affixInfo) {
        stats[affix.stat] = (stats[affix.stat] ?? 0) + affix.value
      }
    }

    if (slot.name.includes("+10")) {
      stats["Dmg%"] = (stats["Dmg%"] ?? 0) + 1
    }
  }

  const enabledSlots = snapshot.equipmentSlots.map((slot, index) => ({
    enabled: enabledIndices.has(index),
    scriptGroupId: slot.scriptGroupId,
  }))
  const appliedScriptCounts = buildAppliedEquipmentScriptCounts(snapshot.equipmentScriptGroups, enabledSlots)
  const appliedScriptStats = buildAverageStatsForScriptCounts(appliedScriptCounts)

  for (const [stat, value] of Object.entries(appliedScriptStats)) {
    stats[stat] = (stats[stat] ?? 0) + value
  }

  return stats
}

function computeRuneStats(snapshot: BuildSnapshot): Record<string, number> {
  const stats: Record<string, number> = {}

  for (const tier in snapshot.selectedRunes) {
    for (const { rune, count } of snapshot.selectedRunes[tier]) {
      const runeEntry = rune_data[rune]
      if (!runeEntry) continue

      for (const [stat, value] of Object.entries(runeEntry.stats)) {
        stats[stat] = (stats[stat] || 0) + (value ?? 0) * count
      }
    }
  }

  return stats
}

function computeArtifactStats(snapshot: BuildSnapshot): Record<string, number> {
  const stats: Record<string, number> = {}
  const level = snapshot.artifact.Level

  if (!Number.isFinite(level)) return stats

  for (const stat of stat_data.Mainstats) {
    const artifactMultiplier = snapshot.artifact[`${stat}%`]
    if (Number.isFinite(artifactMultiplier)) {
      stats[`Art_${stat}%`] = artifactMultiplier
    }
    stats[stat] = level
  }

  return stats
}

function computexPenStats(statsBase: Record<string, number>): Record<string, number> {
  const statsXPen: Record<string, number> = {}

  for (const [xPenStat, affectedStats] of Object.entries(stat_data.xPenMapping)) {
    const multiplier = statsBase[xPenStat] ?? 0
    for (const stat of affectedStats) {
      statsXPen[stat] = Math.floor((statsBase[stat] ?? 0) * (multiplier / 100))
    }
  }

  return statsXPen
}

function computeConversionReadyStats(statsBase: Record<string, number>): Record<string, number> {
  const statsCombined: Record<string, number> = { ...statsBase }

  const statsConversionReady: Record<string, number> = { ...statsCombined }

  for (const stat of stat_data.Mainstats) {
    const base = statsCombined[stat] ?? 0
    const multiplier = (statsCombined[`${stat}%`] ?? 0)
    const globalMultiplier = (statsCombined[`Global ${stat}%`] ?? 0)
    const artifactMultiplier = statsCombined[`Art_${stat}%`] ?? 0
    statsConversionReady[stat] = Math.floor(base * (1 + multiplier / 100) * (1 + globalMultiplier / 100) * (1 + artifactMultiplier / 100))
  }

  for (const stat of stat_data.AllElements) {
    statsConversionReady[`${stat}%`] = statsCombined[`${stat}%`] ?? 0
    statsConversionReady[`${stat} Pen%`] = Math.floor((statsCombined[`${stat} Pen%`] ?? 0) * (1 + (statsCombined[`${stat} xPen%`] ?? 0) / 100))
  }

  statsConversionReady.HP = Math.floor(statsCombined.HP * (1 + ((statsCombined["HP%"] ?? 0) / 100)))
  statsConversionReady.MP = Math.floor((statsCombined.MP ?? 0) * (1 + ((statsCombined["MP%"] ?? 0) / 100)))
  statsConversionReady.Focus = Math.floor((statsCombined.Focus ?? 0) * (1 + ((statsCombined["Focus%"] ?? 0) / 100)))

  return statsConversionReady
}

function computeConversionReadyDelta(
  statsBase: Record<string, number>,
  statsConversionReady: Record<string, number>,
  statsBaseDelta: Record<string, number>,
): Record<string, number> {
  const statsConversionReadyDelta: Record<string, number> = { ...statsBaseDelta }

  for (const stat of stat_data.Mainstats) {
    const baseDelta = statsBaseDelta[stat] ?? 0
    const multiplierDelta = statsBaseDelta[`${stat}%`] ?? 0
    const globalMultiplierDelta = statsBaseDelta[`Global ${stat}%`] ?? 0
    const artifactMultiplierDelta = statsBaseDelta[`Art_${stat}%`] ?? 0

    if (baseDelta === 0 && multiplierDelta === 0 && globalMultiplierDelta === 0 && artifactMultiplierDelta === 0) {
      continue
    }

    const nextValue = Math.floor(
      ((statsBase[stat] ?? 0) + baseDelta)
      * (1 + (((statsBase[`${stat}%`] ?? 0) + multiplierDelta) / 100))
      * (1 + (((statsBase[`Global ${stat}%`] ?? 0) + globalMultiplierDelta) / 100))
      * (1 + (((statsBase[`Art_${stat}%`] ?? 0) + artifactMultiplierDelta) / 100)),
    )

    statsConversionReadyDelta[stat] = nextValue - (statsConversionReady[stat] ?? 0)
  }

  for (const stat of stat_data.AllElements) {
    const penDelta = statsBaseDelta[`${stat} Pen%`] ?? 0
    const xPenDelta = statsBaseDelta[`${stat} xPen%`] ?? 0

    if (penDelta === 0 && xPenDelta === 0) {
      continue
    }

    const nextValue = Math.floor(
      ((statsBase[`${stat} Pen%`] ?? 0) + penDelta)
      * (1 + (((statsBase[`${stat} xPen%`] ?? 0) + xPenDelta) / 100)),
    )

    statsConversionReadyDelta[`${stat} Pen%`] = nextValue - (statsConversionReady[`${stat} Pen%`] ?? 0)
  }

  for (const stat of ["HP", "MP", "Focus"] as const) {
    const baseDelta = statsBaseDelta[stat] ?? 0
    const multiplierDelta = statsBaseDelta[`${stat}%`] ?? 0

    if (baseDelta === 0 && multiplierDelta === 0) {
      continue
    }

    const nextValue = Math.floor(
      ((statsBase[stat] ?? 0) + baseDelta)
      * (1 + (((statsBase[`${stat}%`] ?? 0) + multiplierDelta) / 100)),
    )

    statsConversionReadyDelta[stat] = nextValue - (statsConversionReady[stat] ?? 0)
  }

  return statsConversionReadyDelta
}

function buildSelectedTalentConversionPercents(selectedTalentNames: readonly string[]): ConversionPercentMap {
  let selectedConversionPercents: ConversionPercentMap = {}

  for (const name of selectedTalentNames) {
    selectedConversionPercents = mergeConversionPercentMaps(
      selectedConversionPercents,
      allTalentConversionPercentsByName[name] ?? {},
    )
  }

  return selectedConversionPercents
}

function computeConversionDeltaFromMaps(
  sourceStats: Record<string, number>,
  sourceDelta: Record<string, number>,
  baseConversionPercents: ConversionPercentMap,
  conversionPercentDelta: ConversionPercentMap = {},
): Record<string, number> {
  const convertedDelta: Record<string, number> = {}
  const affectedSources = new Set<string>([
    ...Object.keys(sourceDelta),
    ...Object.keys(conversionPercentDelta),
  ])

  for (const source of affectedSources) {
    const baseSourceValue = sourceStats[source] ?? 0
    const nextSourceValue = baseSourceValue + (sourceDelta[source] ?? 0)
    const baseTargets = baseConversionPercents[source] ?? {}
    const ratioDeltaTargets = conversionPercentDelta[source] ?? {}
    const affectedTargets = new Set<string>([
      ...Object.keys(baseTargets),
      ...Object.keys(ratioDeltaTargets),
    ])

    for (const resultingStat of affectedTargets) {
      const baseRatio = baseTargets[resultingStat] ?? 0
      const nextRatio = baseRatio + (ratioDeltaTargets[resultingStat] ?? 0)
      const baseValue = baseRatio === 0 ? 0 : truncateTowardZero(baseSourceValue * baseRatio)
      const nextValue = nextRatio === 0 ? 0 : truncateTowardZero(nextSourceValue * nextRatio)
      addRawStageStat(convertedDelta, resultingStat, nextValue - baseValue)
    }
  }

  return convertedDelta
}

function computeConvertedStatsFromPercents(
  statsConversionReady: Record<string, number>,
  conversionPercents: ConversionPercentMap,
): Record<string, number> {
  const converted: Record<string, number> = {}

  for (const [source, resultingStats] of Object.entries(conversionPercents)) {
    const base = statsConversionReady[source] ?? 0

    if (!Number.isFinite(base) || Math.abs(base) < 0.0001) {
      continue
    }

    for (const [resultingStat, ratio] of Object.entries(resultingStats)) {
      converted[resultingStat] = (converted[resultingStat] || 0) + truncateTowardZero(base * ratio)
    }
  }

  return converted
}

function computeBuffReadyStats(statsConversionReady: Record<string, number>, statsConverted: Record<string, number>): Record<string, number> {
  const statsBuffReady: Record<string, number> = {}
  const expandedConverted = expandCompoundStats(statsConverted)

  for (const [stat, value] of Object.entries(statsConversionReady)) {
    statsBuffReady[stat] = (statsBuffReady[stat] || 0) + value
  }

  for (const [stat, value] of Object.entries(expandedConverted)) {
    statsBuffReady[stat] = (statsBuffReady[stat] || 0) + value
  }

  return statsBuffReady
}

export function getOrderedBuffPercentBeforeByName(
  selectedNames: readonly string[],
  stackDict: Record<string, number>,
  sourceStats: Record<string, number>,
  sourceData: Record<string, EffectSourceData | undefined>,
  flatStatScale = 1,
): Record<string, number> {
  return buildEffectPipelineCache(selectedNames, stackDict, sourceStats, sourceData, flatStatScale).percentBeforeByName
}

function computeBuffStats(
  selectedBuffNames: readonly string[],
  buffStacks: Record<string, number>,
  statsBuffReady: Record<string, number>,
  buffPercentBeforeByName?: Record<string, number>,
): Record<string, number> {
  return buildEffectPipelineCache(
    selectedBuffNames,
    buffStacks,
    statsBuffReady,
    skill_data,
    100,
    buffPercentBeforeByName,
  ).outputs
}

function computeTarotStats(
  selectedTarots: readonly string[],
  tarotStacks: Record<string, number>,
  statsBuffReady: Record<string, number>,
  tarotPercentBeforeByName?: Record<string, number>,
): Record<string, number> {
  return buildEffectPipelineCache(
    selectedTarots,
    tarotStacks,
    statsBuffReady,
    tarot_data,
    1,
    tarotPercentBeforeByName,
  ).outputs
}

function computeDmgReadyStats(
  statsBuffReady: Record<string, number>,
  statsBuffs: Record<string, number>,
  statsTarots: Record<string, number>,
): Record<string, number> {
  const result: Record<string, number> = { ...statsBuffReady }

  for (const [stat, value] of Object.entries(statsBuffs)) {
    result[stat] = (result[stat] || 0) + (value ?? 0)
  }

  for (const [stat, value] of Object.entries(statsTarots)) {
    result[stat] = (result[stat] || 0) + (value ?? 0)
  }

  return result
}

export type BuildStatDeltaCache = {
  snapshot: BuildSnapshot
  stages: BuildStatStages
  additionalStageStats: ReturnType<typeof groupAdditionalStageStatEntries>
  stageStatOverrides: ReturnType<typeof groupStageStatOverrideEntries>
}

function attachPlayerLevelStat(statsDmgReady: Record<string, number>, stages: BuildStatStages): Record<string, number> {
  statsDmgReady[DAMAGE_CALC_PLAYER_LEVEL_STAT] = stages.StatsDmgReady[DAMAGE_CALC_PLAYER_LEVEL_STAT] ?? 0
  return statsDmgReady
}

function computeAdjustedBuffStats(
  selectedBuffs: readonly string[],
  buffStacks: Record<string, number>,
  statsBuffReady: Record<string, number>,
  cache: BuildStatDeltaCache,
): Record<string, number> {
  const buffPercents = getOrderedBuffPercentBeforeByName(
    selectedBuffs,
    buffStacks,
    statsBuffReady,
    skill_data,
    100,
  )

  return mergeExpandedStageStats(
    applyExpandedStageStatOverrides(
      computeBuffStats(selectedBuffs, buffStacks, statsBuffReady, buffPercents),
      cache.stageStatOverrides.buffs,
    ),
    cache.additionalStageStats.buffs,
  )
}

function computeAdjustedTarotStats(
  selectedTarots: readonly string[],
  tarotStacks: Record<string, number>,
  statsBuffReady: Record<string, number>,
  cache: BuildStatDeltaCache,
): Record<string, number> {
  return mergeExpandedStageStats(
    applyExpandedStageStatOverrides(
      computeTarotStats(selectedTarots, tarotStacks, statsBuffReady),
      cache.stageStatOverrides.tarots,
    ),
    cache.additionalStageStats.tarots,
  )
}

export function prepareBuildStatDeltaCache(
  snapshot: BuildSnapshot,
  stages: BuildStatStages = computeBuildStatStages(snapshot),
): BuildStatDeltaCache {
  return {
    snapshot,
    stages,
    additionalStageStats: groupAdditionalStageStatEntries(snapshot.additionalStageStats),
    stageStatOverrides: groupStageStatOverrideEntries(snapshot.stageStatOverrides),
  }
}

export function computeTalentToggledDmgReadyStatsDelta(
  cache: BuildStatDeltaCache,
  talentName: string,
  wasSelected: boolean,
): Record<string, number> {
  const statsTalentDelta = scaleStageStats(cache.stages.StatsTalentStats[talentName] ?? {}, wasSelected ? -1 : 1)
  const conversionPercentDelta = scaleConversionPercentMap(
    cache.stages.StatsTalentConversionPercents[talentName] ?? {},
    wasSelected ? -1 : 1,
  )
  const statsBaseDelta = combineBaseStats(statsTalentDelta)
  const statsConversionReadyDelta = computeConversionReadyDelta(
    cache.stages.StatsBase,
    cache.stages.StatsConversionReady,
    statsBaseDelta,
  )
  const statsConvertedDelta = computeConversionDeltaFromMaps(
    cache.stages.StatsConversionReady,
    statsConversionReadyDelta,
    cache.stages.StatsConversionPercents,
    conversionPercentDelta,
  )
  const statsBuffReadyDelta = mergeRawStageStats(
    statsConversionReadyDelta,
    expandCompoundStats(statsConvertedDelta),
  )
  const statsBuffsDelta = computeEffectDeltaStats(
    cache.snapshot.selectedBuffs,
    cache.snapshot.selectedBuffStacks,
    cache.stages.StatsBuffReady,
    statsBuffReadyDelta,
    skill_data,
    {
      percentBeforeByName: cache.stages.StatsBuffPercents,
      outputsBeforeByName: cache.stages.StatsBuffOutputsBeforeByName,
    },
  )
  const statsTarotsDelta = computeEffectDeltaStats(
    cache.snapshot.selectedTarots,
    cache.snapshot.tarotStacks,
    cache.stages.StatsBuffReady,
    statsBuffReadyDelta,
    tarot_data,
    {
      percentBeforeByName: cache.stages.StatsTarotPercents,
      outputsBeforeByName: cache.stages.StatsTarotOutputsBeforeByName,
    },
  )
  const statsDmgReadyDelta = mergeRawStageStats(
    mergeRawStageStats(statsBuffReadyDelta, statsBuffsDelta),
    statsTarotsDelta,
  )

  return statsDmgReadyDelta
}

export function applyTalentToggleToBuildStatDeltaCache(
  cache: BuildStatDeltaCache,
  talentName: string,
  wasSelected: boolean,
  nextSelectedTalents: Iterable<string>,
): {
  cache: BuildStatDeltaCache
  statsDmgReadyDelta: Record<string, number>
} {
  const statsTalentDelta = scaleStageStats(cache.stages.StatsTalentStats[talentName] ?? {}, wasSelected ? -1 : 1)
  const conversionPercentDelta = scaleConversionPercentMap(
    cache.stages.StatsTalentConversionPercents[talentName] ?? {},
    wasSelected ? -1 : 1,
  )
  const statsBaseDelta = combineBaseStats(statsTalentDelta)
  const statsBase = mergeRawStageStats(cache.stages.StatsBase, statsBaseDelta)
  const statsXPen = computexPenStats(statsBase)
  const statsConversionReadyDelta = computeConversionReadyDelta(
    cache.stages.StatsBase,
    cache.stages.StatsConversionReady,
    statsBaseDelta,
  )
  const statsConversionReady = mergeRawStageStats(cache.stages.StatsConversionReady, statsConversionReadyDelta)
  const statsConversionPercents = mergeConversionPercentMaps(cache.stages.StatsConversionPercents, conversionPercentDelta)
  const statsConvertedDelta = computeConversionDeltaFromMaps(
    cache.stages.StatsConversionReady,
    statsConversionReadyDelta,
    cache.stages.StatsConversionPercents,
    conversionPercentDelta,
  )
  const statsConverted = mergeRawStageStats(cache.stages.StatsConverted, statsConvertedDelta)
  const statsBuffReadyDelta = mergeRawStageStats(
    statsConversionReadyDelta,
    expandCompoundStats(statsConvertedDelta),
  )
  const statsBuffReady = mergeRawStageStats(cache.stages.StatsBuffReady, statsBuffReadyDelta)
  const buffPipelineDelta = applyEffectPipelineDelta(
    cache.snapshot.selectedBuffs,
    cache.snapshot.selectedBuffStacks,
    cache.stages.StatsBuffReady,
    statsBuffReadyDelta,
    skill_data,
    {
      percentBeforeByName: cache.stages.StatsBuffPercents,
      outputsBeforeByName: cache.stages.StatsBuffOutputsBeforeByName,
    },
  )
  const statsBuffs = mergeRawStageStats(cache.stages.StatsBuffs, buffPipelineDelta.outputsDelta)
  const tarotPipelineDelta = applyEffectPipelineDelta(
    cache.snapshot.selectedTarots,
    cache.snapshot.tarotStacks,
    cache.stages.StatsBuffReady,
    statsBuffReadyDelta,
    tarot_data,
    {
      percentBeforeByName: cache.stages.StatsTarotPercents,
      outputsBeforeByName: cache.stages.StatsTarotOutputsBeforeByName,
    },
  )
  const statsTarots = mergeRawStageStats(cache.stages.StatsTarots, tarotPipelineDelta.outputsDelta)
  const statsDmgReadyDelta = mergeRawStageStats(
    mergeRawStageStats(statsBuffReadyDelta, buffPipelineDelta.outputsDelta),
    tarotPipelineDelta.outputsDelta,
  )
  const statsDmgReady = attachPlayerLevelStat(
    mergeRawStageStats(cache.stages.StatsDmgReady, statsDmgReadyDelta),
    cache.stages,
  )

  return {
    cache: {
      ...cache,
      snapshot: {
        ...cache.snapshot,
        selectedTalents: Array.from(new Set(nextSelectedTalents)),
      },
      stages: {
        ...cache.stages,
        StatsTalents: mergeRawStageStats(cache.stages.StatsTalents, statsTalentDelta),
        StatsConversionPercents: statsConversionPercents,
        StatsBase: statsBase,
        StatsXPen: statsXPen,
        StatsConversionReady: statsConversionReady,
        StatsConverted: statsConverted,
        StatsBuffReady: statsBuffReady,
        StatsBuffOutputsBeforeByName: buffPipelineDelta.outputsBeforeByName,
        StatsBuffs: statsBuffs,
        StatsTarotOutputsBeforeByName: tarotPipelineDelta.outputsBeforeByName,
        StatsTarots: statsTarots,
        StatsDmgReady: statsDmgReady,
      },
    },
    statsDmgReadyDelta,
  }
}

export function computeTalentToggledDmgReadyStats(
  cache: BuildStatDeltaCache,
  talentName: string,
  wasSelected: boolean,
): Record<string, number> {
  return attachPlayerLevelStat(
    mergeRawStageStats(cache.stages.StatsDmgReady, computeTalentToggledDmgReadyStatsDelta(cache, talentName, wasSelected)),
    cache.stages,
  )
}

export function computeBuffSelectionDmgReadyStats(
  cache: BuildStatDeltaCache,
  selectedBuffs: Iterable<string>,
  buffStacks: Record<string, number> = cache.snapshot.selectedBuffStacks,
): Record<string, number> {
  const nextSelectedBuffs = Array.from(new Set(selectedBuffs))
  const statsBuffs = computeAdjustedBuffStats(nextSelectedBuffs, buffStacks, cache.stages.StatsBuffReady, cache)

  return attachPlayerLevelStat(
    computeDmgReadyStats(cache.stages.StatsBuffReady, statsBuffs, cache.stages.StatsTarots),
    cache.stages,
  )
}

export function computeTarotSelectionDmgReadyStats(
  cache: BuildStatDeltaCache,
  selectedTarots: Iterable<string>,
  tarotStacks: Record<string, number> = cache.snapshot.tarotStacks,
): Record<string, number> {
  const nextSelectedTarots = Array.from(new Set(selectedTarots))
  const statsTarots = computeAdjustedTarotStats(nextSelectedTarots, tarotStacks, cache.stages.StatsBuffReady, cache)

  return attachPlayerLevelStat(
    computeDmgReadyStats(cache.stages.StatsBuffReady, cache.stages.StatsBuffs, statsTarots),
    cache.stages,
  )
}

export function computeBuildStatStages(
  snapshot: BuildSnapshot,
  overrides?: {
    selectedTalents?: Iterable<string>
    selectedBuffs?: Iterable<string>
    buffStacks?: Record<string, number>
    selectedTarots?: Iterable<string>
    tarotStacks?: Record<string, number>
    extraRawStats?: Record<string, number>
  },
): BuildStatStages {
  const selectedTalents = overrides?.selectedTalents
    ? Array.from(new Set(overrides.selectedTalents))
    : snapshot.selectedTalents
  const selectedBuffs = overrides?.selectedBuffs
    ? Array.from(new Set(overrides.selectedBuffs))
    : snapshot.selectedBuffs
  const selectedTarots = overrides?.selectedTarots
    ? Array.from(new Set(overrides.selectedTarots))
    : snapshot.selectedTarots
  const buffStacks = overrides?.buffStacks ?? snapshot.selectedBuffStacks
  const tarotStacks = overrides?.tarotStacks ?? snapshot.tarotStacks
  const extraRawStats = overrides?.extraRawStats ?? {}
  const additionalStageStats = groupAdditionalStageStatEntries(snapshot.additionalStageStats)
  const stageStatOverrides = groupStageStatOverrideEntries(snapshot.stageStatOverrides)
  const statsTalentStats = allTalentStageStatsByName
  const statsTalentConversionPercents = allTalentConversionPercentsByName
  const statsConversionPercents = buildSelectedTalentConversionPercents(selectedTalents)

  const statsTalents = mergeRawStageStats(
    applyRawStageStatOverrides(
      computeTalentStats(snapshot, selectedTalents),
      stageStatOverrides.talents,
    ),
    additionalStageStats.talents,
  )
  const statsLevels = mergeRawStageStats(
    applyRawStageStatOverrides(computeLevelStats(snapshot), stageStatOverrides.levels),
    additionalStageStats.levels,
  )
  const statsEquipment = mergeRawStageStats(
    applyRawStageStatOverrides(computeEquipmentStats(snapshot), stageStatOverrides.equipment),
    additionalStageStats.equipment,
  )
  const statsRunes = mergeRawStageStats(
    mergeRawStageStats(
      applyRawStageStatOverrides(computeRuneStats(snapshot), stageStatOverrides.runes),
      additionalStageStats.runes,
    ),
    extraRawStats,
  )
  const statsArtifact = mergeRawStageStats(
    applyRawStageStatOverrides(computeArtifactStats(snapshot), stageStatOverrides.artifact),
    additionalStageStats.artifact,
  )
  const statsBase = combineBaseStats(statsTalents, statsEquipment, statsLevels, statsRunes, statsArtifact)
  const statsXPen = computexPenStats(statsBase)
  const statsConversionReady = computeConversionReadyStats(statsBase)
  const statsConverted = mergeRawStageStats(
    applyRawStageStatOverrides(
      computeConvertedStatsFromPercents(statsConversionReady, statsConversionPercents),
      stageStatOverrides.converted,
    ),
    additionalStageStats.converted,
  )
  const statsBuffReady = computeBuffReadyStats(statsConversionReady, statsConverted)
  const buffPipelineCache = buildEffectPipelineCache(
    selectedBuffs,
    buffStacks,
    statsBuffReady,
    skill_data,
    100,
  )
  const statsBuffPercents = buffPipelineCache.percentBeforeByName
  const statsBuffs = mergeExpandedStageStats(
    applyExpandedStageStatOverrides(
      buffPipelineCache.outputs,
      stageStatOverrides.buffs,
    ),
    additionalStageStats.buffs,
  )
  const tarotPipelineCache = buildEffectPipelineCache(
    selectedTarots,
    tarotStacks,
    statsBuffReady,
    tarot_data,
  )
  const statsTarotPercents = tarotPipelineCache.percentBeforeByName
  const statsTarots = mergeExpandedStageStats(
    applyExpandedStageStatOverrides(
      tarotPipelineCache.outputs,
      stageStatOverrides.tarots,
    ),
    additionalStageStats.tarots,
  )
  const statsDmgReady = computeDmgReadyStats(statsBuffReady, statsBuffs, statsTarots)
  statsDmgReady[DAMAGE_CALC_PLAYER_LEVEL_STAT] = Object.values(snapshot.selectedLevels).reduce(
    (total, level) => total + Math.max(0, Math.floor(level ?? 0)),
    0,
  )

  return {
    StatsTalents: statsTalents,
    StatsTalentStats: statsTalentStats,
    StatsTalentConversionPercents: statsTalentConversionPercents,
    StatsConversionPercents: statsConversionPercents,
    StatsLevels: statsLevels,
    StatsEquipment: statsEquipment,
    StatsRunes: statsRunes,
    StatsArtifact: statsArtifact,
    StatsBase: statsBase,
    StatsXPen: statsXPen,
    StatsConversionReady: statsConversionReady,
    StatsConverted: statsConverted,
    StatsBuffReady: statsBuffReady,
    StatsBuffPercents: statsBuffPercents,
    StatsBuffOutputsBeforeByName: buffPipelineCache.outputsBeforeByName,
    StatsBuffs: statsBuffs,
    StatsTarotPercents: statsTarotPercents,
    StatsTarotOutputsBeforeByName: tarotPipelineCache.outputsBeforeByName,
    StatsTarots: statsTarots,
    StatsDmgReady: statsDmgReady,
  }
}

export function persistBuildStatStages(storage: Storage, stages: BuildStatStages): void {
  for (const [key, value] of Object.entries(stages)) {
    storage.setItem(key, JSON.stringify(value))
  }
}
