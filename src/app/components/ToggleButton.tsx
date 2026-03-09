"use client"

import type { Dispatch, SetStateAction } from "react"
import type { Talent } from "../data/talent_data"
import type { Skill } from "../data/skill_data"
import { dispatchBuildSnapshotUpdated } from "@/app/lib/buildEvents"
import { formatSignedDamageDelta } from "@/app/lib/damageCalc"
import type { ManagedColumn } from "@/app/lib/managedColumns"
import { getStripedRowClass } from "@/app/lib/tableRowStyles"
import { getSkillAvailabilityState, getTalentAvailabilityState, type ClassLevels } from "@/app/lib/tableRequirements"

type ToggleButtonProps = {
  talentName: string
  talent: Talent
  selected: Set<string>
  setSelected: Dispatch<SetStateAction<Set<string>>>
  totalLevels: number
  selectedRacePrereqs: Set<string>
  selectedDungeonUnlocks: Set<string>
  classLevels: ClassLevels
  columns: ManagedColumn[]
  averageDamageChange: number | null
  rowIndex: number
}

type SkillButtonProps = {
  skillName: string
  skill: Skill
  selected: Set<string>
  setSelected: Dispatch<SetStateAction<Set<string>>>
  selectedTalents: Set<string>
  selectedRacePrereqs: Set<string>
  selectedDungeonUnlocks: Set<string>
  classLevels: ClassLevels
  trainingPointsSpent?: number
  columns: ManagedColumn[]
  averageDamageChange?: number | null
  rowIndex: number
}

type ClassColorKey = "tank" | "warrior" | "caster" | "healer"
type ClassLevelSource = {
  class_levels: {
    tank_levels?: number | 0
    warrior_levels?: number | 0
    caster_levels?: number | 0
    healer_levels?: number | 0
  }
}

function getAverageDamageClass(value: number | null | undefined): string {
  if (value === undefined) return ""
  if (value === null) return "text-slate-400 text-right font-mono tabular-nums"
  if (value > 0) return "text-emerald-300 text-right font-mono tabular-nums"
  if (value < 0) return "text-rose-300 text-right font-mono tabular-nums"
  return "text-slate-200 text-right font-mono tabular-nums"
}

function getPrimaryClassKey(item: ClassLevelSource): ClassColorKey | null {
  const levels: Record<ClassColorKey, number> = {
    tank: item.class_levels.tank_levels ?? 0,
    warrior: item.class_levels.warrior_levels ?? 0,
    caster: item.class_levels.caster_levels ?? 0,
    healer: item.class_levels.healer_levels ?? 0,
  }

  let primaryClass: ClassColorKey | null = null
  let highestLevel = 0

  for (const classKey of ["tank", "warrior", "caster", "healer"] as const) {
    if (levels[classKey] > highestLevel) {
      highestLevel = levels[classKey]
      primaryClass = classKey
    }
  }

  return primaryClass
}

