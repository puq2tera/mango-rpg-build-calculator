import { heroPointGainsByRace, heroPointStats } from "@/app/data/heropoint_data"
import { race_data_by_tag } from "@/app/data/race_data"
import rune_data from "@/app/data/rune_data"
import { skill_data, type Skill } from "@/app/data/skill_data"
import stat_data from "@/app/data/stat_data"
import { talent_data } from "@/app/data/talent_data"
import tarot_data, { type Tarot } from "@/app/data/tarot_data"
import {
  ADDITIONAL_STAGE_STATS_STORAGE_KEY,
  groupAdditionalStageStatEntries,
  normalizeAdditionalStageStatEntries,
  type AdditionalStageStatEntry,
} from "@/app/lib/additionalStageStats"
import { normalizeArtifact } from "@/app/lib/artifactState"
import {
  getTarotScalingValue,
  isTarotEquipmentSlot,
  normalizeEquipmentSlots,
  type EquipmentSlot,
} from "@/app/lib/equipmentSlots"
import { readStoredStatPoints } from "@/app/lib/mainStatPoints"
import { readStoredEffectiveTarotSelections } from "@/app/lib/tarotSelections"
import { THREAT_BASE_STAT, THREAT_LEVELS_STAT } from "@/app/lib/threat"
import {
  getManualRangeGain,
  normalizeManualLevelRanges,
  type ManualLevelRange,
} from "@/app/lib/manualLevelRanges"

type RuneSelection = { rune: string; count: number }

export type BuildSnapshot = {
  selectedTalents: string[]
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
  artifact: Record<string, number>
  additionalStageStats: AdditionalStageStatEntry[]
}

