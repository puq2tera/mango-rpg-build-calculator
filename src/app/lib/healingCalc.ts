import { healingBaseStats, type HealingBaseStat } from "@/app/lib/healingCalcSkillPresets"

export const HEALING_CALC_STORAGE_KEY = "HealingCalcState"
const HEALING_CALC_SCHEMA_VERSION = 1

export type HealingCalcInputs = {
  baseStat: HealingBaseStat
  totalStat: number
  skillHealPercent: number
  skillFlatHeal: number
  critChancePercent: number
  critDamagePercent: number
  overdrivePercent: number
  canCrit: boolean
  threatPercent?: number
  threatBonusMultiplier?: number
}

export type HealingBreakdown = {
  flatHeal: number
  scalingHealRaw: number
  scalingHeal: number
  effectiveCritChancePercent: number
  critBonusPercent: number
  critMultiplier: number
  overdriveMultiplier: number
  nonCritWeight: number
  critWeight: number
  maxCritWeight: number
}

export type HealingThreatOutcomeBreakdown = {
  healAmount: number
  baseThreat: number
  afterSkillThreat: number
  finalThreat: number
}

export type HealingThreatBreakdown = {
  baseThreatMultiplier: number
  skillThreatPercent: number
  skillThreatMultiplier: number
  bonusThreatMultiplier: number
  nonCrit: HealingThreatOutcomeBreakdown
  crit: HealingThreatOutcomeBreakdown
  maxcrit: HealingThreatOutcomeBreakdown
  average: {
    nonCritWeight: number
    critWeight: number
    maxCritWeight: number
    finalThreat: number
  }
}

export type HealingCalcManualOverrides = {
  effectiveStat: boolean
  totalStat: boolean
  critChancePercent: boolean
  critDamagePercent: boolean
  overdrivePercent: boolean
}

export type HealingCalcState = {
  schemaVersion?: number
  selectedSkill: string
  baseStat: HealingBaseStat
  skillHealPercent: number
  skillFlatHeal: number
  critChancePercent: number
  critDamagePercent: number
  overdrivePercent: number
  canCrit: boolean
  effectiveStat: number
  totalStat: number
  threatPercent: number
  manualOverrides: HealingCalcManualOverrides
}

export type HealingCalcResult = {
  baseStat: HealingBaseStat
  totalStat: number
  skillHealPercent: number
  skillFlatHeal: number
  critChancePercent: number
  critDamagePercent: number
  overdrivePercent: number
  canCrit: boolean
  nonCrit: number
  crit: number
  maxcrit: number
  average: number
  threatNonCrit: number
  threatCrit: number
  threatMaxcrit: number
  threatAverage: number
  breakdown: HealingBreakdown
  threatBreakdown: HealingThreatBreakdown
}

export const defaultHealingCalcManualOverrides: HealingCalcManualOverrides = {
  effectiveStat: false,
  totalStat: false,
  critChancePercent: false,
  critDamagePercent: false,
  overdrivePercent: false,
}

export const defaultHealingCalcState: HealingCalcState = {
  schemaVersion: HEALING_CALC_SCHEMA_VERSION,
  selectedSkill: "",
  baseStat: "HEAL",
  skillHealPercent: 0,
  skillFlatHeal: 0,
  critChancePercent: 0,
  critDamagePercent: 0,
  overdrivePercent: 0,
  canCrit: true,
  effectiveStat: 0,
  totalStat: 0,
  threatPercent: 0,
  manualOverrides: defaultHealingCalcManualOverrides,
}

const HEALING_CRIT_BONUS_EFFECTIVENESS = 0.25
const HEALING_BASE_THREAT_MULTIPLIER = 6

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

