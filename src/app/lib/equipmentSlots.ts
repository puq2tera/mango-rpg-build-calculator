import tarot_data from "@/app/data/tarot_data"

export type EquipmentAffix = {
  stat: string
  value: number
}

export type EquipmentSlot = {
  name: string
  type: string
  mainstat: string
  mainstat_value: number
  affixes: EquipmentAffix[]
  enabled: boolean
  tarotScalingStat: string
  tarotLevel: number
  tarotAuto: boolean
}

export const EQUIPMENT_SLOTS_STORAGE_KEY = "EquipmentSlots"
export const ENABLED_EQUIPMENT_STORAGE_KEY = "EnabledEquipment"
export const EQUIPMENT_AUTO_LINKED_TAROTS_STORAGE_KEY = "equipmentAutoLinkedTarots"

const LEVEL_EPSILON = 0.0001

const asFiniteNumber = (value: unknown, fallback = 0): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback

const normalizeLevel = (value: unknown): number => Math.max(0, Math.floor(asFiniteNumber(value, 0)))

export function createDefaultEquipmentSlot(): EquipmentSlot {
  return {
    name: "",
    type: "",
    mainstat: "",
    mainstat_value: 0,
    affixes: Array.from({ length: 8 }, () => ({ stat: "", value: 0 })),
    enabled: false,
    tarotScalingStat: "",
    tarotLevel: 0,
    tarotAuto: false,
  }
}

export function isKnownTarotName(name: string): name is keyof typeof tarot_data {
  return name in tarot_data
}

export function isTarotEquipmentSlot(
  slot: Pick<EquipmentSlot, "name" | "type"> | null | undefined,
): boolean {
  if (!slot) {
    return false
  }

  return slot.type === "Tarot" || (slot.name.length > 0 && isKnownTarotName(slot.name))
}

function stripTarotMainstat(slot: EquipmentSlot): EquipmentSlot {
  if (!isTarotEquipmentSlot(slot)) {
    return slot
  }

  return {
    ...slot,
    mainstat: "",
    mainstat_value: 0,
  }
}

export function getTarotScalingValue(name: string, level: number): number | null {
  if (!isKnownTarotName(name)) {
    return null
  }

  const tarot = tarot_data[name]
  return tarot.stat_base + (tarot.stat_scale * normalizeLevel(level))
}

function inferTarotLevelFromValue(name: string, value: number): number | null {
  if (!isKnownTarotName(name) || !Number.isFinite(value)) {
    return null
  }

  const tarot = tarot_data[name]
  if (tarot.stat_scale === 0) {
    return Math.abs(value - tarot.stat_base) <= LEVEL_EPSILON ? 0 : null
  }

  const rawLevel = (value - tarot.stat_base) / tarot.stat_scale
  const roundedLevel = Math.round(rawLevel)

  if (roundedLevel < 0 || Math.abs(rawLevel - roundedLevel) > LEVEL_EPSILON) {
    return null
  }

  return roundedLevel
}

function normalizeAffixes(value: unknown): EquipmentAffix[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .filter((entry): entry is Record<string, unknown> => typeof entry === "object" && entry !== null)
    .map((entry) => ({
      stat: typeof entry.stat === "string" ? entry.stat : "",
      value: asFiniteNumber(entry.value, 0),
    }))
}

function migrateTarotScalingAffix(slot: EquipmentSlot): EquipmentSlot {
  if (!isTarotEquipmentSlot(slot) || !isKnownTarotName(slot.name)) {
    return slot
  }

  const tarot = tarot_data[slot.name]
  const nextAffixes = [...slot.affixes]
  let tarotScalingStat = slot.tarotScalingStat || tarot.stat_bonus
  let tarotLevel = normalizeLevel(slot.tarotLevel)

  const expectedValue = getTarotScalingValue(slot.name, tarotLevel)

  if (slot.tarotScalingStat && expectedValue !== null) {
    const duplicateAffixIndex = nextAffixes.findIndex((affix) => (
      affix.stat === tarotScalingStat &&
      Math.abs(affix.value - expectedValue) <= LEVEL_EPSILON
    ))

    if (duplicateAffixIndex >= 0) {
      nextAffixes.splice(duplicateAffixIndex, 1)
    }
  }

  if (!slot.tarotScalingStat) {
    const migratedAffixIndex = nextAffixes.findIndex((affix) => (
      affix.stat === tarot.stat_bonus &&
      inferTarotLevelFromValue(slot.name, affix.value) !== null
    ))

    if (migratedAffixIndex >= 0) {
      tarotScalingStat = nextAffixes[migratedAffixIndex].stat
      tarotLevel = inferTarotLevelFromValue(slot.name, nextAffixes[migratedAffixIndex].value) ?? tarotLevel
      nextAffixes.splice(migratedAffixIndex, 1)
    }
  }

  return {
    ...slot,
    affixes: nextAffixes,
    tarotScalingStat,
    tarotLevel,
  }
}

