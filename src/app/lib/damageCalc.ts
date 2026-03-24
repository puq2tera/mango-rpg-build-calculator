import stat_data from "@/app/data/stat_data"
import { getThreatBonusMultiplier, getThreatMultiplier } from "@/app/lib/threat"

export const DAMAGE_CALC_STORAGE_KEY = "DamageCalcState"
const DAMAGE_CALC_SCHEMA_VERSION = 3
export const DAMAGE_CALC_CUSTOM_SKILL_SCALING_CUSTOM_SOURCE = "Custom"

const dynamicSkillScalingSourceGroups = {
  "Highest Phys%": ["Slash%", "Pierce%", "Blunt%"],
  "Highest Phys Pen%": ["Slash Pen%", "Pierce Pen%", "Blunt Pen%"],
  "Highest Magic%": ["Fire%", "Water%", "Lightning%", "Wind%", "Earth%", "Toxic%", "Neg%", "Holy%", "Void%"],
  "Highest Magic Pen%": [
    "Fire Pen%",
    "Water Pen%",
    "Lightning Pen%",
    "Wind Pen%",
    "Earth Pen%",
    "Toxic Pen%",
    "Neg Pen%",
    "Holy Pen%",
    "Void Pen%",
  ],
  "Highest Elemental%": ["Fire%", "Water%", "Lightning%", "Wind%", "Earth%", "Toxic%"],
  "Highest Elemental Pen%": [
    "Fire Pen%",
    "Water Pen%",
    "Lightning Pen%",
    "Wind Pen%",
    "Earth Pen%",
    "Toxic Pen%",
  ],
  "Highest Divine%": ["Neg%", "Holy%", "Void%"],
  "Highest Divine Pen%": ["Neg Pen%", "Holy Pen%", "Void Pen%"],
} as const

export const damageCalcCustomSkillScalingSources = [
  DAMAGE_CALC_CUSTOM_SKILL_SCALING_CUSTOM_SOURCE,
  ...Object.keys(dynamicSkillScalingSourceGroups),
  ...Object.keys(stat_data.StatsInfo).sort((left, right) => left.localeCompare(right)),
]

const damageCalcCustomSkillScalingSourceSet = new Set(damageCalcCustomSkillScalingSources)

export type DamageCalcInputs = {
  skillDmg: number
  skillCritDmg: number
  skillPen: number
  skillCritChance: number
  threatDef: number
  skillThreat: number
  armorIgnore: number
  skillArmorBreak: number
  resIgnore: number
  dot: number
  secondSkillDmg: number
  enemyArmor: number
  enemyRes: number
  dungeonLevel: number
  bossDefPen: number
}

export type DamageCalcCustomSkillScaling = {
  enabled: boolean
  stat: string
  percent: number
  customValue: number
}

export type DamageCalcState = {
  schemaVersion?: number
  attackPreset: string
  mainStat: string
  secondStat: string
  element: string
  penElement: string
  skillType: string
  customSkillScaling: DamageCalcCustomSkillScaling
  inputs: DamageCalcInputs
}

export type DamageBaseBreakdown = {
  mainStatName: string
  mainStatValue: number
  skillPercent: number
  secondStatName: string
  secondStatValue: number
  secondSkillPercent: number
  baseRaw: number
  baseDamage: number
  enemyArmor: number
  armorIgnorePercent: number
  armorBlock: number
  armorBreakBase: number
  skillArmorBreakPercent: number
  skillArmorBreakAmount: number
  armorBreak: number
  mitigatedDamage: number
  elementStatName: string
  elementPercent: number
  skillElementStatName: string | null
  skillElementPercent: number
  skillTypeDamageStatName: string | null
  skillTypeDamagePercent: number
  convertedSkillTypeDamagePercent: number
  globalSkillTypeDamagePercent: number
  elementBonusPercent: number
  elementXDmgPercent: number
  penStatName: string
  penPercent: number
  skillPenPercent: number
  totalPenBonusPercent: number
  enemyRes: number
  resIgnorePercent: number
  effectiveEnemyRes: number
  penMultiplier: number
  dmgPercent: number
}

