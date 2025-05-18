"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Skill } from "@/app/data/skill_data"

type SortableItemProps = {
  skillName: string
  skill: Skill
  colWidths: string[]
}

export function SortableItem({ skillName, skill, colWidths }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: skillName })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    padding: "0",
    border: "1px solid gray",
    borderRadius: "4px",
    background: "white",
    cursor: "grab"
  }

  const values = [
    skillName,
    skill.description
  ]

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, gridTemplateColumns: colWidths.join(" ") }}
      {...attributes}
      {...listeners}
      className="grid text-left transition px-0 py-1 hover:bg-gray-50"
    >
      {values.map((val, i) => (
        <span
          key={i}
          className="px-2 whitespace-nowrap border-r border-gray-300 last:border-r-0 box-border"
        >
          {val}
        </span>
      ))}
    </div>
  )
}