export function normalizeEquipmentSlot(value: unknown): EquipmentSlot {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return createDefaultEquipmentSlot()
  }

  const entry = value as Partial<EquipmentSlot>

  return stripTarotMainstat(migrateTarotScalingAffix({
    name: typeof entry.name === "string" ? entry.name : "",
    type: typeof entry.type === "string" ? entry.type : "",
    mainstat: typeof entry.mainstat === "string" ? entry.mainstat : "",
    mainstat_value: asFiniteNumber(entry.mainstat_value, 0),
    affixes: normalizeAffixes(entry.affixes),
    enabled: entry.enabled === true,
    tarotScalingStat: typeof entry.tarotScalingStat === "string" ? entry.tarotScalingStat : "",
    tarotLevel: normalizeLevel(entry.tarotLevel),
    tarotAuto: entry.tarotAuto === true,
  }))
}

export function normalizeEquipmentSlots(value: unknown): EquipmentSlot[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.map((entry) => normalizeEquipmentSlot(entry))
}

export function getEquipmentAutoLinkedTarots(
  slots: readonly EquipmentSlot[],
  enabledIndices: Iterable<number>,
): string[] {
  const enabledSet = new Set(enabledIndices)
  const linkedTarots = new Set<string>()

  for (const [index, slot] of slots.entries()) {
    if (!enabledSet.has(index) || !slot.tarotAuto || !isKnownTarotName(slot.name) || !isTarotEquipmentSlot(slot)) {
      continue
    }

    linkedTarots.add(slot.name)
  }

  return Array.from(linkedTarots)
}

export function getEquipmentTarotNames(slots: readonly EquipmentSlot[]): string[] {
  const tarotNames = new Set<string>()

  for (const slot of slots) {
    if (!isKnownTarotName(slot.name) || !isTarotEquipmentSlot(slot)) {
      continue
    }

    tarotNames.add(slot.name)
  }

  return Array.from(tarotNames)
}

export function getAutoManagedTarotNames(slots: readonly EquipmentSlot[]): string[] {
  const linkedTarots = new Set<string>()

  for (const slot of slots) {
    if (!slot.tarotAuto || !isKnownTarotName(slot.name) || !isTarotEquipmentSlot(slot)) {
      continue
    }

    linkedTarots.add(slot.name)
  }

  return Array.from(linkedTarots)
}

export function getEnabledEquipmentIndices(slots: readonly EquipmentSlot[]): number[] {
  return slots
    .map((slot, index) => slot.enabled ? index : null)
    .filter((index): index is number => index !== null)
}

export function disableAutoLinkedTarotEquipment(
  slots: readonly EquipmentSlot[],
  tarotName: string,
): EquipmentSlot[] {
  return setAutoLinkedTarotEquipmentEnabled(slots, tarotName, false)
}

export function hasAutoLinkedTarotEquipment(
  slots: readonly EquipmentSlot[],
  tarotName: string,
): boolean {
  return slots.some((slot) => (
    slot.tarotAuto && slot.name === tarotName && isTarotEquipmentSlot(slot)
  ))
}

export function setAutoLinkedTarotEquipmentEnabled(
  slots: readonly EquipmentSlot[],
  tarotName: string,
  enabled: boolean,
): EquipmentSlot[] {
  return slots.map((slot) => (
    slot.tarotAuto && slot.name === tarotName && isTarotEquipmentSlot(slot)
      ? { ...slot, enabled }
      : slot
  ))
}
