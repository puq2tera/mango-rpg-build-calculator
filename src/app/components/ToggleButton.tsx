"use client"

import type { Talent } from "../data/talent_data"

type ToggleButtonProps = {
  talentName: string
  talent: Talent
  selected: boolean
  toggle: (id: string) => void
  colWidths: string[]
}

export default function ToggleButton({ talentName, talent, selected, toggle, colWidths }: ToggleButtonProps) {
  const t = talent
  const values = [
    talentName,
    Array.isArray(t.PreReq) ? t.PreReq.join(", ") : t.PreReq,
    t.Tag,
    t.BlockedTag,
    String(t.gold),
    String(t.exp),
    String(t.tp_spent),
    String(t.total_level),
    String(t.class_levels.tank_levels),
    String(t.class_levels.warrior_levels),
    String(t.class_levels.caster_levels),
    String(t.class_levels.healer_levels),
    t.description
  ]

  return (
    <button
      onClick={() => toggle(talentName)}
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
