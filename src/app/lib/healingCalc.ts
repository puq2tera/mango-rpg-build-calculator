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
  const roundedHeal = Math.round((totalStat * (skillHealPercent / 100)) + skillFlatHeal)
  const normalizedCritChancePercent = Number.isFinite(critChancePercent) ? critChancePercent : 0
  const normalizedCritDamagePercent = Number.isFinite(critDamagePercent) ? critDamagePercent : 0
  const normalizedOverdrivePercent = Number.isFinite(overdrivePercent) ? overdrivePercent : 0

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
    }
  }

  const crit = Math.floor(roundedHeal * Math.max(0, normalizedCritDamagePercent / 100))
  const maxcrit = Math.floor(crit * Math.max(0, normalizedOverdrivePercent / 100))
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
  }
}