function getClassTint(
  item: ClassLevelSource,
  state: "default" | "selected" | "unavailable",
): string {
  const primaryClass = getPrimaryClassKey(item)

  if (!primaryClass) {
    return ""
  }

  const subtleTintByClass: Record<ClassColorKey, string> = {
    tank: "bg-[linear-gradient(90deg,rgba(132,204,22,0.18),rgba(132,204,22,0.075),transparent_72%)]",
    warrior: "bg-[linear-gradient(90deg,rgba(248,113,113,0.2),rgba(248,113,113,0.09),transparent_72%)]",
    caster: "bg-[linear-gradient(90deg,rgba(59,130,246,0.28),rgba(59,130,246,0.12),transparent_72%)]",
    healer: "bg-[linear-gradient(90deg,rgba(192,132,252,0.18),rgba(192,132,252,0.075),transparent_72%)]",
  }

  const selectedTintByClass: Record<ClassColorKey, string> = {
    tank: "bg-[linear-gradient(90deg,rgba(34,197,94,0.74),rgba(34,197,94,0.38),transparent_82%)] ring-1 ring-inset ring-lime-100/75",
    warrior: "bg-[linear-gradient(90deg,rgba(239,68,68,0.6),rgba(239,68,68,0.28),transparent_80%)] ring-1 ring-inset ring-rose-200/65",
    caster: "bg-[linear-gradient(90deg,rgba(37,99,235,0.68),rgba(37,99,235,0.32),transparent_80%)] ring-1 ring-inset ring-blue-200/70",
    healer: "bg-[linear-gradient(90deg,rgba(147,51,234,0.74),rgba(147,51,234,0.34),transparent_82%)] ring-1 ring-inset ring-violet-100/75",
  }

  const unavailableTintByClass: Record<ClassColorKey, string> = {
    tank: "bg-[linear-gradient(90deg,rgba(132,204,22,0.02),rgba(132,204,22,0.007),transparent_72%)]",
    warrior: "bg-[linear-gradient(90deg,rgba(248,113,113,0.032),rgba(248,113,113,0.012),transparent_72%)]",
    caster: "bg-[linear-gradient(90deg,rgba(59,130,246,0.04),rgba(59,130,246,0.014),transparent_72%)]",
    healer: "bg-[linear-gradient(90deg,rgba(192,132,252,0.022),rgba(192,132,252,0.008),transparent_72%)]",
  }

  if (state === "selected") {
    return selectedTintByClass[primaryClass]
  }

  if (state === "unavailable") {
    return unavailableTintByClass[primaryClass]
  }

  return subtleTintByClass[primaryClass]
}

export function ToggleButton({
  talentName,
  talent,
  selected,
  setSelected,
  totalLevels,
  selectedRacePrereqs,
  selectedDungeonUnlocks,
  classLevels,
  columns,
  averageDamageChange,
  rowIndex,
}: ToggleButtonProps) {
  const isSelected = selected.has(talentName)
  const {
    blockedTagConflict,
    missingRequirement,
    prereqTokens,
    requiredClassLevels,
    requiredTotalLevel,
    requiredTalentPoints,
  } = getTalentAvailabilityState({
    talentName,
    talent,
    selectedTalents: selected,
    selectedRacePrereqs,
    selectedDungeonUnlocks,
    classLevels,
    totalLevels,
  })
  const isUnavailable = blockedTagConflict || missingRequirement
  const rowTone = isSelected && isUnavailable
    ? "selectedBlocked"
    : isUnavailable
      ? "unavailable"
      : isSelected
        ? "selected"
        : "default"
  const rowClass = getStripedRowClass(rowIndex, rowTone)

  const handleClick = () => {
    const nextSelected = new Set(selected)
    if (nextSelected.has(talentName)) {
      nextSelected.delete(talentName)
      console.log(`Removed ${talentName}`)
    } else {
      nextSelected.add(talentName)
      console.log(`Added ${talentName}`)
    }

    setSelected(nextSelected)
    // Update selectedTalents
    localStorage.setItem("selectedTalents", JSON.stringify(Array.from(nextSelected)))
    dispatchBuildSnapshotUpdated()
    window.dispatchEvent(new Event("talentsUpdated"))
  }

  const values: Record<string, string> = {
    name: talentName,
    preReq: prereqTokens.join(", "),
    tag: talent.Tag,
    blockedTag: talent.BlockedTag,
    gold: String(talent.gold),
    exp: String(talent.exp),
    tp: String(requiredTalentPoints),
    lvl: String(requiredTotalLevel),
    tank: String(requiredClassLevels.tank_levels ?? 0),
    warrior: String(requiredClassLevels.warrior_levels ?? 0),
    caster: String(requiredClassLevels.caster_levels ?? 0),
    healer: String(requiredClassLevels.healer_levels ?? 0),
    description: talent.description,
    avgDamageChange: formatSignedDamageDelta(averageDamageChange),
  }

  return (
    <button
      onClick={handleClick}
      className={`grid min-w-full w-max text-left transition px-0 py-1 ${rowClass} ${getClassTint(
        talent,
        isSelected && isUnavailable
          ? "default"
          : isUnavailable
            ? "unavailable"
            : isSelected
              ? "selected"
              : "default",
      )}`}
      style={{ gridTemplateColumns: columns.map((column) => `${column.renderWidth}px`).join(" ") }}
    >
      {columns.map((column) => (
        <span
          key={column.id}
          className={`${column.collapsed ? "px-0" : "px-2 whitespace-nowrap"} border-r border-slate-700 last:border-r-0 box-border overflow-hidden ${
            column.id === "avgDamageChange" ? getAverageDamageClass(averageDamageChange) : ""
          }`}
        >
          {column.collapsed ? "" : (values[column.id] ?? "")}
        </span>
      ))}
    </button>
  )
}

