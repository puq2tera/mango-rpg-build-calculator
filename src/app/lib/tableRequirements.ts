import type { Skill } from "@/app/data/skill_data"
import { skill_data } from "@/app/data/skill_data"
import type { Talent } from "@/app/data/talent_data"
import { talent_data } from "@/app/data/talent_data"
import {
  normalizePrereqToken,
  resolveSkillName,
  resolveTalentName,
  splitPrereqTokens,
  toNormalizedPrereqTokenSet,
} from "@/app/lib/prereqTokens"
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

type TalentRequirementState = {
  prereqTokens: string[]
  requiredClassLevels: RequiredClassLevels
  requiredTotalLevel: number
  requiredTalentPoints: number
  missingRequirement: boolean
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

const defaultSkillPrereqToken = normalizePrereqToken("Default Skill")

const splitTagTokens = (tag: string | undefined): string[] => {
  if (!tag) {
    return []
  }

  return tag
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0)
}

const linkedSkillTooltipByTalentName = (() => {
  const tooltipsByTalentName = new Map<string, string[]>()

  for (const [skillName, skill] of Object.entries(skill_data)) {
    const linkedTalentNames = new Set(
      splitPrereqTokens(skill.PreReq)
        .map((token) => resolveTalentName(token))
        .filter((token): token is string => token !== null),
    )

    for (const talentName of linkedTalentNames) {
      const entries = tooltipsByTalentName.get(talentName) ?? []

      if (!tooltipsByTalentName.has(talentName)) {
        tooltipsByTalentName.set(talentName, entries)
      }

      entries.push(`${skillName}\n${skill.description}`)
    }
  }

  return new Map(
    Array.from(tooltipsByTalentName, ([talentName, entries]) => [talentName, entries.join("\n\n")]),
  )
})()

export function getTalentPrereqTokens(talent: Talent): string[] {
  return splitPrereqTokens(talent.PreReq)
}

export function getSkillPrereqTokens(skill: Skill): string[] {
  return splitPrereqTokens(skill.PreReq)
}

export function getTalentLinkedSkillTooltip(talentName: string): string | null {
  return linkedSkillTooltipByTalentName.get(talentName) ?? null
}

function getSecondPrestigeUnlock(
  talent: Talent,
  prereqTokens: readonly string[],
): string | null {
  if (talent.category !== "prestige") {
    return null
  }

  if (prereqTokens.some((token) => normalizePrereqToken(token) === normalizePrereqToken("PleiadesTrial"))) {
    return secondPrestigeUnlockByPrereq.PleiadesTrial
  }

  if (prereqTokens.some((token) => normalizePrereqToken(token) === normalizePrereqToken("DeathGodBlessing"))) {
    return secondPrestigeUnlockByPrereq.DeathGodBlessing
  }

  return null
}

function getMatchingBlockedTalentNames(
  talentName: string,
  blockedTag: string | undefined,
  selectedTalents: ReadonlySet<string>,
): string[] {
  if (!blockedTag) {
    return []
  }

  const normalizedBlockedTag = normalizePrereqToken(blockedTag)

  return Array.from(selectedTalents).filter((name) => (
    name !== talentName &&
    splitTagTokens(talent_data[name]?.Tag)
      .some((tag) => normalizePrereqToken(tag) === normalizedBlockedTag)
  ))
}

function getSelectedTalentTags(selectedTalents: ReadonlySet<string>): Set<string> {
  return new Set(
    Array.from(selectedTalents)
      .flatMap((name) => splitTagTokens(talent_data[name]?.Tag)),
  )
}

function getTalentSelectionIndex(selectedTalents: ReadonlySet<string>, talentName: string): number {
  let index = 0

  for (const name of selectedTalents) {
    if (name === talentName) {
      return index
    }

    index += 1
  }

  return Number.POSITIVE_INFINITY
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

    const skillName = resolveSkillName(token)

    if (skillName && !visitedSkills.has(skillName)) {
      visitedSkills.add(skillName)
      collectExpandedPrereqTokens(getSkillPrereqTokens(skill_data[skillName]), visitedSkills, visitedTalents)
        .forEach((expandedToken) => expandedTokens.add(expandedToken))
    }

    const talentName = resolveTalentName(token)

    if (talentName && !visitedTalents.has(talentName)) {
      visitedTalents.add(talentName)
      collectExpandedPrereqTokens(getTalentPrereqTokens(talent_data[talentName]), visitedSkills, visitedTalents)
        .forEach((expandedToken) => expandedTokens.add(expandedToken))
    }
  }

  return Array.from(expandedTokens)
}

