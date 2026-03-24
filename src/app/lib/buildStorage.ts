import { dispatchBuildSnapshotUpdated } from "@/app/lib/buildEvents"

export const BUILD_MANAGER_STORAGE_KEY = "buildManager:state"
export const BUILD_MANAGER_SCHEMA_VERSION = 1
export const BUILD_MANAGER_EXPORT_TYPE = "mango-build-profile"

export type StoredBuildData = Record<string, string>

export type StoredBuildProfile = {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  data: StoredBuildData
}

export type BuildManagerState = {
  schemaVersion: number
  activeBuildId: string | null
  profiles: StoredBuildProfile[]
}

export type BuildExportPayload = {
  schemaVersion: number
  type: typeof BUILD_MANAGER_EXPORT_TYPE
  exportedAt: string
  build: {
    name: string
    createdAt?: string
    updatedAt?: string
    data: StoredBuildData
  }
}

export type ImportedBuildDefinition = {
  name: string
  data: StoredBuildData
}

export type BuildExportSource = {
  name: string
  createdAt?: string
  updatedAt?: string
  data: StoredBuildData
}

const BUILD_MANAGER_KEY_PREFIX = "buildManager:"
const DERIVED_BUILD_STORAGE_KEYS = new Set([
  "StatsTalents",
  "StatsLevels",
  "StatsEquipment",
  "StatsRunes",
  "StatsArtifact",
  "StatsBase",
  "StatsXPen",
  "StatsConversionReady",
  "StatsConverted",
  "StatsBuffReady",
  "StatsBuffs",
  "StatsTarots",
  "StatsDmgReady",
])
const NON_BUILD_STORAGE_KEY_PREFIXES = [
  "debugVars:",
]

function createProfileId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function normalizeStoredBuildData(value: unknown): StoredBuildData {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {}
  }

  return Object.entries(value).reduce<StoredBuildData>((result, [key, entry]) => {
    if (typeof entry === "string" && shouldStoreKeyInBuildProfile(key)) {
      result[key] = entry
    }
    return result
  }, {})
}

function normalizeStoredBuildProfile(value: unknown): StoredBuildProfile | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null
  }

  const data = value as Partial<StoredBuildProfile>
  const normalizedData = normalizeStoredBuildData(data.data)
  const now = new Date().toISOString()

  return {
    id: typeof data.id === "string" && data.id.length > 0 ? data.id : createProfileId(),
    name: typeof data.name === "string" && data.name.trim().length > 0 ? data.name.trim() : "Unnamed Build",
    createdAt: typeof data.createdAt === "string" && data.createdAt.length > 0 ? data.createdAt : now,
    updatedAt: typeof data.updatedAt === "string" && data.updatedAt.length > 0 ? data.updatedAt : now,
    data: normalizedData,
  }
}

function sortProfiles(profiles: readonly StoredBuildProfile[]): StoredBuildProfile[] {
  return [...profiles].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
}

function getDefaultBuildManagerState(): BuildManagerState {
  return {
    schemaVersion: BUILD_MANAGER_SCHEMA_VERSION,
    activeBuildId: null,
    profiles: [],
  }
}

function persistBuildManagerState(storage: Storage, state: BuildManagerState): void {
  storage.setItem(BUILD_MANAGER_STORAGE_KEY, JSON.stringify({
    schemaVersion: BUILD_MANAGER_SCHEMA_VERSION,
    activeBuildId: state.activeBuildId,
    profiles: sortProfiles(state.profiles),
  }))
}

export function isManagedBuildStorageKey(key: string): boolean {
  return key.startsWith(BUILD_MANAGER_KEY_PREFIX)
}

function isNonBuildStorageKey(key: string): boolean {
  return NON_BUILD_STORAGE_KEY_PREFIXES.some((prefix) => key.startsWith(prefix))
}

function shouldStoreKeyInBuildProfile(key: string): boolean {
  return !isManagedBuildStorageKey(key)
    && !DERIVED_BUILD_STORAGE_KEYS.has(key)
    && !isNonBuildStorageKey(key)
}

