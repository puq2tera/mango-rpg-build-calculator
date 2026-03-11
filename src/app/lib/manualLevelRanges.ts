export const manualRangeClasses = ["tank", "warrior", "caster", "healer"] as const
export type ManualRangeClass = (typeof manualRangeClasses)[number]

export type ManualLevelRange = {
  className: ManualRangeClass
  startLevel: number
  endLevel: number
  hpGain: number
  atkGain: number
  defGain: number
  matkGain: number
  healGain: number
}

export type ManualRangeLevels = Record<ManualRangeClass, number>
export type ManualRangeStatKey = "hpGain" | "atkGain" | "defGain" | "matkGain" | "healGain"

type ParsedTranscriptResult = {
  ranges: ManualLevelRange[]
  warnings: string[]
}

type ParsedGainTotals = Record<ManualRangeStatKey, number>
type ParsedLevelUpBlock = {
  index: number
  totals: ParsedGainTotals
  levelCount: number | null
  totalLevel: number | null
  inferredClass: ManualRangeClass | null
}

const gainPatterns: Record<ManualRangeStatKey, RegExp> = {
  hpGain: /\+HP\s*([+-]?\d[\d,]*(?:\.\d+)?)/i,
  atkGain: /\+ATK\s*([+-]?\d[\d,]*(?:\.\d+)?)/i,
  defGain: /\+DEF\s*([+-]?\d[\d,]*(?:\.\d+)?)/i,
  matkGain: /\+MATK\s*([+-]?\d[\d,]*(?:\.\d+)?)/i,
  healGain: /\+Healpower\s*([+-]?\d[\d,]*(?:\.\d+)?)/i,
}
const talentPointPattern = /Talent Points?\s*([+-]?\d[\d,]*(?:\.\d+)?)/i
const skillPointPattern = /Skill Points?\s*([+-]?\d[\d,]*(?:\.\d+)?)/i
const singleTalentPointGainPattern = /\bTalent Point gained!?/i
const singleSkillPointGainPattern = /\bSkill Point gained!?/i
const totalLevelPattern = /Total Level\s*([+-]?\d[\d,]*(?:\.\d+)?)/i
const totalLevelsSnapshotPattern = /Total Levels\s*([+-]?\d[\d,]*(?:\.\d+)?)\s*\/\s*[+-]?\d[\d,]*(?:\.\d+)?/gi

const levelCommandPattern = /\bxlevelup\s+(tank|warrior|caster|healer)(?:\s+([0-9,]+))?\b/gi
const levelUpPattern = /Level Up!/gi

function asFiniteNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback
}

function parseWholeNumber(raw: string): number {
  const normalized = Number(raw.replaceAll(",", ""))
  return Number.isFinite(normalized) ? normalized : 0
}

function parsePointGain(levelUpBlock: string, pointPattern: RegExp, singlePointGainPattern: RegExp): number | null {
  const match = levelUpBlock.match(pointPattern)
  if (match) {
    return parseWholeNumber(match[1])
  }

  return singlePointGainPattern.test(levelUpBlock) ? 1 : null
}

function inferClassFromLevelUpBlock(levelUpBlock: string): ManualRangeClass | null {
  if (/Armor Save/i.test(levelUpBlock)) {
    return "tank"
  }

  if (/Overdrive/i.test(levelUpBlock)) {
    return "warrior"
  }

  if (/Armor Strike/i.test(levelUpBlock)) {
    return "healer"
  }

  if (/Crit Damage/i.test(levelUpBlock)) {
    return "caster"
  }

  return null
}

export function isManualRangeClass(value: string): value is ManualRangeClass {
  return manualRangeClasses.includes(value as ManualRangeClass)
}

export function createDefaultManualLevelRange(): ManualLevelRange {
  return {
    className: "healer",
    startLevel: 1,
    endLevel: 1,
    hpGain: 0,
    atkGain: 0,
    defGain: 0,
    matkGain: 0,
    healGain: 0,
  }
}

