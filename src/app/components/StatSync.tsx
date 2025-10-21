// components/StatSync.tsx
"use client"

import { useEffect } from "react"
import { talent_data } from "@/app/data/talent_data"
import stat_data from "../data/stat_data"
import type { Skill } from "../data/skill_data"
import type { Tarot } from "../data/tarot_data"
import rune_data from "../data/rune_data"
import { skill_data } from "../data/skill_data"
import tarot_data from "../data/tarot_data"


// Helper functions

function updateConversionSubStats(targetDict: Record<string, number>, sourceDict: Record<string, number>, sourceStat: string, ratio: number, targetStat: string, stackCount: number = 1 ): void {
  const buff = (sourceDict["Buff%"] ?? 0) + (targetDict["Buff%"] ?? 0)
  const sourceValue = sourceDict[sourceStat] ?? 0

  const affixInfo = stat_data.StatsInfo[targetStat as keyof typeof stat_data.StatsInfo]
  const substats = affixInfo?.sub_stats
  const resultValue = Math.floor(sourceValue * (ratio * stackCount) * (1 + buff))

  if (substats) { // handles allres, elemental, physical, etc
    for (const substat of substats) {
      targetDict[substat] = (targetDict[substat] ?? 0) + resultValue
    }
  } else if (affixInfo) {
    targetDict[targetStat] = (targetDict[targetStat] ?? 0) + resultValue
  }
}

function updateFlatSubStats(targetDict: Record<string, number>, sourceDict: Record<string, number>, targetStat: string, targetValue: number, stackCount: number = 1 ): void {
  const buff = (sourceDict["Buff%"] ?? 0) + (targetDict["Buff%"] ?? 0)

  const affixInfo = stat_data.StatsInfo[targetStat as keyof typeof stat_data.StatsInfo]
  const substats = affixInfo?.sub_stats
  const resultValue = Math.floor(targetValue * stackCount * (1 + buff))

  if (substats) { // handles allres, elemental, physical, etc
    for (const substat of substats) {
      targetDict[substat] = (targetDict[substat] ?? 0) + resultValue
    }
  } else if (affixInfo) {
    targetDict[targetStat] = (targetDict[targetStat] ?? 0) + resultValue
  }
}

function updateStats(targetDict: Record<string, number>, sourceDict: Record<string, number>, stackDict: Record<string, number>, sourceSkillName: string, sourceSkillData: Skill | Tarot): void {
  if (sourceSkillData.conversions) {
    for (const { source, ratio, resulting_stat } of sourceSkillData.conversions) {
      updateConversionSubStats(targetDict, sourceDict, source, ratio, resulting_stat)
    }
  }
  if (sourceSkillData.stack_conversions) {
    for (const { source, ratio, resulting_stat } of sourceSkillData.stack_conversions) {
      updateConversionSubStats(targetDict, sourceDict, source, ratio, resulting_stat, stackDict[sourceSkillName])
    }   
  }
  if (sourceSkillData.stats) {
    for (const [stat, stat_amount] of Object.entries(sourceSkillData.stats)) {
      updateFlatSubStats(targetDict, sourceDict, stat, (stat_amount ?? 0))
    }    
  }
  if (sourceSkillData.stack_stats) {
    for (const [stat, stat_amount] of Object.entries(sourceSkillData.stack_stats)) {
      updateFlatSubStats(targetDict, sourceDict, stat, (stat_amount ?? 0), stackDict[sourceSkillName])
    }    
  }
}

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
        stats[stat] = (stats[stat] ?? 0) + (value ?? 0)
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
  StatsLevels['Crit DMG%'] = 120
  StatsLevels['Crit Chance%'] = 10
  StatsLevels['Overdrive%'] = 110
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
    StatsLevels['Threat%'] = 100 + storedLevels["tank"] * 10
  } else {
    StatsLevels['Threat%'] = 100 + storedLevels["tank"] * 2
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
      name: string
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
        const affixInfo = stat_data.StatsInfo[affix.stat as keyof typeof stat_data.StatsInfo]
        const substats = affixInfo?.sub_stats
        if (substats) { // handles allres, elemental, physical, etc
          for (const substat of substats) {
            stats[substat] = (stats[substat] ?? 0) + affix.value
          }
        } else if (affixInfo) {
          stats[affix.stat] = (stats[affix.stat] ?? 0) + affix.value
        }
      }
      // Full level bonus
      if (slot.name.includes("+10")) {
        stats["Dmg%"] = (stats["Dmg%"]) + 1
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
        stats[stat] = (stats[stat] || 0) + (value ?? 0) * count
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
    stats[`Art_${stat}%`] = Artifact[`${stat}%`]
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
      StatsXPen[stat] = Math.floor((StatsBase[stat] ?? 0) * (multiplier / 100))
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
  const StatsXPen: Record<string, number> = JSON.parse(localStorage.getItem("StatsXPen") ?? "{}")
  const StatsTalents: Record<string, number> = JSON.parse(localStorage.getItem("StatsBase") ?? "{}")

  // Add up combined stats
  const StatsCombined: Record<string, number> = StatsXPen

  for (const [stat, value] of Object.entries(StatsTalents)) {
    StatsCombined[stat] = (StatsCombined[stat] ?? 0) + value
  }

  const StatsConversionReady: Record<string, number> = StatsCombined
  // Compute mainstats
  for (const stat of stat_data.Mainstats) {
    const base = StatsCombined[stat] ?? 0
    const multiplier = StatsCombined[`${stat}%`] ?? 0
    const artifact_multiplier = StatsCombined[`Art_${stat}%`] ?? 0
    StatsConversionReady[stat] = Math.floor(base * (1 + multiplier/100) * (1 + artifact_multiplier/100))
  }
  // Elements
  for (const stat of stat_data.AllElements) {
    StatsConversionReady[`${stat}%`] = StatsCombined[`${stat}%`] ?? 0 // xDmg applied in dmg formula
    StatsConversionReady[`${stat} Pen%`] = Math.floor((StatsCombined[`${stat} Pen%`] ?? 0) * (1 + (StatsCombined[`${stat} xPen%`] ?? 0)/100))
  }
  // HP
  StatsConversionReady["HP"] = Math.floor(StatsCombined["HP"] * (1 + (StatsCombined["HP%"] ?? 0)))

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
      converted[resulting_stat] = Math.floor((converted[resulting_stat] || 0) + (base * ratio))
    }
  }

  localStorage.setItem("StatsConverted", JSON.stringify(converted))
  console.log(converted)
}

