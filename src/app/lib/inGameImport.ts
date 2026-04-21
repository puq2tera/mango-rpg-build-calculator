import { heroPointStats, type HeroPointStatId } from "@/app/data/heropoint_data"
import race_data, { type RaceTag } from "@/app/data/race_data"
import rune_data from "@/app/data/rune_data"
import { skill_data } from "@/app/data/skill_data"
import stat_data from "@/app/data/stat_data"
import tarot_data from "@/app/data/tarot_data"
import { talent_data } from "@/app/data/talent_data"
import { normalizeArtifact, type ArtifactState } from "@/app/lib/artifactState"
import { dispatchBuildSnapshotUpdated } from "@/app/lib/buildEvents"
import {
  ENABLED_EQUIPMENT_STORAGE_KEY,
  EQUIPMENT_AUTO_LINKED_TAROTS_STORAGE_KEY,
  EQUIPMENT_SLOTS_STORAGE_KEY,
  createDefaultEquipmentSlot,
  getAutoManagedTarotNames,
  getEnabledEquipmentIndices,
  getEquipmentAutoLinkedTarots,
  normalizeEquipmentSlot,
  normalizeEquipmentSlots,
  type EquipmentAffix,
  type EquipmentSlot,
} from "@/app/lib/equipmentSlots"
import {
  SKILL_SELECTION_STORAGE_KEY,
  TALENT_SELECTION_STORAGE_KEY,
  getOrderedSkillNames,
  getOrderedTalentNames,
} from "@/app/lib/learnCommands"
import {
  createDefaultMainStatValues,
  parseStoredMainStatValues,
  persistStoredStatPoints,
  type MainStatKey,
  type MainStatValues,
} from "@/app/lib/mainStatPoints"
import {
  getManualRangeGain,
  getManualRangeMaxTotalLevel,
  getManualRangeSpan,
  normalizeManualLevelRanges,
  parseManualLevelTranscript,
  type ManualLevelRange,
  type ManualRangeClass,
} from "@/app/lib/manualLevelRanges"
import {
  getEffectiveTrainingTotalsFromEntries,
  normalizeManualTrainingEntries,
  parseManualTrainingTranscript,
  type ManualTrainingEntry,
} from "@/app/lib/manualTraining"
import {
  MANUAL_TAROT_SELECTION_STORAGE_KEY,
  filterManualTarotSelections,
  readStoredManualTarotSelections,
} from "@/app/lib/tarotSelections"
import { calculateHeroPointAvailability } from "@/app/lib/heroPoints"

type PageImportKind = "skill" | "talent"
type ImportedRuneSelection = {
  rune: string
  count: number
}

const runeTiers = ["Low", "Middle", "High", "Legacy", "Divine"] as const
type RuneTier = typeof runeTiers[number]
const equipmentImportTargets = ["Helm", "Armor", "Amulet", "Ring1", "Ring2", "Mainhand", "Offhand", "Runeshard"] as const
export type EquipmentImportTargetKey = typeof equipmentImportTargets[number]
const equipmentImportSlotMarkerRegex = new RegExp(`^\\[\\[MANGO_IMPORT_SLOT:(${equipmentImportTargets.join("|")})\\]\\]$`)
const tarotImportRows = ["EquippedList", "FiveStar", "FourStar", "ThreeStar1", "ThreeStar2"] as const
export type TarotImportRowKey = typeof tarotImportRows[number]
type TarotImportTier = 3 | 4 | 5
const tarotImportRowMarkerRegex = new RegExp(`^\\[\\[MANGO_TAROT_ROW:(${tarotImportRows.join("|")})\\]\\]$`)
type ParsedEquipmentImportSlot = {
  slot: EquipmentSlot
  targetSlot: EquipmentImportTargetKey | null
}
type ParsedTarotImportSlot = {
  rowKey: Exclude<TarotImportRowKey, "EquippedList">
  tier: TarotImportTier
  slotIndex: number
  name: string | null
}

export type InGameImportInputs = {
  skills: string
  talents: string
  guildCard: string
  statCard: string
  artifact: string
  tarots: string
  levelUps: string
  training: string
  heroTraining: string
  equipment: string
}

export type ParsedTranscriptPageCoverage = {
  totalPages: number
  foundPages: number[]
  complete: boolean
}

export type ParsedInGameNameList = {
  foundNames: string[]
  namesToApply: string[] | null
  pageCoverage: ParsedTranscriptPageCoverage | null
  learnCommandCount: number
  warnings: string[]
}

export type ParsedGuildCardImport = {
  raceTag: RaceTag | null
  levels: Record<ManualRangeClass, number> | null
  totalLevels: number | null
  availableSkillPoints: number | null
  availableTalentPoints: number | null
  warnings: string[]
}

export type ParsedStatCardImport = {
  statPoints: MainStatValues | null
  availableStatPoints: number | null
  availableHeroPoints: number | null
  warnings: string[]
}

export type ParsedHeroTrainingImport = {
  deltas: Partial<Record<HeroPointStatId, number>>
  warnings: string[]
}

export type ParsedArtifactImport = {
  values: Partial<ArtifactState>
  runes: Record<RuneTier, ImportedRuneSelection[]>
  seenRuneTiers: RuneTier[]
  warnings: string[]
}

export type ParsedTarotImport = {
  equippedSlots: ParsedTarotImportSlot[]
  equippedNames: string[]
  viewCardsFound: string[]
  namesToApply: string[] | null
  stacksByName: Record<string, number>
  equipmentSlots: ParsedEquipmentImportSlot[]
  missingDetailNames: string[]
  warnings: string[]
}

export type ParsedInGameImport = {
  skills: ParsedInGameNameList
  talents: ParsedInGameNameList
  guildCard: ParsedGuildCardImport
  statCard: ParsedStatCardImport
  artifact: ParsedArtifactImport
  tarots: ParsedTarotImport
  manualLevelRanges: ManualLevelRange[]
  manualLevelWarnings: string[]
  manualTrainingEntries: ManualTrainingEntry[]
  trainingTotals: MainStatValues
  trainingWarnings: string[]
  heroTraining: ParsedHeroTrainingImport
  equipmentSlots: ParsedEquipmentImportSlot[]
  equipmentWarnings: string[]
  warnings: string[]
}

export type ParseInGameImportOptions = {
  fallbackManualLevelTotal?: number
}

export type AppliedInGameImport = {
  updatedSections: string[]
}

export type InGameImportCoverageStatus = "ok" | "missing" | "warning" | "needs-source"

export type InGameImportCoverageRow = {
  area: string
  status: InGameImportCoverageStatus
  expected: string
  accounted: string
  gap: string
  command: string
  note: string
}

const LEVELS_STORAGE_KEY = "SelectedLevels"
const TRAINING_STORAGE_KEY = "SelectedTraining"
const HERO_POINTS_STORAGE_KEY = "SelectedHeroPoints"
const RUNES_STORAGE_KEY = "SelectedRunes"
const TAROT_STACKS_STORAGE_KEY = "tarotStacks"
const RACE_STORAGE_KEY = "SelectedRace"
const ARTIFACT_STORAGE_KEY = "Artifact"
const MANUAL_LEVEL_RANGES_STORAGE_KEY = "SelectedManualLevelRanges"
const MANUAL_TRAINING_ENTRIES_STORAGE_KEY = "SelectedManualTrainingEntries"

const mainStatKeys: readonly MainStatKey[] = ["ATK", "DEF", "MATK", "HEAL"]
const equipmentTypeOptions = ["Helm", "Armor", "Amulet", "Ring", "Weapon", "Runeshard", "Tarot"] as const
const equipmentImportTargetIndexByKey: Record<EquipmentImportTargetKey, number> = {
  Helm: 0,
  Armor: 1,
  Amulet: 2,
  Ring1: 3,
  Ring2: 4,
  Mainhand: 5,
  Offhand: 6,
  Runeshard: 7,
}

const heroPointCostById = new Map<HeroPointStatId, number>(
  heroPointStats.map((entry) => [entry.id, entry.cost]),
)

const skillNameByNormalizedKey = new Map<string, string>(
  Object.keys(skill_data).map((name) => [normalizeDenseText(name), name]),
)

const talentNameByNormalizedKey = new Map<string, string>(
  Object.keys(talent_data).map((name) => [normalizeDenseText(name), name]),
)

type RaceLookupEntry = {
  normalizedKey: string
  tag: RaceTag
}

const raceLookupEntries: readonly RaceLookupEntry[] = race_data.flatMap((race) => ([
  { normalizedKey: normalizeDenseText(race.name), tag: race.tag },
  { normalizedKey: normalizeDenseText(race.tag), tag: race.tag },
]))

const raceTagByNormalizedKey = new Map<string, RaceTag>(
  raceLookupEntries.map(({ normalizedKey, tag }) => [normalizedKey, tag]),
)

function collectRaceTagsFromLabel(value: string): RaceTag[] {
  const normalizedValue = normalizeDenseText(value)
  const matches = raceLookupEntries
    .filter(({ normalizedKey }) => (
      normalizedValue === normalizedKey
      || normalizedValue.startsWith(normalizedKey)
    ))
    .sort((left, right) => right.normalizedKey.length - left.normalizedKey.length)

  return Array.from(new Set(matches.map(({ tag }) => tag)))
}

function buildRaceTagByNormalizedRacialTalentKey(): Map<string, RaceTag> {
  const racialTalentEntries = Object.entries(talent_data)
    .filter(([, entry]) => entry.category === "racial")
    .map(([name, entry]) => ({
      name,
      prereqs: Array.isArray(entry.PreReq)
        ? entry.PreReq.filter((prereq): prereq is string => typeof prereq === "string")
        : [],
    }))
  const racialTalentNames = new Set(racialTalentEntries.map(({ name }) => name))
  const adjacency = new Map<string, Set<string>>()

  const ensureNode = (name: string) => {
    if (!adjacency.has(name)) {
      adjacency.set(name, new Set())
    }
  }

  for (const { name, prereqs } of racialTalentEntries) {
    ensureNode(name)

    for (const prereq of prereqs) {
      if (!racialTalentNames.has(prereq)) {
        continue
      }

      ensureNode(prereq)
      adjacency.get(name)?.add(prereq)
      adjacency.get(prereq)?.add(name)
    }
  }

  const visited = new Set<string>()
  const mappedRaceTags = new Map<string, RaceTag>()

  for (const { name } of racialTalentEntries) {
    if (visited.has(name)) {
      continue
    }

    const stack = [name]
    const component: string[] = []

    while (stack.length > 0) {
      const current = stack.pop()
      if (!current || visited.has(current)) {
        continue
      }

      visited.add(current)
      component.push(current)

      for (const neighbor of adjacency.get(current) ?? []) {
        if (!visited.has(neighbor)) {
          stack.push(neighbor)
        }
      }
    }

    const inferredTags = Array.from(new Set(component.flatMap((entryName) => collectRaceTagsFromLabel(entryName))))
    if (inferredTags.length !== 1) {
      continue
    }

    for (const entryName of component) {
      mappedRaceTags.set(normalizeDenseText(entryName), inferredTags[0])
    }
  }

  return mappedRaceTags
}

