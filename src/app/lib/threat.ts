export const THREAT_BASE_STAT = "Threat Base%"
export const THREAT_BONUS_STAT = "Threat%"

function hasOwnStat(stats: Record<string, number>, stat: string): boolean {
  return Object.prototype.hasOwnProperty.call(stats, stat)
}

export function getTotalThreatModifierPercent(stats: Record<string, number>): number {
  if (hasOwnStat(stats, THREAT_BASE_STAT)) {
    return (stats[THREAT_BASE_STAT] ?? 100) + (stats[THREAT_BONUS_STAT] ?? 0)
  }

  return hasOwnStat(stats, THREAT_BONUS_STAT) ? (stats[THREAT_BONUS_STAT] ?? 0) : 100
}

export function getDisplayedThreatModifierPercent(stats: Record<string, number>): number {
  if (hasOwnStat(stats, THREAT_BASE_STAT)) {
    return getTotalThreatModifierPercent(stats) - 100
  }

  if (!hasOwnStat(stats, THREAT_BONUS_STAT)) {
    return 0
  }

  const threatValue = stats[THREAT_BONUS_STAT] ?? 0
  return Math.abs(threatValue) >= 100 ? threatValue - 100 : threatValue
}

export function getThreatMultiplier(stats: Record<string, number>): number {
  return Math.max(0, getTotalThreatModifierPercent(stats) / 100)
}

export function isInternalThreatStat(stat: string): boolean {
  return stat === THREAT_BASE_STAT
}
