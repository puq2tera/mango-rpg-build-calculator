import rune_data from "@/app/data/rune_data"
import { runeword_data, script_recipes, type Runeword, type ScriptWord } from "@/app/data/script_data"
import type { StatNames } from "@/app/data/stat_data"

export type PlannerStatMap = Partial<Record<StatNames, number>>

export type PlannerStatsRange = {
  min: PlannerStatMap
  max: PlannerStatMap
  average: Record<string, number>
}

type PlannerEntryBase = {
  name: string
  description: string
  stats: PlannerStatsRange
}

export type PlannerScriptEntry = PlannerEntryBase & {
  kind: "script"
  recipe: string[]
  contributingRunewords: string[]
}

export type PlannerRunewordEntry = PlannerEntryBase & {
  kind: "runeword"
  componentWords: string[]
}

export type PlannerEffectSummaryRow = {
  stat: string
  min: number
  max: number
  average: number
}

export type PlannerRuneRequirement = {
  rune: string
  count: number
  tier: string
  description: string
}

type PlannerEntry = PlannerScriptEntry | PlannerRunewordEntry

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" })

function getAverageStats(minStats: PlannerStatMap, maxStats: PlannerStatMap): Record<string, number> {
  const averages: Record<string, number> = {}
  const statKeys = new Set<string>([
    ...Object.keys(minStats ?? {}),
    ...Object.keys(maxStats ?? {}),
  ])

  for (const stat of statKeys) {
    const minValue = minStats[stat as StatNames] ?? 0
    const maxValue = maxStats[stat as StatNames] ?? minValue
    averages[stat] = (minValue + maxValue) / 2
  }

  return averages
}

function buildStatsRange(data: ScriptWord | Runeword): PlannerStatsRange {
  return {
    min: data.min_stats,
    max: data.max_stats,
    average: getAverageStats(data.min_stats, data.max_stats),
  }
}

const runewordsByScriptName = Object.entries(runeword_data).reduce<Record<string, string[]>>((result, [name, data]) => {
  for (const scriptName of data.component_words) {
    if (!result[scriptName]) {
      result[scriptName] = []
    }
    result[scriptName].push(name)
  }

  return result
}, {})

for (const names of Object.values(runewordsByScriptName)) {
  names.sort(collator.compare)
}

export const plannerScriptsByName = Object.fromEntries(
  Object.entries(script_recipes).map(([name, data]) => [
    name,
    {
      kind: "script",
      name,
      description: data.description,
      recipe: data.recipe,
      contributingRunewords: runewordsByScriptName[name] ?? [],
      stats: buildStatsRange(data),
    } satisfies PlannerScriptEntry,
  ]),
) as Record<string, PlannerScriptEntry>

export const plannerRunewordsByName = Object.fromEntries(
  Object.entries(runeword_data).map(([name, data]) => [
    name,
    {
      kind: "runeword",
      name,
      description: data.description,
      componentWords: data.component_words,
      stats: buildStatsRange(data),
    } satisfies PlannerRunewordEntry,
  ]),
) as Record<string, PlannerRunewordEntry>

export const plannerScriptNames = Object.keys(plannerScriptsByName).sort(collator.compare)
export const plannerRunewordNames = Object.keys(plannerRunewordsByName).sort(collator.compare)
export const plannerScripts = plannerScriptNames.map((name) => plannerScriptsByName[name])
export const plannerRunewords = plannerRunewordNames.map((name) => plannerRunewordsByName[name])

export function getRunewordsForScript(scriptName: string): string[] {
  return runewordsByScriptName[scriptName] ?? []
}

export function getFormedRunewordNames(selectedScriptNames: Iterable<string>): string[] {
  const selected = new Set(selectedScriptNames)

  return plannerRunewordNames.filter((name) =>
    plannerRunewordsByName[name].componentWords.every((componentWord) => selected.has(componentWord)),
  )
}

export function getMissingScriptsForRuneword(runewordName: string, selectedScriptNames: Iterable<string>): string[] {
  const selected = new Set(selectedScriptNames)
  const runeword = plannerRunewordsByName[runewordName]

  if (!runeword) {
    return []
  }

  return runeword.componentWords.filter((componentWord) => !selected.has(componentWord))
}

export function getScriptCounts(selectedScriptNames: Iterable<string>): Record<string, number> {
  const counts: Record<string, number> = {}

  for (const name of selectedScriptNames) {
    if (!plannerScriptsByName[name]) continue
    counts[name] = (counts[name] ?? 0) + 1
  }

  return counts
}

