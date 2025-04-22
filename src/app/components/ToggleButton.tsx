"use client"

import talent_data from "../data/talent_data"

type ToggleButtonProps = {
  id: string
  label: string
  selected: boolean
  toggle: (id: string) => void
  colWidths: string[]
}

export default function ToggleButton({ id, label, selected, toggle, colWidths }: ToggleButtonProps) {
  const t = talent_data[label]
  const values = [
    label, t.PreReq, t.Tag, t.BlockedTag,
    String(t.gold), String(t.exp), String(t.tp_spent), String(t.total_level),
    String(t.class_levels.tank_levels),
    String(t.class_levels.warrior_levels),
    String(t.class_levels.caster_levels),
    String(t.class_levels.healer_levels),
    t.description
  ]

  return (
    <button
      onClick={() => toggle(id)}
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
