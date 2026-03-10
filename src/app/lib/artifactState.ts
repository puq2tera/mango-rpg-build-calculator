export const ARTIFACT_STAT_KEYS = ["ATK%", "DEF%", "MATK%", "HEAL%"] as const

export type ArtifactStatKey = typeof ARTIFACT_STAT_KEYS[number]

export type ArtifactState = Record<ArtifactStatKey, number> & {
  Level: number
}

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value)

export function createDefaultArtifact(): ArtifactState {
  return {
    "ATK%": 100,
    "DEF%": 100,
    "MATK%": 100,
    "HEAL%": 100,
    Level: 0,
  }
}

export function normalizeArtifact(value: unknown): ArtifactState {
  const fallback = createDefaultArtifact()

  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return fallback
  }

  const parsed = value as Partial<Record<ArtifactStatKey | "Level", unknown>>

  return {
    "ATK%": isFiniteNumber(parsed["ATK%"]) ? parsed["ATK%"] : fallback["ATK%"],
    "DEF%": isFiniteNumber(parsed["DEF%"]) ? parsed["DEF%"] : fallback["DEF%"],
    "MATK%": isFiniteNumber(parsed["MATK%"]) ? parsed["MATK%"] : fallback["MATK%"],
    "HEAL%": isFiniteNumber(parsed["HEAL%"]) ? parsed["HEAL%"] : fallback["HEAL%"],
    Level: isFiniteNumber(parsed.Level) ? parsed.Level : fallback.Level,
  }
}