export function getFormedRunewordCounts(scriptCounts: Readonly<Record<string, number>>): Record<string, number> {
  const counts: Record<string, number> = {}

  for (const runewordName of plannerRunewordNames) {
    const runeword = plannerRunewordsByName[runewordName]
    const formedCount = Math.min(...runeword.componentWords.map((componentWord) => scriptCounts[componentWord] ?? 0))

    if (formedCount > 0) {
      counts[runewordName] = formedCount
    }
  }

  return counts
}

function buildAverageStatTotalsForCounts<T extends Pick<PlannerEntry, "stats"> & { name: string }>(
  entriesByName: Readonly<Record<string, T>>,
  counts: Readonly<Record<string, number>>,
): Record<string, number> {
  const totals: Record<string, number> = {}

  for (const [name, count] of Object.entries(counts)) {
    if (!Number.isFinite(count) || count <= 0) continue

    const entry = entriesByName[name]
    if (!entry) continue

    for (const [stat, value] of Object.entries(entry.stats.average)) {
      totals[stat] = (totals[stat] ?? 0) + value * count
    }
  }

  return totals
}

export function buildAverageStatsForScriptCounts(scriptCounts: Readonly<Record<string, number>>): Record<string, number> {
  const runewordCounts = getFormedRunewordCounts(scriptCounts)
  const totals = buildAverageStatTotalsForCounts(plannerScriptsByName, scriptCounts)
  const runewordTotals = buildAverageStatTotalsForCounts(plannerRunewordsByName, runewordCounts)

  for (const [stat, value] of Object.entries(runewordTotals)) {
    totals[stat] = (totals[stat] ?? 0) + value
  }

  return totals
}

export function buildAverageStatTotals(entries: Iterable<Pick<PlannerEntry, "stats">>): Record<string, number> {
  const totals: Record<string, number> = {}

  for (const entry of entries) {
    for (const [stat, value] of Object.entries(entry.stats.average)) {
      totals[stat] = (totals[stat] ?? 0) + value
    }
  }

  return totals
}

export function buildEffectSummary(entries: Iterable<Pick<PlannerEntry, "stats">>): PlannerEffectSummaryRow[] {
  const totals = new Map<string, PlannerEffectSummaryRow>()

  for (const entry of entries) {
    const statKeys = new Set<string>([
      ...Object.keys(entry.stats.min),
      ...Object.keys(entry.stats.max),
      ...Object.keys(entry.stats.average),
    ])

    for (const stat of statKeys) {
      const current = totals.get(stat) ?? {
        stat,
        min: 0,
        max: 0,
        average: 0,
      }

      current.min += entry.stats.min[stat as StatNames] ?? 0
      current.max += entry.stats.max[stat as StatNames] ?? 0
      current.average += entry.stats.average[stat] ?? 0
      totals.set(stat, current)
    }
  }

  return Array.from(totals.values())
}

export function buildSelectionEntries(selectedScriptNames: Iterable<string>): {
  selectedScripts: PlannerScriptEntry[]
  formedRunewords: PlannerRunewordEntry[]
  effectSummary: PlannerEffectSummaryRow[]
  averageStats: Record<string, number>
} {
  const selected = new Set(selectedScriptNames)
  const selectedScripts = plannerScriptNames
    .filter((name) => selected.has(name))
    .map((name) => plannerScriptsByName[name])
  const formedRunewords = getFormedRunewordNames(selected)
    .map((name) => plannerRunewordsByName[name])
  const allEntries: PlannerEntry[] = [...selectedScripts, ...formedRunewords]

  return {
    selectedScripts,
    formedRunewords,
    effectSummary: buildEffectSummary(allEntries),
    averageStats: buildAverageStatTotals(allEntries),
  }
}

export function buildRuneRequirements(selectedScriptNames: Iterable<string>): PlannerRuneRequirement[] {
  const counts = new Map<string, number>()

  for (const scriptName of selectedScriptNames) {
    const script = plannerScriptsByName[scriptName]
    if (!script) continue

    for (const rune of script.recipe) {
      counts.set(rune, (counts.get(rune) ?? 0) + 1)
    }
  }

  return Array.from(counts.entries()).map(([rune, count]) => ({
    rune,
    count,
    tier: rune_data[rune]?.tier ?? "Unknown",
    description: rune_data[rune]?.description ?? "",
  }))
}
