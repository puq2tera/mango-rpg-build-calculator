import type { BuildStatStages } from "@/app/lib/buildStats"

export const worldBossStatKeys = ["ATK", "DEF", "MATK", "HEAL"] as const

export type WorldBossStatKey = (typeof worldBossStatKeys)[number]
export type WorldBossUserStats = Record<WorldBossStatKey, number>
export type WorldBossActionName = "Strike" | "Defend" | "Cast" | "Heal" | "Doctor"

export type WorldBossActionResult = {
  name: WorldBossActionName
  formula: string
  contributions: WorldBossUserStats
  min: number
  average: number
  max: number
}

type WorldBossRange = {
  min: number
  average: number
  max: number
}

export const defaultWorldBossUserStats: WorldBossUserStats = {
  ATK: 0,
  DEF: 0,
  MATK: 0,
  HEAL: 0,
}

const worldBossActionWeights: Record<Exclude<WorldBossActionName, "Doctor">, WorldBossUserStats> = {
  Strike: {
    ATK: 1,
    DEF: 0.65,
    MATK: 0.65,
    HEAL: 0.25,
  },
  Defend: {
    ATK: 0.65,
    DEF: 1,
    MATK: 0.65,
    HEAL: 0.25,
  },
  Cast: {
    ATK: 0.65,
    DEF: 0.65,
    MATK: 1,
    HEAL: 0.25,
  },
  Heal: {
    ATK: 0,
    DEF: 0,
    MATK: 0,
    HEAL: 1,
  },
}

const asFiniteNumber = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback

const roundDown = (value: number): number => Math.trunc(value)

const createRangeFromAverage = (average: number): WorldBossRange => ({
  min: roundDown(average * 0.9),
  average,
  max: roundDown(average * 1.1),
})

const normalizeWorldBossStatValues = (raw: unknown, fallback: WorldBossUserStats): WorldBossUserStats => {
  const data = typeof raw === "object" && raw !== null ? raw as Partial<Record<WorldBossStatKey, number>> : {}

  return worldBossStatKeys.reduce<WorldBossUserStats>((result, stat) => {
    result[stat] = asFiniteNumber(data[stat], fallback[stat])
    return result
  }, { ...fallback })
}

const combinePercentBonuses = (primaryPercent: number, secondaryPercent: number): number =>
  (((1 + (primaryPercent / 100)) * (1 + (secondaryPercent / 100))) - 1) * 100

const getWorldBossTotalStat = (stages: BuildStatStages, stat: WorldBossStatKey): number =>
  (stages.StatsBase[stat] ?? 0) + (stages.StatsConverted[stat] ?? 0)

const getWorldBossStatMultiplier = (stages: BuildStatStages, stat: WorldBossStatKey): number =>
  1 + (
    combinePercentBonuses(
      (stages.StatsBase[`${stat}%`] ?? 0) + (stages.StatsConverted[`${stat}%`] ?? 0),
      (stages.StatsBase[`Global ${stat}%`] ?? 0) + (stages.StatsConverted[`Global ${stat}%`] ?? 0),
    ) / 100
  )

const getWorldBossArtifactMultiplier = (stages: BuildStatStages, stat: WorldBossStatKey): number =>
  1 + ((stages.StatsBase[`Art_${stat}%`] ?? 0) / 100)

const createContributions = (userStats: WorldBossUserStats, weights: WorldBossUserStats): WorldBossUserStats =>
  worldBossStatKeys.reduce<WorldBossUserStats>((result, stat) => {
    result[stat] = userStats[stat] * weights[stat]
    return result
  }, { ...defaultWorldBossUserStats })

const sumContributions = (contributions: WorldBossUserStats): number =>
  worldBossStatKeys.reduce((total, stat) => total + contributions[stat], 0)

export function normalizeWorldBossUserStats(raw: unknown): WorldBossUserStats {
  return normalizeWorldBossStatValues(raw, defaultWorldBossUserStats)
}

export function getWorldBossUserStatsFromBuildStages(stages: BuildStatStages): WorldBossUserStats {
  return worldBossStatKeys.reduce<WorldBossUserStats>((result, stat) => {
    result[stat] = Math.round(
      getWorldBossTotalStat(stages, stat)
      * getWorldBossStatMultiplier(stages, stat)
      * getWorldBossArtifactMultiplier(stages, stat),
    )
    return result
  }, { ...defaultWorldBossUserStats })
}

export function calculateWorldBossActions(userStats: WorldBossUserStats): WorldBossActionResult[] {
  const normalizedStats = normalizeWorldBossUserStats(userStats)

  const strikeContributions = createContributions(normalizedStats, worldBossActionWeights.Strike)
  const defendContributions = createContributions(normalizedStats, worldBossActionWeights.Defend)
  const castContributions = createContributions(normalizedStats, worldBossActionWeights.Cast)
  const healContributions = createContributions(normalizedStats, worldBossActionWeights.Heal)

  const strikeRange = createRangeFromAverage(sumContributions(strikeContributions))
  const defendRange = createRangeFromAverage(sumContributions(defendContributions))
  const castRange = createRangeFromAverage(sumContributions(castContributions))
  const healRange = createRangeFromAverage(sumContributions(healContributions))
  const doctorContributions = { ...defaultWorldBossUserStats }
  doctorContributions.HEAL = roundDown(healRange.average * 0.25)
  const doctorRange = {
    min: roundDown(healRange.min * 0.25),
    average: doctorContributions.HEAL,
    max: roundDown(healRange.max * 0.25),
  }

  return [
    {
      name: "Strike",
      formula: "ATK + 65% DEF + 65% MATK + 25% HEAL",
      contributions: strikeContributions,
      ...strikeRange,
    },
    {
      name: "Defend",
      formula: "65% ATK + DEF + 65% MATK + 25% HEAL",
      contributions: defendContributions,
      ...defendRange,
    },
    {
      name: "Cast",
      formula: "65% ATK + 65% DEF + MATK + 25% HEAL",
      contributions: castContributions,
      ...castRange,
    },
    {
      name: "Heal",
      formula: "HEAL",
      contributions: healContributions,
      ...healRange,
    },
    {
      name: "Doctor",
      formula: "25% of Heal range",
      contributions: doctorContributions,
      ...doctorRange,
    },
  ]
}
