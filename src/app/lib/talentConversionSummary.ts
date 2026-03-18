import stat_data from "@/app/data/stat_data"
import { talent_data } from "@/app/data/talent_data"
import type { BuildSnapshot, BuildStatStages } from "@/app/lib/buildStats"
import { truncateTowardZero } from "@/app/lib/statRounding"

export type TalentConversionBreakdown = {
  talentName: string
  ratio: number
  amount: number
}

export type TalentConversionRow = {
  id: string
  talentName: string
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

const directInGameTokenByStat: Record<string, string> = {
  ATK: "atk",
  DEF: "def",
  MATK: "matk",
  HEAL: "heal",
  HP: "maxHP",
  MP: "maxMP",
  Focus: "maxFocus",
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
  sourceStat: string
  resultingStat: string
}> = {
  "HP%": { sourceStat: "HP", resultingStat: "HP" },
  "MP%": { sourceStat: "MP", resultingStat: "MP" },
  "Focus%": { sourceStat: "Focus", resultingStat: "Focus" },
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

function getMergedConversionStatValue(
  baseStats: Record<string, number>,
  convertedStats: Record<string, number>,
  stat: string,
): number {
  return (baseStats[stat] ?? 0) + (convertedStats[stat] ?? 0)
}

function getHighestConvertedValue(
  baseStats: Record<string, number>,
  convertedStats: Record<string, number>,
  stats: readonly string[],
): number {
  return stats.reduce(
    (highest, stat) => Math.max(highest, getMergedConversionStatValue(baseStats, convertedStats, stat)),
    0,
  )
}

function getDisplayConversionSourceValue(
  baseStats: Record<string, number>,
  convertedStats: Record<string, number>,
  sourceStat: string,
): number {
  switch (sourceStat) {
    case "Highest Phys%":
      return getHighestConvertedValue(baseStats, convertedStats, ["Slash%", "Pierce%", "Blunt%"])
    case "Highest Phys Pen%":
      return getHighestConvertedValue(baseStats, convertedStats, ["Slash Pen%", "Pierce Pen%", "Blunt Pen%"])
    case "Highest Magic%":
      return getHighestConvertedValue(baseStats, convertedStats, [
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
      return getHighestConvertedValue(baseStats, convertedStats, [
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
      return getMergedConversionStatValue(baseStats, convertedStats, "Crit Chance%")
    default:
      return baseStats[sourceStat] ?? 0
  }
}

function addExpandedConvertedValue(
  convertedStats: Record<string, number>,
  stat: string,
  value: number,
): void {
  const info = stat_data.StatsInfo[stat as keyof typeof stat_data.StatsInfo]
  if (!info || !Number.isFinite(value) || Math.abs(value) < 0.0001) {
    return
  }

  const substats = info.sub_stats
  if (substats?.length) {
    for (const substat of substats) {
      convertedStats[substat] = (convertedStats[substat] ?? 0) + value
    }
    return
  }

  convertedStats[stat] = (convertedStats[stat] ?? 0) + value
}

function createRow(
  id: string,
  talentName: string,
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
    talentName,
    sourceStat,
    sourceValue,
    ratio,
    resultingStat,
    amount,
    order,
    breakdown: breakdown ?? [{ talentName, ratio, amount }],
  }
}

export function getTalentConversionRows(
  snapshot: BuildSnapshot,
  stages: BuildStatStages,
): TalentConversionRow[] {
  const rows: TalentConversionRow[] = []
  const syntheticRowsByKey = new Map<string, TalentConversionRow>()
  const convertedStats: Record<string, number> = {}
  let order = 0

  for (const talentName of snapshot.selectedTalents) {
    const talent = talent_data[talentName]
    if (!talent) {
      continue
    }

    for (const [stat, value] of Object.entries(talent.stats ?? {})) {
      const syntheticConfig = syntheticResourceMultiplierMap[stat]
      const normalizedValue = value ?? 0
      if (!syntheticConfig || !Number.isFinite(normalizedValue) || normalizedValue === 0) {
        continue
      }

      const ratio = normalizedValue / 100
      const sourceValue = stages.StatsBase[syntheticConfig.sourceStat] ?? 0
      const amount = truncateTowardZero(sourceValue * ratio)

      if (!Number.isFinite(amount) || amount === 0) {
        continue
      }

      const key = `synthetic:${syntheticConfig.sourceStat}:${syntheticConfig.resultingStat}`
      const existingSyntheticRow = syntheticRowsByKey.get(key)
      if (existingSyntheticRow) {
        existingSyntheticRow.ratio += ratio
        existingSyntheticRow.amount += amount
        existingSyntheticRow.breakdown.push({ talentName, ratio, amount })
        continue
      }

      const syntheticRow = createRow(
        key,
        talentName,
        syntheticConfig.sourceStat,
        sourceValue,
        ratio,
        syntheticConfig.resultingStat,
        amount,
        order,
      )

      syntheticRowsByKey.set(key, syntheticRow)
      rows.push(syntheticRow)
      order += 1
    }

    talent.conversions.forEach(({ source, ratio, resulting_stat }, index) => {
      const sourceValue = getDisplayConversionSourceValue(stages.StatsConversionReady, convertedStats, source)
      const amount = truncateTowardZero(sourceValue * ratio)

      if (!Number.isFinite(amount) || amount === 0) {
        return
      }

      rows.push(
        createRow(
          `${talentName}:${index}:${resulting_stat}`,
          talentName,
          source,
          sourceValue,
          ratio,
          resulting_stat,
          amount,
          order,
        ),
      )
      order += 1
      addExpandedConvertedValue(convertedStats, resulting_stat, amount)
    })
  }

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
      sourceValue: row.sourceValue,
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
        return [`${row.talentName}: ${getTalentConversionOutputLine(row)}`]
      }

      return [
        ...row.breakdown.map((entry) =>
          `${entry.talentName}: ⇒  ${formatTalentConversionRatio(entry.ratio)}  ⇒  ${formatTalentConversionValue(entry.amount, row.resultingStat)} ${getTalentConversionOutputLabel(row.resultingStat)}`,
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
