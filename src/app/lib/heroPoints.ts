import { race_data_by_tag } from "@/app/data/race_data"
import { talent_data } from "@/app/data/talent_data"

const HERO_POINT_START_LEVEL = 100

export type HeroPointAvailability = {
  availablePoints: number
  baseScaling: number
  humanScaling: number
  talentBonus: number
}

export function isHumanRace(selectedRace: string | null): boolean {
  if (!selectedRace || !(selectedRace in race_data_by_tag)) {
    return false
  }

  return race_data_by_tag[selectedRace as keyof typeof race_data_by_tag].isHuman
}

export function getTalentHeroPointBonus(selectedTalentNames: readonly string[]): number {
  return selectedTalentNames.reduce((sum, talentName) => {
    const bonus = talent_data[talentName]?.stats["Hero Points"] ?? 0
    return sum + bonus
  }, 0)
}

export function calculateHeroPointAvailability(
  totalLevels: number,
  selectedRace: string | null,
  selectedTalentNames: readonly string[],
): HeroPointAvailability {
  const normalizedLevels = Number.isFinite(totalLevels) ? Math.max(0, Math.floor(totalLevels)) : 0
  const levelsAboveThreshold = Math.max(0, normalizedLevels - HERO_POINT_START_LEVEL)
  const baseScaling = Math.ceil(levelsAboveThreshold / 2)
  // Humanoids keep the shared every-other-level gain and also get +1 hero point per level above 100.
  const humanScaling = isHumanRace(selectedRace) ? levelsAboveThreshold : 0
  const talentBonus = getTalentHeroPointBonus(selectedTalentNames)

  return {
    availablePoints: Math.max(0, baseScaling + humanScaling + talentBonus),
    baseScaling,
    humanScaling,
    talentBonus,
  }
}
