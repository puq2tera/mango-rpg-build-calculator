import type { HealingBaseStat } from "@/app/lib/healingCalcSkillPresets"

export type HealingCalcInputs = {
  baseStat: HealingBaseStat
  totalStat: number
  skillHealPercent: number
  skillFlatHeal: number
  critChancePercent: number
  critDamagePercent: number
  overdrivePercent: number
  canCrit: boolean
}

export type HealingBreakdown = {
  baseHealRaw: number
  roundedBaseHeal: number
  effectiveCritChancePercent: number
  critMultiplier: number
  overdriveMultiplier: number
  nonCritWeight: number
  critWeight: number
  maxCritWeight: number
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
  breakdown: HealingBreakdown
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
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
}: HealingCalcInputs): HealingCalcResult {
  const baseHealRaw = (totalStat * (skillHealPercent / 100)) + skillFlatHeal
  const roundedHeal = Math.round(baseHealRaw)
  const normalizedCritChancePercent = Number.isFinite(critChancePercent) ? critChancePercent : 0
  const normalizedCritDamagePercent = Number.isFinite(critDamagePercent) ? critDamagePercent : 0
  const normalizedOverdrivePercent = Number.isFinite(overdrivePercent) ? overdrivePercent : 0
  const critMultiplier = Math.max(0, normalizedCritDamagePercent / 100)
  const overdriveMultiplier = Math.max(0, normalizedOverdrivePercent / 100)

  if (!canCrit) {
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
      breakdown: {
        baseHealRaw,
        roundedBaseHeal: roundedHeal,
        effectiveCritChancePercent: 0,
        critMultiplier,
        overdriveMultiplier,
        nonCritWeight: 1,
        critWeight: 0,
        maxCritWeight: 0,
      },
    }
  }

  const crit = Math.floor(roundedHeal * critMultiplier)
  const maxcrit = Math.floor(crit * overdriveMultiplier)
  const totalCritChance = normalizedCritChancePercent / 100
  const critChance = clamp(totalCritChance, 0, 2)
  const nonCritWeight = 1 - clamp(critChance, 0, 1)
  const maxCritWeight = clamp(critChance - 1, 0, 1)
  const critWeight = clamp(critChance, 0, 1) - maxCritWeight
  const average = Math.floor(roundedHeal * nonCritWeight + crit * critWeight + maxcrit * maxCritWeight)

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
    breakdown: {
      baseHealRaw,
      roundedBaseHeal: roundedHeal,
      effectiveCritChancePercent: critChance * 100,
      critMultiplier,
      overdriveMultiplier,
      nonCritWeight,
      critWeight,
      maxCritWeight,
    },
  }
}