const raceTagByNormalizedRacialTalentKey = buildRaceTagByNormalizedRacialTalentKey()

function resolveGuildCardRaceTag(raceValue: string): RaceTag | null {
  const normalizedRaceValue = normalizeDenseText(raceValue)
  const directRaceTag = raceTagByNormalizedKey.get(normalizedRaceValue)
  if (directRaceTag) {
    return directRaceTag
  }

  const racialTalentRaceTag = raceTagByNormalizedRacialTalentKey.get(normalizedRaceValue)
  if (racialTalentRaceTag) {
    return racialTalentRaceTag
  }

  const inferredTags = collectRaceTagsFromLabel(raceValue)
  return inferredTags.length === 1 ? inferredTags[0] : null
}

const equipmentTypeByNormalizedKey = new Map<string, typeof equipmentTypeOptions[number]>(
  equipmentTypeOptions.map((type) => [normalizeDenseText(type), type]),
)
equipmentTypeByNormalizedKey.set("ring1", "Ring")
equipmentTypeByNormalizedKey.set("ring2", "Ring")
equipmentTypeByNormalizedKey.set("mainhand", "Weapon")
equipmentTypeByNormalizedKey.set("offhand", "Weapon")

const affixStatByNormalizedKey = new Map<string, string>(
  Object.entries(stat_data.inGameNames).map(([token, stat]) => [normalizeDenseText(token), stat]),
)

const runeNameByNormalizedKey = new Map<string, string>(
  Object.keys(rune_data).map((name) => [normalizeDenseText(name), name]),
)

const tarotNameByNormalizedKey = new Map<string, string>(
  Object.keys(tarot_data).map((name) => [normalizeDenseText(name), name]),
)

affixStatByNormalizedKey.set("penvoid", "Void Pen%")
affixStatByNormalizedKey.set("heal", "HEAL")

export function createDefaultInGameImportInputs(): InGameImportInputs {
  return {
    skills: "",
    talents: "",
    guildCard: "",
    statCard: "",
    artifact: "",
    tarots: "",
    levelUps: "",
    training: "",
    heroTraining: "",
    equipment: "",
  }
}

export function buildEquipmentImportSlotMarker(target: EquipmentImportTargetKey): string {
  return `[[MANGO_IMPORT_SLOT:${target}]]`
}

export function buildTarotImportRowMarker(rowKey: TarotImportRowKey): string {
  return `[[MANGO_TAROT_ROW:${rowKey}]]`
}

function normalizeTranscriptText(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\u3164/g, " ")
}

function getMeaningfulLines(text: string): string[] {
  return normalizeTranscriptText(text)
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
}

function normalizeLookupText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function normalizeDenseText(value: string): string {
  return normalizeLookupText(value).replace(/\s+/g, "")
}

function jsonParse<T>(raw: string | null, fallback: T): T {
  if (!raw) {
    return fallback
  }

  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function parseWholeNumber(raw: string): number {
  const value = Number(raw.replaceAll(",", ""))
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0
}

function parseNumericValue(raw: string): number {
  const value = Number(raw.replaceAll(",", ""))
  return Number.isFinite(value) ? value : 0
}

function countMatchingPages(totalPages: number, foundPages: readonly number[]): boolean {
  const found = new Set(foundPages)

  for (let page = 1; page <= totalPages; page += 1) {
    if (!found.has(page)) {
      return false
    }
  }

  return true
}

function getMissingPages(totalPages: number, foundPages: readonly number[]): number[] {
  const found = new Set(foundPages)
  const missingPages: number[] = []

  for (let page = 1; page <= totalPages; page += 1) {
    if (!found.has(page)) {
      missingPages.push(page)
    }
  }

  return missingPages
}

function isSkillBlock(block: string): boolean {
  return /\bskill list\b/i.test(block)
    || /\bskillpage\b/i.test(block)
    || /\bcz\s+x?learnskill\b/i.test(block)
}

function isTalentBlock(block: string): boolean {
  return /\btalent list\b/i.test(block)
    || /\btalentpage\b/i.test(block)
    || /\bcz\s+x?learntalent\b/i.test(block)
}

function isGuildCardBlock(block: string): boolean {
  return /\bguild card\b/i.test(block) && /\brace\b/i.test(block) && /\btotal levels\b/i.test(block)
}

function isStatCardBlock(block: string): boolean {
  return /\bstat card\b/i.test(block) || /\bstat up record\b/i.test(block)
}

function isArtifactBlock(block: string): boolean {
  return (/\bartifact\s*-\s*level\b/i.test(block) || /(?:^|\n)\s*:sparkle:\s*Artifact\b/i.test(block))
    && (/\+ATK\s*%/i.test(block) || /\+DEF\s*%/i.test(block) || /\+MATK\s*%/i.test(block) || /\+Healpower\s*%/i.test(block))
}

function isEquipmentBlock(block: string): boolean {
  return /\[\s*i\d+\s*\]/i.test(block) && (/\bequip type\b/i.test(block) || /\baffixes\b/i.test(block))
}

function splitTranscriptBlocks(rawText: string): string[] {
  return normalizeTranscriptText(rawText)
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter((block) => block.length > 0)
}

function findValueAfterLabel(lines: readonly string[], matcher: (line: string) => boolean): string | null {
  for (let index = 0; index < lines.length; index += 1) {
    if (!matcher(normalizeLookupText(lines[index]))) {
      continue
    }

    for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
      const candidate = lines[cursor]
      const normalizedCandidate = normalizeLookupText(candidate)

      if (normalizedCandidate === "guild card" || normalizedCandidate === "image") {
        continue
      }

      return candidate
    }
  }

  return null
}

function createEmptyLevelRecord(): Record<ManualRangeClass, number> {
  return {
    tank: 0,
    warrior: 0,
    caster: 0,
    healer: 0,
  }
}

function createEmptyRuneSelections(): Record<RuneTier, ImportedRuneSelection[]> {
  return {
    Low: [],
    Middle: [],
    High: [],
    Legacy: [],
    Divine: [],
  }
}

function parseEquipmentImportSlotMarker(line: string): EquipmentImportTargetKey | null {
  const markerMatch = line.match(equipmentImportSlotMarkerRegex)
  return markerMatch ? markerMatch[1] as EquipmentImportTargetKey : null
}

function parseTarotImportRowMarker(line: string): TarotImportRowKey | null {
  const markerMatch = line.match(tarotImportRowMarkerRegex)
  return markerMatch ? markerMatch[1] as TarotImportRowKey : null
}

function createEmptyTarotImportSlots(): ParsedTarotImportSlot[] {
  return [
    { rowKey: "FiveStar", tier: 5, slotIndex: 0, name: null },
    { rowKey: "FourStar", tier: 4, slotIndex: 0, name: null },
    { rowKey: "ThreeStar1", tier: 3, slotIndex: 0, name: null },
    { rowKey: "ThreeStar2", tier: 3, slotIndex: 1, name: null },
  ]
}

function createDefaultTarotImport(): ParsedTarotImport {
  return {
    equippedSlots: createEmptyTarotImportSlots(),
    equippedNames: [],
    viewCardsFound: [],
    namesToApply: null,
    stacksByName: {},
    equipmentSlots: [],
    missingDetailNames: [],
    warnings: [],
  }
}

function formatTarotImportRowLabel(rowKey: Exclude<TarotImportRowKey, "EquippedList">): string {
  switch (rowKey) {
    case "FiveStar":
      return "5-star slot"
    case "FourStar":
      return "4-star slot"
    case "ThreeStar1":
      return "3-star slot 1"
    case "ThreeStar2":
      return "3-star slot 2"
  }
}

function resolveTarotName(rawName: string): string | null {
  return tarotNameByNormalizedKey.get(normalizeDenseText(rawName.trim())) ?? null
}

function isTarotEquippedCardsBlock(block: string): boolean {
  return /\bequipped tarot cards\b/i.test(block) || /\bcz\s+tarot\s+equippedcards\b/i.test(block)
}

function isTarotViewCardBlock(block: string): boolean {
  return /\bcz\s+tarot\s+viewmycard\b/i.test(block)
    || (/\bawakening\b/i.test(block) && /\bstat bonus\b/i.test(block) && /\bplayer\b/i.test(block))
}

function parseTarotEquippedCardsBlock(block: string | null): {
  equippedSlots: ParsedTarotImportSlot[]
  equippedNames: string[]
  warnings: string[]
} {
  const equippedSlots = createEmptyTarotImportSlots()

  if (!block) {
    return {
      equippedSlots,
      equippedNames: [],
      warnings: [],
    }
  }

  const warnings: string[] = []
  const byTier: Record<TarotImportTier, Array<string | null>> = {
    3: [],
    4: [],
    5: [],
  }
  const encounteredNames: string[] = []
  const lines = getMeaningfulLines(block)

  for (const line of lines) {
    const slotMatch = line.match(/^\[\s*(3|4|5)\s*⭐\s*\]\s*-\s*(.+)$/u)
    if (!slotMatch) {
      continue
    }

    const tier = Number(slotMatch[1]) as TarotImportTier
    const rawName = slotMatch[2].trim()

    if (/^none$/i.test(rawName)) {
      byTier[tier].push(null)
      continue
    }

    const canonicalName = resolveTarotName(rawName)
    if (!canonicalName) {
      warnings.push(`Tarot equipped list included an unknown tarot "${rawName}".`)
      byTier[tier].push(null)
      continue
    }

    byTier[tier].push(canonicalName)
    encounteredNames.push(canonicalName)
  }

  if (Object.values(byTier).every((entries) => entries.length === 0)) {
    warnings.push("Tarot equipped list import could not read any equipped tarot slots.")
  }

  if (byTier[5].length > 1) {
    warnings.push("Tarot equipped list contained more than one 5-star slot.")
  }

  if (byTier[4].length > 1) {
    warnings.push("Tarot equipped list contained more than one 4-star slot.")
  }

  if (byTier[3].length > 2) {
    warnings.push("Tarot equipped list contained more than two 3-star slots.")
  }

  equippedSlots[0].name = byTier[5][0] ?? null
  equippedSlots[1].name = byTier[4][0] ?? null
  equippedSlots[2].name = byTier[3][0] ?? null
  equippedSlots[3].name = byTier[3][1] ?? null

  return {
    equippedSlots,
    equippedNames: Array.from(new Set(encounteredNames)),
    warnings,
  }
}

