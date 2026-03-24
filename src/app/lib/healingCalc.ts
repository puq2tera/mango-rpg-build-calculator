import type { HealingBaseStat } from "@/app/lib/healingCalcSkillPresets"

export type HealingCalcInputs = {
  baseStat: HealingBaseStat
  totalStat: number
  skillHealPercent: number
  skillFlatHeal: number
}

export type HealingCalcResult = {
  baseStat: HealingBaseStat
  totalStat: number
  skillHealPercent: number
  skillFlatHeal: number
  nonCrit: number
  crit: number
  average: number
}

export function calculateHealing({
  baseStat,
  totalStat,
  skillHealPercent,
  skillFlatHeal,
}: HealingCalcInputs): HealingCalcResult {
  const roundedHeal = Math.round((totalStat * (skillHealPercent / 100)) + skillFlatHeal)

  return {
    baseStat,
    totalStat,
    skillHealPercent,
    skillFlatHeal,
    nonCrit: roundedHeal,
    crit: roundedHeal,
    average: roundedHeal,
  }
}
