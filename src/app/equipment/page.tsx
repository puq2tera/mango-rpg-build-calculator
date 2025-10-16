"use client"

import { useState, useEffect } from "react"
import type { StatNames as StatNameType } from "../data/stat_data"
import stat_data from "../data/stat_data"
import rune_data from "../data/rune_data"

interface Affix {
  stat: string
  value: number
}

type RuneSelection = {
  rune: string
  count: number
}

interface Slot {
  name: string
  type: string
  mainstat: string
  mainstat_value: number
  affixes: Affix[]
  enabled: boolean
}

const STORAGE_KEY_SLOTS = "EquipmentSlots"
const STORAGE_KEY_ENABLED = "EnabledEquipment"
const STORAGE_KEY_RUNES = "SelectedRunes"
const STORAGE_KEY_ARTIFACT = "Artifact"


const runeTiers = ["Low", "Middle", "High", "Legacy", "Divine"] as const

type RuneTier = typeof runeTiers[number]

const initialSlot = (): Slot => ({
  name: "",
  type: "",
  mainstat: "",
  mainstat_value: 0,
  affixes: Array.from({ length: 8 }, () => ({ stat: "", value: 0 })),
  enabled: false
})

const initialRuneSelection = (): RuneSelection => ({
  rune: "",
  count: 1
})

const emptyRuneSet = (): Record<RuneTier, RuneSelection[]> => {
  const result: Partial<Record<RuneTier, RuneSelection[]>> = {}
  for (const tier of runeTiers) {
    result[tier] = []
  }
  return result as Record<RuneTier, RuneSelection[]>
}