export type DamageCritBreakdown = {
  baseCritDamagePercent: number
  skillTypeCritDamageStatNames: string[]
  skillTypeCritDamagePercent: number
  convertedSkillTypeCritDamagePercent: number
  globalSkillTypeCritDamagePercent: number
  elementalCritDamagePercent: number
  holyCritDamagePercent: number
  skillCritDamagePercent: number
  damageCritDamageMultiplier: number
  skillTypeCritDamageMultiplier: number
  finalDamage: number
}

export type DamageMaxCritBreakdown = {
  overdriveMultiplier: number
  finalDamage: number
}

export type DamageAverageBreakdown = {
  baseCritChancePercent: number
  skillTypeCritChanceStatNames: string[]
  skillTypeCritChancePercent: number
  skillCritChancePercent: number
  rawCritChancePercent: number
  effectiveCritChancePercent: number
  nonCritWeight: number
  critWeight: number
  maxCritWeight: number
  finalDamage: number
}

export type DamageBreakdownResult = {
  base: DamageBaseBreakdown
  nonCrit: {
    finalDamage: number
  }
  crit: DamageCritBreakdown
  maxcrit: DamageMaxCritBreakdown
  average: DamageAverageBreakdown
}

export type DotOutcomeBreakdown = {
  baseDamage: number
  skillDotPercent: number
  elementDotStatName: string
  elementDotPercent: number
  totalDotPercent: number
  effectiveDotPercent: number
  dotMultiplier: number
  finalDamage: number
}

export type DotBreakdownResult = {
  nonCrit: DotOutcomeBreakdown
  crit: DotOutcomeBreakdown
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
  damageBreakdown: DamageBreakdownResult
  dotBreakdown: DotBreakdownResult
  threatBreakdown: ThreatBreakdownResult
}

export type ThreatOutcomeBreakdown = {
  damageThreat: number
  flatThreat: number
  combinedBaseThreat: number
  afterSkillThreat: number
  finalThreat: number
}

export type ThreatAverageBreakdown = {
  nonCritWeight: number
  critWeight: number
  maxCritWeight: number
  finalThreat: number
}

export type ThreatBreakdownResult = {
  skillThreatPercent: number
  skillThreatMultiplier: number
  bonusThreatMultiplier: number
  totalThreatMultiplier: number
  flatThreatBase: number
  flatThreatCritMultiplier: number
  overdriveMultiplier: number
  nonCrit: ThreatOutcomeBreakdown
  crit: ThreatOutcomeBreakdown
  maxcrit: ThreatOutcomeBreakdown
  average: ThreatAverageBreakdown
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
  skillThreat: 0,
  armorIgnore: 0,
  skillArmorBreak: 0,
  resIgnore: 0,
  dot: 0,
  secondSkillDmg: 0,
  enemyArmor: 0,
  enemyRes: 0,
  dungeonLevel: 1,
  bossDefPen: 0,
}

export const defaultDamageCalcCustomSkillScaling: DamageCalcCustomSkillScaling = {
  enabled: false,
  stat: "ATK",
  percent: 100,
  customValue: 0,
}

