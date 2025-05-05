// components/StatSync.tsx
"use client"

import { useEffect } from "react"
import { talent_data } from "@/app/data/talent_data"
import stat_data from "../data/stat_data"
import rune_data from "../data/rune_data"


// Stage 1 of Stat Pipeline

export function computeTalentStats() {
  console.log("Updating Talent Stats")
  const raw = localStorage.getItem("selectedTalents")
  if (!raw) return //Skip if selectedTalents doens't return anything
  try {
    const selected = new Set<string>(JSON.parse(raw))
    const stats: Record<string, number> = {}
    for (const [name, data] of Object.entries(talent_data)) {
      if (!selected.has(name)) continue
      for (const [stat, value] of Object.entries(data.stats)) {
        stats[stat] = (stats[stat] || 0) + value
      }
    }
    localStorage.setItem("StatsTalents", JSON.stringify(stats)) // Save totals to StatsTalents
    console.log(stats)
  } catch {}
}

export function computeLevelStats() {
  console.log("Updating Level Stats")
  const rawstoredLevels = localStorage.getItem('SelectedLevels')
  const rawstoredStatPoints = localStorage.getItem('SelectedStatPoints')
  const rawstoredTraining = localStorage.getItem('SelectedTraining')
  const rawstoredHeroPoints = localStorage.getItem('SelectedHeroPoints')
  if (!rawstoredLevels || !rawstoredStatPoints || !rawstoredTraining || !rawstoredHeroPoints) return
  const storedLevels: Record<string, number> = JSON.parse(rawstoredLevels)
  const storedStatPoints: Record<string, number> = JSON.parse(rawstoredStatPoints)
  const storedTraining: Record<string, number> = JSON.parse(rawstoredTraining)
  const storedHeroPoints: Record<string, number> = JSON.parse(rawstoredHeroPoints)

  const StatsLevels: Record<string, number> = {}

  // console.log(storedLevels)
  // console.log(storedStatPoints)
  // console.log(storedTraining)
  console.log(storedHeroPoints)

  // Mainstats
  for (const stat of stat_data.Mainstats) {
    StatsLevels[stat] = 5 + storedStatPoints[stat] + (4 * storedTraining[stat])
    for (const ClassName of stat_data.ClassNames) {
      StatsLevels[stat] = StatsLevels[stat] + storedLevels[ClassName]*stat_data.ClassMainStatValues[ClassName][stat]
    }
  }

  //TODO: HEROPOINT CALULATIONS


  localStorage.setItem("StatsLevels", JSON.stringify(StatsLevels))
  console.log(StatsLevels)
}


export function computeEquipmentStats() {
  console.log("Updating Equipment Stats")
  const rawSlots = localStorage.getItem("EquipmentSlots")
  const rawEnabled = localStorage.getItem("EnabledEquipment")
  if (!rawSlots || !rawEnabled) return

  try {
    const slots: {
      affixes: { stat: string; value: number }[]
      mainstat: string
      mainstat_value: number
    }[] = JSON.parse(rawSlots)

    const enabledIndices = new Set<number>(JSON.parse(rawEnabled))
    const stats: Record<string, number> = {}

    for (const [i, slot] of slots.entries()) {
      if (!enabledIndices.has(i)) continue

      // Main stat
      if (slot.mainstat && slot.mainstat_value) {
        stats[slot.mainstat] = (stats[slot.mainstat] || 0) + slot.mainstat_value
      }

      // Affixes
      for (const affix of slot.affixes) {
        if (!affix.stat) continue
        stats[affix.stat] = (stats[affix.stat] || 0) + affix.value
      }
    }

    localStorage.setItem("StatsEquipment", JSON.stringify(stats))
    console.log(stats)
  } catch (e) {
    console.error("Failed to compute equipment stats", e)
  }
}


export function computeRuneStats() {
  console.log("Updating Rune Stats")
  const rawSelectedRunes = localStorage.getItem('SelectedRunes')
  if (!rawSelectedRunes) return
  const selectedRunes: Record<string, { rune: string; count: number }[]> = JSON.parse(rawSelectedRunes)

  const stats: Record<string, number> = {}

  for (const tier in selectedRunes) {
    for (const { rune, count } of selectedRunes[tier]) {
      const runeEntry = rune_data[rune]
      if (!runeEntry) continue

      for (const [stat, value] of Object.entries(runeEntry.stats)) {
        stats[stat] = (stats[stat] || 0) + value * count
      }
    }
  }

  localStorage.setItem("StatsRunes", JSON.stringify(stats))
  console.log(stats)
}

// Combine all of stage 1
export function computeBaseStats() {
  computeLevelStats()
  computeTalentStats()
  computeRuneStats()
  computeEquipmentStats()
  console.log("Updating Base Stats")
  const rawStatsTalents = localStorage.getItem("StatsTalents")
  const rawStatsEquipment = localStorage.getItem("StatsEquipment")
  const rawStatsLevels = localStorage.getItem("StatsLevels")
  const rawStatsRunes = localStorage.getItem("StatsRunes")
  if (!rawStatsTalents || !rawStatsEquipment || !rawStatsLevels || !rawStatsRunes) return

  const StatsTalents: Record<string, number> = JSON.parse(rawStatsTalents)
  const StatsEquipment: Record<string, number> = JSON.parse(rawStatsEquipment)
  const StatsLevels: Record<string, number> = JSON.parse(rawStatsLevels)
  const StatsRunes: Record<string, number> = JSON.parse(rawStatsRunes)

  const StatsBase: Record<string, number> = {}
  
  for (const [stat, value] of Object.entries(StatsTalents)) {
    StatsBase[stat] = (StatsBase[stat] || 0) + value
  }
  for (const [stat, value] of Object.entries(StatsEquipment)) {
    StatsBase[stat] = (StatsBase[stat] || 0) + value
  }
  for (const [stat, value] of Object.entries(StatsLevels)) {
    StatsBase[stat] = (StatsBase[stat] || 0) + value
  }
  for (const [stat, value] of Object.entries(StatsRunes)) {
    StatsBase[stat] = (StatsBase[stat] || 0) + value
  }

  localStorage.setItem("StatsBase", JSON.stringify(StatsBase))
  console.log(StatsBase)
}

