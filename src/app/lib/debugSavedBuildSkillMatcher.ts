"use client"

import type { StoredBuildData, StoredBuildProfile } from "@/app/lib/buildStorage"
import { computeBuildStatStages, readBuildSnapshot } from "@/app/lib/buildStats"
import {
  calculateDamage,
  defaultDamageCalcCustomSkillScaling,
  readDamageCalcState,
  type DamageCalcResult,
} from "@/app/lib/damageCalc"
import {
  getDamageCalcAttackPresets,
  type DamageCalcAttackPreset,
} from "@/app/lib/damageCalcAttackPresets"

export type SavedBuildComparisonMode = "nonCrit" | "crit" | "average" | "maxcrit" | "threat"

export type SavedBuildCalculatedResult = {
  profile: StoredBuildProfile
  presets: DamageCalcAttackPreset[]
  presetsByName: Map<string, DamageCalcAttackPreset>
  baseDamageState: ReturnType<typeof readDamageCalcState>
  stats: Record<string, number>
}

export const savedBuildComparisonModeOptions: Array<{
  key: SavedBuildComparisonMode
  label: string
}> = [
  { key: "nonCrit", label: "Non-Crit" },
  { key: "crit", label: "Crit" },
  { key: "average", label: "Avg" },
  { key: "maxcrit", label: "Maximized" },
  { key: "threat", label: "Threat" },
]

function createStoredBuildDataStorage(data: StoredBuildData): Storage {
  const entries = new Map(Object.entries(data))

  return {
    get length() {
      return entries.size
    },
    clear() {
      entries.clear()
    },
    getItem(key: string) {
      return entries.get(key) ?? null
    },
    key(index: number) {
      return Array.from(entries.keys())[index] ?? null
    },
    removeItem(key: string) {
      entries.delete(key)
    },
    setItem(key: string, value: string) {
      entries.set(key, value)
    },
  } as Storage
}

export function buildSavedBuildCalculatedResults(
  profiles: readonly StoredBuildProfile[],
): SavedBuildCalculatedResult[] {
  return profiles.map((profile) => {
    const storage = createStoredBuildDataStorage(profile.data)
    const snapshot = readBuildSnapshot(storage)
    const stats = computeBuildStatStages(snapshot).StatsDmgReady
    const baseDamageState = readDamageCalcState(storage)
    const presets = getDamageCalcAttackPresets(stats)

    return {
      profile,
      presets,
      presetsByName: new Map(presets.map((preset) => [preset.name, preset])),
      baseDamageState,
      stats,
    }
  })
}

export function calculateSavedBuildSkillResult(
  build: SavedBuildCalculatedResult,
  skillName: string,
): DamageCalcResult | null {
  const preset = build.presetsByName.get(skillName)

  if (!preset) {
    return null
  }

  return calculateDamage(build.stats, {
    ...build.baseDamageState,
    attackPreset: preset.name,
    mainStat: preset.mainStat,
    secondStat: preset.secondStat,
    element: preset.element,
    penElement: preset.penElement,
    skillType: preset.skillType,
    customSkillScaling: {
      ...defaultDamageCalcCustomSkillScaling,
      enabled: false,
    },
    inputs: {
      ...build.baseDamageState.inputs,
      ...preset.inputs,
    },
  })
}

export function getSavedBuildCalculatedValue(
  result: DamageCalcResult,
  mode: SavedBuildComparisonMode,
): number {
  switch (mode) {
    case "nonCrit":
      return result.nonCrit
    case "crit":
      return result.crit
    case "average":
      return result.average
    case "maxcrit":
      return result.maxcrit
    case "threat":
      return result.threatMaxcrit
  }
}
