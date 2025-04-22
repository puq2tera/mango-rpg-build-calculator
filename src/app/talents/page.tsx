"use client"

import { useEffect, useState } from "react"
import ToggleButton from "@/app/components/ToggleButton"
import talent_data from "@/app/data/talent_data"

const STORAGE_KEY = "selectedTalents"

// Define widths manually or dynamically
const colWidths = [
  "16ch", // Name
  "12ch", // PreReq
  "8ch",  // Tag
  "12ch", // BlockedTag
  "6ch",  // Gold
  "6ch",  // Exp
  "5ch",  // TP
  "5ch",  // Lvl
  "6ch",  // Tank
  "8ch",  // Warrior
  "8ch",  // Caster
  "8ch",  // Healer
  "30ch", // Description
]

export default function TalentsPage() {
  const [selected, setSelected] = useState<Set<string> | null>(null)

  useEffect(() => {
    function loadFromStorage() {
      const stored = localStorage.getItem(STORAGE_KEY)
      try {
        setSelected(stored ? new Set(JSON.parse(stored)) : new Set())
      } catch {
        setSelected(new Set())
      }
    }
    loadFromStorage()
  }, [])

  useEffect(() => {
    if (selected) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...selected]))
    }
  }, [selected])

  const toggle = (id: string) => {
    if (!selected) return
    const copy = new Set(selected)
    if (copy.has(id)) {
      copy.delete(id)
    } else {
      copy.add(id)
    }
    setSelected(copy)
  }

  if (selected === null) return <div className="p-4">Loading...</div>

  return (
    <div className="h-[80vh] overflow-y-auto border rounded-md">
      {/* Header */}
      <div
        className="sticky top-0 z-10 bg-white border-b py-2 grid gap-x-4"
        style={{ gridTemplateColumns: colWidths.join(" ") }}
      >
        {[
            "Name", "PreReq", "Tag", "BlockedTag",
            "Gold", "Exp", "TP", "Lvl",
            "Tank", "Warrior", "Caster", "Healer",
            "Description"
          ].map((label, i) => (
            <span
              key={i}
              className="font-bold px-2"
              style={{ width: colWidths[i], minWidth: colWidths[i] }}
            >
              {label}
            </span>
          ))}
      </div>

      {/* Talent Rows */}
      <div className="space-y-0.5">
        {Object.entries(talent_data).map(([name]) => (
          <ToggleButton
            key={name}
            id={name}
            label={name}
            selected={selected.has(name)}
            toggle={toggle}
            colWidths={colWidths}
          />
        ))}
      </div>
    </div>
  )
}