// Stage 2 of stat pipeline

export function computexPenStats() {
  console.log("Updating xPen Stats")
  const rawStatsBase = localStorage.getItem("StatsBase")
  if (!rawStatsBase) return

  const StatsBase: Record<string, number> = JSON.parse(rawStatsBase)
  const StatsXPen: Record<string, number> = {}

  for (const [xPenStat, affectedStats] of Object.entries(stat_data.xPenMapping)) {
    const multiplier = (StatsBase[xPenStat] ?? 0)
    for (const stat of affectedStats) {
      StatsXPen[stat] = (StatsBase[stat] ?? 0) * multiplier
    }
  }

  localStorage.setItem("StatsXPen", JSON.stringify(StatsXPen))
  console.log(StatsXPen)
}

// Combine all of stage 2
export function computeConversionReadyStats() {
  computeBaseStats()
  computexPenStats()
  console.log("Updating Conversion Ready Stats")
  const rawStatsXPen = localStorage.getItem("StatsXPen")
  const rawStatsBase = localStorage.getItem("StatsTalents")
  if (!rawStatsXPen || !rawStatsBase) return

  const StatsXPen: Record<string, number> = JSON.parse(rawStatsXPen)
  const StatsTalents: Record<string, number> = JSON.parse(rawStatsBase)
  const StatsConversionReady: Record<string, number> = {}

  for (const [stat, value] of Object.entries(StatsXPen)) {
    StatsConversionReady[stat] = (StatsConversionReady[stat] || 0) + value
  }
  for (const [stat, value] of Object.entries(StatsTalents)) {
    StatsConversionReady[stat] = (StatsConversionReady[stat] || 0) + value
  }

  localStorage.setItem("StatsConversionReady", JSON.stringify(StatsConversionReady))
  console.log(StatsConversionReady)
}

// Stage 3 of stat pipeline
export function computeConversionStats() {
  computeConversionReadyStats()
  console.log("Updating Conversion Stats")

  const rawSelected = localStorage.getItem("selectedTalents")
  const rawStats = localStorage.getItem("StatsTalents")
  if (!rawSelected || !rawStats) return

  try {
    const selected = new Set<string>(JSON.parse(rawSelected))
    const baseStats: Record<string, number> = JSON.parse(rawStats)
    const converted: Record<string, number> = {}

    for (const [name, data] of Object.entries(talent_data)) {
      if (!selected.has(name)) continue
      if (!Array.isArray(data.conversions)) continue

      for (const { source, ratio, resulting_stat } of data.conversions) {
        const base = baseStats[source] ?? 0
        const amount = base * ratio
        converted[resulting_stat] = (converted[resulting_stat] || 0) + amount
      }
    }

    localStorage.setItem("StatsConverted", JSON.stringify(converted))
    console.log(converted)
  } catch {}
}

// Tie all stats together
export function computeDmgReadyStats() {
  computeConversionStats()
  console.log("Updating Dmg Ready Stats")
  const raw = localStorage.getItem("StatsTalents")
  if (!raw) return

  try {
    const stats: Record<string, number> = JSON.parse(raw)
    const result: Record<string, number> = {}

    // Mainstats
    for (const stat of stat_data.Mainstats) {
      const base = stats[stat] ?? 0
      const multiplier = stats[`${stat}%`] ?? 0
      result[stat] = base * (1 + multiplier)
    }

    for (const stat of stat_data.AllElements) {
      result[stat] = stats[`${stat_data.AllElements}%`]
    }

    localStorage.setItem("StatsDmgReady", JSON.stringify(result))
    console.log(result)
  } catch {}
}




export default function StatSync() {
  useEffect(() => {   //Run once on mount
    // Add custom event listeners for stat updates
    //Stage 1
    window.addEventListener("talentsUpdated", computeTalentStats)
    window.addEventListener("equipmentUpdated", computeEquipmentStats)
    window.addEventListener("runesUpdated", computeRuneStats)
    window.addEventListener("computeBaseStats", computeBaseStats)
    //Stage 2
    window.addEventListener("computexPenStats", computexPenStats)
    window.addEventListener("computexPenStats", computeConversionReadyStats)
    //Stage 3
    window.addEventListener("talentsUpdated", computeConversionStats)
    //Stage 4
    
    //Final Stats
    window.addEventListener("computeDmgReadyStats", computeDmgReadyStats)

    // Clean up listeners for when unmounted (to prevent multiple updates)
    return () => {
      window.removeEventListener("talentsUpdated", computeTalentStats)
      window.removeEventListener("equipmentUpdated", computeEquipmentStats)
      window.removeEventListener("runesUpdated", computeRuneStats)
      window.removeEventListener("computeBaseStats", computeBaseStats)
      window.removeEventListener("computexPenStats", computexPenStats)
      window.removeEventListener("computexPenStats", computeConversionReadyStats)
      window.removeEventListener("talentsUpdated", computeConversionStats)
      window.removeEventListener("computeDmgReadyStats", computeDmgReadyStats)
    }
  }, [])
  return null
}