function parseTarotViewCardBlock(block: string): {
  name: string | null
  awakening: number | null
  equipmentSlot: ParsedEquipmentImportSlot | null
  warnings: string[]
} {
  const lines = getMeaningfulLines(block)
  const warnings: string[] = []
  const nameCandidates: string[] = []

  const commandLine = lines.find((line) => /\bcz\s+tarot\s+viewmycard\b/i.test(line)) ?? null
  const commandMatch = commandLine?.match(/\bcz\s+tarot\s+viewmycard\s+(.+)$/i) ?? null
  if (commandMatch) {
    nameCandidates.push(commandMatch[1].trim())
  }

  for (const line of lines) {
    const headerMatch = line.match(/^\[\s*[^\]]+\s*\]\s+(.+)$/)
    if (headerMatch) {
      nameCandidates.push(headerMatch[1].trim())
    }
  }

  let name: string | null = null

  for (const candidate of nameCandidates) {
    const resolvedName = resolveTarotName(candidate)
    if (resolvedName) {
      name = resolvedName
      break
    }
  }

  if (!name) {
    warnings.push("Tarot view card import could not read a recognized tarot name.")
  }

  const awakeningLine = lines.find((line) => /\bawakening\b/i.test(line)) ?? null
  const awakeningMatch = awakeningLine?.match(/([+-]?\d[\d,]*)\s*(?:\/\s*[+-]?\d[\d,]*)?/) ?? null
  const awakening = awakeningMatch ? parseWholeNumber(awakeningMatch[1]) : null

  if (awakening === null) {
    warnings.push(`Tarot view card${name ? ` "${name}"` : ""} did not contain a readable Awakening value.`)
  }

  let equipmentSlot: ParsedEquipmentImportSlot | null = null

  if (name) {
    const slot = createDefaultEquipmentSlot()
    slot.name = name
    slot.type = "Tarot"
    slot.enabled = true
    slot.affixes = []
    slot.scriptGroupId = ""
    slot.mainstat = ""
    slot.mainstat_value = 0
    slot.tarotAuto = false
    slot.tarotScalingStat = tarot_data[name]?.stat_bonus ?? ""

    const levelLine = lines.find((line) => /level\s*:/i.test(line)) ?? null
    const levelMatch = levelLine?.match(/level\s*:\s*(\d+)\s*\/\s*(\d+)/i) ?? null
    slot.tarotLevel = levelMatch ? parseWholeNumber(levelMatch[1]) : 0

    if (!levelMatch) {
      warnings.push(`Tarot view card "${name}" did not contain a readable Level value.`)
    }

    for (const line of lines) {
      if (!line.startsWith("◘")) {
        continue
      }

      const affix = parseEquipmentAffixLine(line)
      if (affix) {
        slot.affixes.push(affix)
      }
    }

    equipmentSlot = {
      slot: normalizeEquipmentSlot(slot),
      targetSlot: null,
    }
  }

  return {
    name,
    awakening,
    equipmentSlot,
    warnings,
  }
}

function parseTarotImport(rawText: string | null): ParsedTarotImport {
  if (!rawText) {
    return createDefaultTarotImport()
  }

  const blocks = splitTranscriptBlocks(rawText).filter((block) => block.length > 0)
  if (blocks.length === 0) {
    return createDefaultTarotImport()
  }

  const warnings: string[] = []
  let equippedListBlock: string | null = null
  const detailBlocks: Array<{ rowKey: Exclude<TarotImportRowKey, "EquippedList"> | null; block: string }> = []

  for (const block of blocks) {
    const lines = getMeaningfulLines(block)
    let rowKey: TarotImportRowKey | null = null
    const cleanedLines: string[] = []

    for (const line of lines) {
      const parsedRowKey = parseTarotImportRowMarker(line)
      if (parsedRowKey && rowKey === null) {
        rowKey = parsedRowKey
        continue
      }

      cleanedLines.push(line)
    }

    const cleanedBlock = cleanedLines.join("\n").trim()
    if (cleanedBlock.length === 0) {
      continue
    }

    if (rowKey === "EquippedList") {
      if (equippedListBlock) {
        warnings.push("Multiple tarot equipped list rows were pasted. Using the last one.")
      }
      equippedListBlock = cleanedBlock
      continue
    }

    if (rowKey) {
      detailBlocks.push({
        rowKey,
        block: cleanedBlock,
      })
      continue
    }

    if (isTarotEquippedCardsBlock(cleanedBlock)) {
      if (equippedListBlock) {
        warnings.push("Multiple tarot equipped list blocks were pasted. Using the last one.")
      }
      equippedListBlock = cleanedBlock
      continue
    }

    if (isTarotViewCardBlock(cleanedBlock)) {
      detailBlocks.push({
        rowKey: null,
        block: cleanedBlock,
      })
    }
  }

  const equippedResult = parseTarotEquippedCardsBlock(equippedListBlock)
  warnings.push(...equippedResult.warnings)

  const expectedNameByRowKey = new Map<Exclude<TarotImportRowKey, "EquippedList">, string | null>(
    equippedResult.equippedSlots.map((slot) => [slot.rowKey, slot.name]),
  )
  const viewCardsFound: string[] = []
  const stacksByName: Record<string, number> = {}
  const equipmentSlots: ParsedEquipmentImportSlot[] = []

  for (const [detailIndex, detailEntry] of detailBlocks.entries()) {
    const parsedDetail = parseTarotViewCardBlock(detailEntry.block)
    warnings.push(...parsedDetail.warnings.map((warning) => `Tarot detail ${detailIndex + 1}: ${warning}`))

    if (detailEntry.rowKey) {
      const expectedName = expectedNameByRowKey.get(detailEntry.rowKey) ?? null
      if (!expectedName) {
        warnings.push(`A ${formatTarotImportRowLabel(detailEntry.rowKey)} transcript was pasted, but no tarot is equipped in that slot.`)
      } else if (parsedDetail.name && parsedDetail.name !== expectedName) {
        warnings.push(`The ${formatTarotImportRowLabel(detailEntry.rowKey)} transcript parsed "${parsedDetail.name}", but the equipped list shows "${expectedName}".`)
      }
    }

    if (!parsedDetail.name) {
      continue
    }

    viewCardsFound.push(parsedDetail.name)

    if (parsedDetail.awakening !== null) {
      stacksByName[parsedDetail.name] = parsedDetail.awakening
    }

    if (parsedDetail.equipmentSlot) {
      equipmentSlots.push(parsedDetail.equipmentSlot)
    }

    if (equippedListBlock && !equippedResult.equippedNames.includes(parsedDetail.name)) {
      warnings.push(`Tarot detail "${parsedDetail.name}" is not present in the equipped tarot list.`)
    }
  }

  const uniqueViewCardsFound = Array.from(new Set(viewCardsFound))
  const missingDetailNames = equippedListBlock
    ? equippedResult.equippedNames.filter((name) => stacksByName[name] === undefined)
    : []

  return {
    equippedSlots: equippedResult.equippedSlots,
    equippedNames: equippedResult.equippedNames,
    viewCardsFound: uniqueViewCardsFound,
    namesToApply: equippedListBlock ? equippedResult.equippedNames : null,
    stacksByName,
    equipmentSlots,
    missingDetailNames,
    warnings,
  }
}

function normalizeStoredRuneSelections(value: unknown): Record<RuneTier, ImportedRuneSelection[]> {
  const emptySelections = createEmptyRuneSelections()

  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return emptySelections
  }

  const result = createEmptyRuneSelections()

  for (const tier of runeTiers) {
    const rawEntries = (value as Partial<Record<RuneTier, unknown>>)[tier]
    if (!Array.isArray(rawEntries)) {
      continue
    }

    result[tier] = rawEntries
      .filter((entry): entry is Partial<ImportedRuneSelection> => typeof entry === "object" && entry !== null)
      .map((entry) => ({
        rune: typeof entry.rune === "string" ? entry.rune : "",
        count: Math.max(0, Math.floor(typeof entry.count === "number" && Number.isFinite(entry.count) ? entry.count : 0)),
      }))
      .filter((entry) => entry.rune.length > 0 && entry.count > 0)
  }

  return result
}

function countImportedRunesByTier(entries: readonly ImportedRuneSelection[]): number {
  return entries.reduce((sum, entry) => sum + Math.max(0, Math.floor(entry.count)), 0)
}

function parseArtifactRuneTier(
  tier: RuneTier,
  expectedCount: number,
  rawLines: readonly string[],
  warnings: string[],
): ImportedRuneSelection[] {
  const joinedValue = rawLines.join(", ").trim()

  if (joinedValue.length === 0 || /^none$/i.test(joinedValue)) {
    if (expectedCount > 0) {
      warnings.push(`Artifact ${tier} runes listed ${expectedCount}, but no rune names were found.`)
    }
    return []
  }

  const countsByRune = new Map<string, number>()
  const orderedRunes: string[] = []

  for (const rawName of joinedValue.split(/\s*,\s*/)) {
    const trimmedName = rawName.trim()
    if (trimmedName.length === 0 || /^none$/i.test(trimmedName)) {
      continue
    }

    const canonicalName = runeNameByNormalizedKey.get(normalizeDenseText(trimmedName))
    if (!canonicalName) {
      warnings.push(`Artifact ${tier} runes included an unknown rune "${trimmedName}".`)
      continue
    }

    if (!countsByRune.has(canonicalName)) {
      countsByRune.set(canonicalName, 0)
      orderedRunes.push(canonicalName)
    }

    countsByRune.set(canonicalName, (countsByRune.get(canonicalName) ?? 0) + 1)
  }

  const parsedSelections = orderedRunes.map((rune) => ({
    rune,
    count: countsByRune.get(rune) ?? 0,
  }))

  const parsedCount = countImportedRunesByTier(parsedSelections)
  if (expectedCount !== parsedCount) {
    warnings.push(`Artifact ${tier} runes listed ${expectedCount}, but ${parsedCount} rune${parsedCount === 1 ? "" : "s"} were parsed.`)
  }

  return parsedSelections
}

function createEmptyHeroPointDeltaRecord(): Partial<Record<HeroPointStatId, number>> {
  return {}
}

function addMainStatValues(base: MainStatValues, added: Partial<Record<MainStatKey, number>>): MainStatValues {
  const nextValues = { ...base }

  for (const key of mainStatKeys) {
    nextValues[key] = (nextValues[key] ?? 0) + Math.max(0, Math.floor(added[key] ?? 0))
  }

  return nextValues
}

export function countMainStatValues(values: MainStatValues): number {
  return mainStatKeys.reduce((sum, key) => sum + Math.max(0, Math.floor(values[key] ?? 0)), 0)
}

export function countHeroPointDeltas(deltas: Partial<Record<HeroPointStatId, number>>): number {
  return heroPointStats.reduce((sum, { id }) => sum + Math.max(0, Math.floor(deltas[id] ?? 0)), 0)
}

export function countHeroTrainingSpentPoints(deltas: Partial<Record<HeroPointStatId, number>>): number {
  return heroPointStats.reduce((sum, { id, cost }) => (
    sum + (Math.max(0, Math.floor(deltas[id] ?? 0)) * cost)
  ), 0)
}

