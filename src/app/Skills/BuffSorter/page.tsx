"use client"
import { useEffect, useState } from "react"
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { SortableItem } from "@/app/components/SortableItem"
import { skill_data, __columnWidths as colWidths } from "@/app/data/skill_data"

export default function BuffPriorityEditor() {
  const [buffs, setBuffs] = useState<string[]>([])
  const [isHydrated, setIsHydrated] = useState(false)
  const sensors = useSensors(useSensor(PointerSensor))

  useEffect(() => {
    const stored = localStorage.getItem("selectedBuffs")
    console.log(stored)
    if (stored) {
      try {
        const parsed: string[] = JSON.parse(stored)
        setBuffs(parsed)
      } catch {
        setBuffs([])
      }
    }
  }, [])

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  const handleReorder = (from: number, to: number) => {
    const reordered = arrayMove(buffs, from, to)
    setBuffs(reordered)
    localStorage.setItem("selectedBuffs", JSON.stringify(reordered))
  }

  if (!isHydrated) return <div className="p-4">Loading...</div>

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={({ active, over }) => {
        if (!over || active.id === over.id) return
        const oldIndex = buffs.indexOf(active.id as string)
        const newIndex = buffs.indexOf(over.id as string)
        handleReorder(oldIndex, newIndex)
      }}      
    >
      <SortableContext items={buffs} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
        {buffs.map(buff => (
            <SortableItem
                key={buff}
                skillName={buff}
                skill={skill_data[buff]}
                colWidths={colWidths}
            />
        ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
