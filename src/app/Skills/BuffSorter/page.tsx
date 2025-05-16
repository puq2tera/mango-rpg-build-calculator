"use client"
import { useEffect, useState } from "react"
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { SortableItem } from "@/app/components/SortableItem"

export default function BuffPriorityEditor() {
  const [buffs, setBuffs] = useState(["Vision", "Gaia", "Cyclone", "Talent Buff"])
  const [isHydrated, setIsHydrated] = useState(false)
  const sensors = useSensors(useSensor(PointerSensor))
  
  useEffect(() => {
    const saved = localStorage.getItem("buffPriority")
    if (saved) setBuffs(JSON.parse(saved))
  }, [])  

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  if (!isHydrated) return <div className="p-4">Loading...</div>

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={({ active, over }) => {
        if (active.id !== over?.id) {
          const oldIndex = buffs.indexOf(active.id as string)
          const newIndex = buffs.indexOf(over.id as string)
          const updated = arrayMove(buffs, oldIndex, newIndex)
          setBuffs(updated)
          localStorage.setItem("buffPriority", JSON.stringify(updated))
        }
      }}
    >
      <SortableContext items={buffs} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {buffs.map(buff => (
            <SortableItem key={buff} id={buff} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
