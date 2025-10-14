// components/StatSync.tsx
"use client"

import { useEffect } from "react"
import { talent_data } from "@/app/data/talent_data"
import stat_data from "../data/stat_data"
import { PostBuffTypes } from "../data/stat_data"
import rune_data from "../data/rune_data"
import { skill_data } from "../data/skill_data"


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
  const rawstoredOrder = localStorage.getItem('SelectedLevelOrder')
  const rawstoredStatPoints = localStorage.getItem('SelectedStatPoints')
  const rawstoredTraining = localStorage.getItem('SelectedTraining')
  const rawstoredHeroPoints = localStorage.getItem('SelectedHeroPoints')

  const StatsLevels: Record<string, number> = {}

  const storedLevels: Record<string, number> = JSON.parse(rawstoredLevels ?? "{}")
  const storedLevelOrder: string[] = JSON.parse(rawstoredOrder ?? "{}")
  const storedStatPoints: Record<string, number> = JSON.parse(rawstoredStatPoints ?? "{}") 
  const storedTraining: Record<string, number> = JSON.parse(rawstoredTraining ?? "{}")
  const storedHeroPoints: Record<string, number> = JSON.parse(rawstoredHeroPoints ?? "{}")

  //TODO: Remove once heropoints are implemented
  console.log(storedHeroPoints)
  
  // Starting stats
  StatsLevels['Crit DMG%'] = 1.2
  StatsLevels['Crit Chance%'] = 0.1
  StatsLevels['Overdrive%'] = 1.1
  StatsLevels['Focus Regen'] = 5

  // HP and Scaling Stats
  let hp = 50
  let lvl = 0
  for (const ClassName of storedLevelOrder){
    const hp_multiplier = stat_data.ClassMainStatValues[ClassName]['HP']
    const scaling_stat = stat_data.ClassScalingStats[ClassName]
    let scaling_value = 0
    for (let i = 0; i < storedLevels[ClassName]; i++) {
      lvl++
      hp += Math.floor(hp_multiplier * (1 + 0.1 * (lvl - 1))) + 4 * lvl
      switch (ClassName) {
        case "tank":    scaling_value += stat_data.ClassMainStatValues[ClassName][scaling_stat] + Math.floor(stat_data.ClassMainStatValues[ClassName][`${scaling_stat} Scaling`] * lvl); break;
        case "warrior": scaling_value += Math.min(0.00155, stat_data.ClassMainStatValues[ClassName][scaling_stat] + stat_data.ClassMainStatValues[ClassName][`${scaling_stat} Scaling`] * lvl); break;
        case "caster":  scaling_value += stat_data.ClassMainStatValues[ClassName][scaling_stat] + Math.floor(stat_data.ClassMainStatValues[ClassName][`${scaling_stat} Scaling`] * lvl); break;
        case "healer":  scaling_value += stat_data.ClassMainStatValues[ClassName][scaling_stat] + (stat_data.ClassMainStatValues[ClassName][`${scaling_stat} Scaling`] * lvl); break;
      }
    }
    StatsLevels[scaling_stat] += scaling_value
  }
  StatsLevels['HP'] = hp

  //MP
  StatsLevels['MP'] = 8 + (storedLevels["tank"] * stat_data.ClassMainStatValues["tank"]["MP"]) + (storedLevels["warrior"] * stat_data.ClassMainStatValues["warrior"]["MP"]) + (storedLevels["caster"] * stat_data.ClassMainStatValues["caster"]["MP"]) + (storedLevels["healer"] * stat_data.ClassMainStatValues["healer"]["MP"])
  StatsLevels['Focus'] = 100 + (storedLevels["warrior"] * stat_data.ClassMainStatValues["warrior"]["Focus"])
  if (storedLevels["tank"] >= Math.max(...Object.values(storedLevels))) {
    StatsLevels['Threat%'] = 1 + storedLevels["tank"] * 0.1
  } else {
    StatsLevels['Threat%'] = 1 + storedLevels["tank"] * 0.02
  }

  //Mainstats
  for (const stat of stat_data.Mainstats) {
    StatsLevels[stat] = 5 + (storedStatPoints[stat] ?? 0) + (4 * (storedTraining[stat] ?? 0))
    for (const ClassName of stat_data.ClassNames) {
      StatsLevels[stat] = StatsLevels[stat] + (storedLevels[ClassName] ?? 0)*stat_data.ClassMainStatValues[ClassName][stat]
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
        stats[affix.stat] = (stats[affix.stat] || 0) + (affix.value * stat_data.StatsInfo[affix.stat]['multi'])
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

export function computeArtifactStats() {
  console.log("Updating Artifact Stats")
  const rawArtifact = localStorage.getItem('Artifact')
  if (!rawArtifact) return
  const Artifact: Record<string, number> = JSON.parse(rawArtifact)
  const stats: Record<string, number> = {}

  for (const stat of stat_data.Mainstats) {
    stats[`Art_${stat}%`] = Artifact[`${stat}%`] / 100
    stats[stat] = Artifact["Level"]
  }
  
  localStorage.setItem("StatsArtifact", JSON.stringify(stats))
  console.log(stats)
}

// Combine all of stage 1
export function computeBaseStats() {
  computeLevelStats()
  computeTalentStats()
  computeRuneStats()
  computeEquipmentStats()
  computeArtifactStats()
  console.log("Updating Base Stats")
  const rawStatsTalents = localStorage.getItem("StatsTalents")
  const rawStatsEquipment = localStorage.getItem("StatsEquipment")
  const rawStatsLevels = localStorage.getItem("StatsLevels")
  const rawStatsRunes = localStorage.getItem("StatsRunes")
  const rawStatsArtifact = localStorage.getItem("StatsArtifact")
  const StatsBase: Record<string, number> = {}

  if(rawStatsTalents) {
    const StatsTalents: Record<string, number> = JSON.parse(rawStatsTalents)
    for (const [stat, value] of Object.entries(StatsTalents)) {
      StatsBase[stat] = (StatsBase[stat] || 0) + value
    }
  }

  if(rawStatsEquipment) {
    const StatsEquipment: Record<string, number> = JSON.parse(rawStatsEquipment)
    for (const [stat, value] of Object.entries(StatsEquipment)) {
      StatsBase[stat] = (StatsBase[stat] || 0) + value
    }
  }

  if(rawStatsLevels) {
    const StatsLevels: Record<string, number> = JSON.parse(rawStatsLevels)
    for (const [stat, value] of Object.entries(StatsLevels)) {
      StatsBase[stat] = (StatsBase[stat] || 0) + value
    }
  }

  if(rawStatsRunes) {
    const StatsRunes: Record<string, number> = JSON.parse(rawStatsRunes)
    for (const [stat, value] of Object.entries(StatsRunes)) {
      StatsBase[stat] = (StatsBase[stat] || 0) + value
    }
  }

  if(rawStatsArtifact) {
    const StatsArtifact: Record<string, number> = JSON.parse(rawStatsArtifact)
    for (const [stat, value] of Object.entries(StatsArtifact)) {
      StatsBase[stat] = (StatsBase[stat] || 0) + value
    }
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
  const rawStatsBase = localStorage.getItem("StatsBase")
  const StatsConversionReady: Record<string, number> = {}

  if(rawStatsXPen) {
    const StatsXPen: Record<string, number> = JSON.parse(rawStatsXPen)
    for (const [stat, value] of Object.entries(StatsXPen)) {
      StatsConversionReady[stat] = (StatsConversionReady[stat] || 0) + value
    }
  }
  if(rawStatsBase) {
    const StatsTalents: Record<string, number> = JSON.parse(rawStatsBase)
    for (const [stat, value] of Object.entries(StatsTalents)) {
      StatsConversionReady[stat] = (StatsConversionReady[stat] || 0) + value
    }
  }

  localStorage.setItem("StatsConversionReady", JSON.stringify(StatsConversionReady))
  console.log(StatsConversionReady)
}

// Stage 3 of stat pipeline
export function computeConversionStats() {
  computeConversionReadyStats()
  console.log("Updating Conversion Stats")

  const rawSelected = localStorage.getItem("selectedTalents")
  const rawStats = localStorage.getItem("StatsConversionReady")
  if (!rawSelected || !rawStats) return


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
}

// Combine all of stage 3
export function computeBuffReadyStats() {
  computeConversionStats()
  console.log("Updating Buff Ready Stats")
  const rawStatsBase = localStorage.getItem("StatsConversionReady")
  const rawStatsConverted = localStorage.getItem("StatsConverted")
  const StatsBuffReady: Record<string, number> = {}

  if(rawStatsBase) {
    const StatsBase: Record<string, number> = JSON.parse(rawStatsBase)
    for (const [stat, value] of Object.entries(StatsBase)) {
      StatsBuffReady[stat] = (StatsBuffReady[stat] || 0) + value
    }
  }
  if(rawStatsConverted) {
    const StatsConverted: Record<string, number> = JSON.parse(rawStatsConverted)
    for (const [stat, value] of Object.entries(StatsConverted)) {
      StatsBuffReady[stat] = (StatsBuffReady[stat] || 0) + value
    }
  }

  localStorage.setItem("StatsBuffReady", JSON.stringify(StatsBuffReady))
  console.log(StatsBuffReady)
}

// Stage 4 of stat pipeline
export function computeBuffStats() {
  computeBuffReadyStats()
  console.log("Updating Buff Stats")

  const rawSelected = localStorage.getItem("selectedBuffs")
  const rawBuffs = localStorage.getItem("StatsBuffReady")
  if (!rawSelected || !rawBuffs) return


  const selected = new Set<string>(JSON.parse(rawSelected))
  const baseStats: Record<string, number> = JSON.parse(rawBuffs)
  const buffed: Record<string, number> = {}

  for (const [name, data] of Object.entries(skill_data)) {
    if (!selected.has(name)) continue

    for (const { source, ratio, resulting_stat } of data.conversions) {
      const base = baseStats[source] ?? 0
      const buff = baseStats["Buff%"] + (buffed["Buff%"] ?? 0)
      const effectiveBase = source in PostBuffTypes
        ? base + (buffed[source] ?? 0) // If it is postBuff then use buffed stats
        : base // Otherwise use pre-buff stats
      const amount = effectiveBase * ratio * (1 + buff)
      buffed[resulting_stat] = (buffed[resulting_stat] || 0) + amount
    }
    for (const [stat, stat_amount] of Object.entries(data.stats)) {
      const base = baseStats[stat] ?? 0
      const buff = baseStats["Buff%"] + (buffed["Buff%"] ?? 0)
      const amount = base + stat_amount * (1 + buff)
      buffed[stat] = (buffed[stat] || 0) + amount
    }    
  }

  localStorage.setItem("StatsBuffs", JSON.stringify(buffed))
  console.log(buffed)
}

// Tie all stats together
export function computeDmgReadyStats() {
  computeBuffReadyStats()
  console.log("Updating Dmg Ready Stats")
  const raw = localStorage.getItem("StatsBuffReady")
  if (!raw) return

  try {
    const stats: Record<string, number> = JSON.parse(raw)
    const result: Record<string, number> = {}

    // Mainstats
    for (const stat of stat_data.Mainstats) {
      const base = stats[stat] ?? 0
      const multiplier = stats[`${stat}%`] ?? 0
      const artifact_multiplier = stats[`Art_${stat}%`] ?? 0
      result[stat] = base * (1 + multiplier) * (1 + artifact_multiplier)
    }
    // Elements
    for (const stat of stat_data.AllElements) {
      result[`${stat}%`] = stats[`${stat}%`] ?? 0
      result[`${stat} Pen%`] = stats[`${stat} Pen%`] ?? 0
    }
    // HP
    result["HP"] = stats["HP"] * (1 + (stats["HP%"] ?? 0)) 

    //Basic
    for (const stat of ["Crit DMG%", "Crit Chance%", "Armor Save", "Armor Strike", "Overdrive%", "MP", "Focus", "Focus Regen", "Threat%"]) {
      result[stat] = stats[stat] ?? 0
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