export function countSkillPointCost(skillNames: readonly string[]): number {
  return skillNames.reduce((sum, name) => sum + Math.max(0, Math.floor(skill_data[name]?.sp ?? 0)), 0)
}

function getExpectedSkillPointTotal(totalLevels: number): number {
  return Math.max(0, Math.ceil(totalLevels / 2))
}

function formatSignedGap(value: number): string {
  if (value === 0) {
    return "0"
  }

  return `${value > 0 ? "+" : "-"}${Math.abs(value).toLocaleString("en-US")}`
}

function createCoverageRow(
  area: string,
  status: InGameImportCoverageStatus,
  expected: string,
  accounted: string,
  gap: string,
  command: string,
  note: string,
): InGameImportCoverageRow {
  return {
    area,
    status,
    expected,
    accounted,
    gap,
    command,
    note,
  }
}

function getNextMissingPageNumber(coverage: ParsedTranscriptPageCoverage | null): number {
  if (!coverage) {
    return 1
  }

  const foundPages = new Set(coverage.foundPages)

  for (let page = 1; page <= coverage.totalPages; page += 1) {
    if (!foundPages.has(page)) {
      return page
    }
  }

  return coverage.totalPages
}

function getSkillPageCommand(parsed: ParsedInGameImport): string {
  return `cz skillpage ${getNextMissingPageNumber(parsed.skills.pageCoverage)}`
}

function getTalentPageCommand(parsed: ParsedInGameImport): string {
  return `cz talentpage ${getNextMissingPageNumber(parsed.talents.pageCoverage)}`
}

function parseNameListFromBlocks(blocks: readonly string[], kind: PageImportKind): ParsedInGameNameList {
  const warnings: string[] = []
  const unknownNames = new Set<string>()
  const foundNames = new Set<string>()
  const foundPages = new Set<number>()
  let learnCommandCount = 0
  let totalPages: number | null = null

  const lookup = kind === "skill" ? skillNameByNormalizedKey : talentNameByNormalizedKey
  const orderNames = kind === "skill" ? getOrderedSkillNames : getOrderedTalentNames
  const label = kind === "skill" ? "skill" : "talent"
  const learnCommandRegex = kind === "skill"
    ? /\bcz\s+x?learnskill\b\s+(.+)$/i
    : /\bcz\s+x?learntalent\b\s+(.+)$/i

  for (const block of blocks) {
    const pageMatch = block.match(/\bPage\s+(\d+)\s*\/\s*(\d+)/i)
    if (pageMatch) {
      const pageNumber = parseWholeNumber(pageMatch[1])
      const blockTotalPages = parseWholeNumber(pageMatch[2])

      if (pageNumber > 0) {
        foundPages.add(pageNumber)
      }

      if (blockTotalPages > 0) {
        if (totalPages !== null && totalPages !== blockTotalPages) {
          warnings.push(`Saw conflicting ${label} page totals (${totalPages} and ${blockTotalPages}).`)
        }

        totalPages = totalPages === null ? blockTotalPages : Math.max(totalPages, blockTotalPages)
      }
    }

    for (const line of getMeaningfulLines(block)) {
      const learnCommandMatch = line.match(learnCommandRegex)
      if (learnCommandMatch) {
        const rawNames = learnCommandMatch[1]
          .split(/\s*\/\s*/)
          .map((entry) => entry.trim())
          .filter((entry) => entry.length > 0)

        if (rawNames.length > 0) {
          learnCommandCount += 1
        }

        for (const rawName of rawNames) {
          const canonicalName = lookup.get(normalizeDenseText(rawName))
          if (canonicalName) {
            foundNames.add(canonicalName)
            continue
          }

          unknownNames.add(rawName)
        }
      }

      const lineMatch = line.match(/^◘\s*(.+?)\s*:/)
      if (!lineMatch) {
        continue
      }

      const rawName = lineMatch[1]?.trim() ?? ""
      if (rawName.length === 0) {
        continue
      }

      const canonicalName = lookup.get(normalizeDenseText(rawName))
      if (canonicalName) {
        foundNames.add(canonicalName)
        continue
      }

      if (!/^[+-]?\d/.test(rawName)) {
        unknownNames.add(rawName)
      }
    }
  }

  const orderedNames = orderNames(foundNames)
  const coverage = totalPages !== null
    ? {
        totalPages,
        foundPages: [...foundPages].sort((left, right) => left - right),
        complete: countMatchingPages(totalPages, [...foundPages]),
      }
    : null

  if (coverage && !coverage.complete) {
    const missingPages = getMissingPages(coverage.totalPages, coverage.foundPages)
    warnings.push(
      `Found ${label} page${coverage.foundPages.length === 1 ? "" : "s"} ${coverage.foundPages.join(", ")}, but page${missingPages.length === 1 ? "" : "s"} ${missingPages.join(", ")} ${missingPages.length === 1 ? "is" : "are"} still missing.`,
    )
  }

  if (blocks.length > 0 && orderedNames.length === 0) {
    warnings.push(`No known ${label} names were found in the pasted ${label} pages or learn commands.`)
  }

  for (const unknownName of unknownNames) {
    warnings.push(`Unrecognized ${label} "${unknownName}".`)
  }

  return {
    foundNames: orderedNames,
    namesToApply: orderedNames.length > 0 && (!coverage || coverage.complete) ? orderedNames : null,
    pageCoverage: coverage,
    learnCommandCount,
    warnings,
  }
}

function parseGuildCardImport(block: string | null): ParsedGuildCardImport {
  if (!block) {
    return {
      raceTag: null,
      levels: null,
      totalLevels: null,
      availableSkillPoints: null,
      availableTalentPoints: null,
      warnings: [],
    }
  }

  const lines = getMeaningfulLines(block)
  const warnings: string[] = []
  const raceValue = findValueAfterLabel(lines, (line) => line.includes("race"))
  const totalLevelsValue = findValueAfterLabel(lines, (line) => line.includes("total levels"))
  const classLevelsValue = findValueAfterLabel(lines, (line) => line.includes("t w c h levels"))
  const skillTalentPointValue = findValueAfterLabel(lines, (line) => line.includes("skill talent points"))

  const raceTag = raceValue ? resolveGuildCardRaceTag(raceValue) : null
  if (raceValue && !raceTag) {
    warnings.push(`Unrecognized race "${raceValue}".`)
  }

  const totalLevelsMatch = totalLevelsValue?.match(/([+-]?\d[\d,]*)/)
  const totalLevels = totalLevelsMatch ? parseWholeNumber(totalLevelsMatch[1]) : null
  const classLevelsMatch = classLevelsValue?.match(/([+-]?\d[\d,]*)\s*\/\s*([+-]?\d[\d,]*)\s*\/\s*([+-]?\d[\d,]*)\s*\/\s*([+-]?\d[\d,]*)/)
  const skillTalentPointMatch = skillTalentPointValue?.match(/([+-]?\d[\d,]*)\s*\/\s*([+-]?\d[\d,]*)/)
  const availableSkillPoints = skillTalentPointMatch ? parseWholeNumber(skillTalentPointMatch[1]) : null
  const availableTalentPoints = skillTalentPointMatch ? parseWholeNumber(skillTalentPointMatch[2]) : null

  let levels: Record<ManualRangeClass, number> | null = null

  if (classLevelsMatch) {
    levels = createEmptyLevelRecord()
    levels.tank = parseWholeNumber(classLevelsMatch[1])
    levels.warrior = parseWholeNumber(classLevelsMatch[2])
    levels.caster = parseWholeNumber(classLevelsMatch[3])
    levels.healer = parseWholeNumber(classLevelsMatch[4])

    if (totalLevels !== null) {
      const summedLevels = Object.values(levels).reduce((sum, value) => sum + value, 0)
      if (summedLevels !== totalLevels) {
        warnings.push(`Guild Card total levels ${totalLevels} did not match T/W/C/H sum ${summedLevels}.`)
      }
    }
  } else {
    warnings.push("Guild Card import could not read T/W/C/H levels.")
  }

  return {
    raceTag,
    levels,
    totalLevels,
    availableSkillPoints,
    availableTalentPoints,
    warnings,
  }
}

function parseStatCardImport(block: string | null): ParsedStatCardImport {
  if (!block) {
    return {
      statPoints: null,
      availableStatPoints: null,
      availableHeroPoints: null,
      warnings: [],
    }
  }

  const lines = getMeaningfulLines(block)
  const warnings: string[] = []
  const statPoints = createDefaultMainStatValues()
  let hasAnyStatRecord = false
  let availableStatPoints: number | null = null
  let availableHeroPoints: number | null = null

  for (const line of lines) {
    const recordMatch = line.match(/^(ATK|DEF|MATK|HEAL)\s*:\s*([+-]?\d[\d,]*)/i)
    if (!recordMatch) {
      const statPointsMatch = line.match(/([+-]?\d[\d,]*)\s+Stat Points\s+(?:Available to Allocate|left to allocate)/i)
      if (statPointsMatch) {
        availableStatPoints = parseWholeNumber(statPointsMatch[1])
      }

      const heroPointsMatch = line.match(/([+-]?\d[\d,]*)\s+Hero Points Available/i)
      if (heroPointsMatch) {
        availableHeroPoints = parseWholeNumber(heroPointsMatch[1])
      }

      continue
    }

    const key = recordMatch[1].toUpperCase() as MainStatKey
    statPoints[key] = parseWholeNumber(recordMatch[2])
    hasAnyStatRecord = true
  }

  if (!hasAnyStatRecord) {
    warnings.push("Stat Card import could not read any Stat Up Record rows.")
  }

  if (availableStatPoints === null) {
    const availableStatPointsMatch = block.match(/([+-]?\d[\d,]*)\s+Stat Points\s+(?:Available to Allocate|left to allocate)/i)
    availableStatPoints = availableStatPointsMatch ? parseWholeNumber(availableStatPointsMatch[1]) : null
  }

  if (availableHeroPoints === null) {
    const availableHeroPointsMatch = block.match(/([+-]?\d[\d,]*)\s+Hero Points Available/i)
    availableHeroPoints = availableHeroPointsMatch ? parseWholeNumber(availableHeroPointsMatch[1]) : null
  }

  return {
    statPoints: hasAnyStatRecord ? statPoints : null,
    availableStatPoints,
    availableHeroPoints,
    warnings,
  }
}