function buildTalentRequirementState(
  {
    talentName,
    talent,
    selectedTalents,
    selectedRacePrereqs,
    selectedDungeonUnlocks,
    classLevels,
    totalLevels,
  }: TalentAvailabilityArgs,
  requirementMultiplier: number,
): TalentRequirementState {
  const selectedTalentTags = getSelectedTalentTags(selectedTalents)
  const normalizedSelectedTalents = toNormalizedPrereqTokenSet(selectedTalents)
  const normalizedSelectedTalentTags = toNormalizedPrereqTokenSet(selectedTalentTags)
  const normalizedSelectedRacePrereqs = toNormalizedPrereqTokenSet(selectedRacePrereqs)
  const normalizedSelectedDungeonUnlocks = toNormalizedPrereqTokenSet(selectedDungeonUnlocks)
  const basePrereqTokens = getTalentPrereqTokens(talent)
  const secondPrestigeUnlock = getSecondPrestigeUnlock(talent, basePrereqTokens)
  const prereqTokens = requirementMultiplier > 1 && secondPrestigeUnlock
    ? [...basePrereqTokens, secondPrestigeUnlock]
    : basePrereqTokens
  const requiredClassLevels = multiplyClassLevels(talent.class_levels, requirementMultiplier)
  const requiredTotalLevel = (talent.total_level ?? 0) * requirementMultiplier
  const requiredTalentPoints = (talent.tp_spent ?? 0) * requirementMultiplier
  const missingPrereq = prereqTokens.some((req) => {
    const normalizedReq = normalizePrereqToken(req)

    return (
      !normalizedSelectedTalents.has(normalizedReq) &&
      !normalizedSelectedTalentTags.has(normalizedReq) &&
      !normalizedSelectedRacePrereqs.has(normalizedReq) &&
      !normalizedSelectedDungeonUnlocks.has(normalizedReq)
    )
  })
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

  return {
    prereqTokens,
    requiredClassLevels,
    requiredTotalLevel,
    requiredTalentPoints,
    missingRequirement,
  }
}