export function SkillButton({
  skillName,
  skill,
  selected,
  setSelected,
  selectedTalents,
  selectedRacePrereqs,
  selectedDungeonUnlocks,
  classLevels,
  trainingPointsSpent = 0,
  columns,
  averageDamageChange,
  rowIndex,
}: SkillButtonProps) {
  const isSelected = selected.has(skillName)
  const { blockedTagConflict, missingRequirement } = getSkillAvailabilityState({
    skillName,
    skill,
    selectedSkills: selected,
    selectedTalents,
    selectedRacePrereqs,
    selectedDungeonUnlocks,
    classLevels,
    trainingPointsSpent,
  })
  const isUnavailable = blockedTagConflict || missingRequirement

  const handleClick = () => {
    setSelected((currentSelected) => {
      const newSet = new Set(currentSelected)

      if (newSet.has(skillName)) {
        newSet.delete(skillName)
        console.log(`Removed ${skillName}`)
      } else {
        newSet.add(skillName)
        console.log(`Added ${skillName}`)
      }

      localStorage.setItem("selectedBuffs", JSON.stringify(Array.from(newSet)))
      dispatchBuildSnapshotUpdated()
      return newSet
    })
  }
  // TODO: ADD sp cost to button instead of just sp_spent required to learn it
  const values: Record<string, string> = {
    name: skillName,
    preReq: Array.isArray(skill.PreReq) ? skill.PreReq.join(", ") : (skill.PreReq ?? ""),
    tag: skill.Tag ?? "",
    blockedTag: skill.BlockedTag ?? "",
    gold: String(skill.gold),
    exp: String(skill.exp),
    sp: String(skill.sp ?? 0),
    spSpent: String(skill.sp_spent ?? 0),
    tank: String(skill.class_levels.tank_levels ?? 0),
    warrior: String(skill.class_levels.warrior_levels ?? 0),
    caster: String(skill.class_levels.caster_levels ?? 0),
    healer: String(skill.class_levels.healer_levels ?? 0),
    description: skill.description,
    avgDamageChange: formatSignedDamageDelta(averageDamageChange ?? null),
  }

  return (
    <button
      onClick={handleClick}
      className={`grid min-w-full w-max text-left transition px-0 py-1 ${getStripedRowClass(
        rowIndex,
        isSelected && isUnavailable
          ? "selectedBlocked"
          : isUnavailable
            ? "unavailable"
            : isSelected
              ? "selected"
              : "default",
      )} ${getClassTint(
        skill,
        isSelected && isUnavailable
          ? "default"
          : isUnavailable
            ? "unavailable"
          : isSelected
            ? "selected"
            : "default",
      )}`}
      style={{ gridTemplateColumns: columns.map((column) => `${column.renderWidth}px`).join(" ") }}
    >
      {columns.map((column) => (
        <span
          key={column.id}
          className={`${column.collapsed ? "px-0" : "px-2 whitespace-nowrap"} border-r border-slate-700 last:border-r-0 box-border overflow-hidden ${
            column.id === "avgDamageChange" ? getAverageDamageClass(averageDamageChange) : ""
          }`}
        >
          {column.collapsed ? "" : (values[column.id] ?? "")}
        </span>
      ))}
    </button>
  )
}