function parseArtifactImport(block: string | null): ParsedArtifactImport {
  if (!block) {
    return {
      values: {},
      runes: createEmptyRuneSelections(),
      seenRuneTiers: [],
      warnings: [],
    }
  }

  const lines = getMeaningfulLines(block)
  const warnings: string[] = []
  const values: Partial<ArtifactState> = {}
  const runes = createEmptyRuneSelections()
  const seenRuneTiers: RuneTier[] = []
  const levelMatch = block.match(/\bArtifact\s*-\s*Level\s*([+-]?\d[\d,]*)/i)
  const atkValue = findValueAfterLabel(lines, (line) => line.includes("atk") && !line.includes("matk"))
  const defValue = findValueAfterLabel(lines, (line) => line.includes("def") && !line.includes("matk"))
  const matkValue = findValueAfterLabel(lines, (line) => line.includes("matk"))
  const healValue = findValueAfterLabel(lines, (line) => line.includes("healpower"))

  if (levelMatch) {
    values.Level = parseWholeNumber(levelMatch[1])
  }

  const parsedAtk = atkValue?.match(/([+-]?\d[\d,]*)/)
  const parsedDef = defValue?.match(/([+-]?\d[\d,]*)/)
  const parsedMatk = matkValue?.match(/([+-]?\d[\d,]*)/)
  const parsedHeal = healValue?.match(/([+-]?\d[\d,]*)/)

  if (parsedAtk) {
    values["ATK%"] = parseWholeNumber(parsedAtk[1])
  }

  if (parsedDef) {
    values["DEF%"] = parseWholeNumber(parsedDef[1])
  }

  if (parsedMatk) {
    values["MATK%"] = parseWholeNumber(parsedMatk[1])
  }

  if (parsedHeal) {
    values["HEAL%"] = parseWholeNumber(parsedHeal[1])
  }

  let currentRuneTier: RuneTier | null = null
  let currentExpectedRuneCount = 0
  let currentRuneLines: string[] = []

  const flushCurrentRuneTier = () => {
    if (!currentRuneTier) {
      return
    }

    runes[currentRuneTier] = parseArtifactRuneTier(
      currentRuneTier,
      currentExpectedRuneCount,
      currentRuneLines,
      warnings,
    )
  }

  for (const line of lines) {
    const tierMatch = line.match(/^(Low|Middle|High|Legacy|Divine)\s*:\s*([+-]?\d[\d,]*)\s*$/i)

    if (tierMatch) {
      flushCurrentRuneTier()

      currentRuneTier = tierMatch[1][0].toUpperCase() + tierMatch[1].slice(1).toLowerCase() as RuneTier
      currentExpectedRuneCount = parseWholeNumber(tierMatch[2])
      currentRuneLines = []

      if (!seenRuneTiers.includes(currentRuneTier)) {
        seenRuneTiers.push(currentRuneTier)
      }

      continue
    }

    if (currentRuneTier) {
      currentRuneLines.push(line)
    }
  }

  flushCurrentRuneTier()

  if (Object.keys(values).length === 0 && seenRuneTiers.length === 0) {
    warnings.push("Artifact import did not contain any parseable level, artifact stat values, or equipped runes.")
  }

  return {
    values,
    runes,
    seenRuneTiers,
    warnings,
  }
}

function parseHeroTrainingStatId(lines: readonly string[], commandStatId: string | null): HeroPointStatId | null {
  const possibleValues: string[] = []

  if (commandStatId) {
    possibleValues.push(commandStatId)
  }

  const heroTrainingIndex = lines.findIndex((line) => normalizeLookupText(line).includes("hero training"))
  if (heroTrainingIndex >= 0) {
    for (let index = heroTrainingIndex + 1; index < Math.min(lines.length, heroTrainingIndex + 4); index += 1) {
      possibleValues.push(lines[index])
    }
  }

  for (const line of lines) {
    possibleValues.push(line)
  }

  for (const value of possibleValues) {
    const normalized = normalizeDenseText(value)
    if (heroPointCostById.has(normalized as HeroPointStatId)) {
      return normalized as HeroPointStatId
    }
  }

  return null
}

function parseHeroTrainingImport(blocks: readonly string[]): ParsedHeroTrainingImport {
  const deltas = createEmptyHeroPointDeltaRecord()
  const warnings: string[] = []

  for (const [blockIndex, block] of blocks.entries()) {
    const lines = getMeaningfulLines(block)
    const commandLine = lines.find((line) => /\b(?:x?herotraining)\b/i.test(line)) ?? null
    const commandMatch = commandLine?.match(/\b(?:x?herotraining)\s+([a-z]+)(?:\s+([0-9,]+))?\b/i) ?? null
    const statId = parseHeroTrainingStatId(lines, commandMatch?.[1] ?? null)

    if (!statId) {
      warnings.push(`Skipped hero training block ${blockIndex + 1}: the hero stat id could not be read.`)
      continue
    }

    const cost = heroPointCostById.get(statId) ?? 1
    const commandCount = commandMatch?.[2] ? parseWholeNumber(commandMatch[2]) : null
    const spentValue = findValueAfterLabel(lines, (line) => line === "hero pts spent")
    const spentPoints = spentValue ? parseWholeNumber(spentValue) : null

    let purchasedLevels = commandCount

    if (purchasedLevels === null && spentPoints !== null) {
      if (spentPoints === 0) {
        warnings.push(`Skipped hero training ${statId}: Hero PTs Spent was 0.`)
        continue
      }

      purchasedLevels = Math.max(0, Math.floor(spentPoints / cost))
      if (spentPoints % cost !== 0) {
        warnings.push(`Hero training ${statId} spent ${spentPoints} points, which does not divide cleanly by its cost ${cost}.`)
      }
    }

    if (purchasedLevels === null || purchasedLevels <= 0) {
      warnings.push(`Skipped hero training ${statId}: no positive purchase count could be read.`)
      continue
    }

    deltas[statId] = (deltas[statId] ?? 0) + purchasedLevels

    if (spentPoints !== null && spentPoints !== purchasedLevels * cost) {
      warnings.push(`Hero training ${statId} spent ${spentPoints} points, but ${purchasedLevels} purchase${purchasedLevels === 1 ? "" : "s"} at cost ${cost} would spend ${purchasedLevels * cost}.`)
    }
  }

  return {
    deltas,
    warnings,
  }
}

function canonicalizeEquipmentType(rawType: string | null): string {
  if (!rawType) {
    return ""
  }

  return equipmentTypeByNormalizedKey.get(normalizeDenseText(rawType)) ?? rawType.trim()
}

function parseEquipmentAffixLine(line: string): EquipmentAffix | null {
  const cleanedLine = line
    .replace(/^◘\s*/, "")
    .replace(/🖊️/g, "")
    .trim()

  const affixMatch = cleanedLine.match(/^([+-]?\d[\d,]*(?:\.\d+)?)%?\s+(.+)$/)
  if (!affixMatch) {
    return null
  }

  const stat = affixStatByNormalizedKey.get(normalizeDenseText(affixMatch[2]))
  if (!stat) {
    return null
  }

  return {
    stat,
    value: parseNumericValue(affixMatch[1]),
  }
}

function parseEquipmentBlock(block: string): { slot: EquipmentSlot | null; targetSlot: EquipmentImportTargetKey | null; warnings: string[] } {
  const rawLines = getMeaningfulLines(block)
  const targetSlot = rawLines
    .map((line) => parseEquipmentImportSlotMarker(line))
    .find((value): value is EquipmentImportTargetKey => value !== null) ?? null
  const lines = rawLines.filter((line) => parseEquipmentImportSlotMarker(line) === null)
  const warnings: string[] = []
  const slot = createDefaultEquipmentSlot()

  slot.enabled = true
  slot.affixes = []
  slot.scriptGroupId = ""
  slot.tarotAuto = false
  slot.tarotLevel = 0
  slot.tarotScalingStat = ""

  const itemNameLine = lines.find((line) => /\[\s*i\d+\s*\]/i.test(line)) ?? null
  if (itemNameLine) {
    slot.name = itemNameLine
  }

  const equipTypeLine = findValueAfterLabel(lines, (line) => line === "equip type")
  slot.type = canonicalizeEquipmentType(equipTypeLine)

  if (!slot.type) {
    const headerTypeLine = lines.find((line) => /-\s*[A-Za-z]+\s+Equip/i.test(line))
    const headerTypeMatch = headerTypeLine?.match(/-\s*([A-Za-z]+)\s+Equip/i)
    slot.type = canonicalizeEquipmentType(headerTypeMatch?.[1] ?? null)
  }

  if (!slot.type) {
    const commandLine = lines.find((line) => /\bitemequipview\b/i.test(line))
    const commandTypeMatch = commandLine?.match(/\bitemequipview\s+([A-Za-z0-9]+)/i)
    slot.type = canonicalizeEquipmentType(commandTypeMatch?.[1] ?? null)
  }

  const mainStatLabelIndex = lines.findIndex((line) => /\+\s*(ATK|DEF|MATK|HEAL)\b/i.test(line))
  if (mainStatLabelIndex >= 0) {
    const mainStatMatch = lines[mainStatLabelIndex].match(/\+\s*(ATK|DEF|MATK|HEAL)\b/i)
    if (mainStatMatch) {
      slot.mainstat = mainStatMatch[1].toUpperCase()
    }

    const mainStatValueLine = lines.slice(mainStatLabelIndex + 1).find((line) => /\d/.test(line)) ?? null
    if (mainStatValueLine) {
      slot.mainstat_value = parseWholeNumber(mainStatValueLine)
    }
  }

  for (const line of lines) {
    if (!line.startsWith("◘")) {
      continue
    }

    const affix = parseEquipmentAffixLine(line)
    if (!affix) {
      continue
    }

    slot.affixes.push(affix)
  }

  if (!slot.name && !slot.type && slot.affixes.length === 0) {
    warnings.push("Skipped an equipment block because it did not contain a recognizable item.")
    return { slot: null, targetSlot, warnings }
  }

  if (!slot.type) {
    warnings.push(`Imported "${slot.name || "equipment"}" without a recognized equipment type.`)
  }

  return {
    slot: normalizeEquipmentSlot(slot),
    targetSlot,
    warnings,
  }
}

function readRecordOfNumbers(storage: Storage, key: string): Record<string, number> {
  const parsed = jsonParse<Record<string, unknown>>(storage.getItem(key), {})
  const record: Record<string, number> = {}

  for (const [entryKey, value] of Object.entries(parsed)) {
    if (typeof value === "number" && Number.isFinite(value)) {
      record[entryKey] = value
    }
  }

  return record
}

function getLevelCount(levels: Record<ManualRangeClass, number>): number {
  return Object.values(levels).reduce((sum, value) => sum + value, 0)
}

function parseImportedEquipmentSlots(blocks: readonly string[]): { slots: ParsedEquipmentImportSlot[]; warnings: string[] } {
  const slots: ParsedEquipmentImportSlot[] = []
  const warnings: string[] = []

  for (const block of blocks) {
    const parsed = parseEquipmentBlock(block)
    if (parsed.slot) {
      slots.push({
        slot: parsed.slot,
        targetSlot: parsed.targetSlot,
      })
    }

    warnings.push(...parsed.warnings)
  }

  return {
    slots,
    warnings,
  }
}

