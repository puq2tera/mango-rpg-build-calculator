"use client"

export type ComparableValue = {
  display: string
  normalized: string
  numericParts: number[]
}

export type ParsedLabelValueRow = {
  label: string
  value: ComparableValue
}

export type ParsedTerminalMainRow = {
  label: string
  value: ComparableValue
  modifier?: ComparableValue
}

export type ParsedTerminalDetailRow = {
  label: string
  value: ComparableValue
}

export type ParsedTypeBonusRow = {
  label: string
  dmg: ComparableValue
  xDmg: ComparableValue
  pen: ComparableValue
  xPen: ComparableValue
}

export type ParsedElementRow = {
  label: string
  dmg: ComparableValue
  res: ComparableValue
  pen: ComparableValue
}

export type ParsedTerminalCard = {
  mainRows: ParsedTerminalMainRow[]
  detailRows: ParsedTerminalDetailRow[]
  typeRows: ParsedTypeBonusRow[]
  elementRows: ParsedElementRow[]
}

export type ParsedBuffEffect = {
  display: string
  statKey: string | null
  normalizedKey: string
  value: number | null
}

export type ParsedBuff = {
  name: string
  normalizedName: string
  effects: ParsedBuffEffect[]
}

export type ParsedSkillMatchMetric = "dmg" | "threat"

export type ParsedSkillMatchRow = {
  sourceLine: string
  skillLabel: string
  metric: ParsedSkillMatchMetric
  realValue: number
}

export type ComparedValue = {
  status: "match" | "different" | "missing-calc" | "missing-game"
  delta?: string
}

const numberPattern = /[+-]?\d[\d,]*(?:\.\d+)?/g

const guildFieldMatchers = [
  { label: "Race", matchers: ["race"] },
  { label: "Total Levels", matchers: ["total levels"] },
  { label: "T/W/C/H Levels", matchers: ["t w c h levels"] },
  { label: "Health", matchers: ["health"] },
  { label: "Mana", matchers: ["mana"] },
  { label: "ATK", matchers: ["atk"] },
  { label: "DEF", matchers: ["def"] },
  { label: "MATK", matchers: ["matk"] },
  { label: "Healpower", matchers: ["healpower", "heal power"] },
  { label: "Skill/Talent Points", matchers: ["skill talent points"] },
  { label: "Rebirth LvL", matchers: ["rebirth lvl", "rebirth level"] },
] as const

const mainRowLabelMap = new Map<string, string>([
  ["health", "Health"],
  ["mana", "Mana"],
  ["focus", "Focus"],
  ["matk", "MATK"],
  ["atk", "ATK"],
  ["def", "DEF"],
  ["healpower", "HEAL"],
  ["heal", "HEAL"],
])

const detailLabelMap = new Map<string, string>([
  ["crit chance damage", "Crit Chance/Damage"],
  ["overdrive scaling", "Overdrive Scaling"],
  ["hp regen rate", "HP Regen/Rate"],
  ["mp focus regen", "MP/Focus Regen"],
  ["global damage", "Global Damage"],
  ["all resist", "All Resist"],
  ["threat modifier", "Threat Modifier"],
])

const typeLabelMap = new Map<string, string>([
  ["phys", "PHYS"],
  ["ele", "ELE"],
  ["div", "DIV"],
  ["void", "VOID"],
])

const elementLabelMap = new Map<string, string>([
  ["fire", "Fire"],
  ["lightning", "Lightning"],
  ["water", "Water"],
  ["earth", "Earth"],
  ["wind", "Wind"],
  ["toxic", "Toxic"],
  ["void", "Void"],
  ["negative", "Negative"],
  ["holy", "Holy"],
  ["blunt", "Blunt"],
  ["pierce", "Pierce"],
  ["slash", "Slash"],
])

