import { skill_data } from "@/app/data/skill_data"
import { talent_data } from "@/app/data/talent_data"
import { resolveSkillName, resolveTalentName, splitPrereqTokens } from "@/app/lib/prereqTokens"

export const TALENT_SELECTION_STORAGE_KEY = "selectedTalents"
export const BUFF_SELECTION_STORAGE_KEY = "selectedBuffs"
export const SKILL_SELECTION_STORAGE_KEY = "selectedSkills"
export const DEFAULT_LEARN_COMMAND_MAX_LENGTH = 300
export const DEFAULT_TALENT_LEARN_COMMAND_PREFIX = "cz xlearntalent "
export const DEFAULT_SKILL_LEARN_COMMAND_PREFIX = "cz xlearnskill "

export type LearnCommandBatch = {
  entries: string[]
  length: number
  text: string
}

const talentNames = Object.keys(talent_data)
const skillNames = Object.keys(skill_data)
const talentOrderIndex = new Map(talentNames.map((name, index) => [name, index]))
const skillOrderIndex = new Map(skillNames.map((name, index) => [name, index]))
const validTalentNames = new Set(talentNames)
const validSkillNames = new Set(skillNames)

const jsonParse = <T>(raw: string | null, fallback: T): T => {
  if (!raw) {
    return fallback
  }

  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

const asUniqueValidNames = (value: unknown, validNames: ReadonlySet<string>): string[] => {
  if (!Array.isArray(value)) {
    return []
  }

  const seen = new Set<string>()
  const result: string[] = []

  for (const entry of value) {
    if (typeof entry !== "string" || !validNames.has(entry) || seen.has(entry)) {
      continue
    }

    seen.add(entry)
    result.push(entry)
  }

  return result
}

export function readSelectedTalents(storage: Storage): string[] {
  return asUniqueValidNames(
    jsonParse(storage.getItem(TALENT_SELECTION_STORAGE_KEY), []),
    validTalentNames,
  )
}

export function readSelectedSkills(storage: Storage): string[] {
  const selectedSkillsRaw = storage.getItem(SKILL_SELECTION_STORAGE_KEY)
  if (selectedSkillsRaw !== null) {
    return asUniqueValidNames(
      jsonParse(selectedSkillsRaw, []),
      validSkillNames,
    )
  }

  const migratedSkills = asUniqueValidNames(
    jsonParse(storage.getItem(BUFF_SELECTION_STORAGE_KEY), []),
    validSkillNames,
  )

  if (migratedSkills.length > 0) {
    try {
      storage.setItem(SKILL_SELECTION_STORAGE_KEY, JSON.stringify(migratedSkills))
    } catch {
      // Ignore storage write failures and keep using the in-memory migrated list.
    }
  }

  return migratedSkills
}

function orderSelectedNames(
  selectedNames: Iterable<string>,
  getOrderIndex: (name: string) => number,
  getPrereqs: (name: string) => string[],
): string[] {
  const uniqueSelected = Array.from(new Set(selectedNames))
  const selectedSet = new Set(uniqueSelected)
  const orderedSelected = [...uniqueSelected].sort((left, right) => {
    const difference = getOrderIndex(left) - getOrderIndex(right)
    return difference !== 0 ? difference : left.localeCompare(right)
  })

  const visited = new Set<string>()
  const active = new Set<string>()
  const result: string[] = []

  const visit = (name: string) => {
    if (visited.has(name) || active.has(name)) {
      return
    }

    active.add(name)

    const prereqs = getPrereqs(name)
      .filter((token) => selectedSet.has(token))
      .sort((left, right) => {
        const difference = getOrderIndex(left) - getOrderIndex(right)
        return difference !== 0 ? difference : left.localeCompare(right)
      })

    for (const prereq of prereqs) {
      visit(prereq)
    }

    active.delete(name)
    visited.add(name)
    result.push(name)
  }

  for (const name of orderedSelected) {
    visit(name)
  }

  return result
}

export function getOrderedTalentNames(selectedNames: Iterable<string>): string[] {
  return orderSelectedNames(
    selectedNames,
    (name) => talentOrderIndex.get(name) ?? Number.MAX_SAFE_INTEGER,
    (name) => splitPrereqTokens(talent_data[name]?.PreReq)
      .map((token) => resolveTalentName(token) ?? token),
  )
}

export function getOrderedSkillNames(selectedNames: Iterable<string>): string[] {
  return orderSelectedNames(
    selectedNames,
    (name) => skillOrderIndex.get(name) ?? Number.MAX_SAFE_INTEGER,
    (name) => splitPrereqTokens(skill_data[name]?.PreReq)
      .map((token) => resolveSkillName(token) ?? token),
  )
}

export function buildLearnCommandBatches(
  orderedNames: Iterable<string>,
  prefix: string,
  maxLength = DEFAULT_LEARN_COMMAND_MAX_LENGTH,
): LearnCommandBatch[] {
  const batches: LearnCommandBatch[] = []
  let currentEntries: string[] = []
  let currentText = prefix

  const flushBatch = () => {
    if (currentEntries.length === 0) {
      return
    }

    batches.push({
      entries: currentEntries,
      length: currentText.length,
      text: currentText,
    })

    currentEntries = []
    currentText = prefix
  }

  for (const name of orderedNames) {
    const separator = currentEntries.length === 0 ? "" : "/"
    const nextText = `${currentText}${separator}${name}`

    if (currentEntries.length > 0 && nextText.length > maxLength) {
      flushBatch()
    }

    const nextSeparator = currentEntries.length === 0 ? "" : "/"
    currentEntries = [...currentEntries, name]
    currentText = `${currentText}${nextSeparator}${name}`
  }

  flushBatch()
  return batches
}
