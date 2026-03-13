import stat_data from "@/app/data/stat_data"
import { getThreatMultiplier } from "@/app/lib/threat"

export const DAMAGE_CALC_STORAGE_KEY = "DamageCalcState"
const DAMAGE_CALC_SCHEMA_VERSION = 2

export type DamageCalcInputs = {
  skillDmg: number
  skillCritDmg: number
  skillPen: number
  skillCritChance: number
  threatDef: number
  armorIgnore: number
  resIgnore: number
  dot: number
  secondSkillDmg: number
  enemyArmor: number
  enemyRes: number
  dungeonLevel: number
  bossDefPen: number
}

export type DamageCalcState = {
  schemaVersion?: number
  attackPreset: string
  mainStat: string
  secondStat: string
  element: string
  penElement: string
  skillType: string
  inputs: DamageCalcInputs
}

export type DamageCalcResult = {
  nonCrit: number
  crit: number
  maxcrit: number
  average: number
  dotNonCrit: number
  dotCrit: number
  threatNonCrit: number
  threatCrit: number
  threatMaxcrit: number
  threatAverage: number
}

export type PlayerDamageReductionResult = {
  bossLevel: number
  defenseScaling: number
  rawReductionPercent: number
  effectiveReductionPercent: number
  defenseCap: number
}

export type PlayerDamageReductionInputs = {
  defense: number
  dungeonLevel: number
  bossDefPen: number
}

export const defaultDamageCalcInputs: DamageCalcInputs = {
  skillDmg: 25,
  skillCritDmg: 0,
  skillPen: 0,
  skillCritChance: 0,
  threatDef: 0,
  armorIgnore: 0,
  resIgnore: 0,
  dot: 0,
  secondSkillDmg: 0,
  enemyArmor: 0,
  enemyRes: 0,
  dungeonLevel: 1,
  bossDefPen: 0,
}

export const defaultDamageCalcState: DamageCalcState = {
  schemaVersion: DAMAGE_CALC_SCHEMA_VERSION,
  attackPreset: "",
  mainStat: "ATK",
  secondStat: "DEF",
  element: "Blunt",
  penElement: "Blunt",
  skillType: "N/A",
  inputs: defaultDamageCalcInputs,
}

const damageInputKeys = Object.keys(defaultDamageCalcInputs) as Array<keyof DamageCalcInputs>