function getResolvedPrestigeRequirementMultiplier(args: TalentAvailabilityArgs): number {
  const { talentName, talent, selectedTalents, selectedDungeonUnlocks } = args
  const matchingBlockedTalentNames = getMatchingBlockedTalentNames(talentName, talent.BlockedTag, selectedTalents)

  if (matchingBlockedTalentNames.length === 0) {
    return 1
  }

  const basePrereqTokens = getTalentPrereqTokens(talent)
  const secondPrestigeUnlock = getSecondPrestigeUnlock(talent, basePrereqTokens)

  if (!secondPrestigeUnlock || !selectedDungeonUnlocks.has(secondPrestigeUnlock)) {
    return 1
  }

  const otherTalentName = matchingBlockedTalentNames[0]
  const otherTalent = talent_data[otherTalentName]

  if (!otherTalent) {
    return 1
  }

  const pairSelectedTalents = new Set(selectedTalents)
  pairSelectedTalents.add(otherTalentName)
  pairSelectedTalents.add(talentName)

  const pairArgs: TalentAvailabilityArgs = {
    ...args,
    selectedTalents: pairSelectedTalents,
  }
  const otherPairArgs: TalentAvailabilityArgs = {
    ...args,
    talentName: otherTalentName,
    talent: otherTalent,
    selectedTalents: pairSelectedTalents,
  }
  const currentAsFirst = !buildTalentRequirementState(pairArgs, 1).missingRequirement
  const currentAsSecond = !buildTalentRequirementState(pairArgs, 2).missingRequirement
  const otherAsFirst = !buildTalentRequirementState(otherPairArgs, 1).missingRequirement
  const otherAsSecond = !buildTalentRequirementState(otherPairArgs, 2).missingRequirement
  const canCurrentBeFirst = currentAsFirst && otherAsSecond
  const canCurrentBeSecond = currentAsSecond && otherAsFirst

  if (canCurrentBeFirst !== canCurrentBeSecond) {
    return canCurrentBeSecond ? 2 : 1
  }

  if (!selectedTalents.has(talentName)) {
    return 2
  }

  if (!selectedTalents.has(otherTalentName)) {
    return 1
  }

  return getTalentSelectionIndex(selectedTalents, talentName) > getTalentSelectionIndex(selectedTalents, otherTalentName)
    ? 2
    : 1
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

  const normalizedSelectedRaceTokens = toNormalizedPrereqTokenSet(selectedRaceTokens)
  const normalizedAllRaceTokens = toNormalizedPrereqTokenSet(allRaceTokens)
  const matchingRaceTokens = prereqTokens.filter((token) => (
    normalizedAllRaceTokens.has(normalizePrereqToken(token))
  ))

  if (raceFilter === "raceSpecific") {
    return matchingRaceTokens.length > 0
  }

  if (selectedRaceTokens.size === 0) {
    return false
  }

  return matchingRaceTokens.some((token) => normalizedSelectedRaceTokens.has(normalizePrereqToken(token)))
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
  const basePrereqTokens = getTalentPrereqTokens(talent)
  const matchingBlockedTalentNames = getMatchingBlockedTalentNames(talentName, talent.BlockedTag, selectedTalents)
  const matchingBlockedTagCount = matchingBlockedTalentNames.length
  const secondPrestigeUnlock = getSecondPrestigeUnlock(talent, basePrereqTokens)
  const requirementMultiplier = getResolvedPrestigeRequirementMultiplier({
    talentName,
    talent,
    selectedTalents,
    selectedRacePrereqs,
    selectedDungeonUnlocks,
    classLevels,
    totalLevels,
  })
  const {
    prereqTokens,
    requiredClassLevels,
    requiredTotalLevel,
    requiredTalentPoints,
    missingRequirement,
  } = buildTalentRequirementState(
    {
      talentName,
      talent,
      selectedTalents,
      selectedRacePrereqs,
      selectedDungeonUnlocks,
      classLevels,
      totalLevels,
    },
    requirementMultiplier,
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
      .flatMap((name) => splitTagTokens(talent_data[name]?.Tag)),
  )
  const normalizedSelectedSkills = toNormalizedPrereqTokenSet(selectedSkills)
  const normalizedSelectedSkillTags = toNormalizedPrereqTokenSet(selectedSkillTags)
  const normalizedOtherSelectedSkillTags = toNormalizedPrereqTokenSet(otherSelectedSkillTags)
  const normalizedSelectedTalents = toNormalizedPrereqTokenSet(selectedTalents)
  const normalizedSelectedTalentTags = toNormalizedPrereqTokenSet(selectedTalentTags)
  const normalizedSelectedRacePrereqs = toNormalizedPrereqTokenSet(selectedRacePrereqs)
  const normalizedSelectedDungeonUnlocks = toNormalizedPrereqTokenSet(selectedDungeonUnlocks)
  const selectedSkillPoints = Array.from(selectedSkills).reduce((sum, name) => sum + (skill_data[name]?.sp ?? 0), 0) + trainingPointsSpent
  const spentPointsBeforeCurrent = selectedSkillPoints - (selectedSkills.has(skillName) ? (skill.sp ?? 0) : 0)

  const missingPrereq = prereqTokens.some((req) => {
    const normalizedReq = normalizePrereqToken(req)

    return (
      normalizedReq !== defaultSkillPrereqToken &&
      !normalizedSelectedSkills.has(normalizedReq) &&
      !normalizedSelectedSkillTags.has(normalizedReq) &&
      !normalizedSelectedTalents.has(normalizedReq) &&
      !normalizedSelectedTalentTags.has(normalizedReq) &&
      !normalizedSelectedRacePrereqs.has(normalizedReq) &&
      !normalizedSelectedDungeonUnlocks.has(normalizedReq)
    )
  })

  const missingClassLevel = (
    classLevels.tank < (skill.class_levels.tank_levels ?? 0) ||
    classLevels.warrior < (skill.class_levels.warrior_levels ?? 0) ||
    classLevels.caster < (skill.class_levels.caster_levels ?? 0) ||
    classLevels.healer < (skill.class_levels.healer_levels ?? 0)
  )

  const missingSkillPoints = spentPointsBeforeCurrent < (skill.sp_spent ?? 0)
  const missingRequirement = missingPrereq || missingClassLevel || missingSkillPoints
  const blockedTag = skill.BlockedTag ?? ""
  const blockedTagConflict = (
    blockedTag.length > 0 &&
    normalizedOtherSelectedSkillTags.has(normalizePrereqToken(blockedTag))
  )

  return {
    prereqTokens,
    raceFilterTokens,
    missingRequirement,
    blockedTagConflict,
    isAvailable: !missingRequirement && !blockedTagConflict,
  }
}
