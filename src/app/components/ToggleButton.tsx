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
    t.gold, t.exp, t.tp_spent, t.total_level,
    t.class_levels.tank_levels,
    t.class_levels.warrior_levels,
    t.class_levels.caster_levels,
    t.class_levels.healer_levels,
    t.description
  ]

  return (
    <button
      onClick={() => toggle(id)}
      className={`flex w-full text-left transition px-1 py-1 ${
        selected ? "bg-blue-100 hover:bg-blue-200" : "hover:bg-gray-100"
      }`}
    >
      {values.map((val, i) => (
        <span
          key={i}
          className="px-1 whitespace-nowrap overflow-hidden"
          style={{ width: colWidths[i], minWidth: colWidths[i] }}
        >
          {val}
        </span>
      ))}
    </button>
  )
}
