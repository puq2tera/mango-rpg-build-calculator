"use client"

import { useState, useEffect } from "react"
import type { Talent } from "../data/talent_data"
import type { Skill } from "../data/skill_data"

type ToggleButtonProps = {
  talentName: string
  talent: Talent
  colWidths: string[]
}

type SkillButtonProps = {
  skillName: string
  skill: Skill
  selected: Set<string>
  setSelected: React.Dispatch<React.SetStateAction<Set<string>>>
  colWidths: string[]
}

export function ToggleButton({ talentName, talent, colWidths }: ToggleButtonProps) {
  const [selected, setSelected] = useState(false)

  // Initialize selection state from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("selectedTalents")
    if (stored) {
      const list: string[] = JSON.parse(stored)
      setSelected(list.includes(talentName))
    }
  }, [talentName])

  //
  const handleClick = () => {
    const stored = localStorage.getItem("selectedTalents")
    const list: string[] = stored ? JSON.parse(stored) : []

    // Checks if talentName is in selectedTalents
    // Only modifies specific index of the talent leaving the rest of the list untouched
    const idx = list.indexOf(talentName)
    if (idx >= 0) {
      list.splice(idx, 1)
      setSelected(false)
      console.log(`Added ${talentName}`)
    } else {
      list.push(talentName)
      setSelected(true)
      console.log(`Removed ${talentName}`)
    }

    // Update selectedTalents
    localStorage.setItem("selectedTalents", JSON.stringify(list))
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
        selected ? "bg-blue-100 hover:bg-blue-200" : "hover:bg-gray-100"
      }`}
      style={{ gridTemplateColumns: colWidths.join(" ") }}
    >
      {values.map((val, i) => (
        <span
          key={i}
          className="px-2 whitespace-nowrap border-r border-gray-300 last:border-r-0 box-border"
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
  colWidths
}: SkillButtonProps) {
  const isSelected = selected.has(skillName)

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
        isSelected ? "bg-blue-100 hover:bg-blue-200" : "hover:bg-gray-100"
      }`}
      style={{ gridTemplateColumns: colWidths.join(" ") }}
    >
      {values.map((val, i) => (
        <span
          key={i}
          className="px-2 whitespace-nowrap border-r border-gray-300 last:border-r-0 box-border"
        >
          {val}
        </span>
      ))}
    </button>
  )
}