const buffEffectAliases = new Map<string, string>([
  ["atk", "ATK"],
  ["def", "DEF"],
  ["matk", "MATK"],
  ["heal", "HEAL"],
  ["healpower", "HEAL"],
  ["health", "HP"],
  ["hp", "HP"],
  ["mana", "MP"],
  ["mp", "MP"],
  ["focus", "Focus"],
  ["critchance", "Crit Chance%"],
  ["critdamage", "Crit DMG%"],
  ["globaldamage", "Dmg%"],
  ["damage", "Dmg%"],
  ["allres", "All Res%"],
  ["allresist", "All Res%"],
  ["threatbonus", "Threat%"],
  ["threatmodifier", "Threat%"],
  ["threat", "Threat%"],
  ["elebow", "Bow%"],
  ["bowdmg", "Bow DMG%"],
  ["bowdamage", "Bow DMG%"],
  ["physicaldmg", "Phys%"],
  ["elementaldmg", "Elemental%"],
  ["divinedmg", "Divine%"],
  ["voiddmg", "Void%"],
  ["bluntdmg", "Blunt%"],
  ["piercedmg", "Pierce%"],
  ["slashdmg", "Slash%"],
  ["firedmg", "Fire%"],
  ["lightningdmg", "Lightning%"],
  ["waterdmg", "Water%"],
  ["earthdmg", "Earth%"],
  ["winddmg", "Wind%"],
  ["toxicdmg", "Toxic%"],
  ["negativedmg", "Neg%"],
  ["holydmg", "Holy%"],
  ["firepen", "Fire Pen%"],
  ["lightningpen", "Lightning Pen%"],
  ["waterpen", "Water Pen%"],
  ["earthpen", "Earth Pen%"],
  ["windpen", "Wind Pen%"],
  ["toxicpen", "Toxic Pen%"],
  ["bluntpen", "Blunt Pen%"],
  ["piercepen", "Pierce Pen%"],
  ["slashpen", "Slash Pen%"],
])

const skillMatchValuePattern = /(?:\b(expect(?:ed)?|real)\b\s*[:=]?\s*)?([+-]?\d[\d,]*(?:\.\d+)?)\s*(dmg|damage|threat)\b/ig

function cleanInput(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\u3164/g, " ")
}

function getMeaningfulLines(text: string): string[] {
  return cleanInput(text)
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
}

function normalizeLookupText(value: string): string {
  return value
    .toLowerCase()
    .replace(/\*|_/g, " ")
    .replace(/[^\p{L}\p{N}%]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function normalizeDenseText(value: string): string {
  return normalizeLookupText(value).replace(/[ %/]/g, "")
}

function extractNumbers(value: string): number[] {
  const matches = value.match(numberPattern)

  if (!matches) {
    return []
  }

  return matches
    .map((match) => Number(match.replace(/,/g, "")))
    .filter((entry) => Number.isFinite(entry))
}

export function createComparableValue(display: string): ComparableValue {
  return {
    display: display.trim(),
    normalized: normalizeDenseText(display),
    numericParts: extractNumbers(display),
  }
}

function formatDeltaNumber(value: number): string {
  if (!Number.isFinite(value)) {
    return "0"
  }

  if (Math.abs(value - Math.round(value)) < 0.0001) {
    return Math.round(value).toLocaleString("en-US")
  }

  return value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 6,
  })
}

function areNumericPartsEqual(left: number[], right: number[]): boolean {
  if (left.length === 0 || right.length === 0 || left.length !== right.length) {
    return false
  }

  return left.every((value, index) => Math.abs(value - right[index]) < 0.0001)
}

export function compareComparableValues(calc?: ComparableValue, inGame?: ComparableValue): ComparedValue {
  if (!calc && !inGame) {
    return { status: "match" }
  }

  if (!calc) {
    return { status: "missing-calc" }
  }

  if (!inGame) {
    return { status: "missing-game" }
  }

  if (areNumericPartsEqual(calc.numericParts, inGame.numericParts)) {
    return {
      status: "match",
      delta: calc.numericParts.length === 1 ? "0" : "0 / 0",
    }
  }

  if (calc.numericParts.length === 1 && inGame.numericParts.length === 1) {
    const delta = inGame.numericParts[0] - calc.numericParts[0]
    return {
      status: Math.abs(delta) < 0.0001 ? "match" : "different",
      delta: `${delta >= 0 ? "+" : "-"}${formatDeltaNumber(Math.abs(delta))}`,
    }
  }

  if (calc.numericParts.length > 1 && calc.numericParts.length === inGame.numericParts.length) {
    const deltas = calc.numericParts.map((value, index) => {
      const delta = inGame.numericParts[index] - value
      return `${delta >= 0 ? "+" : "-"}${formatDeltaNumber(Math.abs(delta))}`
    })

    return {
      status: "different",
      delta: deltas.join(" / "),
    }
  }

  return {
    status: calc.normalized === inGame.normalized ? "match" : "different",
  }
}

