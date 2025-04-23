"use client"

import { useState } from "react"
import { __allStatNames } from "@/app/data/talent_data"

interface Affix {
  stat: string
  value: number
}

interface Slot {
  name: string
  type: string
  mainstat: string
  mainstat_value: number
  affixes: Affix[]
}

const initialSlot = (): Slot => ({
  name: "",
  type: "",
  mainstat: "",
  mainstat_value: 0,
  affixes: Array.from({ length: 20 }, () => ({ stat: "", value: 0 }))
})

export default function EquipmentPage() {
  const [slots, setSlots] = useState<Slot[]>([
    initialSlot(), initialSlot(), initialSlot(), initialSlot(),
    initialSlot(), initialSlot(), initialSlot(), initialSlot()
  ])

  const updateSlot = (index: number, field: string, value: string | number) => {
    setSlots(prev => {
      const updated = [...prev]
      if (field.startsWith("affix_")) {
        const [, affixIndexStr, affixField] = field.split("_")
        const affixIndex = parseInt(affixIndexStr, 10)
        updated[index].affixes[affixIndex][affixField as keyof Affix] = value as never
      } else {
        updated[index][field as keyof Slot] = value as never
      }
      return updated
    })
  }

  const addSlot = () => {
    setSlots(prev => [...prev, initialSlot()])
  }

  const typeOptions = ["Helm", "Armor", "Amulet", "Ring", "Weapon", "Runeshard", "Tarot"]
  const statOptions = ["ATK", "DEF", "MATK", "HEAL"]

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Equipment Editor</h1>

      <div className="flex flex-wrap gap-4 mt-4">
        {slots.map((slot, idx) => (
          <div key={idx} className="border rounded p-2 w-full max-w-md">
            <h2 className="font-semibold mb-2">Slot {idx + 1}</h2>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <label className="block text-sm font-medium">Name</label>
                <input value={slot.name} onChange={e => updateSlot(idx, "name", e.target.value)} className="w-full border px-1" />
              </div>
              <div>
                <label className="block text-sm font-medium">Type</label>
                <select value={slot.type} onChange={e => updateSlot(idx, "type", e.target.value)} className="w-full border px-1">
                  <option value="">Select</option>
                  {typeOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <div className="flex gap-2 items-end">
                  <select value={slot.mainstat} onChange={e => updateSlot(idx, "mainstat", e.target.value)} className="w-1/2 border px-1">
                    <option value="">Main Stat</option>
                    {statOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={slot.mainstat_value}
                    onChange={e => updateSlot(idx, "mainstat_value", +e.target.value)}
                    className="w-1/2 border px-1"
                  />
                </div>
              </div>
            </div>
            <table className="table-fixed border border-collapse text-sm w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-2 py-1">Stat</th>
                  <th className="border px-2 py-1">Value</th>
                </tr>
              </thead>
              <tbody>
                {slot.affixes.map((affix, i) => (
                  <tr key={i}>
                    <td className="border px-2 py-1">
                      <select
                        value={affix.stat}
                        onChange={e => updateSlot(idx, `affix_${i}_stat`, e.target.value)}
                        className="w-full border px-1"
                      >
                        <option value="">Select</option>
                        {__allStatNames.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </td>
                    <td className="border px-2 py-1">
                      <input
                        type="number"
                        value={affix.value}
                        onChange={e => updateSlot(idx, `affix_${i}_value`, +e.target.value)}
                        className="w-full border px-1"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

        <div className="flex items-center justify-center w-full max-w-md border-dashed border-2 border-gray-400 rounded p-4">
          <button onClick={addSlot} className="px-4 py-1 bg-blue-500 text-white rounded">Add Slot</button>
        </div>
      </div>
    </div>
  )
}