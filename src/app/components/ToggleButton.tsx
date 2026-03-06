"use client"

import type { Dispatch, SetStateAction } from "react"
import type { Talent } from "../data/talent_data"
import type { Skill } from "../data/skill_data"
import { skill_data } from "../data/skill_data"

type ToggleButtonProps = {
  talentName: string
  talent: Talent
  selected: Set<string>
  setSelected: Dispatch<SetStateAction<Set<string>>>
  totalLevels: number
  colWidths: string[]
}

type SkillButtonProps = {
  skillName: string
  skill: Skill
  selected: Set<string>
  setSelected: Dispatch<SetStateAction<Set<string>>>
  selectedTalents: Set<string>
  classLevels: {
    tank: number
    warrior: number
    caster: number
    healer: number
  }
  colWidths: string[]
}

export function ToggleButton({ talentName, talent, selected, setSelected, totalLevels, colWidths }: ToggleButtonProps) {
  const isSelected = selected.has(talentName)
  const tpSpent = selected.size - (isSelected ? 1 : 0)
  const missingRequirement = totalLevels < (talent.total_level ?? 0) || tpSpent < (talent.tp_spent ?? 0)

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

  const values = [
    talentName,
    Array.isArray(talent.PreReq) ? talent.PreReq.join(", ") : talent.PreReq,
    talent.Tag,
    talent.BlockedTag,
    String(talent.gold),
    String(talent.exp),
    String(talent.tp_spent),
    String(talent.total_level),
    String(talent.class_levels.tank_levels),
    String(talent.class_levels.warrior_levels),
    String(talent.class_levels.caster_levels),
    String(talent.class_levels.healer_levels),
    talent.description
  ]

  return (
    <button
      onClick={handleClick}
      className={`grid w-full text-left transition px-0 py-1 ${
        missingRequirement && isSelected
          ? "bg-amber-900/55 hover:bg-amber-900/65"
          : missingRequirement
            ? "bg-rose-900/45 hover:bg-rose-900/55"
            : isSelected
              ? "bg-sky-900/40 hover:bg-sky-800/45"
              : "hover:bg-slate-800/85"
      }`}
      style={{ gridTemplateColumns: colWidths.join(" ") }}
    >
      {values.map((val, i) => (
        <span
          key={i}
          className="px-2 whitespace-nowrap border-r border-slate-700 last:border-r-0 box-border"
        >
          {val}
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
  classLevels,
  colWidths
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
    !selectedTalents.has(req)
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
  const values = [
    skillName,
    Array.isArray(skill.PreReq) ? skill.PreReq.join(", ") : skill.PreReq,
    skill.Tag,
    skill.BlockedTag,
    String(skill.gold),
    String(skill.exp),
    String(skill.sp_spent),
    String(skill.class_levels.tank_levels),
    String(skill.class_levels.warrior_levels),
    String(skill.class_levels.caster_levels),
    String(skill.class_levels.healer_levels),
    skill.description
  ]

  return (
    <button
      onClick={handleClick}
      className={`grid w-full text-left transition px-0 py-1 ${
        missingRequirement && isSelected
          ? "bg-amber-900/55 hover:bg-amber-900/65"
          : missingRequirement
            ? "bg-rose-900/45 hover:bg-rose-900/55"
            : isSelected
              ? "bg-sky-900/40 hover:bg-sky-800/45"
              : "hover:bg-slate-800/85"
      }`}
      style={{ gridTemplateColumns: colWidths.join(" ") }}
    >
      {values.map((val, i) => (
        <span
          key={i}
          className="px-2 whitespace-nowrap border-r border-slate-700 last:border-r-0 box-border"
        >
          {val}
        </span>
      ))}
    </button>
  )
}
