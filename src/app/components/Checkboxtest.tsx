"use client"

import { useEffect, useState } from "react"

const STORAGE_KEY = "checkboxTestState"

export default function Checkboxtest() {
  const [selectedBoxes, setBoxState] = useState<boolean[] | null>(null)

  // Load from localStorage on first client-side mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        setBoxState(JSON.parse(stored))
        return
      } catch {}
    }
    setBoxState([false, false, false, false]) // fallback default
  }, [])

  // Save to localStorage when updated (only after init)
  useEffect(() => {
    if (selectedBoxes !== null) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedBoxes))
    }
  }, [selectedBoxes])

  const toggleBox = (index: number) => {
    if (!selectedBoxes) return
    setBoxState((prev) => {
      if (!prev) return prev
      const updated = [...prev]
      updated[index] = !updated[index]
      return updated
    })
  }

  if (!selectedBoxes) return <div className="p-4">Loading...</div>

  return (
    <div>
      {selectedBoxes.map((selected, i) => (
        <label key={i} className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={selected}
            onChange={() => toggleBox(i)}
          />
          <span className="text-sm">Select {i + 1}</span>
        </label>
      ))}
    </div>
  )
}