function lineContainsMatcher(normalizedLine: string, matcher: string): boolean {
  const lineTokens = normalizedLine.split(" ")
  const matcherTokens = matcher.split(" ")

  for (let index = 0; index <= lineTokens.length - matcherTokens.length; index += 1) {
    const isMatch = matcherTokens.every((token, matcherIndex) => lineTokens[index + matcherIndex] === token)

    if (isMatch) {
      return true
    }
  }

  return false
}

function getNextValueLine(lines: string[], startIndex: number): string | null {
  for (let index = startIndex + 1; index < lines.length; index += 1) {
    const normalized = normalizeLookupText(lines[index])

    if (normalized === "image" || normalized === "guild card") {
      continue
    }

    return lines[index]
  }

  return null
}

export function parseGuildCard(text: string): ParsedLabelValueRow[] {
  const lines = getMeaningfulLines(text)
  const rows: ParsedLabelValueRow[] = []

  for (const field of guildFieldMatchers) {
    let valueLine: string | null = null

    for (let index = 0; index < lines.length; index += 1) {
      const normalizedLine = normalizeLookupText(lines[index])

      if (field.matchers.some((matcher) => lineContainsMatcher(normalizedLine, matcher))) {
        valueLine = getNextValueLine(lines, index)
        break
      }
    }

    if (!valueLine) {
      continue
    }

    rows.push({
      label: field.label,
      value: createComparableValue(valueLine),
    })
  }

  return rows
}

function getCanonicalMainLabel(line: string): string | null {
  const normalized = normalizeLookupText(line)

  for (const [matcher, label] of mainRowLabelMap) {
    if (lineContainsMatcher(normalized, matcher)) {
      return label
    }
  }

  return null
}

function getCanonicalDetailLabel(line: string): string | null {
  const normalized = normalizeLookupText(line)

  for (const [matcher, label] of detailLabelMap) {
    if (lineContainsMatcher(normalized, matcher)) {
      return label
    }
  }

  return null
}

function getCanonicalTypeLabel(line: string): string | null {
  const normalized = normalizeLookupText(line)

  for (const [matcher, label] of typeLabelMap) {
    if (lineContainsMatcher(normalized, matcher)) {
      return label
    }
  }

  return null
}

function getCanonicalElementLabel(line: string): string | null {
  const normalized = normalizeLookupText(line)

  for (const [matcher, label] of elementLabelMap) {
    if (lineContainsMatcher(normalized, matcher)) {
      return label
    }
  }

  return null
}

function extractComparableFromMatch(match: string | undefined): ComparableValue | undefined {
  if (!match) {
    return undefined
  }

  return createComparableValue(match)
}

function parseMainRow(line: string): ParsedTerminalMainRow | null {
  const label = getCanonicalMainLabel(line)

  if (!label) {
    return null
  }

  const segments = line.split("|").map((segment) => segment.trim()).filter((segment) => segment.length > 0)
  const leftNumbers = segments[0]?.match(numberPattern) ?? []

  if (label === "Health") {
    if (leftNumbers.length < 2) {
      return null
    }

    return {
      label,
      value: createComparableValue(`${leftNumbers[0]} / ${leftNumbers[1]}`),
    }
  }

  if (label === "Mana" || label === "Focus") {
    if (leftNumbers.length === 0) {
      return null
    }

    if (leftNumbers.length >= 2) {
      const [currentValue, maxValue] = leftNumbers

      return {
        label,
        value: createComparableValue(`${currentValue} / ${maxValue}`),
      }
    }

    const value = leftNumbers[0]

    if (!value) {
      return null
    }

    return {
      label,
      value: createComparableValue(value),
    }
  }

  if (leftNumbers.length === 0) {
    return null
  }

  const primaryValue = leftNumbers[0]

  if (!primaryValue) {
    return null
  }

  return {
    label,
    value: createComparableValue(primaryValue),
    modifier: extractComparableFromMatch(segments[1]?.match(/[+-]?\d[\d,]*(?:\.\d+)?%?/)?.[0]),
  }
}

