"use client"

import type { EquipmentSlot } from "@/app/lib/equipmentSlots"

export type EquipmentScriptGroup = {
  id: string
  name: string
  manualCountEnabled: boolean
  manualCount: number
  scripts: string[]
}

export const EQUIPMENT_SCRIPT_GROUPS_STORAGE_KEY = "equipmentScriptGroups"
export const DEFAULT_EQUIPMENT_SCRIPT_GROUP_SCRIPT_SLOTS = 4

function asFiniteInt(value: unknown, fallback = 0): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback
  return Math.max(0, Math.floor(value))
}

function normalizeScripts(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return Array.from({ length: DEFAULT_EQUIPMENT_SCRIPT_GROUP_SCRIPT_SLOTS }, () => "")
  }

  const normalized = value.map((entry) => typeof entry === "string" ? entry : "")

  return normalized.length >= DEFAULT_EQUIPMENT_SCRIPT_GROUP_SCRIPT_SLOTS
    ? normalized
    : [
        ...normalized,
        ...Array.from({ length: DEFAULT_EQUIPMENT_SCRIPT_GROUP_SCRIPT_SLOTS - normalized.length }, () => ""),
      ]
}

export function createDefaultEquipmentScriptGroup(id: string): EquipmentScriptGroup {
  return {
    id,
    name: "",
    manualCountEnabled: false,
    manualCount: 0,
    scripts: Array.from({ length: DEFAULT_EQUIPMENT_SCRIPT_GROUP_SCRIPT_SLOTS }, () => ""),
  }
}

export function normalizeEquipmentScriptGroup(value: unknown, fallbackId = ""): EquipmentScriptGroup {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return createDefaultEquipmentScriptGroup(fallbackId)
  }

  const entry = value as Partial<EquipmentScriptGroup>

  return {
    id: typeof entry.id === "string" && entry.id.length > 0 ? entry.id : fallbackId,
    name: typeof entry.name === "string" ? entry.name : "",
    manualCountEnabled: entry.manualCountEnabled === true,
    manualCount: asFiniteInt(entry.manualCount, 0),
    scripts: normalizeScripts(entry.scripts),
  }
}

export function normalizeEquipmentScriptGroups(value: unknown): EquipmentScriptGroup[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.map((entry, index) => normalizeEquipmentScriptGroup(entry, `group-${index + 1}`))
}

export function getEquipmentScriptGroupUsageCounts(
  groups: readonly EquipmentScriptGroup[],
  slots: readonly Pick<EquipmentSlot, "enabled" | "scriptGroupId">[],
): Record<string, number> {
  const groupIds = new Set(groups.map((group) => group.id))
  const counts: Record<string, number> = {}

  for (const slot of slots) {
    if (!slot.enabled || !slot.scriptGroupId || !groupIds.has(slot.scriptGroupId)) {
      continue
    }

    counts[slot.scriptGroupId] = (counts[slot.scriptGroupId] ?? 0) + 1
  }

  return counts
}

export function getEquipmentScriptGroupFinalCount(
  group: Pick<EquipmentScriptGroup, "id" | "manualCountEnabled" | "manualCount">,
  usageCounts: Readonly<Record<string, number>>,
): number {
  return group.manualCountEnabled
    ? Math.max(0, group.manualCount)
    : Math.max(0, usageCounts[group.id] ?? 0)
}

export function buildAppliedEquipmentScriptCounts(
  groups: readonly EquipmentScriptGroup[],
  slots: readonly Pick<EquipmentSlot, "enabled" | "scriptGroupId">[],
): Record<string, number> {
  const usageCounts = getEquipmentScriptGroupUsageCounts(groups, slots)
  const counts: Record<string, number> = {}

  for (const group of groups) {
    const finalCount = getEquipmentScriptGroupFinalCount(group, usageCounts)
    if (finalCount <= 0) continue

    for (const scriptName of group.scripts) {
      if (!scriptName) continue
      counts[scriptName] = (counts[scriptName] ?? 0) + finalCount
    }
  }

  return counts
}
