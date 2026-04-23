import stat_data from "@/app/data/stat_data"
import { skill_data } from "@/app/data/skill_data"
import { talent_data } from "@/app/data/talent_data"
import tarot_data from "@/app/data/tarot_data"
import type { BuildSnapshot, BuildStatStages } from "@/app/lib/buildStats"
import { truncateTowardZero } from "@/app/lib/statRounding"

export type TalentConversionBreakdown = {
  sourceName: string
  ratio: number
  amount: number
}

export type TalentConversionRow = {
  id: string
  sourceName: string
  sourceStat: string
  sourceValue: number
  ratio: number
  resultingStat: string
  amount: number
  order: number
  breakdown: TalentConversionBreakdown[]
}

export type TalentConversionGroup = {
  id: string
  sourceStat: string
  sourceValue: number
  rows: TalentConversionRow[]
  order: number
}

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
}

const directInGameTokenByStat: Record<string, string> = {
  ATK: "atk",
  DEF: "def",
  MATK: "matk",
  HEAL: "healpower",
  HP: "HP",
  MP: "MP",
  Focus: "focus",
  "Temp HP": "tempHP",
  "Temp MP": "tempMP",
  "ATK%": "atkmulti",
  "DEF%": "defmulti",
  "MATK%": "matkmulti",
  "HEAL%": "healmulti",
  "Crit Chance%": "critChance",
  "Crit DMG%": "critDamage",
  "HP Regen": "hpRegen",
  "HP Regen%": "hpregenrate",
  "MP Regen": "mpRegen",
  "Focus Regen": "focusRegen",
  "Dmg%": "dmgmultiadd",
  "All%": "eleglobal",
  "All Res%": "allres",
  "Threat%": "threatbonus",
  "Fire%": "elefire",
  "Water%": "elewater",
  "Lightning%": "elelightning",
  "Wind%": "elewind",
  "Earth%": "eleearth",
  "Toxic%": "eletoxic",
  "Slash%": "eleslash",
  "Pierce%": "elepierce",
  "Blunt%": "eleblunt",
  "Neg%": "elenegative",
  "Holy%": "eleholy",
  "Void%": "elevoid",
  "Fire Pen%": "penfire",
  "Water Pen%": "penwater",
  "Lightning Pen%": "penlightning",
  "Wind Pen%": "penwind",
  "Earth Pen%": "penearth",
  "Toxic Pen%": "pentoxic",
  "Slash Pen%": "penslash",
  "Pierce Pen%": "penpierce",
  "Blunt Pen%": "penblunt",
  "Neg Pen%": "pennegative",
  "Holy Pen%": "penholy",
  "Void Pen%": "penvoid",
  "Fire Res%": "resfire",
  "Water Res%": "reswater",
  "Lightning Res%": "reslightning",
  "Wind Res%": "reswind",
  "Earth Res%": "researth",
  "Toxic Res%": "restoxic",
  "Slash Res%": "resslash",
  "Pierce Res%": "respierce",
  "Blunt Res%": "resblunt",
  "Neg Res%": "resnegative",
  "Holy Res%": "resholy",
  "Void Res%": "resvoid",
}

const compoundOutputOrderOverrides: Record<string, string[]> = {
  "POWER": ["ATK", "DEF", "MATK", "HEAL"],
  "MAIN%": ["ATK%", "DEF%", "MATK%", "HEAL%"],
  "Phys%": ["Slash%", "Blunt%", "Pierce%"],
  "Phys Pen%": ["Slash Pen%", "Blunt Pen%", "Pierce Pen%"],
  "Phys Res%": ["Slash Res%", "Blunt Res%", "Pierce Res%"],
}

const fallbackInGameTokenByStat = Object.entries(stat_data.inGameNames).reduce<Record<string, string>>((result, [token, stat]) => {
  const normalizedToken = token.charAt(0).toLowerCase() + token.slice(1)
  result[stat] = normalizedToken
  return result
}, {})

