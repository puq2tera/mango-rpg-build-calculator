"use client"

import { useEffect, useState } from "react"
import ToggleButton from "@/app/components/ToggleButton"
import talent_data from "@/app/data/talent_data"

const STORAGE_KEY = "selectedTalents"

export default function TalentsPage() {
  const [selected, setSelected] = useState<Set<string> | null>(null)

  // Hydrate from localStorage once on client
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) setSelected(new Set(parsed))
        else setSelected(new Set())
      } catch {
        setSelected(new Set())
      }
    } else {
      setSelected(new Set())
    }
  }, [])

  // Persist on state change
  useEffect(() => {
    if (selected) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...selected]))
    }
  }, [selected])

  const toggle = (id: string) => {
    if (!selected) return
    const copy = new Set(selected)
    if (copy.has(id)) copy.delete(id)
    else copy.add(id)
    setSelected(copy)
  }

  if (selected === null) return <div className="p-4">Loading...</div>

  return (
    <div className="h-[80vh] overflow-y-auto border rounded-md">
  <div className="grid grid-cols-[minmax(12ch,auto)_repeat(13,minmax(8ch,auto))] gap-x-4">
    <div className="sticky top-0 bg-white font-bold border-b col-span-full py-2 z-10 contents">
      <span>Name</span>
      <span>PreReq</span>
      <span>Tag</span>
      <span>BlockedTag</span>
      <span>Gold</span>
      <span>Exp</span>
      <span>TP</span>
      <span>Lvl</span>
      <span>Tank</span>
      <span>Warrior</span>
      <span>Caster</span>
      <span>Healer</span>
      <span>Description</span>
    </div>
  </div>
  {Object.entries(talent_data).map(([name]) => (
      <ToggleButton
        key={name}
        id={name}
        label={name}
        selected={selected.has(name)}
        toggle={toggle}
      />
    ))}
</div>
  )  
}
