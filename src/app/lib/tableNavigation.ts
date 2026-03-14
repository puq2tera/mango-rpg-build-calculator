import { skill_data } from "@/app/data/skill_data"
import { talent_data } from "@/app/data/talent_data"
import { resolveSkillName, resolveTalentName } from "@/app/lib/prereqTokens"

export const TABLE_FOCUS_QUERY_PARAM = "focus"

export type TableScrollPosition = {
  left: number
  top: number
}

const defaultTableScrollPosition: TableScrollPosition = {
  left: 0,
  top: 0,
}

export function getPrereqHref(token: string): string | null {
  const talentName = resolveTalentName(token)

  if (talentName && talentName in talent_data) {
    const query = new URLSearchParams([[TABLE_FOCUS_QUERY_PARAM, talentName]])
    return `/talents?${query.toString()}`
  }

  const skillName = resolveSkillName(token)

  if (skillName && skillName in skill_data) {
    const query = new URLSearchParams([[TABLE_FOCUS_QUERY_PARAM, skillName]])
    return `/Skills?${query.toString()}`
  }

  return null
}

export function readTableScrollPosition(storage: Storage, storageKey: string): TableScrollPosition {
  const raw = storage.getItem(storageKey)
  if (!raw) {
    return defaultTableScrollPosition
  }

  try {
    const parsed = JSON.parse(raw) as Partial<TableScrollPosition>
    return {
      left: typeof parsed.left === "number" && Number.isFinite(parsed.left) ? parsed.left : 0,
      top: typeof parsed.top === "number" && Number.isFinite(parsed.top) ? parsed.top : 0,
    }
  } catch {
    return defaultTableScrollPosition
  }
}

export function persistTableScrollPosition(
  storage: Storage,
  storageKey: string,
  position: TableScrollPosition,
): void {
  storage.setItem(storageKey, JSON.stringify({
    left: Number.isFinite(position.left) ? position.left : 0,
    top: Number.isFinite(position.top) ? position.top : 0,
  }))
}
