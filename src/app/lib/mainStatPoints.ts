const MAIN_STAT_KEYS = ["ATK", "DEF", "MATK", "HEAL"] as const

export type MainStatKey = typeof MAIN_STAT_KEYS[number]
export type MainStatValues = Record<MainStatKey, number>

export const classMainStatOrder: readonly MainStatKey[] = ["DEF", "ATK", "MATK", "HEAL"]

const STAT_POINTS_STORAGE_KEY = "SelectedStatPoints"
const STAT_POINTS_STORAGE_VERSION_KEY = "SelectedStatPointsVersion"
const CURRENT_STAT_POINTS_STORAGE_VERSION = 2

export function createDefaultMainStatValues(): MainStatValues {
  return { ATK: 0, DEF: 0, MATK: 0, HEAL: 0 }
}

export function normalizeMainStatValues(value: unknown): MainStatValues {
  const normalized = createDefaultMainStatValues()
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return normalized
  }

  const entries = value as Partial<Record<MainStatKey, unknown>>
  for (const key of MAIN_STAT_KEYS) {
    const entry = entries[key]
    if (typeof entry === "number" && Number.isFinite(entry)) {
      normalized[key] = entry
    }
  }

  return normalized
}

export function parseStoredMainStatValues(raw: string | null): MainStatValues {
  if (!raw) {
    return createDefaultMainStatValues()
  }

  try {
    return normalizeMainStatValues(JSON.parse(raw))
  } catch {
    return createDefaultMainStatValues()
  }
}

function migrateLegacyStatPoints(values: MainStatValues): MainStatValues {
  return {
    ATK: values.DEF,
    DEF: values.ATK,
    MATK: values.MATK,
    HEAL: values.HEAL,
  }
}

export function readStoredStatPoints(storage: Storage): MainStatValues {
  const storedValues = parseStoredMainStatValues(storage.getItem(STAT_POINTS_STORAGE_KEY))
  const storedVersion = Number(storage.getItem(STAT_POINTS_STORAGE_VERSION_KEY) ?? 1)
  const needsMigration = !Number.isFinite(storedVersion) || storedVersion < CURRENT_STAT_POINTS_STORAGE_VERSION

  if (!needsMigration) {
    return storedValues
  }

  const migratedValues = migrateLegacyStatPoints(storedValues)
  persistStoredStatPoints(storage, migratedValues)
  return migratedValues
}

export function persistStoredStatPoints(storage: Storage, values: MainStatValues): void {
  const normalizedValues = normalizeMainStatValues(values)
  storage.setItem(STAT_POINTS_STORAGE_KEY, JSON.stringify(normalizedValues))
  storage.setItem(STAT_POINTS_STORAGE_VERSION_KEY, String(CURRENT_STAT_POINTS_STORAGE_VERSION))
}
