import type { Skill } from "@/app/data/skill_data"
import { skill_data } from "@/app/data/skill_data"
import type { Talent } from "@/app/data/talent_data"
import { talent_data } from "@/app/data/talent_data"
import type { ClassFilter } from "@/app/lib/tableViewState"

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
  if (classFilter === "all") {
    return true
  }

  const normalizedLevels = {
    tank: Number(requiredClassLevels.tank_levels ?? 0),
    warrior: Number(requiredClassLevels.warrior_levels ?? 0),
    caster: Number(requiredClassLevels.caster_levels ?? 0),
    healer: Number(requiredClassLevels.healer_levels ?? 0),
  }

  const hasClassRequirement = Object.values(normalizedLevels).some((value) => value > 0)
  return !hasClassRequirement || normalizedLevels[classFilter] > 0
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

  const otherSelectedTalentTags = new Set(
    Array.from(selectedTalents)
      .filter((name) => name !== talentName)
      .map((name) => talent_data[name]?.Tag)
      .filter((tag): tag is string => Boolean(tag)),
  )

  const prereqTokens = getTalentPrereqTokens(talent)
  const missingPrereq = prereqTokens.some((req) => (
    !selectedTalents.has(req) &&
    !selectedTalentTags.has(req) &&
    !selectedRacePrereqs.has(req) &&
    !selectedDungeonUnlocks.has(req)
  ))

  const missingClassLevel = (
    classLevels.tank < (talent.class_levels.tank_levels ?? 0) ||
    classLevels.warrior < (talent.class_levels.warrior_levels ?? 0) ||
    classLevels.caster < (talent.class_levels.caster_levels ?? 0) ||
    classLevels.healer < (talent.class_levels.healer_levels ?? 0)
  )

  const tpSpent = selectedTalents.size - (selectedTalents.has(talentName) ? 1 : 0)
  const missingRequirement = (
    totalLevels < (talent.total_level ?? 0) ||
    tpSpent < (talent.tp_spent ?? 0) ||
    missingPrereq ||
    missingClassLevel
  )
  const blockedTagConflict = Boolean(talent.BlockedTag) && otherSelectedTalentTags.has(talent.BlockedTag)
  const raceFilterTokens = collectExpandedPrereqTokens(prereqTokens)

  return {
    prereqTokens,
    raceFilterTokens,
    missingRequirement,
    blockedTagConflict,
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