function preprocessTrainingTranscript(rawText: string): string {
  return rawText.replace(/\btraining(?=\s+(?:atk|def|matk|heal)\b)/gi, "xtraining")
}

function preprocessLevelTranscript(rawText: string): string {
  return rawText.replace(/\blevelup(?=\s+(?:tank|warrior|caster|healer)\b)/gi, "xlevelup")
}

function sliceManualRange(range: ManualLevelRange, startLevel: number, endLevel: number): ManualLevelRange | null {
  if (endLevel < startLevel || startLevel < range.startLevel || endLevel > range.endLevel) {
    return null
  }

  const nextRange: ManualLevelRange = {
    className: range.className,
    startLevel,
    endLevel,
    hpGain: 0,
    atkGain: 0,
    defGain: 0,
    matkGain: 0,
    healGain: 0,
    scalingGain: endLevel === range.endLevel ? range.scalingGain : 0,
  }

  for (let level = startLevel; level <= endLevel; level += 1) {
    nextRange.hpGain += getManualRangeGain(range, level, "hpGain")
    nextRange.atkGain += getManualRangeGain(range, level, "atkGain")
    nextRange.defGain += getManualRangeGain(range, level, "defGain")
    nextRange.matkGain += getManualRangeGain(range, level, "matkGain")
    nextRange.healGain += getManualRangeGain(range, level, "healGain")
  }

  return nextRange
}

function subtractManualRangeOverlap(
  existingRange: ManualLevelRange,
  overlapStart: number,
  overlapEnd: number,
): ManualLevelRange[] {
  const preservedRanges: ManualLevelRange[] = []

  const leftRange = sliceManualRange(existingRange, existingRange.startLevel, overlapStart - 1)
  if (leftRange) {
    preservedRanges.push(leftRange)
  }

  const rightRange = sliceManualRange(existingRange, overlapEnd + 1, existingRange.endLevel)
  if (rightRange) {
    preservedRanges.push(rightRange)
  }

  return preservedRanges
}

function mergeManualLevelRanges(
  existingRanges: readonly ManualLevelRange[],
  importedRanges: readonly ManualLevelRange[],
): ManualLevelRange[] {
  let nextRanges = [...existingRanges]

  for (const importedRange of importedRanges) {
    nextRanges = nextRanges.flatMap((existingRange) => {
      const overlapStart = Math.max(existingRange.startLevel, importedRange.startLevel)
      const overlapEnd = Math.min(existingRange.endLevel, importedRange.endLevel)

      if (overlapStart > overlapEnd) {
        return [existingRange]
      }

      return subtractManualRangeOverlap(existingRange, overlapStart, overlapEnd)
    })

    nextRanges.push(importedRange)
  }

  return nextRanges.sort((left, right) => (
    left.startLevel - right.startLevel
    || left.endLevel - right.endLevel
    || left.className.localeCompare(right.className)
  ))
}

export function dedupeManualLevelRanges(ranges: readonly ManualLevelRange[]): ManualLevelRange[] {
  return mergeManualLevelRanges([], ranges)
}

export function countManualLevelRangesByClass(
  ranges: readonly ManualLevelRange[],
): Record<ManualRangeClass, number> {
  const counts = createEmptyLevelRecord()

  for (const range of dedupeManualLevelRanges(ranges)) {
    counts[range.className] += getManualRangeSpan(range)
  }

  return counts
}

export function getMissingClassLevelsByImportedRanges(
  expectedLevels: Record<ManualRangeClass, number> | null,
  ranges: readonly ManualLevelRange[],
): Record<ManualRangeClass, number> | null {
  if (!expectedLevels) {
    return null
  }

  const importedLevels = countManualLevelRangesByClass(ranges)

  return {
    tank: Math.max(0, expectedLevels.tank - importedLevels.tank),
    warrior: Math.max(0, expectedLevels.warrior - importedLevels.warrior),
    caster: Math.max(0, expectedLevels.caster - importedLevels.caster),
    healer: Math.max(0, expectedLevels.healer - importedLevels.healer),
  }
}

export function getSkillPointAccountingGap(parsed: ParsedInGameImport): number | null {
  if (parsed.guildCard.totalLevels === null || parsed.guildCard.availableSkillPoints === null) {
    return null
  }

  const expectedSkillPoints = getExpectedSkillPointTotal(parsed.guildCard.totalLevels)
  const accountedSkillPoints =
    countSkillPointCost(parsed.skills.foundNames)
    + countMainStatValues(parsed.trainingTotals)
    + parsed.guildCard.availableSkillPoints

  return expectedSkillPoints - accountedSkillPoints
}

export function getHeroPointAccountingGap(parsed: ParsedInGameImport): number | null {
  if (parsed.guildCard.totalLevels === null || !parsed.guildCard.raceTag || parsed.statCard.availableHeroPoints === null) {
    return null
  }

  const heroAvailability = calculateHeroPointAvailability(
    parsed.guildCard.totalLevels,
    parsed.guildCard.raceTag,
    parsed.talents.namesToApply ?? parsed.talents.foundNames,
  )
  const accountedHeroPoints =
    parsed.statCard.availableHeroPoints
    + countHeroTrainingSpentPoints(parsed.heroTraining.deltas)

  return heroAvailability.availablePoints - accountedHeroPoints
}

function getEquipmentSlotMatchScore(
  existingSlot: EquipmentSlot,
  importedSlot: EquipmentSlot,
  slotIndex: number,
  usedIndices: ReadonlySet<number>,
): number {
  if (usedIndices.has(slotIndex)) {
    return Number.NEGATIVE_INFINITY
  }

  const existingType = normalizeDenseText(existingSlot.type)
  const importedType = normalizeDenseText(importedSlot.type)
  const existingName = normalizeDenseText(existingSlot.name)
  const importedName = normalizeDenseText(importedSlot.name)

  if (existingType && importedType && existingType === importedType && existingName && importedName && existingName === importedName) {
    return 5
  }

  if (existingType && importedType && existingType === importedType && existingName.length === 0) {
    return 4
  }

  if (existingType && importedType && existingType === importedType) {
    return 3
  }

  if (existingType.length === 0 && existingName.length === 0) {
    return 2
  }

  if (existingName && importedName && existingName === importedName) {
    return 1
  }

  return Number.NEGATIVE_INFINITY
}

function ensureEquipmentSlotCapacity(slots: EquipmentSlot[], targetIndex: number): void {
  while (slots.length <= targetIndex) {
    slots.push(createDefaultEquipmentSlot())
  }
}

function mergeImportedEquipmentSlots(
  existingSlots: readonly EquipmentSlot[],
  importedSlots: readonly ParsedEquipmentImportSlot[],
): EquipmentSlot[] {
  const nextSlots = [...existingSlots]
  const usedIndices = new Set<number>()

  for (const importedEntry of importedSlots) {
    const { slot: importedSlot, targetSlot } = importedEntry

    if (targetSlot) {
      const targetIndex = equipmentImportTargetIndexByKey[targetSlot]
      ensureEquipmentSlotCapacity(nextSlots, targetIndex)
      nextSlots[targetIndex] = importedSlot
      usedIndices.add(targetIndex)
      continue
    }

    let bestIndex = -1
    let bestScore = Number.NEGATIVE_INFINITY

    for (const [slotIndex, existingSlot] of nextSlots.entries()) {
      const score = getEquipmentSlotMatchScore(existingSlot, importedSlot, slotIndex, usedIndices)
      if (score > bestScore) {
        bestScore = score
        bestIndex = slotIndex
      }
    }

    if (bestIndex === -1) {
      nextSlots.push(importedSlot)
      usedIndices.add(nextSlots.length - 1)
      continue
    }

    nextSlots[bestIndex] = importedSlot
    usedIndices.add(bestIndex)
  }

  return nextSlots
}

function detectInGameImportInputs(rawText: string): InGameImportInputs {
  const blocks = splitTranscriptBlocks(rawText)
  const skillBlocks = blocks.filter((block) => isSkillBlock(block))
  const talentBlocks = blocks.filter((block) => isTalentBlock(block))
  const guildCardBlock = [...blocks].reverse().find((block) => isGuildCardBlock(block)) ?? ""
  const statCardBlocks = blocks.filter((block) => isStatCardBlock(block))
  const artifactBlock = [...blocks].reverse().find((block) => isArtifactBlock(block)) ?? ""
  const tarotBlocks = blocks.filter((block) => isTarotEquippedCardsBlock(block) || isTarotViewCardBlock(block))
  const equipmentBlocks = blocks.filter((block) => isEquipmentBlock(block))
  const heroTrainingBlocks = blocks.filter((block) => /\bhero training\b/i.test(block) || /\bherotraining\b/i.test(block))
  const hasLevelTranscript = /\bLevel Up!\b/i.test(rawText) || /\b(?:x?levelup)\s+(?:tank|warrior|caster|healer)\b/i.test(rawText)
  const hasTrainingTranscript = /\b(?:xtraining|training)\s+(?:atk|def|matk|heal)\b/i.test(rawText)

  return {
    skills: skillBlocks.join("\n\n"),
    talents: talentBlocks.join("\n\n"),
    guildCard: guildCardBlock,
    statCard: statCardBlocks.join("\n\n"),
    artifact: artifactBlock,
    tarots: tarotBlocks.join("\n\n"),
    levelUps: hasLevelTranscript ? rawText : "",
    training: hasTrainingTranscript ? rawText : "",
    heroTraining: heroTrainingBlocks.join("\n\n"),
    equipment: equipmentBlocks.join("\n\n"),
  }
}