export function normalizeManualLevelRange(raw: unknown): ManualLevelRange | null {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return null
  }

  const entry = raw as Partial<ManualLevelRange>
  if (!isManualRangeClass(entry.className ?? "")) {
    return null
  }

  const className = entry.className as ManualRangeClass
  const startLevel = Math.max(1, Math.floor(asFiniteNumber(entry.startLevel, 1)))
  const endLevel = Math.max(startLevel, Math.floor(asFiniteNumber(entry.endLevel, startLevel)))

  return {
    className,
    startLevel,
    endLevel,
    hpGain: asFiniteNumber(entry.hpGain, 0),
    atkGain: asFiniteNumber(entry.atkGain, 0),
    defGain: asFiniteNumber(entry.defGain, 0),
    matkGain: asFiniteNumber(entry.matkGain, 0),
    healGain: asFiniteNumber(entry.healGain, 0),
  }
}

export function normalizeManualLevelRanges(raw: unknown): ManualLevelRange[] {
  if (!Array.isArray(raw)) {
    return []
  }

  return raw
    .map((entry) => normalizeManualLevelRange(entry))
    .filter((entry): entry is ManualLevelRange => entry !== null)
}

export function getManualRangeSpan(range: ManualLevelRange): number {
  return Math.max(1, range.endLevel - range.startLevel + 1)
}

export function getManualRangeMaxTotalLevel(ranges: readonly ManualLevelRange[]): number {
  return ranges.reduce((highest, range) => Math.max(highest, range.endLevel), 0)
}

function getDistributedRangeGain(total: number, offset: number, span: number): number {
  const previous = Math.trunc((total * offset) / span)
  const current = Math.trunc((total * (offset + 1)) / span)
  return current - previous
}

export function getManualRangeGain(
  range: ManualLevelRange,
  rangeLevel: number,
  statKey: ManualRangeStatKey,
): number {
  if (rangeLevel < range.startLevel || rangeLevel > range.endLevel) {
    return 0
  }

  return getDistributedRangeGain(range[statKey], rangeLevel - range.startLevel, getManualRangeSpan(range))
}

function parseLevelUpBlock(levelUpBlock: string, index: number): ParsedLevelUpBlock | null {
  const totals = {} as ParsedGainTotals

  for (const [key, pattern] of Object.entries(gainPatterns) as Array<[ManualRangeStatKey, RegExp]>) {
    const match = levelUpBlock.match(pattern)
    if (!match) {
      return null
    }

    totals[key] = parseWholeNumber(match[1])
  }

  const talentPointGain = parsePointGain(levelUpBlock, talentPointPattern, singleTalentPointGainPattern)
  const skillPointGain = parsePointGain(levelUpBlock, skillPointPattern, singleSkillPointGainPattern)
  const levelCount =
    talentPointGain !== null || skillPointGain !== null
      ? (talentPointGain ?? 0) + (skillPointGain ?? 0)
      : null

  return {
    index,
    totals,
    levelCount,
    totalLevel: (() => {
      const totalLevelMatch = levelUpBlock.match(totalLevelPattern)
      return totalLevelMatch ? parseWholeNumber(totalLevelMatch[1]) : null
    })(),
    inferredClass: inferClassFromLevelUpBlock(levelUpBlock),
  }
}

function getLevelUpBlocks(text: string): ParsedLevelUpBlock[] {
  levelUpPattern.lastIndex = 0
  const levelUpMatches = Array.from(text.matchAll(levelUpPattern))
  const blocks: ParsedLevelUpBlock[] = []

  for (let i = 0; i < levelUpMatches.length; i++) {
    const match = levelUpMatches[i]
    const startIndex = match.index ?? 0
    const endIndex = levelUpMatches[i + 1]?.index ?? text.length
    const levelUpBlock = text.slice(startIndex, endIndex)
    const parsedBlock = parseLevelUpBlock(levelUpBlock, startIndex)

    if (parsedBlock) {
      blocks.push(parsedBlock)
    }
  }

  return blocks
}