export default function EquipmentPage() {
  const [isHydrated, setIsHydrated] = useState(false)
  const [slots, setSlots] = useState<Slot[]>([])
  const [selectedRunes, setSelectedRunes] = useState<Record<RuneTier, RuneSelection[]>>(emptyRuneSet())
  const [artifact, setArtifact] = useState({ "ATK%": 0, "DEF%": 0, "MATK%": 0, 'HEAL%': 0, 'Level': 0 })

  const allStatNames = Object.keys(stat_data.StatsInfo) as StatNameType[]

  function sanitizeToken(label: string): string {
    return label.toLowerCase().replace(/[^a-z]/g, "")
  }

  function parseAffixLine(line: string): Affix | null {
    const cleaned = line
      .replace(/^\u25D8\s*/, "") // remove leading bullet ◘
      .replace(/🖊️/g, "")
      .trim()
    //console.log(cleaned)
    const parts = cleaned.split(/\s+/)
    if (parts.length < 2) return null
    const numPart = parts[0]
    const labelPart = parts.slice(1).join(" ")

    const token = sanitizeToken(labelPart)
    //console.log(token)
    const mapped = stat_data.inGameNames[token]
    //console.log(stat_data.inGameNames[token])
    if (!mapped) return null

    return { stat: mapped, value: parseInt(numPart) }
  }

  function parsePastedItem(text: string): Partial<Slot> | null {
    const lines = text.split(/\r?\n/).map(l => l.trim())
    if (!lines.some(l => l.length)) return null

    const result: Partial<Slot> = { affixes: [] }

    // Name — [ i### ]
    const nameRegex = /\[\s*i\d{3}\s*\]/i;
    const nameLine = lines.find(l => nameRegex.test(l))
    if (nameLine) result.name = nameLine

    // Equip Type — locate marker then take next non-empty line
    const equipIdx = lines.findIndex(l => /^equip type$/i.test(l))
    const typeLine = lines.slice(equipIdx + 1).find(l => l.length > 0)
    if (typeLine) result.type = typeLine

    // Main stat: line that contains +ATK/+DEF/+MATK/+HEAL, next non-empty line is value
    const mainLabelIdx = lines.findIndex(l => /\+[ADMH]?(?:ATK|DEF|MATK|HEAL)/i.test(l))
    if (mainLabelIdx >= 0) {
      const label = lines[mainLabelIdx].replace(/.*\+/, "").toUpperCase().replace(/[^A-Z]/g, "")
      const statMap: Record<string, Slot["mainstat"]> = { ATK: "ATK", DEF: "DEF", MATK: "MATK", HEAL: "HEAL" }
      if (statMap[label]) result.mainstat = statMap[label]
      const valueLine = lines.slice(mainLabelIdx + 1).find(l => /\d/.test(l))
      if (valueLine) {
        const val = parseInt(valueLine.replace(/[^0-9\-]/g, ""), 10)
        if (!Number.isNaN(val)) result.mainstat_value = val
      }
    }

    // Affixes — lines starting with the bullet (◘)
    for (const ln of lines) {
      if (!ln.startsWith("◘")) continue
      const affix = parseAffixLine(ln)
      if (affix) (result.affixes as Affix[]).push(affix)
    }

    // Enable the slot by default when importing
    result.enabled = true
    return result
  }

  // Per-slot paste handler
  function pasteEquipmentIntoSlot(slotIndex: number, rawText: string) {
    const parsed = parsePastedItem(rawText)
    if (!parsed) return
    setSlots(prev => prev.map((slot, idx) => {
      if (idx !== slotIndex) return slot
      return {
        ...slot,
        ...(parsed.name ? { name: parsed.name } : {}),
        ...(parsed.type ? { type: parsed.type } : {}),
        ...(parsed.mainstat ? { mainstat: parsed.mainstat } : {}),
        ...(parsed.mainstat_value !== undefined ? { mainstat_value: parsed.mainstat_value! } : {}),
        ...(parsed.affixes && (parsed.affixes as Affix[]).length > 0 ? { affixes: parsed.affixes as Affix[] } : {}),
        ...(parsed.enabled ? { enabled: true } : {})
      }
    }))
  }

  useEffect(() => {
    const storedSlots = localStorage.getItem(STORAGE_KEY_SLOTS)
    try {
      const parsed = storedSlots ? JSON.parse(storedSlots) : Array.from({ length: 8 }, initialSlot)
      setSlots(parsed)
    } catch {
      setSlots(Array.from({ length: 8 }, initialSlot))
    }

    const storedRunes = localStorage.getItem(STORAGE_KEY_RUNES)
    try {
      const parsed = storedRunes ? JSON.parse(storedRunes) : {}
      const filled: Record<RuneTier, RuneSelection[]> = emptyRuneSet()
      for (const tier of runeTiers) {
        filled[tier] = Array.isArray(parsed[tier]) ? parsed[tier] : []
      }
      setSelectedRunes(filled)
    } catch {
      setSelectedRunes(emptyRuneSet())
    }

    const storedArtifact = localStorage.getItem(STORAGE_KEY_ARTIFACT)
    if (storedArtifact) setArtifact(JSON.parse(storedArtifact))

    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (isHydrated && slots.length > 0) {
      localStorage.setItem(STORAGE_KEY_SLOTS, JSON.stringify(slots))
      const enabledIndices = slots.map((slot, i) => slot.enabled ? i : null).filter(i => i !== null)
      localStorage.setItem(STORAGE_KEY_ENABLED, JSON.stringify(enabledIndices))
    }
  }, [slots, isHydrated])

  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(STORAGE_KEY_RUNES, JSON.stringify(selectedRunes))
    }
  }, [selectedRunes, isHydrated])

  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(STORAGE_KEY_ARTIFACT, JSON.stringify(artifact));
    }
  }, [artifact, isHydrated]);

  const addAffixRow = (slotIndex: number) => {
    const updated = [...slots]
    updated[slotIndex] = {
      ...updated[slotIndex],
      affixes: [...updated[slotIndex].affixes, { stat: "", value: 0 }]
    }
    setSlots(updated)
  }

  const addSlot = () => {
    setSlots([...slots, initialSlot()])
  }

  const toggleSlot = (index: number) => {
    setSlots(slots.map((slot, i) => i === index ? { ...slot, enabled: !slot.enabled } : slot))
  }

  const updateSlot = (index: number, field: string, value: string | number) => {
    const updated = slots.map((slot, i) => {
      if (i !== index) return slot
      const updatedSlot = { ...slot }
      if (field.startsWith("affix_")) {
        const [, affixIndexStr, affixField] = field.split("_")
        const affixIndex = parseInt(affixIndexStr, 10)
        updatedSlot.affixes = [...slot.affixes]
        updatedSlot.affixes[affixIndex] = {
          ...updatedSlot.affixes[affixIndex],
          [affixField]: value
        }
      } else {
        if (field in updatedSlot) {
          (updatedSlot[field as keyof Slot] as typeof value) = value
        }
      }
      return updatedSlot
    })
    setSlots(updated)
  }

  const addRuneRow = (tier: RuneTier) => {
    setSelectedRunes(prev => {
      const updated = { ...prev }
      updated[tier] = [...updated[tier], initialRuneSelection()]
      return updated
    })
  }

  const removeRuneRow = (tier: RuneTier, index: number) => {
    setSelectedRunes(prev => {
      const updated = { ...prev }
      const tierList = [...updated[tier]]
      tierList.splice(index, 1)
      updated[tier] = tierList
      return updated
    })
  }

  const updateRuneSelection = (tier: RuneTier, index: number, field: keyof RuneSelection, value: string | number) => {
    const updated = { ...selectedRunes }
    const tierList = [...updated[tier]]
    tierList[index] = { ...tierList[index], [field]: value }
    updated[tier] = tierList
    setSelectedRunes(updated)
  }

  const runesByTier = (tier: string) =>
    Object.entries(rune_data)
      .filter(([, rune]) => rune.tier === tier)
      .map(([name]) => name)

  const typeOptions = ["Helm", "Armor", "Amulet", "Ring", "Weapon", "Runeshard", "Tarot"]

  if (!isHydrated) return <div className="p-4 text-sm text-gray-600">Loading equipment editor...</div>

  return (
    <div className="p-4 space-y-8">
      <h1 className="text-2xl font-bold">Equipment Editor</h1>
      {/* Artifact Editor */}
      <h1 className="text-xl font-bold">Level Summary</h1>

      <table className="table-fixed border text-center text-sm">
        <thead>
          <tr>
            <th className="bg-green-100 border px-2 py-1">ATK%</th>
            <th className="bg-red-100 border px-2 py-1">DEF%</th>
            <th className="bg-blue-100 border px-2 py-1">MATK%</th>
            <th className="bg-pink-100 border px-2 py-1">HEAL%</th>
            <th className="bg-pink-100 border px-2 py-1">Level</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            {(["ATK%", "DEF%", "MATK%", "HEAL%", "Level"] as const).map(k => (
              <td key={k} className="border">
                <input
                  type="number"
                  value={artifact[k]}
                  onChange={e => setArtifact({ ...artifact, [k]: +e.target.value })}
                  className="w-16 text-center"
                />
              </td>
            ))}
          </tr>
        </tbody>
      </table>

      {/* Rune Editor */}
      <div className="space-y-8">
        {runeTiers.map(tier => (
          <div key={tier}>
            <h2 className="text-lg font-semibold">{tier} Tier Runes</h2>
            <table className="table-fixed border-collapse w-full text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-2 py-1">Rune</th>
                  <th className="border px-2 py-1">Count</th>
                  <th className="border px-2 py-1">Description</th>
                </tr>
              </thead>
              <tbody>
                {selectedRunes[tier].map((selection, idx) => (
                  <tr key={idx}>
                    <td className="border px-2 py-1">
                      <select
                        value={selection.rune}
                        onChange={e => updateRuneSelection(tier, idx, "rune", e.target.value)}
                        className="w-full border px-1"
                      >
                        <option value="">Select Rune</option>
                        {runesByTier(tier).map(runeName => (
                          <option key={runeName} value={runeName}>
                            {runeName}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="border px-2 py-1 flex gap-2 items-center">
                      <input
                        type="number"
                        value={selection.count}
                        min={1}
                        onChange={e => updateRuneSelection(tier, idx, "count", +e.target.value)}
                        className="w-full border px-1"
                      />
                      <button
                        type="button"
                        onClick={() => removeRuneRow(tier, idx)}
                        className="px-2 py-0.5 bg-red-400 text-white text-xs rounded"
                      >
                        ✕
                      </button>
                    </td>
                    <td className="border px-2 py-1">
                      {selection.rune && rune_data[selection.rune]
                        ? rune_data[selection.rune].description
                        : ""}
                    </td>
                  </tr>
                ))}
            </tbody>
            </table>
            <div className="mt-2">
              <button
                onClick={() => addRuneRow(tier)}
                className="px-3 py-1 bg-blue-400 text-white rounded"
              >
                + Add Rune
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Equipment Slots */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4 mt-4 items-start">
        {slots.map((slot, idx) => (
          <div
            key={idx}
            onClick={() => toggleSlot(idx)}
            className={`border rounded p-2 text-left cursor-pointer transition flex-shrink-0 ${
              slot.enabled ? "bg-green-100" : "bg-gray-100 opacity-50"
            }`}
          >
            <div className="grid grid-cols-2 gap-2 mb-2">
              <h2 className="font-semibold mb-2">Slot {idx + 1}</h2>
              {/* Paste item text directly into this box to import */}
              <input
                type="text"
                placeholder="Paste equipment here"
                onPaste={e => {
                  e.preventDefault()
                  const text = (e.clipboardData && e.clipboardData.getData('text')) || ''
                  pasteEquipmentIntoSlot(idx, text)
                  // clear the input box after import
                  ;(e.currentTarget as HTMLInputElement).value = ''
                }}
                className="w-full border px-1"
                onClick={e => e.stopPropagation()}
              />
            </div>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <label className="block text-sm font-medium">Name</label>
                <input
                  value={slot.name}
                  onChange={e => updateSlot(idx, "name", e.target.value)}
                  className="w-full border px-1"
                  onClick={e => e.stopPropagation()}
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Type</label>
                <select
                  value={slot.type}
                  onChange={e => updateSlot(idx, "type", e.target.value)}
                  className="w-full border px-1"
                  onClick={e => e.stopPropagation()}
                >
                  <option value="">Select</option>
                  {typeOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <div className="flex gap-2 items-end">
                  <select
                    value={slot.mainstat}
                    onChange={e => updateSlot(idx, "mainstat", e.target.value)}
                    className="w-1/2 border px-1"
                    onClick={e => e.stopPropagation()}
                  >
                    <option value="">Main Stat</option>
                    {stat_data.Mainstats.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={slot.mainstat_value}
                    onChange={e => updateSlot(idx, "mainstat_value", +e.target.value)}
                    className="w-1/2 border px-1"
                    onClick={e => e.stopPropagation()}
                  />
                </div>
              </div>
            </div>
            <table className="table-fixed border border-collapse text-sm w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-2 py-1">Affix</th>
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
                        onClick={e => e.stopPropagation()}
                      >
                        <option value="">Select</option>
                        {allStatNames.map(option => (
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
                        onClick={e => e.stopPropagation()}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-2">
              <button
                onClick={e => {
                  e.stopPropagation()
                  addAffixRow(idx)
                }}
                className="w-full px-2 py-1 bg-blue-400 text-white rounded"
              >
                + Add Affix
              </button>
            </div>
          </div>
        ))}

        <div className="flex items-center justify-center w-full max-w-md border-dashed border-2 border-gray-400 rounded p-4">
          <button onClick={addSlot} className="px-4 py-1 bg-blue-500 text-white rounded">Add Slot</button>
        </div>
      </div>
    </div>
  )
}
