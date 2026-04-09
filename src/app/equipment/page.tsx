"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { dispatchBuildSnapshotUpdated } from "@/app/lib/buildEvents"
import { ARTIFACT_STAT_KEYS, createDefaultArtifact, normalizeArtifact, type ArtifactState } from "@/app/lib/artifactState"
import {
  createDefaultEquipmentSlot,
  ENABLED_EQUIPMENT_STORAGE_KEY,
  EQUIPMENT_SLOTS_STORAGE_KEY,
  EQUIPMENT_AUTO_LINKED_TAROTS_STORAGE_KEY,
  getAutoManagedTarotNames,
  getEnabledEquipmentIndices,
  getEquipmentAutoLinkedTarots,
  getTarotScalingValue,
  isKnownTarotName,
  isTarotEquipmentSlot,
  normalizeEquipmentSlots,
  type EquipmentAffix as Affix,
  type EquipmentSlot as Slot,
} from "@/app/lib/equipmentSlots"
import {
  EQUIPMENT_SCRIPT_GROUPS_STORAGE_KEY,
  normalizeEquipmentScriptGroups,
  type EquipmentScriptGroup,
} from "@/app/lib/equipmentScripts"
import { TABLE_FOCUS_QUERY_PARAM } from "@/app/lib/tableNavigation"
import {
  filterManualTarotSelections,
  MANUAL_TAROT_SELECTION_STORAGE_KEY,
  readStoredManualTarotSelections,
} from "@/app/lib/tarotSelections"
import type { StatNames as StatNameType } from "../data/stat_data"
import stat_data from "../data/stat_data"
import rune_data from "../data/rune_data"
import tarot_data from "../data/tarot_data"

type RuneSelection = {
  rune: string
  count: number
}

const STORAGE_KEY_RUNES = "SelectedRunes"
const STORAGE_KEY_ARTIFACT = "Artifact"

const runeTiers = ["Low", "Middle", "High", "Legacy", "Divine"] as const
const artifactFieldOrder = [...ARTIFACT_STAT_KEYS, "Level"] as const

type RuneTier = typeof runeTiers[number]

const getRuneOptionLabel = (runeName: string): string => {
  const description = rune_data[runeName]?.description?.trim()
  return description ? `${runeName} (${description})` : runeName
}

const formatScaledRuneEffect = (description: string, count: number): string => {
  if (!description || count === 1) return description

  return description.replace(/[+-]?\d*\.?\d+/g, (match) => {
    const numericValue = Number(match)
    if (Number.isNaN(numericValue)) return match

    const scaledValue = numericValue * count
    const roundedValue = Math.round(scaledValue * 1000) / 1000
    const formattedValue = Number.isInteger(roundedValue)
      ? String(roundedValue)
      : roundedValue.toFixed(3).replace(/\.?0+$/, "")

    return match.startsWith("+") && !formattedValue.startsWith("-")
      ? `+${formattedValue}`
      : formattedValue
  })
}

