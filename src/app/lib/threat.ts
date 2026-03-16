export const THREAT_BASE_STAT = "Threat Base%"
export const THREAT_LEVELS_STAT = "Threat Levels%"
export const THREAT_BONUS_STAT = "Threat%"
export const THREAT_BONUS_DISPLAY_STAT = "Threat Bonus%"

function hasOwnStat(stats: Record<string, number>, stat: string): boolean {
  return Object.prototype.hasOwnProperty.call(stats, stat)
}

function getLegacyDisplayedThreatBonusModifierPercent(stats: Record<string, number>): number {
  const threatValue = stats[THREAT_BONUS_STAT] ?? 0
  return Math.abs(threatValue) >= 100 ? threatValue : 100 + threatValue
}

export function getTotalThreatModifierPercent(stats: Record<string, number>): number {
  if (hasOwnStat(stats, THREAT_BASE_STAT)) {
    return (stats[THREAT_BASE_STAT] ?? 100) + (stats[THREAT_BONUS_STAT] ?? 0)
  }

  return hasOwnStat(stats, THREAT_BONUS_STAT) ? (stats[THREAT_BONUS_STAT] ?? 0) : 100
}

export function getDisplayedThreatLevelModifierPercent(stats: Record<string, number>): number {
  if (hasOwnStat(stats, THREAT_LEVELS_STAT)) {
    return stats[THREAT_LEVELS_STAT] ?? 0
  }

  if (!hasOwnStat(stats, THREAT_BASE_STAT)) {
    return 0
  }

  return (stats[THREAT_BASE_STAT] ?? 100) - 100
}

export function getDisplayedThreatBonusModifierPercent(stats: Record<string, number>): number {
  if (hasOwnStat(stats, THREAT_BASE_STAT)) {
    return 100 + (stats[THREAT_BONUS_STAT] ?? 0)
  }

  if (!hasOwnStat(stats, THREAT_BONUS_STAT)) {
    return 100
  }

  return getLegacyDisplayedThreatBonusModifierPercent(stats)
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
  return stat === THREAT_BASE_STAT || stat === THREAT_LEVELS_STAT
}
