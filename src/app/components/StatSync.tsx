// components/StatSync.tsx
"use client"

import { useEffect } from "react"
import { talent_data } from "@/app/data/talent_data"

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
  } catch {}
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


export function computeConversionStats() {
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


export function computeDmgReadyStats() {
  console.log("Updating Dmg Ready Stats")
  const raw = localStorage.getItem("StatsTalents")
  if (!raw) return

  try {
    const stats: Record<string, number> = JSON.parse(raw)
    const result: Record<string, number> = {}

    const baseStats = ["ATK", "DEF", "MATK", "HEAL"]

    for (const stat of baseStats) {
      const base = stats[stat] ?? 0
      const multiplier = stats[`${stat}%`] ?? 0
      result[stat] = base * (1 + multiplier)
    }

    localStorage.setItem("StatsDmgReady", JSON.stringify(result))
    console.log(result)
  } catch {}
}




export default function StatSync() {
  useEffect(() => {   //Run once on mount
    // Add custom event listeners for stat updates
    window.addEventListener("talentsUpdated", computeTalentStats)
    window.addEventListener("talentsUpdated", computeConversionStats)
    window.addEventListener("talentsUpdated", computeDmgReadyStats)

    window.addEventListener("equipmentUpdated", computeEquipmentStats)

    // Clean up listeners for when unmounted (to prevent multiple updates)
    return () => {
      window.removeEventListener("talentsUpdated", computeTalentStats)
      window.removeEventListener("talentsUpdated", computeConversionStats)
      window.removeEventListener("talentsUpdated", computeDmgReadyStats)

      window.addEventListener("equipmentUpdated", computeEquipmentStats)
    }
  }, [])
  return null
}
