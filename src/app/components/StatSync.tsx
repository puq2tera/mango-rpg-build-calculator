"use client"

import { useEffect } from "react"
import { BUILD_SNAPSHOT_UPDATED_EVENT } from "@/app/lib/buildEvents"
import { computeBuildStatStages, persistBuildStatStages, readBuildSnapshot } from "@/app/lib/buildStats"

function recomputeStoredStats() {
  if (typeof window === "undefined") return

  const snapshot = readBuildSnapshot(window.localStorage)
  const stages = computeBuildStatStages(snapshot)
  persistBuildStatStages(window.localStorage, stages)
}

export function computeTalentStats() {
  recomputeStoredStats()
}

export function computeLevelStats() {
  recomputeStoredStats()
}

export function computeEquipmentStats() {
  recomputeStoredStats()
}

export function computeRuneStats() {
  recomputeStoredStats()
}

export function computeArtifactStats() {
  recomputeStoredStats()
}

export function computeBaseStats() {
  recomputeStoredStats()
}

export function computexPenStats() {
  recomputeStoredStats()
}

export function computeConversionReadyStats() {
  recomputeStoredStats()
}

export function computeConversionStats() {
  recomputeStoredStats()
}

export function computeBuffReadyStats() {
  recomputeStoredStats()
}

export function computeBuffStats() {
  recomputeStoredStats()
}

export function computeTarotStats() {
  recomputeStoredStats()
}

export function computeDmgReadyStats() {
  recomputeStoredStats()
}

export default function StatSync() {
  useEffect(() => {
    recomputeStoredStats()

    const handlers: Array<[string, () => void]> = [
      [BUILD_SNAPSHOT_UPDATED_EVENT, recomputeStoredStats],
      ["talentsUpdated", recomputeStoredStats],
      ["equipmentUpdated", recomputeStoredStats],
      ["runesUpdated", recomputeStoredStats],
      ["computeBaseStats", recomputeStoredStats],
      ["computexPenStats", recomputeStoredStats],
      ["computeDmgReadyStats", recomputeStoredStats],
    ]

    for (const [eventName, handler] of handlers) {
      window.addEventListener(eventName, handler)
    }

    return () => {
      for (const [eventName, handler] of handlers) {
        window.removeEventListener(eventName, handler)
      }
    }
  }, [])

  return null
}
