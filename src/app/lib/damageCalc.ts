import stat_data from "@/app/data/stat_data"

export const DAMAGE_CALC_STORAGE_KEY = "DamageCalcState"

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
  playerLevel: number
  dungeonLevel: number
  bossDefPen: number
  baseStat: number
  buffedStat: number
  defense: number
  dmgReduction: number
  defCap: number
}

export type DamageCalcState = {
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
  threatAverage: number
}

export const defaultDamageCalcInputs: DamageCalcInputs = {
  skillDmg: 25,
  skillCritDmg: 100,
  skillPen: 0,
  skillCritChance: 0,
  threatDef: 0,
  armorIgnore: 0,
  resIgnore: 0,
  dot: 0,
  secondSkillDmg: 0,
  enemyArmor: 0,
  enemyRes: 0,
  playerLevel: 1,
  dungeonLevel: 1,
  bossDefPen: 0,
  baseStat: 0,
  buffedStat: 0,
  defense: 0,
  dmgReduction: 0,
  defCap: 0,
}

export const defaultDamageCalcState: DamageCalcState = {
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

  const inputs = damageInputKeys.reduce<DamageCalcInputs>((result, key) => {
    result[key] = asFiniteNumber(rawInputs[key], defaultDamageCalcInputs[key])
    return result
  }, { ...defaultDamageCalcInputs })

  return {
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

export function calculateDamage(stats: Record<string, number>, state: DamageCalcState): DamageCalcResult {
  const { mainStat, secondStat, element, penElement, skillType, inputs } = normalizeDamageCalcState(state)

  const baseRaw =
    ((stats[mainStat] ?? 0) * (inputs.skillDmg / 100))
    + ((stats[secondStat] ?? 0) * (inputs.secondSkillDmg / 100))
  const base = Math.floor(baseRaw)

  const armorBlock = Math.floor((inputs.enemyArmor ?? 0) * ((inputs.armorIgnore ?? 0) / 100))
  const armorBreak = Math.floor(((stats["ATK"] ?? 0) + (stats["DEF"] ?? 0) + (stats["MATK"] ?? 0) + (stats["HEAL"] ?? 0)) / 4) + (stats["Armor Strike"] ?? 0)
  const mitigated = Math.max(0, Math.floor(base - (armorBlock - armorBreak)))

  let dmg = mitigated
  dmg = Math.floor(dmg * toMult(stats[`${element}%`]))
  dmg = Math.floor(dmg * toMult(stats[`${element} xDmg%`]))
  const penResMult =
    1
    + (((stats[`${penElement} Pen%`] ?? 0) + (inputs.skillPen ?? 0)) / 100)
    - ((inputs.enemyRes ?? 0) * ((inputs.resIgnore ?? 0) / 100))
  dmg = Math.floor(dmg * penResMult)
  dmg = Math.floor(dmg * toMult(stats[`${skillType} DMG%`]))
  dmg = Math.floor(dmg * toMult(stats["Dmg%"]))

  const nonCrit = Math.max(0, dmg)
  const skillCritDamage =
    getTotalStatValue(stats, skillCritDamageStatsBySkillType[skillType] ?? [])
    + (stat_data.Elemental.includes(element) ? (stats["Elemental Crit DMG%"] ?? 0) : 0)
    + (element === "Holy" ? (stats["Holy Crit DMG%"] ?? 0) : 0)
  const totalCritDamage = (stats["Crit DMG%"] ?? 0) + skillCritDamage

  const critStage = Math.floor(nonCrit * ((inputs.skillCritDmg ?? 0) / 100))
  const crit = Math.floor(critStage * (totalCritDamage / 100))
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
  const threatWithGlobalDmg = Math.floor(threatBase * toMult(stats["Dmg%"]))
  const threatNonCrit = Math.floor(threatWithGlobalDmg * toMult(stats["Threat%"]))
  const threatCrit = Math.floor(threatNonCrit * (totalCritDamage / 100))
  const threatAverage = Math.floor(threatNonCrit * nonCritWeight + threatCrit * (critWeight + maxCritWeight))

  return {
    nonCrit,
    crit,
    maxcrit,
    average,
    dotNonCrit,
    dotCrit,
    threatNonCrit,
    threatCrit,
    threatAverage,
  }
}

export function formatSignedDamageDelta(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "..."
  return `${value >= 0 ? "+" : "-"}${Math.abs(Math.trunc(value)).toLocaleString("en-US")}`
}