export function parseInGameImportInputs(
  inputs: InGameImportInputs,
  options: ParseInGameImportOptions = {},
): ParsedInGameImport {
  const skillBlocks = splitTranscriptBlocks(inputs.skills).filter((block) => isSkillBlock(block) || block.length > 0)
  const talentBlocks = splitTranscriptBlocks(inputs.talents).filter((block) => isTalentBlock(block) || block.length > 0)
  const equipmentBlocks = splitTranscriptBlocks(inputs.equipment).filter((block) => block.length > 0)
  const heroTrainingBlocks = splitTranscriptBlocks(inputs.heroTraining).filter((block) => block.length > 0)
  const hasLevelTranscript = /\bLevel Up!\b/i.test(inputs.levelUps) || /\b(?:x?levelup)\s+(?:tank|warrior|caster|healer)\b/i.test(inputs.levelUps)
  const hasTrainingTranscript = /\b(?:xtraining|training)\s+(?:atk|def|matk|heal)\b/i.test(inputs.training)

  const skills = parseNameListFromBlocks(skillBlocks, "skill")
  const talents = parseNameListFromBlocks(talentBlocks, "talent")
  const guildCard = parseGuildCardImport(inputs.guildCard.trim() || null)
  const statCard = parseStatCardImport(inputs.statCard.trim() || null)
  const artifact = parseArtifactImport(inputs.artifact.trim() || null)
  const tarots = parseTarotImport(inputs.tarots.trim() || null)
  const fallbackManualLevelTotal = Math.max(0, Math.floor(options.fallbackManualLevelTotal ?? 0))
  const { ranges: manualLevelRanges, warnings: manualLevelWarnings } = hasLevelTranscript
    ? parseManualLevelTranscript(preprocessLevelTranscript(inputs.levelUps), fallbackManualLevelTotal)
    : { ranges: [], warnings: [] }
  const { entries: manualTrainingEntries, warnings: trainingWarnings } = hasTrainingTranscript
    ? parseManualTrainingTranscript(preprocessTrainingTranscript(inputs.training))
    : { entries: [], warnings: [] }
  const trainingTotals = getEffectiveTrainingTotalsFromEntries(manualTrainingEntries)
  const heroTraining = parseHeroTrainingImport(heroTrainingBlocks)
  const { slots: equipmentSlots, warnings: equipmentWarnings } = parseImportedEquipmentSlots(equipmentBlocks)

  const warnings = [
    ...skills.warnings,
    ...talents.warnings,
    ...guildCard.warnings,
    ...statCard.warnings,
    ...artifact.warnings,
    ...tarots.warnings,
    ...manualLevelWarnings,
    ...trainingWarnings,
    ...heroTraining.warnings,
    ...equipmentWarnings,
  ]

  if (guildCard.levels && statCard.statPoints && statCard.availableStatPoints !== null) {
    const totalLevels = guildCard.totalLevels ?? getLevelCount(guildCard.levels)
    const allocatedStatPoints = countMainStatValues(statCard.statPoints)
    const statPointTotal = allocatedStatPoints + statCard.availableStatPoints

    if (statPointTotal !== totalLevels) {
      warnings.push(`Stat Card stat points totaled ${statPointTotal}, but the Guild Card total level was ${totalLevels}.`)
    }
  }

  return {
    skills,
    talents,
    guildCard,
    statCard,
    artifact,
    tarots,
    manualLevelRanges,
    manualLevelWarnings,
    manualTrainingEntries,
    trainingTotals,
    trainingWarnings,
    heroTraining,
    equipmentSlots,
    equipmentWarnings,
    warnings,
  }
}

export function parseInGameImport(rawText: string, options: ParseInGameImportOptions = {}): ParsedInGameImport {
  return parseInGameImportInputs(detectInGameImportInputs(rawText), options)
}

export function getStoredManualLevelFallbackTotal(storage: Storage): number {
  return getManualRangeMaxTotalLevel(
    normalizeManualLevelRanges(jsonParse(storage.getItem(MANUAL_LEVEL_RANGES_STORAGE_KEY), [])),
  )
}

export function buildInGameImportCoverageRows(parsed: ParsedInGameImport): InGameImportCoverageRow[] {
  const rows: InGameImportCoverageRow[] = []
  const skillPageCoverage = parsed.skills.pageCoverage
  const talentPageCoverage = parsed.talents.pageCoverage
  const skillPageCommand = getSkillPageCommand(parsed)
  const talentPageCommand = getTalentPageCommand(parsed)

  if (skillPageCoverage) {
    const missingPages = skillPageCoverage.totalPages - skillPageCoverage.foundPages.length
    rows.push(createCoverageRow(
      "Skill Pages",
      missingPages === 0 ? "ok" : "missing",
      `${skillPageCoverage.totalPages} pages`,
      `${skillPageCoverage.foundPages.length}/${skillPageCoverage.totalPages}`,
      missingPages === 0 ? "0" : `${missingPages} page${missingPages === 1 ? "" : "s"}`,
      skillPageCommand,
      missingPages === 0
        ? `${parsed.skills.foundNames.length} skill${parsed.skills.foundNames.length === 1 ? "" : "s"} found.`
        : "Paste every page before replacing skills.",
    ))
  } else {
    rows.push(createCoverageRow(
      "Skill Pages",
      "needs-source",
      "At least 1 page",
      parsed.skills.foundNames.length > 0 ? `${parsed.skills.foundNames.length} skill${parsed.skills.foundNames.length === 1 ? "" : "s"} found` : "None",
      parsed.skills.foundNames.length > 0 ? "Need page count" : "No pages pasted",
      skillPageCommand,
      "Use the in-game skill page output here.",
    ))
  }

  if (talentPageCoverage) {
    const missingPages = talentPageCoverage.totalPages - talentPageCoverage.foundPages.length
    rows.push(createCoverageRow(
      "Talent Pages",
      missingPages === 0 ? "ok" : "missing",
      `${talentPageCoverage.totalPages} pages`,
      `${talentPageCoverage.foundPages.length}/${talentPageCoverage.totalPages}`,
      missingPages === 0 ? "0" : `${missingPages} page${missingPages === 1 ? "" : "s"}`,
      talentPageCommand,
      missingPages === 0
        ? `${parsed.talents.foundNames.length} talent${parsed.talents.foundNames.length === 1 ? "" : "s"} found.`
        : "Paste every page before replacing talents.",
    ))
  } else {
    rows.push(createCoverageRow(
      "Talent Pages",
      "needs-source",
      "At least 1 page",
      parsed.talents.foundNames.length > 0 ? `${parsed.talents.foundNames.length} talent${parsed.talents.foundNames.length === 1 ? "" : "s"} found` : "None",
      parsed.talents.foundNames.length > 0 ? "Need page count" : "No pages pasted",
      talentPageCommand,
      "Use the in-game talent page output here.",
    ))
  }

  if (parsed.guildCard.totalLevels !== null && parsed.guildCard.availableTalentPoints !== null) {
    const expectedTalentPoints = Math.ceil(parsed.guildCard.totalLevels / 2)
    const spentTalentPoints = parsed.talents.foundNames.length
    const accountedTalentPoints = spentTalentPoints + parsed.guildCard.availableTalentPoints
    const gap = expectedTalentPoints - accountedTalentPoints

    rows.push(createCoverageRow(
      "Talent Points",
      gap === 0 ? "ok" : gap > 0 ? "missing" : "warning",
      expectedTalentPoints.toLocaleString("en-US"),
      accountedTalentPoints.toLocaleString("en-US"),
      formatSignedGap(gap),
      talentPageCommand,
      gap > 0
        ? `${spentTalentPoints} spent from pasted talents + ${parsed.guildCard.availableTalentPoints} left on the Guild Card. ${gap} more talent${gap === 1 ? "" : "s"} still missing.`
        : gap < 0
          ? `${spentTalentPoints} spent from pasted talents + ${parsed.guildCard.availableTalentPoints} left on the Guild Card. Over by ${Math.abs(gap)} talent${Math.abs(gap) === 1 ? "" : "s"}.`
          : `${spentTalentPoints} spent from pasted talents + ${parsed.guildCard.availableTalentPoints} left on the Guild Card.`,
    ))
  } else {
    rows.push(createCoverageRow(
      "Talent Points",
      "needs-source",
      parsed.guildCard.totalLevels !== null ? Math.ceil(parsed.guildCard.totalLevels / 2).toLocaleString("en-US") : "Need Guild Card",
      parsed.talents.foundNames.length.toLocaleString("en-US"),
      "Unknown",
      parsed.guildCard.totalLevels === null ? "cz gc" : talentPageCommand,
      parsed.guildCard.totalLevels === null
        ? "Paste a Guild Card to know total earned talent points."
        : "Paste the Guild Card skill/talent point line and all talent pages to finish accounting.",
    ))
  }

  if (parsed.guildCard.totalLevels !== null && parsed.guildCard.availableSkillPoints !== null) {
    const expectedSkillPoints = getExpectedSkillPointTotal(parsed.guildCard.totalLevels)
    const spentSkillPoints = countSkillPointCost(parsed.skills.foundNames)
    const spentTrainingPoints = countMainStatValues(parsed.trainingTotals)
    const accountedSkillPoints = spentSkillPoints + spentTrainingPoints + parsed.guildCard.availableSkillPoints
    const gap = getSkillPointAccountingGap(parsed) ?? 0

    rows.push(createCoverageRow(
      "Skill Points",
      gap === 0 ? "ok" : gap > 0 ? "missing" : "warning",
      expectedSkillPoints.toLocaleString("en-US"),
      accountedSkillPoints.toLocaleString("en-US"),
      formatSignedGap(gap),
      `${skillPageCommand} / cz xtraining`,
      `${spentSkillPoints} spent from pasted skills + ${spentTrainingPoints} spent on training + ${parsed.guildCard.availableSkillPoints} left on the Guild Card.`,
    ))
  } else {
    rows.push(createCoverageRow(
      "Skill Points",
      "needs-source",
      parsed.guildCard.totalLevels !== null ? getExpectedSkillPointTotal(parsed.guildCard.totalLevels).toLocaleString("en-US") : "Need Guild Card",
      (countSkillPointCost(parsed.skills.foundNames) + countMainStatValues(parsed.trainingTotals)).toLocaleString("en-US"),
      "Unknown",
      parsed.guildCard.totalLevels === null ? "cz gc" : `${skillPageCommand} / cz xtraining`,
      parsed.guildCard.totalLevels === null
        ? "Paste a Guild Card to know total earned skill points."
        : "Paste the Guild Card skill/talent point line plus skill pages and training output.",
    ))
  }

  if (parsed.guildCard.totalLevels !== null && parsed.statCard.statPoints && parsed.statCard.availableStatPoints !== null) {
    const expectedStatPoints = parsed.guildCard.totalLevels
    const accountedStatPoints = countMainStatValues(parsed.statCard.statPoints) + parsed.statCard.availableStatPoints
    const gap = expectedStatPoints - accountedStatPoints

    rows.push(createCoverageRow(
      "Stat Points",
      gap === 0 ? "ok" : gap > 0 ? "missing" : "warning",
      expectedStatPoints.toLocaleString("en-US"),
      accountedStatPoints.toLocaleString("en-US"),
      formatSignedGap(gap),
      "cz statcard",
      `${countMainStatValues(parsed.statCard.statPoints)} allocated + ${parsed.statCard.availableStatPoints} left.`,
    ))
  } else {
    rows.push(createCoverageRow(
      "Stat Points",
      "needs-source",
      parsed.guildCard.totalLevels !== null ? parsed.guildCard.totalLevels.toLocaleString("en-US") : "Need Guild Card",
      parsed.statCard.statPoints ? countMainStatValues(parsed.statCard.statPoints).toLocaleString("en-US") : "Unknown",
      "Unknown",
      parsed.statCard.statPoints ? "cz statcard" : "cz statcard",
      parsed.guildCard.totalLevels === null
        ? "Paste a Guild Card and a Stat Card or statup results to verify stat points."
        : "Paste a Stat Card or statup results to see allocated and remaining stat points.",
    ))
  }

  if (parsed.guildCard.totalLevels !== null && parsed.guildCard.raceTag && parsed.statCard.availableHeroPoints !== null) {
    const heroAvailability = calculateHeroPointAvailability(
      parsed.guildCard.totalLevels,
      parsed.guildCard.raceTag,
      parsed.talents.namesToApply ?? parsed.talents.foundNames,
    )
    const accountedHeroPoints = parsed.statCard.availableHeroPoints + countHeroTrainingSpentPoints(parsed.heroTraining.deltas)
    const gap = heroAvailability.availablePoints - accountedHeroPoints
    const heroCommand = "cz statcard / cz herotraining"

    rows.push(createCoverageRow(
      "Hero Points",
      gap === 0 ? "ok" : gap > 0 ? "missing" : "warning",
      heroAvailability.availablePoints.toLocaleString("en-US"),
      accountedHeroPoints.toLocaleString("en-US"),
      formatSignedGap(gap),
      heroCommand,
      `${parsed.statCard.availableHeroPoints} left on the Stat Card + ${countHeroTrainingSpentPoints(parsed.heroTraining.deltas)} spent in pasted hero training.${parsed.talents.pageCoverage && !parsed.talents.pageCoverage.complete ? " Talent bonuses may still be undercounted until every talent page is pasted." : ""}`,
    ))
  } else {
    rows.push(createCoverageRow(
      "Hero Points",
      "needs-source",
      parsed.guildCard.totalLevels !== null && parsed.guildCard.raceTag ? "Can calculate" : "Need Guild Card race/levels",
      parsed.statCard.availableHeroPoints !== null ? parsed.statCard.availableHeroPoints.toLocaleString("en-US") : "Unknown",
      "Unknown",
      parsed.statCard.availableHeroPoints !== null ? "cz herotraining" : "cz statcard",
      "Paste a Guild Card for race/levels and a Stat Card for current hero points, then add hero training results.",
    ))
  }

  return rows
}

