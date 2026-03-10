import type { Skill } from "@/app/data/skill_data"
import { skill_data } from "@/app/data/skill_data"
import type { Talent } from "@/app/data/talent_data"
import { talent_data } from "@/app/data/talent_data"
import { CLASS_FILTER_KEYS, type ClassFilter } from "@/app/lib/tableViewState"

export type ClassLevels = {
  tank: number
  warrior: number
  caster: number
  healer: number
}

type RequiredClassLevels = {
  tank_levels?: number | 0
  warrior_levels?: number | 0
  caster_levels?: number | 0
  healer_levels?: number | 0
}

type TalentAvailabilityArgs = {
  talentName: string
  talent: Talent
  selectedTalents: Set<string>
  selectedRacePrereqs: Set<string>
  selectedDungeonUnlocks: Set<string>
  classLevels: ClassLevels
  totalLevels: number
}

type SkillAvailabilityArgs = {
  skillName: string
  skill: Skill
  selectedSkills: Set<string>
  selectedTalents: Set<string>
  selectedRacePrereqs: Set<string>
  selectedDungeonUnlocks: Set<string>
  classLevels: ClassLevels
  trainingPointsSpent?: number
}

const secondPrestigeUnlockByPrereq = {
  PleiadesTrial: "AncientTrial",
  DeathGodBlessing: "SpiritFragment",
} as const

const splitPrereqTokens = (preReq: Array<string> | string | undefined): string[] => {
  if (!preReq) {
    return []
  }

  const source = Array.isArray(preReq) ? preReq : [preReq]

  return source
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter((value) => value.length > 0)
}

export function getTalentPrereqTokens(talent: Talent): string[] {
  return splitPrereqTokens(talent.PreReq)
}

export function getSkillPrereqTokens(skill: Skill): string[] {
  return splitPrereqTokens(skill.PreReq)
}

function getSecondPrestigeUnlock(
  talent: Talent,
  prereqTokens: readonly string[],
): string | null {
  if (talent.category !== "prestige") {
    return null
  }

  if (prereqTokens.includes("PleiadesTrial")) {
    return secondPrestigeUnlockByPrereq.PleiadesTrial
  }

  if (prereqTokens.includes("DeathGodBlessing")) {
    return secondPrestigeUnlockByPrereq.DeathGodBlessing
  }

  return null
}

function multiplyClassLevels(requiredClassLevels: RequiredClassLevels, multiplier: number): RequiredClassLevels {
  return {
    tank_levels: (requiredClassLevels.tank_levels ?? 0) * multiplier,
    warrior_levels: (requiredClassLevels.warrior_levels ?? 0) * multiplier,
    caster_levels: (requiredClassLevels.caster_levels ?? 0) * multiplier,
    healer_levels: (requiredClassLevels.healer_levels ?? 0) * multiplier,
  }
}

function collectExpandedPrereqTokens(
  prereqTokens: readonly string[],
  visitedSkills = new Set<string>(),
  visitedTalents = new Set<string>(),
): string[] {
  const expandedTokens = new Set<string>()

  for (const token of prereqTokens) {
    expandedTokens.add(token)

    if (token in skill_data && !visitedSkills.has(token)) {
      visitedSkills.add(token)
      collectExpandedPrereqTokens(getSkillPrereqTokens(skill_data[token]), visitedSkills, visitedTalents)
        .forEach((expandedToken) => expandedTokens.add(expandedToken))
    }

    if (token in talent_data && !visitedTalents.has(token)) {
      visitedTalents.add(token)
      collectExpandedPrereqTokens(getTalentPrereqTokens(talent_data[token]), visitedSkills, visitedTalents)
        .forEach((expandedToken) => expandedTokens.add(expandedToken))
    }
  }

  return Array.from(expandedTokens)
}

export function matchesClassFilter(requiredClassLevels: RequiredClassLevels, classFilter: ClassFilter): boolean {
  const normalizedLevels = {
    tank: Number(requiredClassLevels.tank_levels ?? 0),
    warrior: Number(requiredClassLevels.warrior_levels ?? 0),
    caster: Number(requiredClassLevels.caster_levels ?? 0),
    healer: Number(requiredClassLevels.healer_levels ?? 0),
  }

  const requiredClasses = CLASS_FILTER_KEYS.filter((classKey) => classFilter[classKey] === "required")
  const optionalClasses = CLASS_FILTER_KEYS.filter((classKey) => classFilter[classKey] === "optional")
  const excludedClasses = CLASS_FILTER_KEYS.filter((classKey) => classFilter[classKey] === "excluded")

  if (excludedClasses.some((classKey) => normalizedLevels[classKey] > 0)) {
    return false
  }

  if (requiredClasses.some((classKey) => normalizedLevels[classKey] <= 0)) {
    return false
  }

  if (requiredClasses.length > 0) {
    return true
  }

  if (optionalClasses.length === 0) {
    return true
  }

  return optionalClasses.some((classKey) => normalizedLevels[classKey] > 0)
}

export function matchesRaceFilter(
  prereqTokens: readonly string[],
  raceFilter: "all" | "current" | "raceSpecific",
  selectedRaceTokens: ReadonlySet<string>,
  allRaceTokens: ReadonlySet<string>,
): boolean {
  if (raceFilter === "all") {
    return true
  }

  const matchingRaceTokens = prereqTokens.filter((token) => allRaceTokens.has(token))

  if (raceFilter === "raceSpecific") {
    return matchingRaceTokens.length > 0
  }

  if (selectedRaceTokens.size === 0) {
    return false
  }

  return matchingRaceTokens.some((token) => selectedRaceTokens.has(token))
}

