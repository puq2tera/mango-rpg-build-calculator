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
  scalingGain: number
}

export type ManualRangeLevels = Record<ManualRangeClass, number>
export type ManualRangeStatKey = "hpGain" | "atkGain" | "defGain" | "matkGain" | "healGain" | "scalingGain"

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

const gainPatterns: Record<Exclude<ManualRangeStatKey, "scalingGain">, RegExp> = {
  hpGain: /\+HP\s*([+-]?\d[\d,]*(?:\.\d+)?)/i,
  atkGain: /\+ATK\s*([+-]?\d[\d,]*(?:\.\d+)?)/i,
  defGain: /\+DEF\s*([+-]?\d[\d,]*(?:\.\d+)?)/i,
  matkGain: /\+MATK\s*([+-]?\d[\d,]*(?:\.\d+)?)/i,
  healGain: /\+Healpower\s*([+-]?\d[\d,]*(?:\.\d+)?)/i,
}
const gainLabelPatterns: Record<Exclude<ManualRangeStatKey, "scalingGain">, RegExp> = {
  hpGain: /^\+HP\b/i,
  atkGain: /^\+ATK\b/i,
  defGain: /^\+DEF\b/i,
  matkGain: /^\+MATK\b/i,
  healGain: /^\+Healpower\b/i,
}
const scalingPatterns: Record<ManualRangeClass, RegExp> = {
  tank: /Acquired\s*\+([+-]?\d[\d,]*(?:\.\d+)?)\s*Armor Save/i,
  warrior: /Acquired\s*\+([+-]?\d[\d,]*(?:\.\d+)?)%\s*Overdrive Scaling/i,
  caster: /Acquired\s*\+([+-]?\d[\d,]*(?:\.\d+)?)%\s*Crit Damage/i,
  healer: /Acquired\s*\+([+-]?\d[\d,]*(?:\.\d+)?)\s*Armor Strike/i,
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

function getMeaningfulLines(text: string): string[] {
  return text
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
}

function findNumericValueNearLabel(
  lines: readonly string[],
  labelPattern: RegExp,
): number | null {
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    if (!labelPattern.test(line)) {
      continue
    }

    const inlineMatch = line.match(/([+-]?\d[\d,]*(?:\.\d+)?)/)
    if (inlineMatch) {
      return parseWholeNumber(inlineMatch[1])
    }

    for (let cursor = index + 1; cursor < Math.min(lines.length, index + 4); cursor += 1) {
      const candidate = lines[cursor]
      if (/^image$/i.test(candidate)) {
        continue
      }

      const numericMatch = candidate.match(/([+-]?\d[\d,]*(?:\.\d+)?)/)
      if (numericMatch) {
        return parseWholeNumber(numericMatch[1])
      }

      break
    }
  }

  return null
}

function parsePointGain(
  levelUpBlock: string,
  lines: readonly string[],
  pointPattern: RegExp,
  labelPattern: RegExp,
  singlePointGainPattern: RegExp,
): number | null {
  const match = levelUpBlock.match(pointPattern)
  if (match) {
    return parseWholeNumber(match[1])
  }

  const multilineValue = findNumericValueNearLabel(lines, labelPattern)
  if (multilineValue !== null) {
    return multilineValue
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

function inferClassFromMainStatTotals(totals: ParsedGainTotals): ManualRangeClass | null {
  const candidates: Array<{ className: ManualRangeClass; value: number }> = [
    { className: "warrior", value: totals.atkGain },
    { className: "tank", value: totals.defGain },
    { className: "caster", value: totals.matkGain },
    { className: "healer", value: totals.healGain },
  ]

  const highestValue = Math.max(...candidates.map(({ value }) => value))
  if (highestValue <= 0) {
    return null
  }

  const highestCandidates = candidates.filter(({ value }) => value === highestValue)
  return highestCandidates.length === 1 ? highestCandidates[0].className : null
}

function parseScalingGain(levelUpBlock: string, className: ManualRangeClass | null): number {
  if (!className) {
    return 0
  }

  const match = levelUpBlock.match(scalingPatterns[className])
  return match ? parseWholeNumber(match[1]) : 0
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
    scalingGain: 0,
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
    scalingGain: asFiniteNumber(entry.scalingGain, 0),
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
  const lines = getMeaningfulLines(levelUpBlock)
  const totals = {} as ParsedGainTotals

  for (const [key, pattern] of Object.entries(gainPatterns) as Array<[Exclude<ManualRangeStatKey, "scalingGain">, RegExp]>) {
    const match = levelUpBlock.match(pattern)
    const multilineValue = match ? null : findNumericValueNearLabel(lines, gainLabelPatterns[key])

    if (!match && multilineValue === null) {
      return null
    }

    totals[key] = match ? parseWholeNumber(match[1]) : multilineValue ?? 0
  }

  const inferredClass = inferClassFromLevelUpBlock(levelUpBlock) ?? inferClassFromMainStatTotals(totals)
  totals.scalingGain = parseScalingGain(levelUpBlock, inferredClass)

  const talentPointGain = parsePointGain(
    levelUpBlock,
    lines,
    talentPointPattern,
    /talent points?/i,
    singleTalentPointGainPattern,
  )
  const skillPointGain = parsePointGain(
    levelUpBlock,
    lines,
    skillPointPattern,
    /skill points?/i,
    singleSkillPointGainPattern,
  )
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
      if (totalLevelMatch) {
        return parseWholeNumber(totalLevelMatch[1])
      }

      return findNumericValueNearLabel(lines, /total level/i)
    })(),
    inferredClass,
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

    const levelCount = commandCount ?? parsedLevelUp.levelCount ?? 0
    if (levelCount <= 0) {
      warnings.push(`Skipped ${className}: no positive level count could be derived from the Level Up points or command.`)
      continue
    }

    if (commandCount !== null && parsedLevelUp.levelCount === null) {
      warnings.push(`Used the command count for ${className} because the Level Up block did not include any parseable skill or talent point gains.`)
    } else if (commandCount !== null && commandCount !== parsedLevelUp.levelCount) {
      warnings.push(
        `Used the command count ${commandCount} for ${className} instead of the Level Up block's parsed point total ${parsedLevelUp.levelCount}.`,
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
