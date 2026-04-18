import { heroPointStats, type HeroPointStatId } from "@/app/data/heropoint_data"
import race_data, { type RaceTag } from "@/app/data/race_data"
import { skill_data } from "@/app/data/skill_data"
import stat_data from "@/app/data/stat_data"
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

export type InGameImportInputs = {
  skills: string
  talents: string
  guildCard: string
  statCard: string
  artifact: string
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
  warnings: string[]
}

export type ParsedInGameImport = {
  skills: ParsedInGameNameList
  talents: ParsedInGameNameList
  guildCard: ParsedGuildCardImport
  statCard: ParsedStatCardImport
  artifact: ParsedArtifactImport
  manualLevelRanges: ManualLevelRange[]
  manualLevelWarnings: string[]
  manualTrainingEntries: ManualTrainingEntry[]
  trainingTotals: MainStatValues
  trainingWarnings: string[]
  heroTraining: ParsedHeroTrainingImport
  equipmentSlots: EquipmentSlot[]
  equipmentWarnings: string[]
  warnings: string[]
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
const RACE_STORAGE_KEY = "SelectedRace"
const ARTIFACT_STORAGE_KEY = "Artifact"
const MANUAL_LEVEL_RANGES_STORAGE_KEY = "SelectedManualLevelRanges"
const MANUAL_TRAINING_ENTRIES_STORAGE_KEY = "SelectedManualTrainingEntries"

const mainStatKeys: readonly MainStatKey[] = ["ATK", "DEF", "MATK", "HEAL"]
const equipmentTypeOptions = ["Helm", "Armor", "Amulet", "Ring", "Weapon", "Runeshard", "Tarot"] as const

const heroPointCostById = new Map<HeroPointStatId, number>(
  heroPointStats.map((entry) => [entry.id, entry.cost]),
)

const skillNameByNormalizedKey = new Map<string, string>(
  Object.keys(skill_data).map((name) => [normalizeDenseText(name), name]),
)

const talentNameByNormalizedKey = new Map<string, string>(
  Object.keys(talent_data).map((name) => [normalizeDenseText(name), name]),
)

const raceTagByNormalizedKey = new Map<string, RaceTag>(
  race_data.flatMap((race) => ([
    [normalizeDenseText(race.name), race.tag],
    [normalizeDenseText(race.tag), race.tag],
  ])),
)

const equipmentTypeByNormalizedKey = new Map<string, typeof equipmentTypeOptions[number]>(
  equipmentTypeOptions.map((type) => [normalizeDenseText(type), type]),
)

const affixStatByNormalizedKey = new Map<string, string>(
  Object.entries(stat_data.inGameNames).map(([token, stat]) => [normalizeDenseText(token), stat]),
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
    levelUps: "",
    training: "",
    heroTraining: "",
    equipment: "",
  }
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
  return /\bskill list\b/i.test(block) || /\bskillpage\b/i.test(block)
}

function isTalentBlock(block: string): boolean {
  return /\btalent list\b/i.test(block) || /\btalentpage\b/i.test(block)
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
  let totalPages: number | null = null

  const lookup = kind === "skill" ? skillNameByNormalizedKey : talentNameByNormalizedKey
  const orderNames = kind === "skill" ? getOrderedSkillNames : getOrderedTalentNames
  const label = kind === "skill" ? "skill" : "talent"

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
    warnings.push(`No known ${label} names were found in the pasted ${label} pages.`)
  }

  for (const unknownName of unknownNames) {
    warnings.push(`Unrecognized ${label} "${unknownName}".`)
  }

  return {
    foundNames: orderedNames,
    namesToApply: orderedNames.length > 0 && (!coverage || coverage.complete) ? orderedNames : null,
    pageCoverage: coverage,
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

  const raceTag = raceValue ? (raceTagByNormalizedKey.get(normalizeDenseText(raceValue)) ?? null) : null
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

  for (const line of lines) {
    const recordMatch = line.match(/^(ATK|DEF|MATK|HEAL)\s*:\s*([+-]?\d[\d,]*)/i)
    if (!recordMatch) {
      continue
    }

    const key = recordMatch[1].toUpperCase() as MainStatKey
    statPoints[key] = parseWholeNumber(recordMatch[2])
    hasAnyStatRecord = true
  }

  if (!hasAnyStatRecord) {
    warnings.push("Stat Card import could not read any Stat Up Record rows.")
  }

  const availableStatPointsMatch = block.match(/([+-]?\d[\d,]*)\s+Stat Points Available to Allocate/i)
  const availableHeroPointsMatch = block.match(/([+-]?\d[\d,]*)\s+Hero Points Available/i)

  return {
    statPoints: hasAnyStatRecord ? statPoints : null,
    availableStatPoints: availableStatPointsMatch ? parseWholeNumber(availableStatPointsMatch[1]) : null,
    availableHeroPoints: availableHeroPointsMatch ? parseWholeNumber(availableHeroPointsMatch[1]) : null,
    warnings,
  }
}