const getRuneEffectLabel = (selection: RuneSelection): string => {
  const rune = rune_data[selection.rune]
  if (!rune) return ""

  return formatScaledRuneEffect(rune.description, selection.count)
}

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
  const [equipmentScriptGroups, setEquipmentScriptGroups] = useState<EquipmentScriptGroup[]>([])
  const [selectedRunes, setSelectedRunes] = useState<Record<RuneTier, RuneSelection[]>>(emptyRuneSet())
  const [artifact, setArtifact] = useState<ArtifactState>(createDefaultArtifact)
  const allStatNames = Object.keys(stat_data.StatsInfo) as StatNameType[]

  const refreshStoredEquipmentSlots = () => {
    const storedSlots = localStorage.getItem(EQUIPMENT_SLOTS_STORAGE_KEY)
    try {
      const parsed = storedSlots ? JSON.parse(storedSlots) : Array.from({ length: 8 }, createDefaultEquipmentSlot)
      setSlots(normalizeEquipmentSlots(parsed))
    } catch {
      setSlots(Array.from({ length: 8 }, createDefaultEquipmentSlot))
    }
  }

  const refreshStoredEquipmentScriptGroups = () => {
    const storedGroups = localStorage.getItem(EQUIPMENT_SCRIPT_GROUPS_STORAGE_KEY)

    try {
      setEquipmentScriptGroups(normalizeEquipmentScriptGroups(storedGroups ? JSON.parse(storedGroups) : []))
    } catch {
      setEquipmentScriptGroups([])
    }
  }

  function sanitizeToken(label: string): string {
    return label.toLowerCase().replace(/[^a-z]/g, "")
  }

  const getTarotFocusHref = (name: string): string => {
    const query = new URLSearchParams([[TABLE_FOCUS_QUERY_PARAM, name]])
    return `/equipment/TarotCards?${query.toString()}`
  }

  const syncManualTarotSelectionsWithAutoSlots = (nextSlots: readonly Slot[]) => {
    const autoManagedTarots = getAutoManagedTarotNames(nextSlots)
    const nextManualSelections = filterManualTarotSelections(
      readStoredManualTarotSelections(localStorage),
      autoManagedTarots,
    )

    localStorage.setItem(MANUAL_TAROT_SELECTION_STORAGE_KEY, JSON.stringify(nextManualSelections))
  }

  function parseAffixLine(line: string): Affix | null {
    const cleaned = line
      .replace(/^\u25D8\s*/, "") // remove leading bullet ◘
      .replace(/🖊️/g, "")
      .trim()
    const parts = cleaned.split(/\s+/)
    if (parts.length < 2) return null

    const numPart = parts[0]
    const labelPart = parts.slice(1).join(" ")
    const token = sanitizeToken(labelPart)
    const mapped = stat_data.inGameNames[token]
    if (!mapped) return null

    return { stat: mapped, value: parseInt(numPart, 10) }
  }

  function parsePastedItem(text: string): Partial<Slot> | null {
    const lines = text.split(/\r?\n/).map((line) => line.trim())
    if (!lines.some((line) => line.length > 0)) return null

    const result: Partial<Slot> = {
      affixes: [],
      tarotScalingStat: "",
      tarotLevel: 0,
    }

    const equipmentNameRegex = /\[\s*i\d{3}\s*\]/i
    const nameLine = lines.find((line) => equipmentNameRegex.test(line))

    if (nameLine) {
      result.name = nameLine

      const equipIdx = lines.findIndex((line) => /^equip type$/i.test(line))
      const typeLine = lines.slice(equipIdx + 1).find((line) => line.length > 0)
      if (typeLine) result.type = typeLine

      const mainLabelIdx = lines.findIndex((line) => /\+[ADMH]?(?:ATK|DEF|MATK|HEAL)/i.test(line))
      if (mainLabelIdx >= 0) {
        const label = lines[mainLabelIdx].replace(/.*\+/, "").toUpperCase().replace(/[^A-Z]/g, "")
        const statMap: Record<string, Slot["mainstat"]> = { ATK: "ATK", DEF: "DEF", MATK: "MATK", HEAL: "HEAL" }
        if (statMap[label]) result.mainstat = statMap[label]

        const valueLine = lines.slice(mainLabelIdx + 1).find((line) => /\d/.test(line))
        if (valueLine) {
          const val = parseInt(valueLine.replace(/[^0-9\-]/g, ""), 10)
          if (!Number.isNaN(val)) result.mainstat_value = val
        }
      }
    } else {
      const tarotMarkerIdx = lines.findIndex((line) => /⭐/i.test(line))
      if (tarotMarkerIdx > 0) {
        const tarotName = lines[tarotMarkerIdx - 1].replace(/^(\s*\[[^\]]+\]\s*)+/, "").trim()
        result.name = tarotName
        result.type = "Tarot"

        const levelMatch = (lines.find((line) => /level\s*:/i.test(line)) ?? "")
          .match(/level\s*:\s*(\d+)\s*\/\s*(\d+)/i)
        result.tarotLevel = levelMatch ? parseInt(levelMatch[1], 10) : 0

        if (isKnownTarotName(tarotName)) {
          result.tarotScalingStat = tarot_data[tarotName].stat_bonus
        }
      }
    }

    for (const line of lines) {
      if (!line.startsWith("◘")) continue
      const affix = parseAffixLine(line)
      if (affix) (result.affixes as Affix[]).push(affix)
    }

    result.enabled = true
    return result
  }

  // Per-slot paste handler
  function pasteEquipmentIntoSlot(slotIndex: number, rawText: string) {
    const parsed = parsePastedItem(rawText)
    if (!parsed) return

    setSlots((prev) => prev.map((slot, idx) => {
      if (idx !== slotIndex) return slot

      return {
        ...slot,
        ...parsed,
        affixes: Array.isArray(parsed.affixes) ? parsed.affixes : slot.affixes,
      }
    }))
  }

  async function importEquipmentFromClipboard(slotIndex: number) {
    if (typeof navigator === "undefined" || !navigator.clipboard?.readText) {
      return
    }

    try {
      const text = await navigator.clipboard.readText()
      if (!text.trim()) {
        return
      }

      pasteEquipmentIntoSlot(slotIndex, text)
    } catch (error) {
      console.warn("Clipboard import failed.", error)
    }
  }

  useEffect(() => {
    refreshStoredEquipmentSlots()
    refreshStoredEquipmentScriptGroups()

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
    try {
      setArtifact(normalizeArtifact(storedArtifact ? JSON.parse(storedArtifact) : null))
    } catch {
      setArtifact(createDefaultArtifact())
    }

    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (!isHydrated) {
      return
    }

    const handleStorage = (event: StorageEvent) => {
      if (
        event.key !== null &&
        event.key !== EQUIPMENT_SLOTS_STORAGE_KEY &&
        event.key !== EQUIPMENT_SCRIPT_GROUPS_STORAGE_KEY
      ) {
        return
      }

      refreshStoredEquipmentSlots()
      refreshStoredEquipmentScriptGroups()
    }

    window.addEventListener("storage", handleStorage)
    window.addEventListener("focus", refreshStoredEquipmentSlots)
    window.addEventListener("focus", refreshStoredEquipmentScriptGroups)
    return () => {
      window.removeEventListener("storage", handleStorage)
      window.removeEventListener("focus", refreshStoredEquipmentSlots)
      window.removeEventListener("focus", refreshStoredEquipmentScriptGroups)
    }
  }, [isHydrated])

  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(EQUIPMENT_SLOTS_STORAGE_KEY, JSON.stringify(slots))
      const enabledIndices = getEnabledEquipmentIndices(slots)
      localStorage.setItem(ENABLED_EQUIPMENT_STORAGE_KEY, JSON.stringify(enabledIndices))
      localStorage.setItem(
        EQUIPMENT_AUTO_LINKED_TAROTS_STORAGE_KEY,
        JSON.stringify(getEquipmentAutoLinkedTarots(slots, enabledIndices)),
      )
      syncManualTarotSelectionsWithAutoSlots(slots)
      dispatchBuildSnapshotUpdated()
    }
  }, [slots, isHydrated])

  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(STORAGE_KEY_RUNES, JSON.stringify(selectedRunes))
      dispatchBuildSnapshotUpdated()
    }
  }, [selectedRunes, isHydrated])

  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(STORAGE_KEY_ARTIFACT, JSON.stringify(artifact));
      dispatchBuildSnapshotUpdated()
    }
  }, [artifact, isHydrated]);

  const addAffixRow = (slotIndex: number) => {
    const updated = [...slots]
    updated[slotIndex] = {
      ...updated[slotIndex],
      affixes: [...updated[slotIndex].affixes, { stat: "", value: 0 }],
    }
    setSlots(updated)
  }

  const addSlot = () => {
    setSlots([...slots, createDefaultEquipmentSlot()])
  }

  const removeSlot = (index: number) => {
    setSlots(slots.filter((_, slotIndex) => slotIndex !== index))
  }

  const toggleSlot = (index: number) => {
    setSlots(slots.map((slot, i) => i === index ? { ...slot, enabled: !slot.enabled } : slot))
  }

  const updateSlot = (index: number, field: keyof Slot | string, value: string | number | boolean) => {
    const updated = slots.map((slot, i) => {
      if (i !== index) return slot

      const updatedSlot: Slot = { ...slot }
      if (field.startsWith("affix_")) {
        const [, affixIndexStr, affixField] = field.split("_")
        const affixIndex = parseInt(affixIndexStr, 10)
        updatedSlot.affixes = [...slot.affixes]
        updatedSlot.affixes[affixIndex] = {
          ...updatedSlot.affixes[affixIndex],
          [affixField]: value,
        }
      } else if (field in updatedSlot) {
        ;(updatedSlot[field as keyof Slot] as Slot[keyof Slot]) = value as Slot[keyof Slot]
      }

      if (
        isTarotEquipmentSlot(updatedSlot) &&
        isKnownTarotName(updatedSlot.name) &&
        (!updatedSlot.tarotScalingStat || field === "name" || field === "type")
      ) {
        updatedSlot.tarotScalingStat = tarot_data[updatedSlot.name].stat_bonus
      }

      if (isTarotEquipmentSlot(updatedSlot)) {
        updatedSlot.mainstat = ""
        updatedSlot.mainstat_value = 0
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

  if (!isHydrated) return <div className="p-4 text-sm text-slate-300">Loading equipment editor...</div>

  return (
    <div className="p-4 space-y-6">
      <div className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-300">Artifact</div>
      <table className="table-fixed border text-center text-sm">
        <thead>
          <tr>
            <th className="bg-emerald-900/45 border px-2 py-1">ATK%</th>
            <th className="bg-rose-900/45 border px-2 py-1">DEF%</th>
            <th className="bg-sky-900/40 border px-2 py-1">MATK%</th>
            <th className="bg-fuchsia-900/40 border px-2 py-1">HEAL%</th>
            <th className="bg-fuchsia-900/40 border px-2 py-1">Level</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            {artifactFieldOrder.map(k => (
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
      <div className="space-y-3">
        {runeTiers.map(tier => (
          <div key={tier} className="max-w-full rounded border border-slate-800/80 bg-slate-950/35 p-2">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold">{tier} Tier Runes</h2>
              <button
                onClick={() => addRuneRow(tier)}
                className="rounded bg-sky-600 px-2 py-0.5 text-[11px] text-slate-100"
              >
                + Add Rune
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-auto border-collapse text-[11px] leading-tight">
                <thead>
                  <tr className="bg-slate-800/85">
                    <th className="border px-1.5 py-0.75 text-left font-semibold">Rune</th>
                    <th className="border px-1.5 py-0.75 text-left font-semibold">Count</th>
                    <th className="border px-1.5 py-0.75 text-left font-semibold">Effect</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedRunes[tier].map((selection, idx) => (
                    <tr key={idx}>
                      <td className="border px-1.5 py-0.75 align-top">
                        <select
                          value={selection.rune}
                          onChange={e => updateRuneSelection(tier, idx, "rune", e.target.value)}
                          className="w-[15rem] border px-1 py-0.5 text-[11px] leading-tight"
                        >
                          <option value="">Select Rune</option>
                          {runesByTier(tier).map(runeName => (
                            <option key={runeName} value={runeName}>
                              {getRuneOptionLabel(runeName)}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="border px-1.5 py-0.75 align-top">
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={selection.count}
                            min={1}
                            onChange={e => updateRuneSelection(tier, idx, "count", +e.target.value)}
                            className="w-12 border px-1 py-0.5 text-[11px] text-center"
                          />
                          <button
                            type="button"
                            onClick={() => removeRuneRow(tier, idx)}
                            className="rounded bg-rose-600 px-1.5 py-0.5 text-[10px] text-slate-100"
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                      <td className="border px-1.5 py-0.75 align-top">
                        <div className="max-w-[16rem] whitespace-normal leading-snug">
                          {getRuneEffectLabel(selection)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {/* Equipment Slots */}
      <div className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] items-start gap-3">
        {slots.map((slot, idx) => {
          const isTarotSlot = slot.type === "Tarot" || (slot.name.length > 0 && isKnownTarotName(slot.name))
          const tarotScalingValue = isKnownTarotName(slot.name)
            ? getTarotScalingValue(slot.name, slot.tarotLevel)
            : null

          return (
            <div
              key={idx}
              onClick={() => toggleSlot(idx)}
              className={`flex-shrink-0 cursor-pointer rounded border p-1.5 text-left text-sm transition ${
                slot.enabled ? "bg-emerald-900/45" : "bg-slate-800/85 opacity-50"
                // TODO: Make the slot change color if the name contains +10
              }`}
            >
              <div className="mb-1.5 grid grid-cols-2 gap-1.5">
                <div>
                  <div className="mb-1 flex min-h-6 items-center">
                    <label className="block text-[11px] font-medium uppercase tracking-[0.08em] text-slate-300">Name</label>
                  </div>
                  <input
                    value={slot.name}
                    onChange={e => updateSlot(idx, "name", e.target.value)}
                    className="w-full border px-1 py-0.5"
                    onClick={e => e.stopPropagation()}
                  />
                </div>
                <div>
                  <div className="mb-1 flex min-h-6 items-center justify-between gap-2">
                    <label className="block text-[11px] font-medium uppercase tracking-[0.08em] text-slate-300">Type</label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        title="Import equipment from clipboard"
                        aria-label="Import equipment from clipboard"
                        className="inline-flex h-6 w-6 items-center justify-center rounded border border-slate-600 bg-slate-900/70 text-slate-200 transition hover:border-sky-400 hover:bg-sky-500/10 hover:text-sky-200"
                        onClick={async (e) => {
                          e.stopPropagation()
                          await importEquipmentFromClipboard(idx)
                        }}
                      >
                        <svg viewBox="0 0 24 24" className="h-3 w-3 fill-none stroke-current" strokeWidth="1.9" aria-hidden="true">
                          <path d="M9 4.75h6" strokeLinecap="round" />
                          <path d="M9 3h6a1 1 0 0 1 1 1v1H8V4a1 1 0 0 1 1-1Z" />
                          <path d="M7 6h10a2 2 0 0 1 2 2v10a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V8a2 2 0 0 1 2-2Z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        title="Delete equipment"
                        aria-label="Delete equipment"
                        className="inline-flex h-6 w-6 items-center justify-center rounded border border-red-600 bg-red-600 text-white transition hover:border-red-500 hover:bg-red-500"
                        onClick={e => {
                          e.stopPropagation()
                          removeSlot(idx)
                        }}
                      >
                        <svg viewBox="0 0 24 24" className="h-3 w-3 fill-none stroke-current" strokeWidth="2.2" aria-hidden="true">
                          <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <select
                    value={slot.type}
                    onChange={e => updateSlot(idx, "type", e.target.value)}
                    className="w-full border px-1 py-0.5"
                    onClick={e => e.stopPropagation()}
                  >
                    <option value="">Select</option>
                    {typeOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <div className="mb-1 flex min-h-6 items-center">
                    <label className="block text-[11px] font-medium uppercase tracking-[0.08em] text-slate-300">Script Group</label>
                  </div>
                  <select
                    value={slot.scriptGroupId}
                    onChange={e => updateSlot(idx, "scriptGroupId", e.target.value)}
                    className="w-full border px-1 py-0.5"
                    onClick={e => e.stopPropagation()}
                  >
                    <option value="">None</option>
                    {equipmentScriptGroups.map((group, groupIndex) => (
                      <option key={group.id} value={group.id}>
                        {group.name.trim() || `Script Group ${groupIndex + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
                {!isTarotSlot ? (
                  <div className="col-span-2">
                    <div className="flex items-end gap-1.5">
                      <select
                        value={slot.mainstat}
                        onChange={e => updateSlot(idx, "mainstat", e.target.value)}
                        className="w-1/2 border px-1 py-0.5"
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
                        className="w-1/2 border px-1 py-0.5"
                        onClick={e => e.stopPropagation()}
                      />
                    </div>
                  </div>
                ) : null}
                {isTarotSlot ? (
                  <div className="col-span-2 rounded border border-slate-700/80 bg-slate-950/45 p-1.5">
                    <div className="grid grid-cols-2 gap-1.5">
                      <div>
                        <label className="mb-1 block text-[11px] font-medium uppercase tracking-[0.08em] text-slate-300">Scaling Stat</label>
                        <select
                          value={slot.tarotScalingStat}
                          onChange={e => updateSlot(idx, "tarotScalingStat", e.target.value)}
                          className="w-full border px-1 py-0.5"
                          onClick={e => e.stopPropagation()}
                        >
                          <option value="">Select Stat</option>
                          {allStatNames.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] font-medium uppercase tracking-[0.08em] text-slate-300">Level</label>
                        <input
                          type="number"
                          min={0}
                          value={slot.tarotLevel}
                          onChange={e => updateSlot(idx, "tarotLevel", Math.max(0, Number(e.target.value) || 0))}
                          className="w-full border px-1 py-0.5"
                          onClick={e => e.stopPropagation()}
                        />
                      </div>
                    </div>
                    <div className="mt-1.5 flex items-center justify-between gap-2 text-xs">
                        <label
                          className="inline-flex items-center gap-2"
                          title="Enables syncing with the tarot page"
                          onClick={e => e.stopPropagation()}
                        >
                        <input
                          type="checkbox"
                          checked={slot.tarotAuto}
                          title="Enables syncing with the tarot page"
                          onChange={e => updateSlot(idx, "tarotAuto", e.target.checked)}
                        />
                        <span>Auto</span>
                      </label>
                      {isKnownTarotName(slot.name) ? (
                        <Link
                          href={getTarotFocusHref(slot.name)}
                          className="text-sky-300 underline underline-offset-2 hover:text-sky-200"
                          onClick={e => e.stopPropagation()}
                        >
                          Open on tarot page
                        </Link>
                      ) : null}
                    </div>
                    <p className="mt-2 text-xs text-slate-300">
                      {slot.tarotScalingStat && tarotScalingValue !== null
                        ? `${slot.tarotScalingStat}: +${tarotScalingValue}`
                        : "For automatic scaling, enter a valid tarot name. Otherwise use affixes to track the stat manually."}
                    </p>
                  </div>
                ) : null}
              </div>
            <table className="w-full table-fixed border-collapse border text-xs">
              <thead>
                <tr className="bg-slate-800/85">
                  <th className="border px-1.5 py-1">Affix</th>
                  <th className="border px-1.5 py-1">Value</th>
                </tr>
              </thead>
              <tbody>
                {slot.affixes.map((affix, i) => (
                  <tr key={i}>
                    <td className="border px-1.5 py-1">
                      <select
                        value={affix.stat}
                        onChange={e => updateSlot(idx, `affix_${i}_stat`, e.target.value)}
                        className="w-full border px-1 py-0.5"
                        onClick={e => e.stopPropagation()}
                      >
                        <option value="">Select</option>
                        {allStatNames.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </td>
                    <td className="border px-1.5 py-1">
                      <input
                        type="number"
                        value={affix.value}
                        onChange={e => updateSlot(idx, `affix_${i}_value`, +e.target.value)}
                        className="w-full border px-1 py-0.5"
                        onClick={e => e.stopPropagation()}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-1.5">
              <button
                onClick={e => {
                  e.stopPropagation()
                  addAffixRow(idx)
                }}
                className="w-full rounded bg-sky-600 px-2 py-0.75 text-sm text-slate-100"
              >
                + Add Affix
              </button>
            </div>
          </div>
          )
        })}

        <div className="flex items-center justify-center w-full max-w-md border-dashed border-2 border-slate-600 rounded p-4">
          <button onClick={addSlot} className="px-4 py-1 bg-sky-600 text-slate-100 rounded">Add Slot</button>
        </div>
      </div>
    </div>
  )
}
