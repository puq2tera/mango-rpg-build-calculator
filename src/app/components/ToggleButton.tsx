"use client"

import type { Dispatch, SetStateAction } from "react"
import type { Talent } from "../data/talent_data"
import { talent_data } from "../data/talent_data"
import type { Skill } from "../data/skill_data"
import { skill_data } from "../data/skill_data"
import { formatSignedDamageDelta } from "@/app/lib/damageCalc"
import type { ManagedColumn } from "@/app/lib/managedColumns"

type ToggleButtonProps = {
  talentName: string
  talent: Talent
  selected: Set<string>
  setSelected: Dispatch<SetStateAction<Set<string>>>
  totalLevels: number
  selectedRacePrereqs: Set<string>
  selectedDungeonUnlocks: Set<string>
  classLevels: {
    tank: number
    warrior: number
    caster: number
    healer: number
  }
  columns: ManagedColumn[]
  averageDamageChange: number | null
}

type SkillButtonProps = {
  skillName: string
  skill: Skill
  selected: Set<string>
  setSelected: Dispatch<SetStateAction<Set<string>>>
  selectedTalents: Set<string>
  selectedDungeonUnlocks: Set<string>
  classLevels: {
    tank: number
    warrior: number
    caster: number
    healer: number
  }
  columns: ManagedColumn[]
  averageDamageChange?: number | null
}

function getAverageDamageClass(value: number | null | undefined): string {
  if (value === undefined) return ""
  if (value === null) return "text-slate-400 text-right font-mono tabular-nums"
  if (value > 0) return "text-emerald-300 text-right font-mono tabular-nums"
  if (value < 0) return "text-rose-300 text-right font-mono tabular-nums"
  return "text-slate-200 text-right font-mono tabular-nums"
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
}: ToggleButtonProps) {
  const isSelected = selected.has(talentName)
  const tpSpent = selected.size - (isSelected ? 1 : 0)
  const selectedTalentTags = new Set(
    Array.from(selected)
      .map((name) => talent_data[name]?.Tag)
      .filter((tag): tag is string => Boolean(tag))
  )
  const otherSelectedTalentTags = new Set(
    Array.from(selected)
      .filter((name) => name !== talentName)
      .map((name) => talent_data[name]?.Tag)
      .filter((tag): tag is string => Boolean(tag))
  )

  const prereqTokens = talent.PreReq
    .flatMap((rawReq) => rawReq.split(","))
    .map((req) => req.trim())
    .filter((req) => req.length > 0)

  const missingPrereq = prereqTokens.some((req) => (
    !selected.has(req) &&
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
  const blockedTagConflict = Boolean(talent.BlockedTag) && otherSelectedTalentTags.has(talent.BlockedTag)

  const missingRequirement = (
    totalLevels < (talent.total_level ?? 0) ||
    tpSpent < (talent.tp_spent ?? 0) ||
    missingPrereq ||
    missingClassLevel
  )
  const rowClass = blockedTagConflict && isSelected
    ? "bg-yellow-700/70 hover:bg-yellow-700/80"
    : blockedTagConflict
      ? "bg-yellow-900/45 hover:bg-yellow-900/55"
      : missingRequirement && isSelected
        ? "bg-amber-900/55 hover:bg-amber-900/65"
        : missingRequirement
          ? "bg-rose-900/45 hover:bg-rose-900/55"
          : isSelected
            ? "bg-sky-900/40 hover:bg-sky-800/45"
            : "hover:bg-slate-800/85"

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
    window.dispatchEvent(new Event("talentsUpdated"))
  }

  const values: Record<string, string> = {
    name: talentName,
    preReq: Array.isArray(talent.PreReq) ? talent.PreReq.join(", ") : talent.PreReq,
    tag: talent.Tag,
    blockedTag: talent.BlockedTag,
    gold: String(talent.gold),
    exp: String(talent.exp),
    tp: String(talent.tp_spent),
    lvl: String(talent.total_level),
    tank: String(talent.class_levels.tank_levels),
    warrior: String(talent.class_levels.warrior_levels),
    caster: String(talent.class_levels.caster_levels),
    healer: String(talent.class_levels.healer_levels),
    description: talent.description,
    avgDamageChange: formatSignedDamageDelta(averageDamageChange),
  }

  return (
    <button
      onClick={handleClick}
      className={`grid min-w-full w-max text-left transition px-0 py-1 ${rowClass}`}
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
  selectedDungeonUnlocks,
  classLevels,
  columns,
  averageDamageChange,
}: SkillButtonProps) {
  const isSelected = selected.has(skillName)
  const selectedSkillPoints = Array.from(selected).reduce((sum, name) => sum + (skill_data[name]?.sp ?? 0), 0)
  const spentPointsBeforeCurrent = selectedSkillPoints - (isSelected ? (skill.sp ?? 0) : 0)

  const prereqTokens = Array.isArray(skill.PreReq)
    ? skill.PreReq
      .flatMap((rawReq) => rawReq.split(","))
      .map((req) => req.trim())
      .filter((req) => req.length > 0)
    : typeof skill.PreReq === "string" && skill.PreReq.length > 0
      ? skill.PreReq
        .split(",")
        .map((req) => req.trim())
        .filter((req) => req.length > 0)
      : []

  const missingPrereq = prereqTokens.some((req) => (
    req !== "Default Skill" &&
    !selected.has(req) &&
    !selectedTalents.has(req) &&
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

  const handleClick = () => {
    const newSet = new Set(selected)
    if (newSet.has(skillName)) {
      newSet.delete(skillName)
      console.log(`Removed ${skillName}`)
    } else {
      newSet.add(skillName)
      console.log(`Added ${skillName}`)
    }
    setSelected(newSet)
    localStorage.setItem("selectedBuffs", JSON.stringify(Array.from(newSet)))
  }
  // TODO: ADD sp cost to button instead of just sp_spent required to learn it
  const values: Record<string, string> = {
    name: skillName,
    preReq: Array.isArray(skill.PreReq) ? skill.PreReq.join(", ") : (skill.PreReq ?? ""),
    tag: skill.Tag ?? "",
    blockedTag: skill.BlockedTag ?? "",
    gold: String(skill.gold),
    exp: String(skill.exp),
    sp: String(skill.sp_spent ?? 0),
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
      className={`grid min-w-full w-max text-left transition px-0 py-1 ${
        missingRequirement && isSelected
          ? "bg-amber-900/55 hover:bg-amber-900/65"
          : missingRequirement
            ? "bg-rose-900/45 hover:bg-rose-900/55"
            : isSelected
              ? "bg-sky-900/40 hover:bg-sky-800/45"
              : "hover:bg-slate-800/85"
      }`}
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
