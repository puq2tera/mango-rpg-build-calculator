"use client"

import { useEffect, useState } from "react"

const STORAGE_KEY = "checkboxTestState"

export default function Checkboxtest() {
  const [selectedCards, setSelectedCards] = useState<boolean[] | null>(null)

  // Load from localStorage on first client-side mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        setSelectedCards(JSON.parse(stored))
        return
      } catch {}
    }
    setSelectedCards([false, false, false]) // fallback default
  }, [])

  // Save to localStorage when updated (only after init)
  useEffect(() => {
    if (selectedCards !== null) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedCards))
    }
  }, [selectedCards])

  const toggleCard = (index: number) => {
    if (!selectedCards) return
    setSelectedCards((prev) => {
      if (!prev) return prev
      const updated = [...prev]
      updated[index] = !updated[index]
      return updated
    })
  }

  if (!selectedCards) return <div className="p-4">Loading...</div>

  return (
    <div>
      {selectedCards.map((selected, i) => (
        <label key={i} className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={selected}
            onChange={() => toggleCard(i)}
          />
          <span className="text-sm">Select {i + 1}</span>
        </label>
      ))}
    </div>
  )
}
