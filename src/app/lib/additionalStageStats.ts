import stat_data from "@/app/data/stat_data"

export const ADDITIONAL_STAGE_STATS_STORAGE_KEY = "AdditionalStageStats"
export const STAGE_STAT_OVERRIDES_STORAGE_KEY = "StageStatOverrides"

export const additionalStageStatStages = [
  "talents",
  "levels",
  "equipment",
  "runes",
  "artifact",
  "converted",
  "buffs",
  "tarots",
] as const

export type AdditionalStageStatStage = typeof additionalStageStatStages[number]

export type AdditionalStageStatEntry = {
  id: string
  stage: AdditionalStageStatStage
  stat: string
  value: number
}

export type StageStatOverrideEntry = AdditionalStageStatEntry

export const additionalStageStatStageOptions: Array<{ value: AdditionalStageStatStage; label: string }> = [
  { value: "equipment", label: "Equipment" },
  { value: "tarots", label: "Tarots" },
  { value: "buffs", label: "Buffs" },
  { value: "talents", label: "Talents" },
  { value: "levels", label: "Levels" },
  { value: "runes", label: "Runes" },
  { value: "artifact", label: "Artifact" },
  { value: "converted", label: "Talent Conversions" },
]

export const additionalStageStatNames = Object.keys(stat_data.StatsInfo).sort((left, right) => left.localeCompare(right))

const additionalStageStatStageSet = new Set<AdditionalStageStatStage>(additionalStageStatStages)
const additionalStageStatNameSet = new Set(additionalStageStatNames)

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

const asFiniteNumber = (value: unknown, fallback = 0): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback

export function isAdditionalStageStatStage(value: unknown): value is AdditionalStageStatStage {
  return typeof value === "string" && additionalStageStatStageSet.has(value as AdditionalStageStatStage)
}

export function isAdditionalStageStatName(value: unknown): value is string {
  return typeof value === "string" && additionalStageStatNameSet.has(value)
}

export function normalizeAdditionalStageStatEntries(value: unknown): AdditionalStageStatEntry[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.reduce<AdditionalStageStatEntry[]>((result, entry, index) => {
    if (!isRecord(entry) || !isAdditionalStageStatStage(entry.stage) || !isAdditionalStageStatName(entry.stat)) {
      return result
    }

    result.push({
      id: typeof entry.id === "string" && entry.id.length > 0 ? entry.id : `${entry.stage}:${entry.stat}:${index}`,
      stage: entry.stage,
      stat: entry.stat,
      value: asFiniteNumber(entry.value, 0),
    })

    return result
  }, [])
}

export function normalizeStageStatOverrideEntries(value: unknown): StageStatOverrideEntry[] {
  return normalizeAdditionalStageStatEntries(value)
}

export function createEmptyAdditionalStageStatGroups(): Record<AdditionalStageStatStage, Record<string, number>> {
  return {
    talents: {},
    levels: {},
    equipment: {},
    runes: {},
    artifact: {},
    converted: {},
    buffs: {},
    tarots: {},
  }
}

export function groupAdditionalStageStatEntries(
  entries: readonly AdditionalStageStatEntry[],
): Record<AdditionalStageStatStage, Record<string, number>> {
  const grouped = createEmptyAdditionalStageStatGroups()

  for (const entry of entries) {
    if (!isAdditionalStageStatStage(entry.stage) || !isAdditionalStageStatName(entry.stat) || !Number.isFinite(entry.value)) {
      continue
    }

    grouped[entry.stage][entry.stat] = (grouped[entry.stage][entry.stat] ?? 0) + entry.value
  }

  return grouped
}

export function groupStageStatOverrideEntries(
  entries: readonly StageStatOverrideEntry[],
): Record<AdditionalStageStatStage, Record<string, number>> {
  const grouped = createEmptyAdditionalStageStatGroups()

  for (const entry of entries) {
    if (!isAdditionalStageStatStage(entry.stage) || !isAdditionalStageStatName(entry.stat) || !Number.isFinite(entry.value)) {
      continue
    }

    grouped[entry.stage][entry.stat] = entry.value
  }

  return grouped
}