const parseStoredJson = <T>(raw: string | null, fallback: T): T => {
  if (!raw) {
    return fallback
  }

  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

const asFiniteNumber = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback

function isHealingBaseStat(value: unknown): value is HealingBaseStat {
  return typeof value === "string" && healingBaseStats.includes(value as HealingBaseStat)
}

export function normalizeHealingCalcState(raw: unknown): HealingCalcState {
  const data = typeof raw === "object" && raw !== null ? raw as Partial<HealingCalcState> : {}
  const rawManualOverrides =
    typeof data.manualOverrides === "object" && data.manualOverrides !== null
      ? data.manualOverrides as Partial<HealingCalcManualOverrides>
      : {}

  return {
    schemaVersion: HEALING_CALC_SCHEMA_VERSION,
    selectedSkill: typeof data.selectedSkill === "string" ? data.selectedSkill : defaultHealingCalcState.selectedSkill,
    baseStat: isHealingBaseStat(data.baseStat) ? data.baseStat : defaultHealingCalcState.baseStat,
    skillHealPercent: asFiniteNumber(data.skillHealPercent, defaultHealingCalcState.skillHealPercent),
    skillFlatHeal: asFiniteNumber(data.skillFlatHeal, defaultHealingCalcState.skillFlatHeal),
    critChancePercent: asFiniteNumber(data.critChancePercent, defaultHealingCalcState.critChancePercent),
    critDamagePercent: asFiniteNumber(data.critDamagePercent, defaultHealingCalcState.critDamagePercent),
    overdrivePercent: asFiniteNumber(data.overdrivePercent, defaultHealingCalcState.overdrivePercent),
    canCrit: typeof data.canCrit === "boolean" ? data.canCrit : defaultHealingCalcState.canCrit,
    effectiveStat: asFiniteNumber(data.effectiveStat, defaultHealingCalcState.effectiveStat),
    totalStat: asFiniteNumber(data.totalStat, defaultHealingCalcState.totalStat),
    threatPercent: asFiniteNumber(data.threatPercent, defaultHealingCalcState.threatPercent),
    manualOverrides: {
      effectiveStat:
        typeof rawManualOverrides.effectiveStat === "boolean"
          ? rawManualOverrides.effectiveStat
          : defaultHealingCalcManualOverrides.effectiveStat,
      totalStat:
        typeof rawManualOverrides.totalStat === "boolean"
          ? rawManualOverrides.totalStat
          : defaultHealingCalcManualOverrides.totalStat,
      critChancePercent:
        typeof rawManualOverrides.critChancePercent === "boolean"
          ? rawManualOverrides.critChancePercent
          : defaultHealingCalcManualOverrides.critChancePercent,
      critDamagePercent:
        typeof rawManualOverrides.critDamagePercent === "boolean"
          ? rawManualOverrides.critDamagePercent
          : defaultHealingCalcManualOverrides.critDamagePercent,
      overdrivePercent:
        typeof rawManualOverrides.overdrivePercent === "boolean"
          ? rawManualOverrides.overdrivePercent
          : defaultHealingCalcManualOverrides.overdrivePercent,
    },
  }
}

export function readHealingCalcState(storage: Storage): HealingCalcState {
  return normalizeHealingCalcState(parseStoredJson(storage.getItem(HEALING_CALC_STORAGE_KEY), defaultHealingCalcState))
}

export function persistHealingCalcState(storage: Storage, state: HealingCalcState): void {
  storage.setItem(HEALING_CALC_STORAGE_KEY, JSON.stringify(normalizeHealingCalcState(state)))
}

export function calculateHealing({
  baseStat,
  totalStat,
  skillHealPercent,
  skillFlatHeal,
  critChancePercent,
  critDamagePercent,
  overdrivePercent,
  canCrit,
  threatPercent = 0,
  threatBonusMultiplier = 1,
}: HealingCalcInputs): HealingCalcResult {
  const normalizedFlatHeal = Number.isFinite(skillFlatHeal) ? skillFlatHeal : 0
  const flatHeal = Math.round(normalizedFlatHeal)
  const scalingHealRaw = totalStat * (skillHealPercent / 100)
  const scalingHeal = Math.round(scalingHealRaw)
  const roundedHeal = flatHeal + scalingHeal
  const normalizedCritChancePercent = Number.isFinite(critChancePercent) ? critChancePercent : 0
  const normalizedCritDamagePercent = Number.isFinite(critDamagePercent) ? critDamagePercent : 0
  const normalizedOverdrivePercent = Number.isFinite(overdrivePercent) ? overdrivePercent : 0
  const normalizedThreatPercent = Number.isFinite(threatPercent) ? threatPercent : 0
  const normalizedThreatBonusMultiplier = Number.isFinite(threatBonusMultiplier) ? threatBonusMultiplier : 1
  const critBonusPercent = Math.max(0, normalizedCritDamagePercent - 100)
  const critMultiplier = 1 + ((critBonusPercent / 100) * HEALING_CRIT_BONUS_EFFECTIVENESS)
  const overdriveMultiplier = Math.max(0, normalizedOverdrivePercent / 100)
  const skillThreatMultiplier = Math.max(0, 1 + (normalizedThreatPercent / 100))

  const buildThreatOutcome = (healAmount: number): HealingThreatOutcomeBreakdown => {
    const baseThreat = Math.floor(healAmount * HEALING_BASE_THREAT_MULTIPLIER)
    const afterSkillThreat = Math.floor(baseThreat * skillThreatMultiplier)
    const finalThreat = Math.floor(afterSkillThreat * Math.max(0, normalizedThreatBonusMultiplier))

    return {
      healAmount,
      baseThreat,
      afterSkillThreat,
      finalThreat,
    }
  }

  if (!canCrit) {
    const threatNonCritBreakdown = buildThreatOutcome(roundedHeal)

    return {
      baseStat,
      totalStat,
      skillHealPercent,
      skillFlatHeal,
      critChancePercent: normalizedCritChancePercent,
      critDamagePercent: normalizedCritDamagePercent,
      overdrivePercent: normalizedOverdrivePercent,
      canCrit,
      nonCrit: roundedHeal,
      crit: roundedHeal,
      maxcrit: roundedHeal,
      average: roundedHeal,
      threatNonCrit: threatNonCritBreakdown.finalThreat,
      threatCrit: threatNonCritBreakdown.finalThreat,
      threatMaxcrit: threatNonCritBreakdown.finalThreat,
      threatAverage: threatNonCritBreakdown.finalThreat,
      breakdown: {
        flatHeal,
        scalingHealRaw,
        scalingHeal,
        effectiveCritChancePercent: 0,
        critBonusPercent,
        critMultiplier,
        overdriveMultiplier,
        nonCritWeight: 1,
        critWeight: 0,
        maxCritWeight: 0,
      },
      threatBreakdown: {
        baseThreatMultiplier: HEALING_BASE_THREAT_MULTIPLIER,
        skillThreatPercent: normalizedThreatPercent,
        skillThreatMultiplier,
        bonusThreatMultiplier: Math.max(0, normalizedThreatBonusMultiplier),
        nonCrit: threatNonCritBreakdown,
        crit: threatNonCritBreakdown,
        maxcrit: threatNonCritBreakdown,
        average: {
          nonCritWeight: 1,
          critWeight: 0,
          maxCritWeight: 0,
          finalThreat: threatNonCritBreakdown.finalThreat,
        },
      },
    }
  }

  const critScalingHeal = Math.floor(scalingHeal * critMultiplier)
  const maxCritScalingHeal = Math.floor(critScalingHeal * overdriveMultiplier)
  const crit = flatHeal + critScalingHeal
  const maxcrit = flatHeal + maxCritScalingHeal
  const totalCritChance = normalizedCritChancePercent / 100
  const critChance = clamp(totalCritChance, 0, 2)
  const nonCritWeight = 1 - clamp(critChance, 0, 1)
  const maxCritWeight = clamp(critChance - 1, 0, 1)
  const critWeight = clamp(critChance, 0, 1) - maxCritWeight
  const average = Math.floor(roundedHeal * nonCritWeight + crit * critWeight + maxcrit * maxCritWeight)
  const threatNonCritBreakdown = buildThreatOutcome(roundedHeal)
  const threatCritBreakdown = buildThreatOutcome(crit)
  const threatMaxcritBreakdown = buildThreatOutcome(maxcrit)
  const threatNonCrit = threatNonCritBreakdown.finalThreat
  const threatCrit = threatCritBreakdown.finalThreat
  const threatMaxcrit = threatMaxcritBreakdown.finalThreat
  const threatAverage = Math.floor(
    threatNonCrit * nonCritWeight
      + threatCrit * critWeight
      + threatMaxcrit * maxCritWeight,
  )

  return {
    baseStat,
    totalStat,
    skillHealPercent,
    skillFlatHeal,
    critChancePercent: normalizedCritChancePercent,
    critDamagePercent: normalizedCritDamagePercent,
    overdrivePercent: normalizedOverdrivePercent,
    canCrit,
    nonCrit: roundedHeal,
    crit,
    maxcrit,
    average,
    threatNonCrit,
    threatCrit,
    threatMaxcrit,
    threatAverage,
    breakdown: {
      flatHeal,
      scalingHealRaw,
      scalingHeal,
      effectiveCritChancePercent: critChance * 100,
      critBonusPercent,
      critMultiplier,
      overdriveMultiplier,
      nonCritWeight,
      critWeight,
      maxCritWeight,
    },
    threatBreakdown: {
      baseThreatMultiplier: HEALING_BASE_THREAT_MULTIPLIER,
      skillThreatPercent: normalizedThreatPercent,
      skillThreatMultiplier,
      bonusThreatMultiplier: Math.max(0, normalizedThreatBonusMultiplier),
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