const syntheticResourceMultiplierMap: Record<string, {
  percentStat: string
}> = {
  HP: { percentStat: "HP%" },
  MP: { percentStat: "MP%" },
  Focus: { percentStat: "Focus%" },
}

function formatNumber(value: number, maxDigits = 4): string {
  if (!Number.isFinite(value)) {
    return "0"
  }

  const roundedValue = Math.round(value)
  if (Math.abs(value - roundedValue) < 0.0001) {
    return roundedValue.toLocaleString("en-US")
  }

  return value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDigits,
  })
}

function getDirectInGameToken(stat: string): string {
  return directInGameTokenByStat[stat] ?? fallbackInGameTokenByStat[stat] ?? stat
}

function getOutputInGameTokens(stat: string): string[] {
  const orderedStats = compoundOutputOrderOverrides[stat]
    ?? stat_data.StatsInfo[stat as keyof typeof stat_data.StatsInfo]?.sub_stats

  if (orderedStats?.length) {
    return orderedStats.map((entry) => getDirectInGameToken(entry))
  }

  return [getDirectInGameToken(stat)]
}

export function formatTalentConversionValue(value: number, stat: string): string {
  const absolute = formatNumber(Math.abs(value))
  return `${value < 0 ? "-" : ""}${absolute}`
}

export function formatTalentConversionRatio(ratio: number): string {
  return `${formatNumber(ratio * 100)}%`
}

export function getTalentConversionSourceLabel(stat: string): string {
  return getDirectInGameToken(stat)
}

export function getTalentConversionOutputLabel(stat: string): string {
  return getOutputInGameTokens(stat).join(", ")
}

function getHighestConvertedValue(
  sourceStats: Record<string, number>,
  stats: readonly string[],
): number {
  return stats.reduce(
    (highest, stat) => Math.max(highest, sourceStats[stat] ?? 0),
    0,
  )
}