const parseStoredJson = <T>(raw: string | null, fallback: T): T => {
  if (!raw) return fallback

  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

const asFiniteNumber = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback

const isOneOf = (value: unknown, options: readonly string[]): value is string =>
  typeof value === "string" && options.includes(value)

export function normalizeDamageCalcState(raw: unknown): DamageCalcState {
  const data = typeof raw === "object" && raw !== null ? raw as Partial<DamageCalcState> : {}
  const rawInputs = typeof data.inputs === "object" && data.inputs !== null ? data.inputs as Partial<DamageCalcInputs> : {}
  const schemaVersion =
    typeof data.schemaVersion === "number" && Number.isFinite(data.schemaVersion)
      ? Math.trunc(data.schemaVersion)
      : 0

  const inputs = damageInputKeys.reduce<DamageCalcInputs>((result, key) => {
    const normalizedValue = asFiniteNumber(rawInputs[key], defaultDamageCalcInputs[key])
    result[key] =
      key === "skillCritDmg" && schemaVersion < DAMAGE_CALC_SCHEMA_VERSION && normalizedValue === 100
        ? 0
        : normalizedValue
    return result
  }, { ...defaultDamageCalcInputs })

  return {
    schemaVersion: DAMAGE_CALC_SCHEMA_VERSION,
    attackPreset: typeof data.attackPreset === "string" ? data.attackPreset : defaultDamageCalcState.attackPreset,
    mainStat: isOneOf(data.mainStat, stat_data.Mainstats) ? data.mainStat : defaultDamageCalcState.mainStat,
    secondStat: isOneOf(data.secondStat, stat_data.Mainstats) ? data.secondStat : defaultDamageCalcState.secondStat,
    element: isOneOf(data.element, stat_data.AllElements) ? data.element : defaultDamageCalcState.element,
    penElement: isOneOf(data.penElement, stat_data.AllElements) ? data.penElement : defaultDamageCalcState.penElement,
    skillType: isOneOf(data.skillType, stat_data.SkillTypes) ? data.skillType : defaultDamageCalcState.skillType,
    inputs,
  }
}

export function readDamageCalcState(storage: Storage): DamageCalcState {
  return normalizeDamageCalcState(parseStoredJson(storage.getItem(DAMAGE_CALC_STORAGE_KEY), defaultDamageCalcState))
}

export function persistDamageCalcState(storage: Storage, state: DamageCalcState): void {
  storage.setItem(DAMAGE_CALC_STORAGE_KEY, JSON.stringify(normalizeDamageCalcState(state)))
}

const toMult = (value: number | undefined): number => 1 + ((value ?? 0) / 100)
const clamp = (value: number, minimum = 0, maximum = 1): number => Math.min(maximum, Math.max(minimum, value))
const toRemainingPercent = (value: number | undefined): number => 1 - clamp((value ?? 0) / 100, 0, 1)
const DAMAGE_REDUCTION_CAP_PERCENT = 90
const DAMAGE_REDUCTION_SCALE_PERCENT = 15
const DEFENSE_SCALING_BASE = 12
const DEFENSE_SCALING_DIVISOR = 15
const skillCritDamageStatsBySkillType: Record<string, string[]> = {
  Bow: ["Bow Crit DMG%"],
  Dagger: ["Dagger Crit DMG%"],
  Fist: ["Fist Crit DMG%"],
}
const skillCritChanceStatsBySkillType: Record<string, string[]> = {
  Bow: ["Bow Crit Chance%"],
  "Shadow Break": ["Shadow Break Crit Chance%"],
}

function getTotalStatValue(stats: Record<string, number>, statNames: readonly string[]): number {
  return statNames.reduce((sum, statName) => sum + (stats[statName] ?? 0), 0)
}

export function calculatePlayerDamageReduction(
  inputs: PlayerDamageReductionInputs,
): PlayerDamageReductionResult {
  const dungeonLevel = Math.max(1, Math.trunc(inputs.dungeonLevel))
  const bossLevel = dungeonLevel
  const defenseScaling =
    DEFENSE_SCALING_BASE
    + Math.floor((dungeonLevel / DEFENSE_SCALING_DIVISOR) ** (1.5 + (dungeonLevel / 1000)))
  const defense = Math.max(0, inputs.defense)
  const bossDefPenRatio = clamp(inputs.bossDefPen / 100, 0, 1)

  if (bossDefPenRatio >= 1) {
    return {
      bossLevel,
      defenseScaling,
      rawReductionPercent: 0,
      effectiveReductionPercent: 0,
      defenseCap: Number.POSITIVE_INFINITY,
    }
  }

  const rawReductionPercent =
    (DAMAGE_REDUCTION_SCALE_PERCENT * defense * (1 - bossDefPenRatio)) / (bossLevel * defenseScaling)
  const effectiveReductionPercent = Math.min(DAMAGE_REDUCTION_CAP_PERCENT, rawReductionPercent)
  const defenseCap =
    (DAMAGE_REDUCTION_CAP_PERCENT / DAMAGE_REDUCTION_SCALE_PERCENT)
    * ((bossLevel * defenseScaling) / (1 - bossDefPenRatio))

  return {
    bossLevel,
    defenseScaling,
    rawReductionPercent: Math.max(0, rawReductionPercent),
    effectiveReductionPercent: Math.max(0, effectiveReductionPercent),
    defenseCap,
  }
}

function applyThreatOffenseMultipliers(
  baseThreat: number,
  stats: Record<string, number>,
  element: string,
  skillType: string,
): number {
  let result = baseThreat
  result = Math.floor(result * toMult(stats[`${element}%`]))
  result = Math.floor(result * toMult(stats[`${element} xDmg%`]))
  result = Math.floor(result * toMult(stats[`${skillType} DMG%`]))
  result = Math.floor(result * toMult(stats["Dmg%"]))
  return result
}

type NormalizedDamageContext = {
  stats: Record<string, number>
  element: string
  penElement: string
  skillType: string
  inputs: DamageCalcInputs
  mitigated: number
}

function buildDamageContext(stats: Record<string, number>, state: DamageCalcState): NormalizedDamageContext {
  const { mainStat, secondStat, element, penElement, skillType, inputs } = normalizeDamageCalcState(state)

  const baseRaw =
    ((stats[mainStat] ?? 0) * (inputs.skillDmg / 100))
    + ((stats[secondStat] ?? 0) * (inputs.secondSkillDmg / 100))
  const base = Math.floor(baseRaw)

  const armorBlock = Math.floor((inputs.enemyArmor ?? 0) * toRemainingPercent(inputs.armorIgnore))
  const armorBreak = Math.floor(((stats["ATK"] ?? 0) + (stats["DEF"] ?? 0) + (stats["MATK"] ?? 0) + (stats["HEAL"] ?? 0)) / 4) + (stats["Armor Strike"] ?? 0)
  const mitigated = Math.max(0, Math.floor(base - (armorBlock - armorBreak)))

  return {
    stats,
    element,
    penElement,
    skillType,
    inputs,
    mitigated,
  }
}

function finalizeDamageResult(nonCrit: number, context: NormalizedDamageContext): DamageCalcResult {
  const { stats, element, skillType, inputs } = context
  const skillCritDamageBonus =
    getTotalStatValue(stats, skillCritDamageStatsBySkillType[skillType] ?? [])
    + (stat_data.Elemental.includes(element) ? (stats["Elemental Crit DMG%"] ?? 0) : 0)
    + (element === "Holy" ? (stats["Holy Crit DMG%"] ?? 0) : 0)
  const totalCritDamageBonus = (stats["Crit DMG%"] ?? 0) + skillCritDamageBonus + (inputs.skillCritDmg ?? 0)
  const damageCritDamageMultiplier = Math.max(0, totalCritDamageBonus / 100)
  // Threat skills line up with combat logs as base 1x threat plus crit-damage bonus.
  const threatCritDamageMultiplier = Math.max(0, 1 + (totalCritDamageBonus / 100))

  const crit = Math.floor(nonCrit * damageCritDamageMultiplier)
  const maxcrit = Math.floor(crit * ((stats["Overdrive%"] ?? 0) / 100))

  const skillCritChance = getTotalStatValue(stats, skillCritChanceStatsBySkillType[skillType] ?? [])
  const totalCritChance =
    ((stats["Crit Chance%"] ?? 0) + skillCritChance + (inputs.skillCritChance ?? 0)) * stat_data.StatsInfo["Crit Chance%"].multi
  const critChance = clamp(totalCritChance, 0, 2)

  const nonCritWeight = 1 - clamp(critChance, 0, 1)
  const maxCritWeight = clamp(critChance - 1, 0, 1)
  const critWeight = clamp(critChance, 0, 1) - maxCritWeight

  const average = Math.floor(nonCrit * nonCritWeight + crit * critWeight + maxcrit * maxCritWeight)

  const totalDotPercent = (inputs.dot ?? 0) + (stats[`${element} DOT%`] ?? 0)
  const dotMult = Math.max(0, totalDotPercent) / 100
  const dotNonCrit = Math.floor(nonCrit * dotMult)
  const dotCrit = Math.floor(crit * dotMult)

  const threatBase = Math.floor((stats["DEF"] ?? 0) * ((inputs.threatDef ?? 0) / 100))
  const threatWithOffenseScaling = applyThreatOffenseMultipliers(threatBase, stats, element, skillType)
  const threatNonCrit = Math.floor(threatWithOffenseScaling * getThreatMultiplier(stats))
  const threatCrit = Math.floor(threatNonCrit * threatCritDamageMultiplier)
  const threatMaxcrit = Math.floor(threatCrit * ((stats["Overdrive%"] ?? 0) / 100))
  const threatAverage = Math.floor(threatNonCrit * nonCritWeight + threatCrit * critWeight + threatMaxcrit * maxCritWeight)

  return {
    nonCrit,
    crit,
    maxcrit,
    average,
    dotNonCrit,
    dotCrit,
    threatNonCrit,
    threatCrit,
    threatMaxcrit,
    threatAverage,
  }
}

export function calculateDamage(stats: Record<string, number>, state: DamageCalcState): DamageCalcResult {
  const context = buildDamageContext(stats, state)
  const { stats: resolvedStats, element, penElement, skillType, inputs, mitigated } = context

  let dmg = mitigated
  dmg = Math.floor(dmg * toMult(resolvedStats[`${element}%`]))
  dmg = Math.floor(dmg * toMult(resolvedStats[`${element} xDmg%`]))
  const effectiveEnemyRes = (inputs.enemyRes ?? 0) * toRemainingPercent(inputs.resIgnore)
  const totalPenBonus = ((resolvedStats[`${penElement} Pen%`] ?? 0) + (inputs.skillPen ?? 0)) / 100
  const penResMult = Math.max(0, 1 + totalPenBonus - (effectiveEnemyRes / 100))
  dmg = Math.floor(dmg * penResMult)
  dmg = Math.floor(dmg * toMult(resolvedStats[`${skillType} DMG%`]))
  dmg = Math.floor(dmg * toMult(resolvedStats["Dmg%"]))

  return finalizeDamageResult(Math.max(0, dmg), context)
}

export function formatSignedDamageDelta(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "..."
  return `${value >= 0 ? "+" : "-"}${Math.abs(Math.trunc(value)).toLocaleString("en-US")}`
}
