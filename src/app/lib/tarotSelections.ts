import tarot_data from "@/app/data/tarot_data"
import { EQUIPMENT_AUTO_LINKED_TAROTS_STORAGE_KEY } from "@/app/lib/equipmentSlots"

export const MANUAL_TAROT_SELECTION_STORAGE_KEY = "selectedTarots"

function normalizeTarotSelectionNames(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return Array.from(new Set(
    value.filter((entry): entry is string => typeof entry === "string" && entry in tarot_data),
  ))
}

function readStoredTarotSelections(storage: Storage, key: string): string[] {
  try {
    return normalizeTarotSelectionNames(JSON.parse(storage.getItem(key) ?? "[]"))
  } catch {
    return []
  }
}

export function mergeTarotSelections(...selectionGroups: Iterable<string>[]): string[] {
  const mergedSelections = new Set<string>()

  for (const selectionGroup of selectionGroups) {
    for (const name of selectionGroup) {
      if (name in tarot_data) {
        mergedSelections.add(name)
      }
    }
  }

  return Array.from(mergedSelections)
}

export function getEffectiveTarotSelectionSet(
  manualSelections: Iterable<string>,
  autoLinkedSelections: Iterable<string>,
): Set<string> {
  return new Set(mergeTarotSelections(manualSelections, autoLinkedSelections))
}

export function readStoredManualTarotSelections(storage: Storage): string[] {
  return readStoredTarotSelections(storage, MANUAL_TAROT_SELECTION_STORAGE_KEY)
}

export function readStoredAutoLinkedTarotSelections(storage: Storage): string[] {
  return readStoredTarotSelections(storage, EQUIPMENT_AUTO_LINKED_TAROTS_STORAGE_KEY)
}

export function filterManualTarotSelections(
  manualSelections: Iterable<string>,
  excludedSelections: Iterable<string>,
): string[] {
  const excluded = new Set(excludedSelections)
  return Array.from(manualSelections).filter((name) => !excluded.has(name) && name in tarot_data)
}

export function readStoredEffectiveTarotSelections(storage: Storage): string[] {
  return mergeTarotSelections(
    readStoredManualTarotSelections(storage),
    readStoredAutoLinkedTarotSelections(storage),
  )
}
