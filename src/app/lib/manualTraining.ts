import {
  createDefaultMainStatValues,
  type MainStatKey,
  type MainStatValues,
} from "@/app/lib/mainStatPoints"

export const MANUAL_TRAINING_SECTION_ID = "manual-training"

export type ManualTrainingEntry = {
  stat: MainStatKey
  trainingPoints: number | null
  reportedGain: number
}

type ManualTrainingParseResult = {
  entries: ManualTrainingEntry[]
  warnings: string[]
}

const trainingTokenToStat: Record<string, MainStatKey> = {
  atk: "ATK",
  def: "DEF",
  matk: "MATK",
  heal: "HEAL",
}

const statToTrainingToken: Record<MainStatKey, string> = {
  ATK: "atk",
  DEF: "def",
  MATK: "matk",
  HEAL: "heal",
}

const trainingCommandPattern = /\bxtraining\s+(atk|def|matk|heal)(?:\s+([0-9,]+))?\b/gi
const trainingResultPattern = /\[\s*(atk|def|matk|heal)\s*\]\s*Training\s*[\s\S]*?([+-]?\d[\d,]*(?:\.\d+)?)/i

function asFiniteNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback
}

function parseWholeNumber(raw: string): number {
  const normalized = Number(raw.replaceAll(",", ""))
  return Number.isFinite(normalized) ? Math.max(0, Math.floor(normalized)) : 0
}

function isMainStatKey(value: string): value is MainStatKey {
  return value in statToTrainingToken
}

export function createDefaultManualTrainingEntry(): ManualTrainingEntry {
  return {
    stat: "ATK",
    trainingPoints: null,
    reportedGain: 0,
  }
}

export function normalizeManualTrainingEntry(raw: unknown): ManualTrainingEntry | null {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return null
  }

  const entry = raw as Partial<ManualTrainingEntry>
  if (!isMainStatKey(entry.stat ?? "")) {
    return null
  }

  const stat = entry.stat as MainStatKey

  return {
    stat,
    trainingPoints:
      typeof entry.trainingPoints === "number" && Number.isFinite(entry.trainingPoints)
        ? Math.max(0, Math.floor(entry.trainingPoints))
        : null,
    reportedGain: Math.max(0, Math.floor(asFiniteNumber(entry.reportedGain, 0))),
  }
}

export function normalizeManualTrainingEntries(raw: unknown): ManualTrainingEntry[] {
  if (!Array.isArray(raw)) {
    return []
  }

  return raw
    .map((entry) => normalizeManualTrainingEntry(entry))
    .filter((entry): entry is ManualTrainingEntry => entry !== null)
}

export function getManualTrainingToken(stat: MainStatKey): string {
  return statToTrainingToken[stat]
}

export function inferTrainingPointsFromGain(reportedGain: number): number {
  const normalizedGain = Math.max(0, Math.floor(reportedGain))
  return Math.max(0, Math.round((normalizedGain - 1) / 4))
}

export function getManualTrainingEffectivePoints(entry: ManualTrainingEntry): number {
  if (entry.trainingPoints !== null) {
    return Math.max(0, Math.floor(entry.trainingPoints))
  }

  return inferTrainingPointsFromGain(entry.reportedGain)
}

export function getEffectiveTrainingTotalsFromEntries(entries: readonly ManualTrainingEntry[]): MainStatValues {
  const totals = createDefaultMainStatValues()

  for (const entry of entries) {
    const effectivePoints = getManualTrainingEffectivePoints(entry)

    if (entry.trainingPoints === null) {
      totals[entry.stat] = effectivePoints
      continue
    }

    totals[entry.stat] += effectivePoints
  }

  return totals
}

export function parseManualTrainingTranscript(rawText: string): ManualTrainingParseResult {
  const text = rawText.replace(/\r\n?/g, "\n")
  const warnings: string[] = []

  trainingCommandPattern.lastIndex = 0
  const commands = Array.from(text.matchAll(trainingCommandPattern))

  if (commands.length === 0) {
    return {
      entries: [],
      warnings: ["No `xtraining` commands were found in the pasted text."],
    }
  }

  const entries: ManualTrainingEntry[] = []

  for (let index = 0; index < commands.length; index++) {
    const command = commands[index]
    const commandToken = command[1]?.toLowerCase()
    const stat = commandToken ? trainingTokenToStat[commandToken] : null
    if (!stat) {
      warnings.push("Skipped a training block because its stat could not be read from the command.")
      continue
    }

    const trainingPoints = command[2] ? parseWholeNumber(command[2]) : null
    const startIndex = command.index ?? 0
    const endIndex = commands[index + 1]?.index ?? text.length
    const block = text.slice(startIndex, endIndex)
    const resultMatch = block.match(trainingResultPattern)

    if (!resultMatch) {
      warnings.push(`Skipped ${getManualTrainingToken(stat)}: the pasted block did not include a parseable training result.`)
      continue
    }

    const resultToken = resultMatch[1]?.toLowerCase()
    const resultStat = resultToken ? trainingTokenToStat[resultToken] : null
    const resolvedStat = resultStat ?? stat

    if (resultStat && resultStat !== stat) {
      warnings.push(
        `Imported ${getManualTrainingToken(resolvedStat)} using the result block instead of the command because the pasted stat labels disagreed.`,
      )
    }

    const reportedGain = parseWholeNumber(resultMatch[2])
    entries.push({
      stat: resolvedStat,
      trainingPoints,
      reportedGain,
    })

    if (trainingPoints !== null) {
      const inferredPoints = inferTrainingPointsFromGain(reportedGain)

      if (inferredPoints !== trainingPoints) {
        warnings.push(
          `Imported ${getManualTrainingToken(resolvedStat)} with ${trainingPoints} requested training, but the reported total +${reportedGain} maps to ${inferredPoints}.`,
        )
      }
    }
  }

  if (entries.length === 0 && warnings.length === 0) {
    warnings.push("The pasted text did not produce any manual training rows.")
  }

  return {
    entries,
    warnings,
  }
}
