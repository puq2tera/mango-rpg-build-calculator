export const worldBossStatKeys = ["ATK", "DEF", "MATK", "HEAL"] as const

export type WorldBossStatKey = (typeof worldBossStatKeys)[number]

export type WorldBossUserStats = Record<WorldBossStatKey, number>

export type WorldBossActionName = "Strike" | "Defend" | "Cast" | "Heal" | "Doctor"

export type WorldBossActionResult = {
  name: WorldBossActionName
  formula: string
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

const asFiniteNumber = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback

const roundDown = (value: number): number => Math.trunc(value)

const createRangeFromAverage = (average: number): WorldBossRange => ({
  min: roundDown(average * 0.9),
  average,
  max: roundDown(average * 1.1),
})

export function normalizeWorldBossUserStats(raw: unknown): WorldBossUserStats {
  const data = typeof raw === "object" && raw !== null ? raw as Partial<Record<WorldBossStatKey, number>> : {}

  return worldBossStatKeys.reduce<WorldBossUserStats>((result, stat) => {
    result[stat] = asFiniteNumber(data[stat], defaultWorldBossUserStats[stat])
    return result
  }, { ...defaultWorldBossUserStats })
}

export function calculateWorldBossActions(userStats: WorldBossUserStats): WorldBossActionResult[] {
  const normalizedStats = normalizeWorldBossUserStats(userStats)
  const strikeRange = createRangeFromAverage(
    normalizedStats.ATK
    + (normalizedStats.DEF * 0.65)
    + (normalizedStats.MATK * 0.65)
    + (normalizedStats.HEAL * 0.25),
  )
  const defendRange = createRangeFromAverage(
    (normalizedStats.ATK * 0.65)
    + normalizedStats.DEF
    + (normalizedStats.MATK * 0.65)
    + (normalizedStats.HEAL * 0.25),
  )
  const castRange = createRangeFromAverage(
    (normalizedStats.ATK * 0.65)
    + (normalizedStats.DEF * 0.65)
    + normalizedStats.MATK
    + (normalizedStats.HEAL * 0.25),
  )
  const healRange = createRangeFromAverage(normalizedStats.HEAL)
  const doctorRange = {
    min: roundDown(healRange.min * 0.25),
    average: roundDown(healRange.average * 0.25),
    max: roundDown(healRange.max * 0.25),
  }

  return [
    {
      name: "Strike",
      formula: "ATK + 65% DEF + 65% MATK + 25% HEAL",
      ...strikeRange,
    },
    {
      name: "Defend",
      formula: "65% ATK + DEF + 65% MATK + 25% HEAL",
      ...defendRange,
    },
    {
      name: "Cast",
      formula: "65% ATK + 65% DEF + MATK + 25% HEAL",
      ...castRange,
    },
    {
      name: "Heal",
      formula: "HEAL",
      ...healRange,
    },
    {
      name: "Doctor",
      formula: "25% of Heal range",
      ...doctorRange,
    },
  ]
}
