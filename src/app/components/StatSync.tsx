"use client"

import { useEffect, useRef } from "react"
import { BUILD_SNAPSHOT_UPDATED_EVENT } from "@/app/lib/buildEvents"
import {
  applyTalentToggleToBuildStatDeltaCache,
  computeBuildStatStages,
  persistBuildStatStages,
  prepareBuildStatDeltaCache,
  readBuildSnapshot,
  type BuildStatDeltaCache,
} from "@/app/lib/buildStats"

function recomputeStoredStats(): BuildStatDeltaCache | null {
  if (typeof window === "undefined") return null

  const snapshot = readBuildSnapshot(window.localStorage)
  const stages = computeBuildStatStages(snapshot)
  persistBuildStatStages(window.localStorage, stages)
  return prepareBuildStatDeltaCache(snapshot, stages)
}

function getSingleTalentToggle(
  previousSelectedTalents: readonly string[],
  nextSelectedTalents: readonly string[],
): { talentName: string; wasSelected: boolean } | null {
  const previousSet = new Set(previousSelectedTalents)
  const nextSet = new Set(nextSelectedTalents)
  const removedTalents = previousSelectedTalents.filter((talentName) => !nextSet.has(talentName))
  const addedTalents = nextSelectedTalents.filter((talentName) => !previousSet.has(talentName))

  if ((removedTalents.length + addedTalents.length) !== 1) {
    return null
  }

  if (removedTalents.length === 1) {
    return {
      talentName: removedTalents[0],
      wasSelected: true,
    }
  }

  if (addedTalents.length === 1) {
    return {
      talentName: addedTalents[0],
      wasSelected: false,
    }
  }

  return null
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
  const cacheRef = useRef<BuildStatDeltaCache | null>(null)
  const pendingTalentSyncIdRef = useRef(0)
  const pendingTalentSyncTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    const clearPendingTalentSync = () => {
      pendingTalentSyncIdRef.current += 1
      if (pendingTalentSyncTimeoutRef.current !== null) {
        window.clearTimeout(pendingTalentSyncTimeoutRef.current)
        pendingTalentSyncTimeoutRef.current = null
      }
    }

    const runFullRecompute = () => {
      clearPendingTalentSync()
      cacheRef.current = recomputeStoredStats()
    }

    const scheduleTalentCacheRefresh = () => {
      clearPendingTalentSync()
      const syncId = pendingTalentSyncIdRef.current

      pendingTalentSyncTimeoutRef.current = window.setTimeout(() => {
        if (syncId !== pendingTalentSyncIdRef.current) {
          return
        }

        pendingTalentSyncTimeoutRef.current = null
        const cachedBuild = cacheRef.current
        const snapshot = readBuildSnapshot(window.localStorage)

        if (!cachedBuild) {
          cacheRef.current = recomputeStoredStats()
          return
        }

        const toggle = getSingleTalentToggle(cachedBuild.snapshot.selectedTalents, snapshot.selectedTalents)

        if (!toggle) {
          cacheRef.current = recomputeStoredStats()
          return
        }

        const result = applyTalentToggleToBuildStatDeltaCache(
          cachedBuild,
          toggle.talentName,
          toggle.wasSelected,
          snapshot.selectedTalents,
        )
        persistBuildStatStages(window.localStorage, result.cache.stages)
        cacheRef.current = result.cache
      }, 0)
    }

    cacheRef.current = recomputeStoredStats()

    const handlers: Array<[string, () => void]> = [
      [BUILD_SNAPSHOT_UPDATED_EVENT, runFullRecompute],
      ["equipmentUpdated", runFullRecompute],
      ["runesUpdated", runFullRecompute],
      ["computeBaseStats", runFullRecompute],
      ["computexPenStats", runFullRecompute],
      ["computeDmgReadyStats", runFullRecompute],
    ]

    for (const [eventName, handler] of handlers) {
      window.addEventListener(eventName, handler)
    }
    window.addEventListener("talentsUpdated", scheduleTalentCacheRefresh)

    return () => {
      clearPendingTalentSync()

      for (const [eventName, handler] of handlers) {
        window.removeEventListener(eventName, handler)
      }
      window.removeEventListener("talentsUpdated", scheduleTalentCacheRefresh)
    }
  }, [])

  return null
}
