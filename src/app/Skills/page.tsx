"use client"

import { useEffect, useState } from "react"
import { InteractiveTableHeader } from "@/app/components/InteractiveTableHeader"
import { SkillButton } from "@/app/components/ToggleButton"
import { DUNGEON_UNLOCKS_STORAGE_KEY, isDungeonUnlockTag } from "@/app/data/dungeon_unlocks"
import { skill_data } from "@/app/data/skill_data"
import { useManagedColumns } from "@/app/lib/managedColumns"
import { skillTableColumns } from "@/app/lib/tableColumnDefinitions"

const STORAGE_KEY = "selectedBuffs"

export default function SkillsPage() {
  const [isHydrated, setIsHydrated] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [selectedTalents, setSelectedTalents] = useState<Set<string>>(new Set())
  const [selectedDungeonUnlocks, setSelectedDungeonUnlocks] = useState<Set<string>>(new Set())
  const [classLevels, setClassLevels] = useState({ tank: 0, warrior: 0, caster: 0, healer: 0 })
  const columnLayout = useManagedColumns("skillColumnLayout", skillTableColumns)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    const storedTalents = localStorage.getItem("selectedTalents")
    const storedDungeonUnlocks = localStorage.getItem(DUNGEON_UNLOCKS_STORAGE_KEY)
    const rawLevels = localStorage.getItem("SelectedLevels")

    try {
      setSelected(stored ? new Set(JSON.parse(stored)) : new Set())
    } catch {
      setSelected(new Set())
    }

    try {
      setSelectedTalents(storedTalents ? new Set(JSON.parse(storedTalents)) : new Set())
    } catch {
      setSelectedTalents(new Set())
    }

    try {
      const parsedUnlocks: string[] = storedDungeonUnlocks ? JSON.parse(storedDungeonUnlocks) : []
      setSelectedDungeonUnlocks(new Set(parsedUnlocks.filter(isDungeonUnlockTag)))
    } catch {
      setSelectedDungeonUnlocks(new Set())
    }

    try {
      const parsedLevels: Record<string, number> = rawLevels ? JSON.parse(rawLevels) : {}
      setClassLevels({
        tank: Number(parsedLevels.tank ?? 0),
        warrior: Number(parsedLevels.warrior ?? 0),
        caster: Number(parsedLevels.caster ?? 0),
        healer: Number(parsedLevels.healer ?? 0),
      })
    } catch {
      setClassLevels({ tank: 0, warrior: 0, caster: 0, healer: 0 })
    }

    setIsHydrated(true)
  }, [])

  useEffect(() => {
    const handleResetUi = () => {
      columnLayout.reset()
    }

    window.addEventListener("resetManagedTableUi", handleResetUi)
    return () => {
      window.removeEventListener("resetManagedTableUi", handleResetUi)
    }
  }, [columnLayout])

  if (!isHydrated || !columnLayout.isReady) return <div className="p-4">Loading...</div>

  return (
    <div className="h-[calc(100vh-2.5rem)] overflow-auto border rounded-md">
      <div className="min-w-full w-max">
        <InteractiveTableHeader
          allColumns={columnLayout.allColumns}
          visibleColumns={columnLayout.visibleColumns}
          gridTemplateColumns={columnLayout.gridTemplateColumns}
          onSetColumnCollapsed={columnLayout.setColumnCollapsed}
          onReorderColumns={columnLayout.reorderVisibleColumns}
          onSetColumnWidth={columnLayout.setColumnWidth}
        />

        <div className="space-y-0.5">
          {Object.entries(skill_data).map(([name]) => (
            <SkillButton
              key={name}
              skillName={name}
              skill={skill_data[name]}
              selected={selected}
              setSelected={setSelected}
              selectedTalents={selectedTalents}
              selectedDungeonUnlocks={selectedDungeonUnlocks}
              classLevels={classLevels}
              columns={columnLayout.visibleColumns}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