function parseDetailRows(line: string): ParsedTerminalDetailRow[] {
  const normalized = normalizeLookupText(line)
  const value = line.includes("|") ? line.split("|").slice(1).join("|").trim() : ""

  if (value.length === 0) {
    return []
  }

  if (normalized.includes("exp scaling bonus")) {
    return []
  }

  const label = getCanonicalDetailLabel(line)

  if (!label) {
    return []
  }

  return [{ label, value: createComparableValue(value) }]
}

function parseTypeRow(line: string): ParsedTypeBonusRow | null {
  const segments = line.split("|").map((segment) => segment.trim()).filter((segment) => segment.length > 0)

  if (segments.length < 5) {
    return null
  }

  const label = getCanonicalTypeLabel(segments[0])

  if (!label) {
    return null
  }

  return {
    label,
    dmg: createComparableValue(segments[1]),
    xDmg: createComparableValue(segments[2]),
    pen: createComparableValue(segments[3]),
    xPen: createComparableValue(segments[4]),
  }
}

function parseElementRow(line: string): ParsedElementRow | null {
  const segments = line.split("|").map((segment) => segment.trim()).filter((segment) => segment.length > 0)

  if (segments.length < 4) {
    return null
  }

  const label = getCanonicalElementLabel(segments[0])

  if (!label) {
    return null
  }

  return {
    label,
    dmg: createComparableValue(segments[1]),
    res: createComparableValue(segments[2]),
    pen: createComparableValue(segments[3]),
  }
}

export function parseTerminalCard(text: string): ParsedTerminalCard {
  const lines = getMeaningfulLines(text)
  const typeHeaderIndex = lines.findIndex((line) => normalizeLookupText(line).includes("dmg type bonuses"))
  const elementHeaderIndex = lines.findIndex((line) => normalizeLookupText(line).includes("elements table"))

  const beforeType = lines.slice(0, typeHeaderIndex >= 0 ? typeHeaderIndex : lines.length)
  const typeLines = typeHeaderIndex >= 0
    ? lines.slice(typeHeaderIndex + 1, elementHeaderIndex >= 0 ? elementHeaderIndex : lines.length)
    : []
  const elementLines = elementHeaderIndex >= 0 ? lines.slice(elementHeaderIndex + 1) : []

  const mainRows: ParsedTerminalMainRow[] = []
  const detailRows: ParsedTerminalDetailRow[] = []
  const typeRows: ParsedTypeBonusRow[] = []
  const elementRows: ParsedElementRow[] = []

  for (const line of beforeType) {
    const normalized = normalizeLookupText(line)
    if (normalized === "type dmg xdmg pen xpen" || normalized === "type dmg res pen") {
      continue
    }

    const mainRow = parseMainRow(line)
    if (mainRow) {
      mainRows.push(mainRow)
      continue
    }

    detailRows.push(...parseDetailRows(line))
  }

  for (const line of typeLines) {
    const row = parseTypeRow(line)
    if (row) {
      typeRows.push(row)
    }
  }

  for (const line of elementLines) {
    const row = parseElementRow(line)
    if (row) {
      elementRows.push(row)
    }
  }

  return {
    mainRows,
    detailRows,
    typeRows,
    elementRows,
  }
}

export function parseConversions(text: string): ParsedLabelValueRow[] {
  const lines = getMeaningfulLines(text)
  const rows: ParsedLabelValueRow[] = []

  for (let index = 0; index < lines.length; index += 1) {
    const currentLine = lines[index]
    const normalizedCurrentLine = normalizeLookupText(currentLine)

    if (normalizedCurrentLine.includes("my conversions")) {
      continue
    }

    if (!currentLine.includes(":") || currentLine.includes("⇒") || currentLine.includes("=>")) {
      continue
    }

    const sourceLabel = currentLine
      .split(":", 2)[0]
      .replace(/^[^\p{L}\p{N}]+/gu, "")
      .trim()

    if (sourceLabel.length === 0 || normalizedCurrentLine.includes("conversions")) {
      continue
    }

    const groupedLines = [currentLine]

    for (let nextIndex = index + 1; nextIndex < lines.length; nextIndex += 1) {
      const nextLine = lines[nextIndex]
      const normalizedNextLine = normalizeLookupText(nextLine)

      if (normalizedNextLine.includes("my conversions")) {
        continue
      }

      if (nextLine.includes("⇒") || nextLine.includes("=>")) {
        groupedLines.push(nextLine.replace(/=>/g, "⇒"))
        index = nextIndex
        continue
      }

      break
    }

    rows.push({
      label: sourceLabel,
      value: createComparableValue(groupedLines.join(" | ")),
    })
  }

  return rows
}