function getDisplayConversionSourceValue(
  sourceStats: Record<string, number>,
  sourceStat: string,
): number {
  switch (sourceStat) {
    case "Highest Phys%":
      return getHighestConvertedValue(sourceStats, ["Slash%", "Pierce%", "Blunt%"])
    case "Highest Phys Pen%":
      return getHighestConvertedValue(sourceStats, ["Slash Pen%", "Pierce Pen%", "Blunt Pen%"])
    case "Highest Magic%":
      return getHighestConvertedValue(sourceStats, [
        "Fire%",
        "Water%",
        "Lightning%",
        "Wind%",
        "Earth%",
        "Toxic%",
        "Neg%",
        "Holy%",
        "Void%",
      ])
    case "Highest Magic Pen%":
      return getHighestConvertedValue(sourceStats, [
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
      return sourceStats["Crit Chance%"] ?? 0
    default:
      return sourceStats[sourceStat] ?? 0
  }
}

function createRow(
  id: string,
  sourceName: string,
  sourceStat: string,
  sourceValue: number,
  ratio: number,
  resultingStat: string,
  amount: number,
  order: number,
  breakdown?: TalentConversionBreakdown[],
): TalentConversionRow {
  return {
    id,
    sourceName,
    sourceStat,
    sourceValue,
    ratio,
    resultingStat,
    amount,
    order,
    breakdown: breakdown ?? [{ sourceName, ratio, amount }],
  }
}

function getGroupSourceValue(
  stages: BuildStatStages,
  sourceStat: string,
): number {
  if (sourceStat in syntheticResourceMultiplierMap) {
    return stages.StatsBase[sourceStat] ?? 0
  }

  return getDisplayConversionSourceValue(stages.StatsBuffReady, sourceStat)
}

function mergeStageStats(
  baseStats: Record<string, number>,
  addedStats?: Record<string, number>,
): Record<string, number> {
  if (!addedStats || Object.keys(addedStats).length === 0) {
    return baseStats
  }

  const merged = { ...baseStats }

  for (const [stat, value] of Object.entries(addedStats)) {
    merged[stat] = (merged[stat] ?? 0) + (value ?? 0)
  }

  return merged
}

function addOrMergeRow(
  rows: TalentConversionRow[],
  rowsByKey: Map<string, TalentConversionRow>,
  args: {
    id: string
    sourceName: string
    sourceStat: string
    sourceValue: number
    ratio: number
    resultingStat: string
    amount: number
    order: number
  },
): void {
  if (!Number.isFinite(args.ratio) || Math.abs(args.ratio) < 0.0000001) {
    return
  }

  if (!Number.isFinite(args.amount) || args.amount === 0) {
    return
  }

  const key = `${args.sourceStat}:${args.resultingStat}`
  const existing = rowsByKey.get(key)
  if (existing) {
    existing.ratio += args.ratio
    existing.amount += args.amount
    existing.breakdown.push({
      sourceName: args.sourceName,
      ratio: args.ratio,
      amount: args.amount,
    })
    return
  }

  const row = createRow(
    args.id,
    args.sourceName,
    args.sourceStat,
    args.sourceValue,
    args.ratio,
    args.resultingStat,
    args.amount,
    args.order,
  )

  rowsByKey.set(key, row)
  rows.push(row)
}

function buildExplicitTalentConversionRatios(
  snapshot: BuildSnapshot,
): Map<string, number> {
  const ratiosByKey = new Map<string, number>()

  for (const talentName of snapshot.selectedTalents) {
    const talent = talent_data[talentName]
    if (!talent) {
      continue
    }

    for (const { source, ratio, resulting_stat } of talent.conversions ?? []) {
      const key = `${source}:${resulting_stat}`
      ratiosByKey.set(key, (ratiosByKey.get(key) ?? 0) + ratio)
    }
  }

  return ratiosByKey
}

function addTalentConversionRows(
  rows: TalentConversionRow[],
  rowsByKey: Map<string, TalentConversionRow>,
  snapshot: BuildSnapshot,
  stages: BuildStatStages,
  nextOrder: number,
): number {
  let order = nextOrder

  for (const talentName of snapshot.selectedTalents) {
    const talent = talent_data[talentName]
    if (!talent) {
      continue
    }

    for (const { source, ratio, resulting_stat } of talent.conversions ?? []) {
      const sourceValue = getDisplayConversionSourceValue(stages.StatsConversionReady, source)
      const amount = truncateTowardZero(sourceValue * ratio)

      addOrMergeRow(rows, rowsByKey, {
        id: `${talentName}:${order}:${resulting_stat}`,
        sourceName: talentName,
        sourceStat: source,
        sourceValue,
        ratio,
        resultingStat: resulting_stat,
        amount,
        order,
      })
      order += 1
    }
  }

  return order
}

function addGlobalMainStatConversionRows(
  rows: TalentConversionRow[],
  rowsByKey: Map<string, TalentConversionRow>,
  stages: BuildStatStages,
  explicitTalentRatiosByKey: ReadonlyMap<string, number>,
  nextOrder: number,
): number {
  let order = nextOrder

  for (const [sourceStat, resultMap] of Object.entries(stages.StatsConversionPercents)) {
    const sourceValue = getDisplayConversionSourceValue(stages.StatsConversionReady, sourceStat)

    for (const [resultingStat, totalRatio] of Object.entries(resultMap)) {
      const explicitTalentRatio = explicitTalentRatiosByKey.get(`${sourceStat}:${resultingStat}`) ?? 0
      const remainingRatio = totalRatio - explicitTalentRatio
      const amount = truncateTowardZero(sourceValue * remainingRatio)

      addOrMergeRow(rows, rowsByKey, {
        id: `build:${sourceStat}:${resultingStat}`,
        sourceName: "Build Stats",
        sourceStat,
        sourceValue,
        ratio: remainingRatio,
        resultingStat,
        amount,
        order,
      })
      order += 1
    }
  }

  return order
}

function addResourceMultiplierRows(
  rows: TalentConversionRow[],
  rowsByKey: Map<string, TalentConversionRow>,
  stages: BuildStatStages,
  nextOrder: number,
): number {
  let order = nextOrder

  for (const [sourceStat, { percentStat }] of Object.entries(syntheticResourceMultiplierMap)) {
    const ratio = (stages.StatsBase[percentStat] ?? 0) / 100
    const sourceValue = stages.StatsBase[sourceStat] ?? 0
    const amount = truncateTowardZero(sourceValue * ratio)

    addOrMergeRow(rows, rowsByKey, {
      id: `resource:${sourceStat}`,
      sourceName: "Build Stats",
      sourceStat,
      sourceValue,
      ratio,
      resultingStat: sourceStat,
      amount,
      order,
    })
    order += 1
  }

  return order
}

function addEffectConversionRows(
  rows: TalentConversionRow[],
  rowsByKey: Map<string, TalentConversionRow>,
  args: {
    selectedNames: readonly string[]
    stackDict: Record<string, number>
    sourceData: Record<string, EffectSourceData | undefined>
    baseSourceStats: Record<string, number>
    percentBeforeByName: Record<string, number>
    outputsBeforeByName: Record<string, Record<string, number>>
    nextOrder: number
  },
): number {
  let order = args.nextOrder

  for (const sourceName of args.selectedNames) {
    const effectData = args.sourceData[sourceName]
    if (!effectData) {
      continue
    }

    const sourceStats = mergeStageStats(
      args.baseSourceStats,
      args.outputsBeforeByName[sourceName],
    )
    const buffPercent = args.percentBeforeByName[sourceName] ?? (args.baseSourceStats["Buff%"] ?? 0)
    const buffMultiplier = 1 + (buffPercent / 100)

    for (const { source, ratio, resulting_stat } of effectData.conversions ?? []) {
      const sourceValue = getDisplayConversionSourceValue(sourceStats, source)
      const effectiveRatio = ratio * buffMultiplier
      const amount = truncateTowardZero(sourceValue * effectiveRatio)

      addOrMergeRow(rows, rowsByKey, {
        id: `${sourceName}:${order}:${resulting_stat}`,
        sourceName,
        sourceStat: source,
        sourceValue,
        ratio: effectiveRatio,
        resultingStat: resulting_stat,
        amount,
        order,
      })
      order += 1
    }

    for (const { source, ratio, resulting_stat } of effectData.stack_conversions ?? []) {
      const stackCount = args.stackDict[sourceName] ?? 0
      if (stackCount === 0) {
        continue
      }

      const sourceValue = getDisplayConversionSourceValue(sourceStats, source)
      const effectiveRatio = ratio * stackCount * buffMultiplier
      const amount = truncateTowardZero(sourceValue * effectiveRatio)

      addOrMergeRow(rows, rowsByKey, {
        id: `${sourceName}:${order}:${resulting_stat}:stack`,
        sourceName,
        sourceStat: source,
        sourceValue,
        ratio: effectiveRatio,
        resultingStat: resulting_stat,
        amount,
        order,
      })
      order += 1
    }
  }

  return order
}

export function getTalentConversionRows(
  snapshot: BuildSnapshot,
  stages: BuildStatStages,
): TalentConversionRow[] {
  const rows: TalentConversionRow[] = []
  const rowsByKey = new Map<string, TalentConversionRow>()
  let order = 0

  const explicitTalentRatiosByKey = buildExplicitTalentConversionRatios(snapshot)
  order = addTalentConversionRows(rows, rowsByKey, snapshot, stages, order)
  order = addGlobalMainStatConversionRows(rows, rowsByKey, stages, explicitTalentRatiosByKey, order)
  order = addResourceMultiplierRows(rows, rowsByKey, stages, order)
  order = addEffectConversionRows(rows, rowsByKey, {
    selectedNames: snapshot.selectedBuffs,
    stackDict: snapshot.selectedBuffStacks,
    sourceData: skill_data as Record<string, EffectSourceData | undefined>,
    baseSourceStats: stages.StatsBuffReady,
    percentBeforeByName: stages.StatsBuffPercents,
    outputsBeforeByName: stages.StatsBuffOutputsBeforeByName,
    nextOrder: order,
  })
  order = addEffectConversionRows(rows, rowsByKey, {
    selectedNames: snapshot.selectedTarots,
    stackDict: snapshot.tarotStacks,
    sourceData: tarot_data as Record<string, EffectSourceData | undefined>,
    baseSourceStats: stages.StatsBuffReady,
    percentBeforeByName: stages.StatsTarotPercents,
    outputsBeforeByName: stages.StatsTarotOutputsBeforeByName,
    nextOrder: order,
  })

  return rows
}

function getConversionRowPriority(row: TalentConversionRow): number {
  const outputTokens = getOutputInGameTokens(row.resultingStat)

  if (outputTokens.length > 1) {
    return 0
  }

  if (row.resultingStat === row.sourceStat) {
    return 1
  }

  return 2
}

export function getTalentConversionGroups(
  snapshot: BuildSnapshot,
  stages: BuildStatStages,
): TalentConversionGroup[] {
  const groupsBySource = new Map<string, TalentConversionGroup>()
  const groups: TalentConversionGroup[] = []

  for (const row of getTalentConversionRows(snapshot, stages)) {
    const key = row.sourceStat
    const existing = groupsBySource.get(key)

    if (existing) {
      existing.rows.push(row)
      continue
    }

    const nextGroup: TalentConversionGroup = {
      id: key,
      sourceStat: row.sourceStat,
      sourceValue: getGroupSourceValue(stages, row.sourceStat),
      rows: [row],
      order: row.order,
    }

    groupsBySource.set(key, nextGroup)
    groups.push(nextGroup)
  }

  return groups
    .sort((left, right) => left.order - right.order)
    .map((group) => ({
      ...group,
      rows: [...group.rows].sort((left, right) => {
        const priorityDifference = getConversionRowPriority(left) - getConversionRowPriority(right)
        if (priorityDifference !== 0) {
          return priorityDifference
        }

        return left.order - right.order
      }),
    }))
}

export function getTalentConversionSourceLine(group: TalentConversionGroup): string {
  return `◘ ${getTalentConversionSourceLabel(group.sourceStat)} : ${formatTalentConversionValue(group.sourceValue, group.sourceStat)}`
}

export function getTalentConversionOutputLine(row: TalentConversionRow): string {
  return `⇒  ${formatTalentConversionRatio(row.ratio)}  ⇒  ${formatTalentConversionValue(row.amount, row.resultingStat)} ${getTalentConversionOutputLabel(row.resultingStat)}`
}

export function getTalentConversionTooltip(group: TalentConversionGroup): string {
  return [
    getTalentConversionSourceLine(group),
    ...group.rows.flatMap((row) => {
      if (row.breakdown.length <= 1) {
        return [`${row.sourceName}: ${getTalentConversionOutputLine(row)}`]
      }

      return [
        ...row.breakdown.map((entry) =>
          `${entry.sourceName}: ⇒  ${formatTalentConversionRatio(entry.ratio)}  ⇒  ${formatTalentConversionValue(entry.amount, row.resultingStat)} ${getTalentConversionOutputLabel(row.resultingStat)}`,
        ),
        `Total: ${getTalentConversionOutputLine(row)}`,
      ]
    }),
  ].join("\n")
}

export function getTalentConversionComparisonRows(
  snapshot: BuildSnapshot,
  stages: BuildStatStages,
): Array<{
  label: string
  value: string
}> {
  return getTalentConversionGroups(snapshot, stages).map((group) => ({
    label: getTalentConversionSourceLabel(group.sourceStat),
    value: [getTalentConversionSourceLine(group), ...group.rows.map((row) => getTalentConversionOutputLine(row))].join(" | "),
  }))
}