export function getTalentAvailabilityState({
  talentName,
  talent,
  selectedTalents,
  selectedRacePrereqs,
  selectedDungeonUnlocks,
  classLevels,
  totalLevels,
}: TalentAvailabilityArgs) {
  const selectedTalentTags = new Set(
    Array.from(selectedTalents)
      .map((name) => talent_data[name]?.Tag)
      .filter((tag): tag is string => Boolean(tag)),
  )

  const basePrereqTokens = getTalentPrereqTokens(talent)
  const matchingBlockedTagCount = talent.BlockedTag
    ? Array.from(selectedTalents).filter((name) => name !== talentName && talent_data[name]?.Tag === talent.BlockedTag).length
    : 0
  const secondPrestigeUnlock = getSecondPrestigeUnlock(talent, basePrereqTokens)
  const isSecondPrestigeSelection = Boolean(secondPrestigeUnlock) && matchingBlockedTagCount > 0
  const prereqTokens = isSecondPrestigeSelection && secondPrestigeUnlock
    ? [...basePrereqTokens, secondPrestigeUnlock]
    : basePrereqTokens
  const requirementMultiplier = isSecondPrestigeSelection ? 2 : 1
  const requiredClassLevels = multiplyClassLevels(talent.class_levels, requirementMultiplier)
  const requiredTotalLevel = (talent.total_level ?? 0) * requirementMultiplier
  const requiredTalentPoints = (talent.tp_spent ?? 0) * requirementMultiplier
  const missingPrereq = prereqTokens.some((req) => (
    !selectedTalents.has(req) &&
    !selectedTalentTags.has(req) &&
    !selectedRacePrereqs.has(req) &&
    !selectedDungeonUnlocks.has(req)
  ))

  const missingClassLevel = (
    classLevels.tank < (requiredClassLevels.tank_levels ?? 0) ||
    classLevels.warrior < (requiredClassLevels.warrior_levels ?? 0) ||
    classLevels.caster < (requiredClassLevels.caster_levels ?? 0) ||
    classLevels.healer < (requiredClassLevels.healer_levels ?? 0)
  )

  const tpSpent = selectedTalents.size - (selectedTalents.has(talentName) ? 1 : 0)
  const missingRequirement = (
    totalLevels < requiredTotalLevel ||
    tpSpent < requiredTalentPoints ||
    missingPrereq ||
    missingClassLevel
  )
  const maxSelectableTalentsInGroup = secondPrestigeUnlock && selectedDungeonUnlocks.has(secondPrestigeUnlock) ? 2 : 1
  const blockedTagConflict = Boolean(talent.BlockedTag) && matchingBlockedTagCount >= maxSelectableTalentsInGroup
  const raceFilterTokens = collectExpandedPrereqTokens(prereqTokens)

  return {
    prereqTokens,
    raceFilterTokens,
    missingRequirement,
    blockedTagConflict,
    requiredClassLevels,
    requiredTotalLevel,
    requiredTalentPoints,
    isAvailable: !missingRequirement && !blockedTagConflict,
  }
}

export function getSkillAvailabilityState({
  skillName,
  skill,
  selectedSkills,
  selectedTalents,
  selectedRacePrereqs,
  selectedDungeonUnlocks,
  classLevels,
  trainingPointsSpent = 0,
}: SkillAvailabilityArgs) {
  const prereqTokens = getSkillPrereqTokens(skill)
  const raceFilterTokens = collectExpandedPrereqTokens(prereqTokens)
  const selectedSkillTags = new Set(
    Array.from(selectedSkills)
      .map((name) => skill_data[name]?.Tag)
      .filter((tag): tag is string => Boolean(tag)),
  )
  const otherSelectedSkillTags = new Set(
    Array.from(selectedSkills)
      .filter((name) => name !== skillName)
      .map((name) => skill_data[name]?.Tag)
      .filter((tag): tag is string => Boolean(tag)),
  )
  const selectedTalentTags = new Set(
    Array.from(selectedTalents)
      .map((name) => talent_data[name]?.Tag)
      .filter((tag): tag is string => Boolean(tag)),
  )
  const selectedSkillPoints = Array.from(selectedSkills).reduce((sum, name) => sum + (skill_data[name]?.sp ?? 0), 0) + trainingPointsSpent
  const spentPointsBeforeCurrent = selectedSkillPoints - (selectedSkills.has(skillName) ? (skill.sp ?? 0) : 0)

  const missingPrereq = prereqTokens.some((req) => (
    req !== "Default Skill" &&
    !selectedSkills.has(req) &&
    !selectedSkillTags.has(req) &&
    !selectedTalents.has(req) &&
    !selectedTalentTags.has(req) &&
    !selectedRacePrereqs.has(req) &&
    !selectedDungeonUnlocks.has(req)
  ))

  const missingClassLevel = (
    classLevels.tank < (skill.class_levels.tank_levels ?? 0) ||
    classLevels.warrior < (skill.class_levels.warrior_levels ?? 0) ||
    classLevels.caster < (skill.class_levels.caster_levels ?? 0) ||
    classLevels.healer < (skill.class_levels.healer_levels ?? 0)
  )

  const missingSkillPoints = spentPointsBeforeCurrent < (skill.sp_spent ?? 0)
  const missingRequirement = missingPrereq || missingClassLevel || missingSkillPoints
  const blockedTag = skill.BlockedTag ?? ""
  const blockedTagConflict = blockedTag.length > 0 && otherSelectedSkillTags.has(blockedTag)

  return {
    prereqTokens,
    raceFilterTokens,
    missingRequirement,
    blockedTagConflict,
    isAvailable: !missingRequirement && !blockedTagConflict,
  }
}