export function hasReadyInGameImport(parsed: ParsedInGameImport): boolean {
  return parsed.skills.namesToApply !== null
    || parsed.talents.namesToApply !== null
    || parsed.guildCard.raceTag !== null
    || parsed.guildCard.levels !== null
    || parsed.statCard.statPoints !== null
    || Object.keys(parsed.artifact.values).length > 0
    || parsed.artifact.seenRuneTiers.length > 0
    || parsed.tarots.namesToApply !== null
    || parsed.tarots.equipmentSlots.length > 0
    || parsed.manualLevelRanges.length > 0
    || countMainStatValues(parsed.trainingTotals) > 0
    || countHeroPointDeltas(parsed.heroTraining.deltas) > 0
    || parsed.equipmentSlots.length > 0
}

export function applyInGameImport(storage: Storage, parsed: ParsedInGameImport): AppliedInGameImport {
  const updatedSections: string[] = []

  if (parsed.skills.namesToApply) {
    storage.setItem(SKILL_SELECTION_STORAGE_KEY, JSON.stringify(parsed.skills.namesToApply))
    updatedSections.push(`skills (${parsed.skills.namesToApply.length})`)
  }

  if (parsed.talents.namesToApply) {
    storage.setItem(TALENT_SELECTION_STORAGE_KEY, JSON.stringify(parsed.talents.namesToApply))
    updatedSections.push(`talents (${parsed.talents.namesToApply.length})`)
  }

  if (parsed.guildCard.raceTag) {
    storage.setItem(RACE_STORAGE_KEY, parsed.guildCard.raceTag)
    updatedSections.push(`race (${parsed.guildCard.raceTag})`)
  }

  if (parsed.guildCard.levels) {
    storage.setItem(LEVELS_STORAGE_KEY, JSON.stringify(parsed.guildCard.levels))
    updatedSections.push(`levels (${getLevelCount(parsed.guildCard.levels)})`)
  }

  if (parsed.statCard.statPoints) {
    persistStoredStatPoints(storage, parsed.statCard.statPoints)
    updatedSections.push(`stat points (${countMainStatValues(parsed.statCard.statPoints)})`)
  }

  if (Object.keys(parsed.artifact.values).length > 0) {
    const currentArtifact = normalizeArtifact(jsonParse(storage.getItem(ARTIFACT_STORAGE_KEY), null))
    const mergedArtifact = normalizeArtifact({
      ...currentArtifact,
      ...parsed.artifact.values,
    })

    if (JSON.stringify(mergedArtifact) !== JSON.stringify(currentArtifact)) {
      storage.setItem(ARTIFACT_STORAGE_KEY, JSON.stringify(mergedArtifact))
      updatedSections.push("artifact")
    }
  }

  if (parsed.artifact.seenRuneTiers.length > 0) {
    const currentRunes = normalizeStoredRuneSelections(
      jsonParse(storage.getItem(RUNES_STORAGE_KEY), {}),
    )
    const nextRunes = createEmptyRuneSelections()

    for (const tier of runeTiers) {
      nextRunes[tier] = parsed.artifact.seenRuneTiers.includes(tier)
        ? parsed.artifact.runes[tier]
        : currentRunes[tier]
    }

    if (JSON.stringify(nextRunes) !== JSON.stringify(currentRunes)) {
      storage.setItem(RUNES_STORAGE_KEY, JSON.stringify(nextRunes))
      if (!updatedSections.includes("artifact")) {
        updatedSections.push("artifact")
      }
    }
  }

  if (parsed.tarots.namesToApply !== null) {
    const currentManualTarots = readStoredManualTarotSelections(storage)
    const nextManualTarots = parsed.tarots.namesToApply

    if (JSON.stringify(nextManualTarots) !== JSON.stringify(currentManualTarots)) {
      storage.setItem(MANUAL_TAROT_SELECTION_STORAGE_KEY, JSON.stringify(nextManualTarots))
      updatedSections.push(`tarots (${nextManualTarots.length})`)
    }

    const currentTarotStacks = readRecordOfNumbers(storage, TAROT_STACKS_STORAGE_KEY)
    const nextTarotStacks = { ...currentTarotStacks }

    for (const tarotName of nextManualTarots) {
      if (parsed.tarots.stacksByName[tarotName] !== undefined) {
        nextTarotStacks[tarotName] = parsed.tarots.stacksByName[tarotName]
      } else {
        delete nextTarotStacks[tarotName]
      }
    }

    if (JSON.stringify(nextTarotStacks) !== JSON.stringify(currentTarotStacks)) {
      storage.setItem(TAROT_STACKS_STORAGE_KEY, JSON.stringify(nextTarotStacks))
      if (!updatedSections.some((section) => section.startsWith("tarots"))) {
        updatedSections.push(`tarots (${nextManualTarots.length})`)
      }
    }
  }

  if (parsed.manualLevelRanges.length > 0) {
    const currentRanges = normalizeManualLevelRanges(
      jsonParse(storage.getItem(MANUAL_LEVEL_RANGES_STORAGE_KEY), []),
    )
    const dedupedImportedRanges = dedupeManualLevelRanges(parsed.manualLevelRanges)
    const mergedRanges = mergeManualLevelRanges(currentRanges, dedupedImportedRanges)

    if (JSON.stringify(mergedRanges) !== JSON.stringify(currentRanges)) {
      storage.setItem(MANUAL_LEVEL_RANGES_STORAGE_KEY, JSON.stringify(mergedRanges))
      updatedSections.push(`manual ranges (${dedupedImportedRanges.length})`)
    }
  }

  if (parsed.manualTrainingEntries.length > 0) {
    const currentTraining = parseStoredMainStatValues(storage.getItem(TRAINING_STORAGE_KEY))
    const nextTraining = addMainStatValues(currentTraining, parsed.trainingTotals)
    const currentManualEntries = normalizeManualTrainingEntries(
      jsonParse(storage.getItem(MANUAL_TRAINING_ENTRIES_STORAGE_KEY), []),
    )

    storage.setItem(TRAINING_STORAGE_KEY, JSON.stringify(nextTraining))
    storage.setItem(
      MANUAL_TRAINING_ENTRIES_STORAGE_KEY,
      JSON.stringify([...currentManualEntries, ...parsed.manualTrainingEntries]),
    )
    updatedSections.push(`training (+${countMainStatValues(parsed.trainingTotals)})`)
  }

  if (countHeroPointDeltas(parsed.heroTraining.deltas) > 0) {
    const currentHeroPoints = readRecordOfNumbers(storage, HERO_POINTS_STORAGE_KEY)

    for (const { id } of heroPointStats) {
      const addedValue = Math.max(0, Math.floor(parsed.heroTraining.deltas[id] ?? 0))
      if (addedValue === 0) {
        continue
      }

      currentHeroPoints[id] = (currentHeroPoints[id] ?? 0) + addedValue
    }

    storage.setItem(HERO_POINTS_STORAGE_KEY, JSON.stringify(currentHeroPoints))
    updatedSections.push(`hero training (+${countHeroPointDeltas(parsed.heroTraining.deltas)})`)
  }

  const importedEquipmentSlots = [
    ...parsed.equipmentSlots,
    ...parsed.tarots.equipmentSlots,
  ]

  if (importedEquipmentSlots.length > 0) {
    const currentEquipmentSlots = normalizeEquipmentSlots(
      jsonParse(storage.getItem(EQUIPMENT_SLOTS_STORAGE_KEY), []),
    )
    const mergedEquipmentSlots = mergeImportedEquipmentSlots(currentEquipmentSlots, importedEquipmentSlots)
    const enabledEquipment = getEnabledEquipmentIndices(mergedEquipmentSlots)
    const autoLinkedTarots = getEquipmentAutoLinkedTarots(mergedEquipmentSlots, enabledEquipment)
    const autoManagedTarots = getAutoManagedTarotNames(mergedEquipmentSlots)
    const filteredManualTarots = filterManualTarotSelections(
      readStoredManualTarotSelections(storage),
      autoManagedTarots,
    )

    storage.setItem(EQUIPMENT_SLOTS_STORAGE_KEY, JSON.stringify(mergedEquipmentSlots))
    storage.setItem(ENABLED_EQUIPMENT_STORAGE_KEY, JSON.stringify(enabledEquipment))
    storage.setItem(EQUIPMENT_AUTO_LINKED_TAROTS_STORAGE_KEY, JSON.stringify(autoLinkedTarots))
    storage.setItem(MANUAL_TAROT_SELECTION_STORAGE_KEY, JSON.stringify(filteredManualTarots))
    if (parsed.equipmentSlots.length > 0) {
      updatedSections.push(`equipment (${parsed.equipmentSlots.length})`)
    }

    if (parsed.tarots.equipmentSlots.length > 0) {
      updatedSections.push(`tarot equipment (${parsed.tarots.equipmentSlots.length})`)
    }
  }

  if (updatedSections.length > 0) {
    dispatchBuildSnapshotUpdated()
  }

  return { updatedSections }
}
