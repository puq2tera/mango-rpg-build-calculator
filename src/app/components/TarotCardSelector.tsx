"use client"

import tarotCards from "@/app/data/tarot-cards"
import { useState } from "react"


export default function TarotCardSelector() {
  const [selectedCards, setSelectedCards] = useState(() =>
    tarotCards.map((card) => ({ ...card, selected: false, level: 0 }))
  )

  const toggleCard = (index: number) => {
    setSelectedCards((prev) => {
      const copy = [...prev]
      copy[index].selected = !copy[index].selected
      return copy
    })
  }

  const updateLevel = (index: number, level: number) => {
    setSelectedCards((prev) => {
      const copy = [...prev]
      copy[index].level = level
      return copy
    })
  }

  return (
    <main className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">Overlord Talent Selector</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {selectedCards.map((card, i) => (
          <div
            key={card.card_name}
            className="border p-4 rounded-xl shadow bg-white space-y-2"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg">{card.card_name}</h2>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={card.selected}
                  onChange={() => toggleCard(i)}
                />
                <span className="text-sm">Select</span>
              </label>
            </div>
            <p className="text-sm italic">{card.skill_name}</p>
            <p className="text-sm">{card.stat_summary}</p>
            <input
              type="number"
              className="border rounded px-2 py-1 w-full"
              min={0}
              max={10}
              value={card.level}
              onChange={(e) => updateLevel(i, parseInt(e.target.value))}
            />
          </div>
        ))}
      </div>
    </main>
  )
}
