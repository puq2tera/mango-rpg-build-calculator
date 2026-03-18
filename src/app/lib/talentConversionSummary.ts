import stat_data from "@/app/data/stat_data"
import { talent_data } from "@/app/data/talent_data"
import type { BuildSnapshot, BuildStatStages } from "@/app/lib/buildStats"
import { truncateTowardZero } from "@/app/lib/statRounding"

export type TalentConversionRow = {
  id: string
  talentName: string
  sourceStat: string
  sourceValue: number
  ratio: number
  resultingStat: string
  amount: number
}

export type TalentConversionGroup = {
  id: string
  sourceStat: string
  sourceValue: number
  rows: TalentConversionRow[]
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
  const suffix = stat.includes("%") ? "%" : ""
  return `${value < 0 ? "-" : ""}${absolute}${suffix}`
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

export function getTalentConversionRows(
  snapshot: BuildSnapshot,
  stages: BuildStatStages,
): TalentConversionRow[] {
  const rows: TalentConversionRow[] = []

  for (const talentName of snapshot.selectedTalents) {
    const talent = talent_data[talentName]
    if (!talent?.conversions?.length) {
      continue
    }

    talent.conversions.forEach(({ source, ratio, resulting_stat }, index) => {
      const sourceValue = stages.StatsConversionReady[source] ?? 0
      const amount = truncateTowardZero(sourceValue * ratio)

      if (!Number.isFinite(amount) || amount === 0) {
        return
      }

      rows.push({
        id: `${talentName}:${index}:${resulting_stat}`,
        talentName,
        sourceStat: source,
        sourceValue,
        ratio,
        resultingStat: resulting_stat,
        amount,
      })
    })
  }

  return rows
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
    }

    groupsBySource.set(key, nextGroup)
    groups.push(nextGroup)
  }

  return groups
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
    ...group.rows.map((row) => `${row.talentName}: ${getTalentConversionOutputLine(row)}`),
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