export const defaultDamageCalcState: DamageCalcState = {
  schemaVersion: DAMAGE_CALC_SCHEMA_VERSION,
  attackPreset: "",
  mainStat: "ATK",
  secondStat: "DEF",
  element: "Blunt",
  penElement: "Blunt",
  skillType: "N/A",
  customSkillScaling: defaultDamageCalcCustomSkillScaling,
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

const isCustomSkillScalingSource = (value: unknown): value is string =>
  typeof value === "string" && damageCalcCustomSkillScalingSourceSet.has(value)

const getHighestStatValue = (stats: Record<string, number>, statNames: readonly string[]): number =>
  statNames.reduce((highest, statName) => Math.max(highest, stats[statName] ?? 0), 0)

export function getDamageCalcCustomSkillScalingSourceValue(
  stats: Record<string, number>,
  customSkillScaling: DamageCalcCustomSkillScaling,
): number {
  if (customSkillScaling.stat === DAMAGE_CALC_CUSTOM_SKILL_SCALING_CUSTOM_SOURCE) {
    return customSkillScaling.customValue
  }

  if (customSkillScaling.stat in dynamicSkillScalingSourceGroups) {
    return getHighestStatValue(
      stats,
      dynamicSkillScalingSourceGroups[customSkillScaling.stat as keyof typeof dynamicSkillScalingSourceGroups],
    )
  }

  return stats[customSkillScaling.stat] ?? 0
}

export function getDamageCalcEffectiveSkillDmgPercent(
  stats: Record<string, number>,
  inputs: DamageCalcInputs,
  customSkillScaling: DamageCalcCustomSkillScaling,
): number {
  if (!customSkillScaling.enabled) {
    return inputs.skillDmg
  }

  return getDamageCalcCustomSkillScalingSourceValue(stats, customSkillScaling) * (customSkillScaling.percent / 100)
}

export function normalizeDamageCalcState(raw: unknown): DamageCalcState {
  const data = typeof raw === "object" && raw !== null ? raw as Partial<DamageCalcState> : {}
  const rawInputs = typeof data.inputs === "object" && data.inputs !== null ? data.inputs as Partial<DamageCalcInputs> : {}
  const rawCustomSkillScaling =
    typeof data.customSkillScaling === "object" && data.customSkillScaling !== null
      ? data.customSkillScaling as Partial<DamageCalcCustomSkillScaling>
      : {}
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
    customSkillScaling: {
      enabled:
        typeof rawCustomSkillScaling.enabled === "boolean"
          ? rawCustomSkillScaling.enabled
          : defaultDamageCalcCustomSkillScaling.enabled,
      stat:
        isCustomSkillScalingSource(rawCustomSkillScaling.stat)
          ? rawCustomSkillScaling.stat
          : defaultDamageCalcCustomSkillScaling.stat,
      percent: asFiniteNumber(rawCustomSkillScaling.percent, defaultDamageCalcCustomSkillScaling.percent),
      customValue: asFiniteNumber(rawCustomSkillScaling.customValue, defaultDamageCalcCustomSkillScaling.customValue),
    },
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
const DAMAGE_CALC_PLAYER_LEVEL_STAT = "__Player Level"
const DAMAGE_REDUCTION_CAP_PERCENT = 90
const DAMAGE_REDUCTION_SCALE_PERCENT = 15
const DEFENSE_SCALING_BASE = 12
const DEFENSE_SCALING_DIVISOR = 15
const skillCritDamageBonusStatsBySkillType: Record<string, string[]> = {
  Bow: ["Bow Crit DMG%"],
  Dagger: ["Dagger Crit DMG%"],
  Fist: ["Fist Crit DMG%"],
}
const skillDamageStatsBySkillType: Partial<Record<string, string>> = {
  Sword: "Sword DMG%",
  Spear: "Spear DMG%",
  Hammer: "Hammer DMG%",
  Fist: "Fist DMG%",
  Dagger: "Dagger DMG%",
  Fire: "Fire DMG%",
  "Shadow Break": "Shadow Break DMG%",
}
const skillCritChanceStatsBySkillType: Record<string, string[]> = {
  Bow: ["Bow Crit Chance%"],
  "Shadow Break": ["Shadow Break Crit Chance%"],
}

function getTotalStatValue(stats: Record<string, number>, statNames: readonly string[]): number {
  return statNames.reduce((sum, statName) => sum + (stats[statName] ?? 0), 0)
}

function getSkillTypeDamageBonus(stats: Record<string, number>, skillType: string): number {
  const statName = skillDamageStatsBySkillType[skillType]
  return statName ? (stats[statName] ?? 0) : 0
}

function getConvertedSkillTypeDamageBonus(stats: Record<string, number>, skillType: string): number {
  const statName = skillDamageStatsBySkillType[skillType]
  return statName ? (stats[`__Converted ${statName}`] ?? 0) : 0
}

function getGlobalSkillTypeDamageBonus(stats: Record<string, number>, skillType: string): number {
  return getSkillTypeDamageBonus(stats, skillType) - getConvertedSkillTypeDamageBonus(stats, skillType)
}

function getConvertedSkillTypeCritDamageBonus(stats: Record<string, number>, skillType: string): number {
  return (skillCritDamageBonusStatsBySkillType[skillType] ?? []).reduce(
    (sum, statName) => sum + (stats[`__Converted ${statName}`] ?? 0),
    0,
  )
}

function getGlobalSkillTypeCritDamageBonus(stats: Record<string, number>, skillType: string): number {
  return getTotalStatValue(stats, skillCritDamageBonusStatsBySkillType[skillType] ?? [])
    - getConvertedSkillTypeCritDamageBonus(stats, skillType)
}

function getSkillTypeElementStatName(skillType: string): string | null {
  if (skillType === "N/A") {
    return null
  }

  const statName = `${skillType}%`
  return statName in stat_data.StatsInfo ? statName : null
}

function getElementDamageBonus(stats: Record<string, number>, element: string, skillType: string): number {
  const bonus =
    (stats[`${element}%`] ?? 0)
    + (stats[`${skillType}%`] ?? 0)
    + getConvertedSkillTypeDamageBonus(stats, skillType)
  return bonus
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
  penElement: string,
  skillType: string,
  skillPen: number,
): number {
  let result = baseThreat
  result = Math.floor(result * toMult(getElementDamageBonus(stats, element, skillType)))
  result = Math.floor(result * toMult((stats[`${penElement} Pen%`] ?? 0) + skillPen))
  result = Math.floor(result * toMult(stats[`${element} xDmg%`]))
  result = Math.floor(result * toMult(getGlobalSkillTypeDamageBonus(stats, skillType)))
  return result
}

type NormalizedDamageContext = {
  stats: Record<string, number>
  mainStat: string
  secondStat: string
  element: string
  penElement: string
  skillType: string
  inputs: DamageCalcInputs
  effectiveSkillDmg: number
  baseBreakdown: DamageBaseBreakdown
}

function buildDamageContext(stats: Record<string, number>, state: DamageCalcState): NormalizedDamageContext {
  const { mainStat, secondStat, element, penElement, skillType, customSkillScaling, inputs } = normalizeDamageCalcState(state)
  const effectiveSkillDmg = getDamageCalcEffectiveSkillDmgPercent(stats, inputs, customSkillScaling)
  const mainStatValue = stats[mainStat] ?? 0
  const secondStatValue = stats[secondStat] ?? 0

  const baseRaw =
    (mainStatValue * (effectiveSkillDmg / 100))
    + (secondStatValue * (inputs.secondSkillDmg / 100))
  const base = Math.floor(baseRaw)

  const armorBlock = Math.floor((inputs.enemyArmor ?? 0) * toRemainingPercent(inputs.armorIgnore))
  const armorBreakBase =
    Math.floor(((stats["ATK"] ?? 0) + (stats["DEF"] ?? 0) + (stats["MATK"] ?? 0) + (stats["HEAL"] ?? 0)) / 4)
    + (stats["Armor Strike"] ?? 0)
  const skillArmorBreakPercent = inputs.skillArmorBreak ?? 0
  const rawSkillArmorBreakAmount = (inputs.enemyArmor ?? 0) * (skillArmorBreakPercent / 100)
  const minimumSkillArmorBreak = Math.max(0, Math.floor(stats[DAMAGE_CALC_PLAYER_LEVEL_STAT] ?? 0))
  const skillArmorBreakAmount =
    skillArmorBreakPercent > 0
      ? Math.max(minimumSkillArmorBreak, Math.floor(rawSkillArmorBreakAmount))
      : Math.floor(rawSkillArmorBreakAmount)
  const armorBreak = armorBreakBase + skillArmorBreakAmount
  // Only deal dmg if the skill itself has a dmg%
  const mitigatedDamage = base <= 0
    ? 0
    : Math.max(0, Math.floor(base - (armorBlock - armorBreak)))
  const elementStatName = `${element}%`
  const elementPercent = stats[elementStatName] ?? 0
  const skillElementStatName = getSkillTypeElementStatName(skillType)
  const skillElementPercent = skillElementStatName ? (stats[skillElementStatName] ?? 0) : 0
  const skillTypeDamageStatName = skillDamageStatsBySkillType[skillType] ?? null
  const skillTypeDamagePercent = skillTypeDamageStatName ? (stats[skillTypeDamageStatName] ?? 0) : 0
  const convertedSkillTypeDamagePercent = getConvertedSkillTypeDamageBonus(stats, skillType)
  const globalSkillTypeDamagePercent = getGlobalSkillTypeDamageBonus(stats, skillType)
  const elementBonusPercent = elementPercent + skillElementPercent + convertedSkillTypeDamagePercent
  const elementXDmgPercent = stats[`${element} xDmg%`] ?? 0
  const penStatName = `${penElement} Pen%`
  const penPercent = stats[penStatName] ?? 0
  const skillPenPercent = inputs.skillPen ?? 0
  const totalPenBonusPercent = penPercent + skillPenPercent
  const enemyRes = inputs.enemyRes ?? 0
  const resIgnorePercent = inputs.resIgnore ?? 0
  const effectiveEnemyRes = enemyRes * toRemainingPercent(inputs.resIgnore)
  const penMultiplier = Math.max(0, 1 + (totalPenBonusPercent / 100) - (effectiveEnemyRes / 100))
  const dmgPercent = stats["Dmg%"] ?? 0

  return {
    stats,
    mainStat,
    secondStat,
    element,
    penElement,
    skillType,
    inputs,
    effectiveSkillDmg,
    baseBreakdown: {
      mainStatName: mainStat,
      mainStatValue,
      skillPercent: effectiveSkillDmg,
      secondStatName: secondStat,
      secondStatValue,
      secondSkillPercent: inputs.secondSkillDmg ?? 0,
      baseRaw,
      baseDamage: base,
      enemyArmor: inputs.enemyArmor ?? 0,
      armorIgnorePercent: inputs.armorIgnore ?? 0,
      armorBlock,
      armorBreakBase,
      skillArmorBreakPercent,
      skillArmorBreakAmount,
      armorBreak,
      mitigatedDamage,
      elementStatName,
      elementPercent,
      skillElementStatName,
      skillElementPercent,
      skillTypeDamageStatName,
      skillTypeDamagePercent,
      convertedSkillTypeDamagePercent,
      globalSkillTypeDamagePercent,
      elementBonusPercent,
      elementXDmgPercent,
      penStatName,
      penPercent,
      skillPenPercent,
      totalPenBonusPercent,
      enemyRes,
      resIgnorePercent,
      effectiveEnemyRes,
      penMultiplier,
      dmgPercent,
    },
  }
}

function finalizeDamageResult(nonCrit: number, context: NormalizedDamageContext): DamageCalcResult {
  const { stats, element, penElement, skillType, inputs, baseBreakdown } = context
  const skillTypeCritDamageStatNames = skillCritDamageBonusStatsBySkillType[skillType] ?? []
  const skillTypeCritDamagePercent = getTotalStatValue(stats, skillTypeCritDamageStatNames)
  const convertedSkillTypeCritDamagePercent = getConvertedSkillTypeCritDamageBonus(stats, skillType)
  const globalSkillTypeCritDamagePercent = getGlobalSkillTypeCritDamageBonus(stats, skillType)
  const elementalCritDamagePercent = stat_data.Elemental.includes(element) ? (stats["Elemental Crit DMG%"] ?? 0) : 0
  const holyCritDamagePercent = element === "Holy" ? (stats["Holy Crit DMG%"] ?? 0) : 0
  const skillTypeCritDamageBonus = convertedSkillTypeCritDamagePercent
    + elementalCritDamagePercent
    + holyCritDamagePercent
  const baseCritDamagePercent = stats["Crit DMG%"] ?? 0
  const skillTypeCritDamageMultiplier = toMult(globalSkillTypeCritDamagePercent)
  const baseCritDamageBonus = baseCritDamagePercent + skillTypeCritDamageBonus
  const damageCritDamageMultiplier = Math.max(0, (baseCritDamageBonus / 100) * toMult(inputs.skillCritDmg ?? 0))
  const threatCritDamageMultiplier = Math.max(0, damageCritDamageMultiplier * skillTypeCritDamageMultiplier)

  const crit = Math.floor(Math.floor(nonCrit * damageCritDamageMultiplier) * skillTypeCritDamageMultiplier)
  const maxcrit = Math.floor(crit * ((stats["Overdrive%"] ?? 0) / 100))

  const skillTypeCritChanceStatNames = skillCritChanceStatsBySkillType[skillType] ?? []
  const skillTypeCritChancePercent = getTotalStatValue(stats, skillTypeCritChanceStatNames)
  const baseCritChancePercent = stats["Crit Chance%"] ?? 0
  const skillCritChancePercent = inputs.skillCritChance ?? 0
  const rawCritChancePercent = baseCritChancePercent + skillTypeCritChancePercent + skillCritChancePercent
  const totalCritChance = rawCritChancePercent * stat_data.StatsInfo["Crit Chance%"].multi
  const critChance = clamp(totalCritChance, 0, 2)
  const effectiveCritChancePercent = critChance * 100

  const nonCritWeight = 1 - clamp(critChance, 0, 1)
  const maxCritWeight = clamp(critChance - 1, 0, 1)
  const critWeight = clamp(critChance, 0, 1) - maxCritWeight

  const average = Math.floor(nonCrit * nonCritWeight + crit * critWeight + maxcrit * maxCritWeight)

  const elementDotStatName = `${element} DOT%`
  const elementDotPercent = stats[elementDotStatName] ?? 0
  const totalDotPercent = (inputs.dot ?? 0) + elementDotPercent
  const effectiveDotPercent = Math.max(0, totalDotPercent)
  const dotMult = effectiveDotPercent / 100
  const dotNonCrit = Math.floor(nonCrit * dotMult)
  const dotCrit = Math.floor(crit * dotMult)

  const flatThreatBase = Math.floor((stats["DEF"] ?? 0) * ((inputs.threatDef ?? 0) / 100))
  const flatThreatWithOffenseScaling = applyThreatOffenseMultipliers(
    flatThreatBase,
    stats,
    element,
    penElement,
    skillType,
    inputs.skillPen ?? 0,
  )
  const bonusThreatMultiplier = getThreatBonusMultiplier(stats)
  const totalThreatMultiplier = getThreatMultiplier(stats)
  const skillThreatMultiplier = Math.max(0, toMult(inputs.skillThreat ?? 0))
  const overdriveMultiplier = Math.max(0, (stats["Overdrive%"] ?? 0) / 100)
  const flatThreatCrit = Math.floor(flatThreatWithOffenseScaling * threatCritDamageMultiplier)
  const flatThreatMaxcrit = Math.floor(flatThreatCrit * overdriveMultiplier)

  const buildThreatOutcome = (
    damageThreat: number,
    flatThreat: number,
  ): ThreatOutcomeBreakdown => {
    const damageThreatAfterSkill = Math.floor(damageThreat * skillThreatMultiplier)
    const flatThreatAfterSkill = Math.floor(flatThreat * skillThreatMultiplier)
    const combinedBaseThreat = damageThreat + flatThreat
    const afterSkillThreat = damageThreatAfterSkill + flatThreatAfterSkill
    // Damage-based threat only uses the displayed threat bonus.
    // Flat DEF-based threat also includes tank-level threat scaling.
    const finalDamageThreat = Math.floor(damageThreatAfterSkill * bonusThreatMultiplier)
    const finalFlatThreat = Math.floor(flatThreatAfterSkill * totalThreatMultiplier)
    const finalThreat = finalDamageThreat + finalFlatThreat

    return {
      damageThreat,
      flatThreat,
      combinedBaseThreat,
      afterSkillThreat,
      finalThreat,
    }
  }

  const threatNonCritBreakdown = buildThreatOutcome(nonCrit, flatThreatWithOffenseScaling)
  const threatCritBreakdown = buildThreatOutcome(crit, flatThreatCrit)
  const threatMaxcritBreakdown = buildThreatOutcome(maxcrit, flatThreatMaxcrit)
  const threatNonCrit = threatNonCritBreakdown.finalThreat
  const threatCrit = threatCritBreakdown.finalThreat
  const threatMaxcrit = threatMaxcritBreakdown.finalThreat
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
    damageBreakdown: {
      base: baseBreakdown,
      nonCrit: {
        finalDamage: nonCrit,
      },
      crit: {
        baseCritDamagePercent,
        skillTypeCritDamageStatNames,
        skillTypeCritDamagePercent,
        convertedSkillTypeCritDamagePercent,
        globalSkillTypeCritDamagePercent,
        elementalCritDamagePercent,
        holyCritDamagePercent,
        skillCritDamagePercent: inputs.skillCritDmg ?? 0,
        damageCritDamageMultiplier,
        skillTypeCritDamageMultiplier,
        finalDamage: crit,
      },
      maxcrit: {
        overdriveMultiplier,
        finalDamage: maxcrit,
      },
      average: {
        baseCritChancePercent,
        skillTypeCritChanceStatNames,
        skillTypeCritChancePercent,
        skillCritChancePercent,
        rawCritChancePercent,
        effectiveCritChancePercent,
        nonCritWeight,
        critWeight,
        maxCritWeight,
        finalDamage: average,
      },
    },
    dotBreakdown: {
      nonCrit: {
        baseDamage: nonCrit,
        skillDotPercent: inputs.dot ?? 0,
        elementDotStatName,
        elementDotPercent,
        totalDotPercent,
        effectiveDotPercent,
        dotMultiplier: dotMult,
        finalDamage: dotNonCrit,
      },
      crit: {
        baseDamage: crit,
        skillDotPercent: inputs.dot ?? 0,
        elementDotStatName,
        elementDotPercent,
        totalDotPercent,
        effectiveDotPercent,
        dotMultiplier: dotMult,
        finalDamage: dotCrit,
      },
    },
    threatBreakdown: {
      skillThreatPercent: inputs.skillThreat ?? 0,
      skillThreatMultiplier,
      bonusThreatMultiplier,
      totalThreatMultiplier,
      flatThreatBase: flatThreatWithOffenseScaling,
      flatThreatCritMultiplier: threatCritDamageMultiplier,
      overdriveMultiplier,
      nonCrit: threatNonCritBreakdown,
      crit: threatCritBreakdown,
      maxcrit: threatMaxcritBreakdown,
      average: {
        nonCritWeight,
        critWeight,
        maxCritWeight,
        finalThreat: threatAverage,
      },
    },
  }
}

export function calculateDamage(stats: Record<string, number>, state: DamageCalcState): DamageCalcResult {
  const context = buildDamageContext(stats, state)
  const { baseBreakdown } = context

  let dmg = baseBreakdown.mitigatedDamage
  dmg = Math.floor(dmg * toMult(baseBreakdown.elementBonusPercent))
  dmg = Math.floor(dmg * toMult(baseBreakdown.elementXDmgPercent))
  dmg = Math.floor(dmg * baseBreakdown.penMultiplier)
  dmg = Math.floor(dmg * toMult(baseBreakdown.globalSkillTypeDamagePercent))
  dmg = Math.floor(dmg * toMult(baseBreakdown.dmgPercent))

  return finalizeDamageResult(Math.max(0, dmg), context)
}

export function formatSignedDamageDelta(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "..."
  return `${value >= 0 ? "+" : "-"}${Math.abs(Math.trunc(value)).toLocaleString("en-US")}`
}