function parseBuffEffect(effectText: string): ParsedBuffEffect {
  const cleaned = effectText.trim()
  const match = cleaned.match(/[+-]?\d[\d,]*(?:\.\d+)?/)
  const value = match ? Number(match[0].replace(/,/g, "")) : null
  const trailingLabel = match ? cleaned.slice(match.index! + match[0].length).trim() : cleaned
  const normalizedKey = normalizeDenseText(trailingLabel)

  return {
    display: cleaned,
    statKey: buffEffectAliases.get(normalizedKey) ?? null,
    normalizedKey,
    value,
  }
}

export function getBuffEffectSignature(effect: ParsedBuffEffect): string {
  if (effect.statKey && effect.value !== null) {
    return `${effect.statKey}:${effect.value}`
  }

  if (effect.value !== null) {
    return `${effect.normalizedKey}:${effect.value}`
  }

  return effect.normalizedKey
}

export function parseBuffs(text: string): ParsedBuff[] {
  const lines = getMeaningfulLines(text)
  const buffs: ParsedBuff[] = []
  let currentBuff: ParsedBuff | null = null

  for (const line of lines) {
    const normalized = normalizeLookupText(line)

    if (
      normalized.includes("skill buffs debuffs")
      || normalized === "image"
      || normalized.startsWith("battle turn timer")
      || normalized.includes("turns")
    ) {
      continue
    }

    const colonIndex = line.indexOf(":")

    if (colonIndex === -1) {
      continue
    }

    const rawName = line.slice(0, colonIndex).replace(/^[^\p{L}\p{N}@]+/gu, "").trim()
    const rawEffect = line.slice(colonIndex + 1).trim()
    const normalizedName = normalizeLookupText(rawName)

    if (normalizedName === "side effect") {
      if (currentBuff && rawEffect.length > 0) {
        currentBuff.effects.push(parseBuffEffect(rawEffect))
      }
      continue
    }

    if (normalizedName.length === 0 || normalizedName.includes("skill buffs debuffs")) {
      continue
    }

    currentBuff = {
      name: rawName,
      normalizedName,
      effects: rawEffect.length > 0 ? [parseBuffEffect(rawEffect)] : [],
    }
    buffs.push(currentBuff)
  }

  return buffs
}

function normalizeSkillMatchMetric(value: string): ParsedSkillMatchMetric {
  return value.toLowerCase() === "threat" ? "threat" : "dmg"
}

export function parseSkillMatches(text: string): ParsedSkillMatchRow[] {
  const lines = getMeaningfulLines(text)
  const rows: ParsedSkillMatchRow[] = []

  for (const line of lines) {
    const valueMatches = Array.from(line.matchAll(skillMatchValuePattern))
      .map((match) => ({
        kind: match[1]?.toLowerCase() ?? null,
        realValue: Number(match[2].replace(/,/g, "")),
        metric: normalizeSkillMatchMetric(match[3]),
        index: match.index ?? -1,
      }))
      .filter((match) => match.index >= 0 && Number.isFinite(match.realValue))

    if (valueMatches.length === 0) {
      continue
    }

    const realMatches = valueMatches.filter((match) => match.kind === "real")
    const effectiveMatches = realMatches.length > 0
      ? realMatches
      : valueMatches.filter((match) => match.kind !== "expect" && match.kind !== "expected")

    if (effectiveMatches.length === 0) {
      continue
    }

    const cutoffCandidates = [
      line.search(/\bexpect(?:ed)?\b/i),
      line.search(/\breal\b/i),
      valueMatches[0]?.index ?? -1,
    ].filter((index) => index >= 0)
    const cutoff = cutoffCandidates.length > 0 ? Math.min(...cutoffCandidates) : line.length
    const skillLabel = line
      .slice(0, cutoff)
      .replace(/^[^\p{L}\p{N}@]+/gu, "")
      .replace(/[,:-]+\s*$/u, "")
      .trim()

    if (skillLabel.length === 0) {
      continue
    }

    for (const match of effectiveMatches) {
      rows.push({
        sourceLine: line,
        skillLabel,
        metric: match.metric,
        realValue: match.realValue,
      })
    }
  }

  return rows
}