function getTotalLevelBeforeIndex(
  text: string,
  index: number,
  fallbackTotalLevel = 0,
): { totalLevel: number; foundSnapshot: boolean } {
  let totalLevel = Math.max(0, Math.floor(fallbackTotalLevel))
  let foundSnapshot = false
  totalLevelsSnapshotPattern.lastIndex = 0

  for (const match of text.matchAll(totalLevelsSnapshotPattern)) {
    const matchIndex = match.index ?? 0
    if (matchIndex >= index) {
      break
    }

    totalLevel = parseWholeNumber(match[1])
    foundSnapshot = true
  }

  return { totalLevel, foundSnapshot }
}

export function parseManualLevelTranscript(
  rawText: string,
  fallbackTotalLevel = 0,
): ParsedTranscriptResult {
  const text = rawText.replace(/\r\n?/g, "\n")
  const warnings: string[] = []
  const levelUpBlocks = getLevelUpBlocks(text)

  if (levelUpBlocks.length === 0) {
    return {
      ranges: [],
      warnings: ["No `Level Up!` blocks were found in the pasted text."],
    }
  }

  levelCommandPattern.lastIndex = 0
  const commands = Array.from(text.matchAll(levelCommandPattern)).map((match) => ({
    index: match.index ?? 0,
    className: match[1].toLowerCase() as ManualRangeClass,
    commandCount: match[2] ? parseWholeNumber(match[2]) : null,
  }))
  const firstAnchorIndex = Math.min(commands[0]?.index ?? Number.POSITIVE_INFINITY, levelUpBlocks[0].index)

  const { totalLevel: startingTotalLevel } = getTotalLevelBeforeIndex(
    text,
    Number.isFinite(firstAnchorIndex) ? firstAnchorIndex : levelUpBlocks[0].index,
    fallbackTotalLevel,
  )

  const ranges: ManualLevelRange[] = []
  let currentTotalLevel = startingTotalLevel
  let commandCursor = 0

  for (const parsedLevelUp of levelUpBlocks) {
    let command = null as null | { index: number; className: ManualRangeClass; commandCount: number | null }
    while (commandCursor < commands.length && commands[commandCursor].index < parsedLevelUp.index) {
      command = commands[commandCursor]
      commandCursor++
    }

    const className = command?.className ?? parsedLevelUp.inferredClass
    if (!className) {
      warnings.push("Skipped a Level Up block because its class could not be inferred from the pasted text.")
      continue
    }

    const commandCount = command?.commandCount ?? null

    if (parsedLevelUp.levelCount === null && commandCount === null) {
      warnings.push(`Skipped ${className}: the Level Up block did not include any parseable skill or talent point gains, and no command count was available.`)
      continue
    }

    const levelCount = parsedLevelUp.levelCount ?? commandCount ?? 0
    if (levelCount <= 0) {
      warnings.push(`Skipped ${className}: no positive level count could be derived from the Level Up points or command.`)
      continue
    }

    if (parsedLevelUp.levelCount === null && commandCount !== null) {
      warnings.push(`Used the command count for ${className} because the Level Up block did not include any parseable skill or talent point gains.`)
    } else if (commandCount !== null && commandCount !== parsedLevelUp.levelCount) {
      warnings.push(
        `Used ${parsedLevelUp.levelCount} levels for ${className} based on skill/talent point gains instead of the command count ${commandCount}.`,
      )
    }

    const endLevel = parsedLevelUp.totalLevel ?? (currentTotalLevel + levelCount)
    const startLevel = endLevel - levelCount + 1
    if (startLevel < 1 || endLevel < startLevel) {
      warnings.push(`Skipped ${className}: the derived total-level range ${startLevel}-${endLevel} is invalid.`)
      continue
    }

    ranges.push({
      className,
      startLevel,
      endLevel,
      ...parsedLevelUp.totals,
    })

    currentTotalLevel = endLevel
  }

  if (ranges.length === 0 && warnings.length === 0) {
    warnings.push("The pasted text did not produce any manual ranges.")
  }

  return { ranges, warnings }
}