// Combine all of stage 3
export function computeBuffReadyStats() {
  computeConversionStats()
  console.log("Updating Buff Ready Stats")
  const StatsBase: Record<string, number> = JSON.parse(localStorage.getItem("StatsConversionReady") ?? "{}")
  const StatsConverted: Record<string, number> = JSON.parse(localStorage.getItem("StatsConverted") ?? "{}")
  const StatsBuffReady: Record<string, number> = {}

  // Add up stats 
  for (const [stat, value] of Object.entries(StatsBase)) {
    StatsBuffReady[stat] = (StatsBuffReady[stat] || 0) + value
  }

  for (const [stat, value] of Object.entries(StatsConverted)) {
    StatsBuffReady[stat] = (StatsBuffReady[stat] || 0) + value
  }

  localStorage.setItem("StatsBuffReady", JSON.stringify(StatsBuffReady))
  console.log(StatsBuffReady)
}

// Stage 4 of stat pipeline
export function computeBuffStats() {
  console.log("Updating Buff Stats")

  const selected: Set<string> = (JSON.parse(localStorage.getItem("selectedBuffs") ?? "[]"))
  const baseStats: Record<string, number> = JSON.parse(localStorage.getItem("StatsBuffReady") ?? "{}")
  const buffed: Record<string, number> = {}

  console.log(selected)
  for (const skill of selected) {
    updateStats(buffed, baseStats, {}, skill, skill_data[skill])
  }

  localStorage.setItem("StatsBuffs", JSON.stringify(buffed))
  console.log(buffed)
}

export function computeTarotStats() {
  console.log("Updating Tarot Stats")

  const baseStats: Record<string, number> = JSON.parse(localStorage.getItem("StatsBuffReady") ?? "{}") 
  const selected: Set<string> = (JSON.parse(localStorage.getItem("selectedTarots") ?? "[]]"))
  const stacks: Record<string, number> = JSON.parse(localStorage.getItem("tarotStacks") ?? "{}")
  const tarot_buff: Record<string, number> = {}
  console.log(selected)
  console.log(stacks)

  for (const tarot of selected) {
    updateStats(tarot_buff, baseStats, stacks, tarot, tarot_data[tarot])
  }

  localStorage.setItem("StatsTarots", JSON.stringify(tarot_buff))
  console.log(tarot_buff)
}

// Tie all stats together
export function computeDmgReadyStats() {
  computeBuffReadyStats()
  computeBuffStats()
  computeTarotStats()
  console.log("Updating Dmg Ready Stats")
  const rawbase = localStorage.getItem("StatsBuffReady")
  const rawbuff = localStorage.getItem("StatsBuffs")
  const rawtarot = localStorage.getItem("StatsTarots")

  const basestats: Record<string, number> = JSON.parse(rawbase ?? "{}")
  const buffstats: Record<string, number> = JSON.parse(rawbuff ?? "{}")
  const tarotstats: Record<string, number> = JSON.parse(rawtarot ?? "{}")

  // Copy stats to result
  const result: Record<string, number> = basestats

  // add buff stats to result
  for (const [stat, value] of Object.entries(buffstats)) {
    result[stat] = (result[stat] || 0) + (value ?? 0)
  }

  // add tarot stats to result
  for (const [stat, value] of Object.entries(tarotstats)) {
    result[stat] = (result[stat] || 0) + (value ?? 0)
  }

  localStorage.setItem("StatsDmgReady", JSON.stringify(result))
  console.log(result)

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
