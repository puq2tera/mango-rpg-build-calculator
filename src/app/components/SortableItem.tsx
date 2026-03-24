"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

type SortableItemProps = {
  skillName: string
  statsText: string
  description: string
}

export function SortableItem({ skillName, statsText, description }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: skillName })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    padding: "0",
    border: "1px solid #334155",
    borderRadius: "4px",
    background: "#0f172a",
    cursor: "grab",
  }

  const values = [skillName, statsText, description]

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, gridTemplateColumns: "minmax(220px, 320px) minmax(280px, 1fr) minmax(320px, 1.2fr)" }}
      {...attributes}
      {...listeners}
      className="grid text-left transition px-0 py-1 hover:bg-slate-900/60"
    >
      {values.map((val, i) => (
        <span
          key={i}
          className={`px-2 border-r border-slate-700 last:border-r-0 box-border ${
            i === 0 ? "whitespace-nowrap" : "whitespace-normal break-words text-slate-200"
          }`}
        >
          {val}
        </span>
      ))}
    </div>
  )
}