function parseArtifactImport(block: string | null): ParsedArtifactImport {
  if (!block) {
    return {
      values: {},
      warnings: [],
    }
  }

  const lines = getMeaningfulLines(block)
  const warnings: string[] = []
  const values: Partial<ArtifactState> = {}
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

  if (Object.keys(values).length === 0) {
    warnings.push("Artifact import did not contain any parseable level or artifact stat values.")
  }

  return {
    values,
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

function parseEquipmentBlock(block: string): { slot: EquipmentSlot | null; warnings: string[] } {
  const lines = getMeaningfulLines(block)
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
    const commandTypeMatch = commandLine?.match(/\bitemequipview\s+([A-Za-z]+)/i)
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
    return { slot: null, warnings }
  }

  if (!slot.type) {
    warnings.push(`Imported "${slot.name || "equipment"}" without a recognized equipment type.`)
  }

  return {
    slot: normalizeEquipmentSlot(slot),
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

function parseImportedEquipmentSlots(blocks: readonly string[]): { slots: EquipmentSlot[]; warnings: string[] } {
  const slots: EquipmentSlot[] = []
  const warnings: string[] = []

  for (const block of blocks) {
    const parsed = parseEquipmentBlock(block)
    if (parsed.slot) {
      slots.push(parsed.slot)
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

function mergeImportedEquipmentSlots(
  existingSlots: readonly EquipmentSlot[],
  importedSlots: readonly EquipmentSlot[],
): EquipmentSlot[] {
  const nextSlots = [...existingSlots]
  const usedIndices = new Set<number>()

  for (const importedSlot of importedSlots) {
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
  const statCardBlock = [...blocks].reverse().find((block) => isStatCardBlock(block)) ?? ""
  const artifactBlock = [...blocks].reverse().find((block) => isArtifactBlock(block)) ?? ""
  const equipmentBlocks = blocks.filter((block) => isEquipmentBlock(block))
  const heroTrainingBlocks = blocks.filter((block) => /\bhero training\b/i.test(block) || /\bherotraining\b/i.test(block))
  const hasLevelTranscript = /\bLevel Up!\b/i.test(rawText) || /\b(?:x?levelup)\s+(?:tank|warrior|caster|healer)\b/i.test(rawText)
  const hasTrainingTranscript = /\b(?:xtraining|training)\s+(?:atk|def|matk|heal)\b/i.test(rawText)

  return {
    skills: skillBlocks.join("\n\n"),
    talents: talentBlocks.join("\n\n"),
    guildCard: guildCardBlock,
    statCard: statCardBlock,
    artifact: artifactBlock,
    levelUps: hasLevelTranscript ? rawText : "",
    training: hasTrainingTranscript ? rawText : "",
    heroTraining: heroTrainingBlocks.join("\n\n"),
    equipment: equipmentBlocks.join("\n\n"),
  }
}

export function parseInGameImportInputs(inputs: InGameImportInputs): ParsedInGameImport {
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
  const { ranges: manualLevelRanges, warnings: manualLevelWarnings } = hasLevelTranscript
    ? parseManualLevelTranscript(preprocessLevelTranscript(inputs.levelUps))
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

export function parseInGameImport(rawText: string): ParsedInGameImport {
  return parseInGameImportInputs(detectInGameImportInputs(rawText))
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
    const expectedTalentPoints = Math.floor(parsed.guildCard.totalLevels / 2)
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
      `${spentTalentPoints} spent from pasted talents + ${parsed.guildCard.availableTalentPoints} left on the Guild Card.`,
    ))
  } else {
    rows.push(createCoverageRow(
      "Talent Points",
      "needs-source",
      parsed.guildCard.totalLevels !== null ? Math.floor(parsed.guildCard.totalLevels / 2).toLocaleString("en-US") : "Need Guild Card",
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
        ? "Paste a Guild Card and Stat Card to verify stat points."
        : "Paste a Stat Card to see allocated and remaining stat points.",
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

  if (parsed.equipmentSlots.length > 0) {
    const currentEquipmentSlots = normalizeEquipmentSlots(
      jsonParse(storage.getItem(EQUIPMENT_SLOTS_STORAGE_KEY), []),
    )
    const mergedEquipmentSlots = mergeImportedEquipmentSlots(currentEquipmentSlots, parsed.equipmentSlots)
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
    updatedSections.push(`equipment (${parsed.equipmentSlots.length})`)
  }

  if (updatedSections.length > 0) {
    dispatchBuildSnapshotUpdated()
  }

  return { updatedSections }
}