export function readBuildManagerState(storage: Storage): BuildManagerState {
  try {
    const parsed = JSON.parse(storage.getItem(BUILD_MANAGER_STORAGE_KEY) ?? "null") as Partial<BuildManagerState> | null

    if (!parsed || !Array.isArray(parsed.profiles)) {
      return getDefaultBuildManagerState()
    }

    const profiles = parsed.profiles
      .map((profile) => normalizeStoredBuildProfile(profile))
      .filter((profile): profile is StoredBuildProfile => profile !== null)
    const activeBuildId = typeof parsed.activeBuildId === "string" && profiles.some((profile) => profile.id === parsed.activeBuildId)
      ? parsed.activeBuildId
      : null

    return {
      schemaVersion: BUILD_MANAGER_SCHEMA_VERSION,
      activeBuildId,
      profiles: sortProfiles(profiles),
    }
  } catch {
    return getDefaultBuildManagerState()
  }
}

export function captureCurrentBuildData(storage: Storage): StoredBuildData {
  const snapshot: StoredBuildData = {}

  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index)
    if (!key || !shouldStoreKeyInBuildProfile(key)) {
      continue
    }

    const value = storage.getItem(key)
    if (value !== null) {
      snapshot[key] = value
    }
  }

  return snapshot
}

export function areStoredBuildDataEqual(left: StoredBuildData, right: StoredBuildData): boolean {
  const leftKeys = Object.keys(left)
  const rightKeys = Object.keys(right)

  if (leftKeys.length !== rightKeys.length) {
    return false
  }

  return leftKeys.every((key) => right[key] === left[key])
}

function upsertProfile(
  profiles: readonly StoredBuildProfile[],
  nextProfile: StoredBuildProfile,
): StoredBuildProfile[] {
  return sortProfiles([
    ...profiles.filter((profile) => profile.id !== nextProfile.id),
    nextProfile,
  ])
}

export function saveCurrentBuildProfile(
  storage: Storage,
  name: string,
  profileId?: string,
): StoredBuildProfile {
  const trimmedName = name.trim()
  if (!trimmedName) {
    throw new Error("Build name is required.")
  }

  const state = readBuildManagerState(storage)
  const existingProfile = profileId
    ? state.profiles.find((profile) => profile.id === profileId) ?? null
    : null
  const now = new Date().toISOString()
  const nextProfile: StoredBuildProfile = {
    id: existingProfile?.id ?? createProfileId(),
    name: trimmedName,
    createdAt: existingProfile?.createdAt ?? now,
    updatedAt: now,
    data: captureCurrentBuildData(storage),
  }

  persistBuildManagerState(storage, {
    schemaVersion: BUILD_MANAGER_SCHEMA_VERSION,
    activeBuildId: nextProfile.id,
    profiles: upsertProfile(state.profiles, nextProfile),
  })

  return nextProfile
}

export function renameBuildProfile(storage: Storage, profileId: string, name: string): StoredBuildProfile {
  const trimmedName = name.trim()
  if (!trimmedName) {
    throw new Error("Build name is required.")
  }

  const state = readBuildManagerState(storage)
  const existingProfile = state.profiles.find((profile) => profile.id === profileId)
  if (!existingProfile) {
    throw new Error("Build not found.")
  }

  const renamedProfile: StoredBuildProfile = {
    ...existingProfile,
    name: trimmedName,
    updatedAt: new Date().toISOString(),
  }

  persistBuildManagerState(storage, {
    ...state,
    profiles: upsertProfile(state.profiles, renamedProfile),
  })

  return renamedProfile
}

export function deleteBuildProfile(storage: Storage, profileId: string): void {
  const state = readBuildManagerState(storage)
  persistBuildManagerState(storage, {
    schemaVersion: BUILD_MANAGER_SCHEMA_VERSION,
    activeBuildId: state.activeBuildId === profileId ? null : state.activeBuildId,
    profiles: state.profiles.filter((profile) => profile.id !== profileId),
  })
}

function getBuildKeysToRemove(storage: Storage): string[] {
  const keysToRemove: string[] = []

  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index)
    if (key && !isManagedBuildStorageKey(key) && !isNonBuildStorageKey(key)) {
      keysToRemove.push(key)
    }
  }

  return keysToRemove
}