export type BuildStatStages = {
  StatsTalents: Record<string, number>
  StatsLevels: Record<string, number>
  StatsEquipment: Record<string, number>
  StatsRunes: Record<string, number>
  StatsArtifact: Record<string, number>
  StatsBase: Record<string, number>
  StatsXPen: Record<string, number>
  StatsConversionReady: Record<string, number>
  StatsConverted: Record<string, number>
  StatsBuffReady: Record<string, number>
  StatsBuffs: Record<string, number>
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
    selectedBuffs: asStringArray(jsonParse(storage.getItem("selectedBuffs"), [])),
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
    artifact: normalizeArtifact(jsonParse(storage.getItem("Artifact"), null)),
    additionalStageStats: normalizeAdditionalStageStatEntries(
      jsonParse(storage.getItem(ADDITIONAL_STAGE_STATS_STORAGE_KEY), []),
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

function updateConversionSubStats(
  targetDict: Record<string, number>,
  sourceDict: Record<string, number>,
  sourceStat: string,
  ratio: number,
  targetStat: string,
  stackCount = 1,
): void {
  const buff = (sourceDict["Buff%"] ?? 0) + (targetDict["Buff%"] ?? 0)
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

  const affixInfo = stat_data.StatsInfo[targetStat as keyof typeof stat_data.StatsInfo]
  const substats = affixInfo?.sub_stats
  const resultValue = Math.floor(sourceValue * (ratio * stackCount) * (1 + buff))

  if (substats) {
    for (const substat of substats) {
      targetDict[substat] = (targetDict[substat] ?? 0) + resultValue
    }
  } else if (affixInfo) {
    targetDict[targetStat] = (targetDict[targetStat] ?? 0) + resultValue
  }
}

function updateFlatSubStats(
  targetDict: Record<string, number>,
  sourceDict: Record<string, number>,
  targetStat: string,
  targetValue: number,
  stackCount = 1,
  flatStatScale = 1,
): void {
  const buff = (sourceDict["Buff%"] ?? 0) + (targetDict["Buff%"] ?? 0)

  const affixInfo = stat_data.StatsInfo[targetStat as keyof typeof stat_data.StatsInfo]
  const substats = affixInfo?.sub_stats
  const normalizedTargetValue = affixInfo?.multi === 0.01
    ? targetValue * flatStatScale
    : targetValue
  const resultValue = Math.floor(normalizedTargetValue * stackCount * (1 + buff))

  if (substats) {
    for (const substat of substats) {
      targetDict[substat] = (targetDict[substat] ?? 0) + resultValue
    }
  } else if (affixInfo) {
    targetDict[targetStat] = (targetDict[targetStat] ?? 0) + resultValue
  }
}

function updateStats(
  targetDict: Record<string, number>,
  sourceDict: Record<string, number>,
  stackDict: Record<string, number>,
  sourceSkillName: string,
  sourceSkillData?: Skill | Tarot,
  flatStatScale = 1,
): void {
  if (!sourceSkillData) return

  if (sourceSkillData.conversions) {
    for (const { source, ratio, resulting_stat } of sourceSkillData.conversions) {
      updateConversionSubStats(targetDict, sourceDict, source, ratio, resulting_stat)
    }
  }

  if (sourceSkillData.stack_conversions) {
    for (const { source, ratio, resulting_stat } of sourceSkillData.stack_conversions) {
      updateConversionSubStats(targetDict, sourceDict, source, ratio, resulting_stat, stackDict[sourceSkillName] ?? 0)
    }
  }

  if (sourceSkillData.stats) {
    for (const [stat, statAmount] of Object.entries(sourceSkillData.stats)) {
      updateFlatSubStats(targetDict, sourceDict, stat, statAmount ?? 0, 1, flatStatScale)
    }
  }

  if (sourceSkillData.stack_stats) {
    for (const [stat, statAmount] of Object.entries(sourceSkillData.stack_stats)) {
      updateFlatSubStats(targetDict, sourceDict, stat, statAmount ?? 0, stackDict[sourceSkillName] ?? 0, flatStatScale)
    }
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
    const data = talent_data[name]
    if (!data) continue

    for (const [stat, value] of Object.entries(data.stats)) {
      stats[stat] = (stats[stat] ?? 0) + (value ?? 0)
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
  // TODO: Verify that changing level based threat gaing from 10-2 to 5-1 is accurate
  const threatLevelBonus = tankLevels >= Math.max(...Object.values(snapshot.selectedLevels), 0) ? tankLevels * 5 : tankLevels
  statsLevels[THREAT_LEVELS_STAT] = threatLevelBonus
  statsLevels[THREAT_BASE_STAT] = 100 + threatLevelBonus

  for (const stat of stat_data.Mainstats) {
    statsLevels[stat] = 5
      + (snapshot.selectedStatPoints[stat] ?? 0)
      + (4 * (snapshot.selectedTraining[stat] ?? 0))
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

  return statsConversionReady
}

function computeConvertedTalentStats(statsConversionReady: Record<string, number>, selectedTalentNames: readonly string[]): Record<string, number> {
  const converted: Record<string, number> = {}

  for (const name of selectedTalentNames) {
    const data = talent_data[name]
    if (!data || !Array.isArray(data.conversions)) continue

    for (const { source, ratio, resulting_stat } of data.conversions) {
      const base = statsConversionReady[source] ?? 0
      converted[resulting_stat] = Math.floor((converted[resulting_stat] || 0) + (base * ratio))
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

function computeBuffStats(
  selectedBuffNames: readonly string[],
  buffStacks: Record<string, number>,
  statsBuffReady: Record<string, number>,
): Record<string, number> {
  const buffed: Record<string, number> = {}

  for (const skillName of selectedBuffNames) {
    updateStats(buffed, statsBuffReady, buffStacks, skillName, skill_data[skillName], 100)
  }

  return buffed
}

function computeTarotStats(
  selectedTarots: readonly string[],
  tarotStacks: Record<string, number>,
  statsBuffReady: Record<string, number>,
): Record<string, number> {
  const tarotBuff: Record<string, number> = {}

  for (const tarotName of selectedTarots) {
    updateStats(tarotBuff, statsBuffReady, tarotStacks, tarotName, tarot_data[tarotName])
  }

  return tarotBuff
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

export function computeBuildStatStages(
  snapshot: BuildSnapshot,
  overrides?: {
    selectedTalents?: Iterable<string>
    selectedBuffs?: Iterable<string>
    buffStacks?: Record<string, number>
    selectedTarots?: Iterable<string>
    tarotStacks?: Record<string, number>
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
  const additionalStageStats = groupAdditionalStageStatEntries(snapshot.additionalStageStats)

  const statsTalents = mergeRawStageStats(
    computeTalentStats(snapshot, selectedTalents),
    additionalStageStats.talents,
  )
  const statsLevels = mergeRawStageStats(computeLevelStats(snapshot), additionalStageStats.levels)
  const statsEquipment = mergeRawStageStats(computeEquipmentStats(snapshot), additionalStageStats.equipment)
  const statsRunes = mergeRawStageStats(computeRuneStats(snapshot), additionalStageStats.runes)
  const statsArtifact = mergeRawStageStats(computeArtifactStats(snapshot), additionalStageStats.artifact)
  const statsBase = combineBaseStats(statsTalents, statsEquipment, statsLevels, statsRunes, statsArtifact)
  const statsXPen = computexPenStats(statsBase)
  const statsConversionReady = computeConversionReadyStats(statsBase)
  const statsConverted = mergeRawStageStats(
    computeConvertedTalentStats(statsConversionReady, selectedTalents),
    additionalStageStats.converted,
  )
  const statsBuffReady = computeBuffReadyStats(statsConversionReady, statsConverted)
  const statsBuffs = mergeExpandedStageStats(
    computeBuffStats(selectedBuffs, buffStacks, statsBuffReady),
    additionalStageStats.buffs,
  )
  const statsTarots = mergeExpandedStageStats(
    computeTarotStats(selectedTarots, tarotStacks, statsBuffReady),
    additionalStageStats.tarots,
  )
  const statsDmgReady = computeDmgReadyStats(statsBuffReady, statsBuffs, statsTarots)

  return {
    StatsTalents: statsTalents,
    StatsLevels: statsLevels,
    StatsEquipment: statsEquipment,
    StatsRunes: statsRunes,
    StatsArtifact: statsArtifact,
    StatsBase: statsBase,
    StatsXPen: statsXPen,
    StatsConversionReady: statsConversionReady,
    StatsConverted: statsConverted,
    StatsBuffReady: statsBuffReady,
    StatsBuffs: statsBuffs,
    StatsTarots: statsTarots,
    StatsDmgReady: statsDmgReady,
  }
}

export function persistBuildStatStages(storage: Storage, stages: BuildStatStages): void {
  for (const [key, value] of Object.entries(stages)) {
    storage.setItem(key, JSON.stringify(value))
  }
}
