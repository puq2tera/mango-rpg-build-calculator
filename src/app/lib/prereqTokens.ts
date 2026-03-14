import { dungeonUnlockTags } from "@/app/data/dungeon_unlocks"
import { allRacePrereqTokens } from "@/app/data/race_data"
import { skill_data } from "@/app/data/skill_data"
import { talent_data } from "@/app/data/talent_data"

type PrereqSource = string[] | string | undefined

export function normalizePrereqToken(token: string): string {
  return token.trim().toLocaleLowerCase()
}

function buildCanonicalTokenMap(tokens: Iterable<string>): Map<string, string> {
  const map = new Map<string, string>()

  for (const token of tokens) {
    const normalizedToken = normalizePrereqToken(token)

    if (normalizedToken.length === 0 || map.has(normalizedToken)) {
      continue
    }

    map.set(normalizedToken, token)
  }

  return map
}

const talentNameByNormalizedToken = buildCanonicalTokenMap(Object.keys(talent_data))
const skillNameByNormalizedToken = buildCanonicalTokenMap(Object.keys(skill_data))
const canonicalPrereqTokenByNormalizedToken = buildCanonicalTokenMap([
  ...Object.keys(talent_data),
  ...Object.keys(skill_data),
  ...allRacePrereqTokens,
  ...dungeonUnlockTags,
])

export function resolveTalentName(token: string): string | null {
  const normalizedToken = normalizePrereqToken(token)
  return normalizedToken.length > 0 ? (talentNameByNormalizedToken.get(normalizedToken) ?? null) : null
}

export function resolveSkillName(token: string): string | null {
  const normalizedToken = normalizePrereqToken(token)
  return normalizedToken.length > 0 ? (skillNameByNormalizedToken.get(normalizedToken) ?? null) : null
}

export function resolvePrereqToken(token: string): string {
  const trimmedToken = token.trim()

  if (trimmedToken.length === 0) {
    return ""
  }

  const normalizedToken = normalizePrereqToken(trimmedToken)
  return canonicalPrereqTokenByNormalizedToken.get(normalizedToken) ?? trimmedToken
}

export function splitPrereqTokens(preReq: PrereqSource): string[] {
  if (!preReq) {
    return []
  }

  const source = Array.isArray(preReq) ? preReq : [preReq]

  return source
    .flatMap((entry) => entry.split(","))
    .map((entry) => resolvePrereqToken(entry))
    .filter((entry) => entry.length > 0)
}

export function toNormalizedPrereqTokenSet(tokens: Iterable<string>): Set<string> {
  const normalizedTokens = new Set<string>()

  for (const token of tokens) {
    const normalizedToken = normalizePrereqToken(token)

    if (normalizedToken.length > 0) {
      normalizedTokens.add(normalizedToken)
    }
  }

  return normalizedTokens
}