export function applyBuildProfile(storage: Storage, profileId: string): StoredBuildProfile {
  const state = readBuildManagerState(storage)
  const profile = state.profiles.find((entry) => entry.id === profileId)

  if (!profile) {
    throw new Error("Build not found.")
  }

  for (const key of getBuildKeysToRemove(storage)) {
    storage.removeItem(key)
  }

  for (const [key, value] of Object.entries(profile.data)) {
    storage.setItem(key, value)
  }

  persistBuildManagerState(storage, {
    ...state,
    activeBuildId: profile.id,
  })
  dispatchBuildSnapshotUpdated()

  return profile
}

export function clearCurrentBuildData(storage: Storage): void {
  for (const key of getBuildKeysToRemove(storage)) {
    storage.removeItem(key)
  }

  clearActiveBuildProfile(storage)
  dispatchBuildSnapshotUpdated()
}

export function exportBuildProfile(profile: BuildExportSource): string {
  const payload: BuildExportPayload = {
    schemaVersion: BUILD_MANAGER_SCHEMA_VERSION,
    type: BUILD_MANAGER_EXPORT_TYPE,
    exportedAt: new Date().toISOString(),
    build: {
      name: profile.name,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
      data: profile.data,
    },
  }

  return JSON.stringify(payload, null, 2)
}

function tryReadDirectStringRecord(value: unknown): { valid: boolean; data: StoredBuildData } {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return { valid: false, data: {} }
  }

  const entries = Object.entries(value)
  if (entries.some(([, entry]) => typeof entry !== "string")) {
    return { valid: false, data: {} }
  }

  return {
    valid: true,
    data: entries.reduce<StoredBuildData>((result, [key, entry]) => {
      if (shouldStoreKeyInBuildProfile(key)) {
        result[key] = entry
      }
      return result
    }, {}),
  }
}

function readImportedBuildData(value: unknown): StoredBuildData {
  const directRecord = tryReadDirectStringRecord(value)

  if (!directRecord.valid) {
    throw new Error("Imported build data must be a JSON object with string local storage values.")
  }

  return directRecord.data
}

export function parseImportedBuildText(text: string, fallbackName = "Imported Build"): ImportedBuildDefinition {
  let parsed: unknown

  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error("Import text is not valid JSON.")
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error("Imported JSON must be an object.")
  }

  const payload = parsed as Partial<BuildExportPayload> & {
    name?: unknown
    data?: unknown
  }

  if (payload.build && typeof payload.build === "object" && payload.build !== null) {
    const build = payload.build as Partial<BuildExportPayload["build"]>
    return {
      name: typeof build.name === "string" && build.name.trim().length > 0 ? build.name.trim() : fallbackName,
      data: readImportedBuildData(build.data),
    }
  }

  if ("data" in payload) {
    return {
      name: typeof payload.name === "string" && payload.name.trim().length > 0 ? payload.name.trim() : fallbackName,
      data: readImportedBuildData(payload.data),
    }
  }

  const directRecord = tryReadDirectStringRecord(parsed)
  if (directRecord.valid) {
    return {
      name: fallbackName,
      data: directRecord.data,
    }
  }

  throw new Error("Imported JSON does not match a supported build format.")
}

export function importBuildProfile(
  storage: Storage,
  text: string,
  nameOverride?: string,
): StoredBuildProfile {
  const imported = parseImportedBuildText(text)
  const trimmedOverride = nameOverride?.trim() ?? ""
  const now = new Date().toISOString()
  const profile: StoredBuildProfile = {
    id: createProfileId(),
    name: trimmedOverride || imported.name,
    createdAt: now,
    updatedAt: now,
    data: imported.data,
  }
  const state = readBuildManagerState(storage)

  persistBuildManagerState(storage, {
    ...state,
    profiles: upsertProfile(state.profiles, profile),
  })

  return profile
}

export function clearActiveBuildProfile(storage: Storage): void {
  const state = readBuildManagerState(storage)
  persistBuildManagerState(storage, {
    ...state,
    activeBuildId: null,
  })
}
