"use client"

import { useEffect, useMemo, useState } from "react"
import tarot_data from "@/app/data/tarot_data"

const STORAGE_SELECTED = "selectedTarots"
const STORAGE_STACKS = "tarotStacks"

const columns = [
  "Name",
  "Tier",
  "Skill",
  "Stack",
  "Description"
] as const

export default function TarotCardsPage() {
  const [isHydrated, setIsHydrated] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [stacks, setStacks] = useState<Record<string, number>>({})

  // Load persisted selection and stacks
  useEffect(() => {
    try {
      const rawSel = localStorage.getItem(STORAGE_SELECTED)
      if (rawSel) setSelected(new Set<string>(JSON.parse(rawSel)))
    } catch {}
    try {
      const rawStacks = localStorage.getItem(STORAGE_STACKS)
      if (rawStacks) setStacks(JSON.parse(rawStacks))
    } catch {}
    setIsHydrated(true)
  }, [])


  // Persist on change
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(STORAGE_SELECTED, JSON.stringify(Array.from(selected)))
    }
  }, [selected])
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(STORAGE_STACKS, JSON.stringify(stacks))
    }
  }, [stacks])

  // Tier counts among selected to flag constraints
  const tierCounts = useMemo(() => {
    const counts: Record<number, number> = {}
    for (const name of selected) {
      const t = tarot_data[name]?.tier ?? 0
      counts[t] = (counts[t] || 0) + 1
    }
    return counts
  }, [selected])

  // Constraints: red if over limits
  const tierLimits: Record<number, number> = { 5: 1, 4: 1, 3: 2 }

  const toggle = (name: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  const onChangeStack = (name: string, value: number) => {
    setStacks(prev => ({ ...prev, [name]: Math.max(0, Math.floor(value || 0)) }))
  }

  const rows = Object.entries(tarot_data)
    .map(([name, t]) => ({ name, ...t }))

  return (
    <div className="h-[80vh] overflow-y-auto border rounded-md">
      <div className="sticky top-0 z-10 bg-white border-b py-2 grid" style={{ gridTemplateColumns: "220px 80px 200px 100px 1fr" }}>
        {columns.map((c) => (
          <div key={c} className="px-2 font-bold whitespace-nowrap border-r border-black last:border-r-0 box-border">{c}</div>
        ))}
      </div>

      <div className="space-y-0.5">
        {rows.map(row => {
          const isSelected = selected.has(row.name)
          const overLimit = (tierCounts[row.tier] ?? 0) > (tierLimits[row.tier] ?? Infinity)
          const canStack = Boolean(row.stack_stats || row.stack_conversions)
          const stackVal = stacks[row.name] ?? 0
          return (
            <div
              key={row.name}
              className={`grid items-center px-0 py-1 cursor-pointer ${isSelected ? "bg-blue-100 hover:bg-blue-200" : "hover:bg-gray-100"}`}
              style={{ gridTemplateColumns: "220px 80px 200px 100px 1fr" }}
              onClick={() => toggle(row.name)}
            >
              <span className="px-2 whitespace-nowrap border-r border-gray-300">{row.name}</span>
              <span className={`px-2 whitespace-nowrap border-r border-gray-300 ${overLimit ? "text-red-600 font-semibold" : ""}`}>{row.tier}</span>
              <span className="px-2 whitespace-nowrap overflow-hidden text-ellipsis border-r border-gray-300">{row.skill_name}</span>
              <span className="px-2 border-r border-gray-300">
                {canStack ? (
                  <input
                    type="number"
                    className="w-20 border px-1"
                    value={stackVal}
                    onClick={e => e.stopPropagation()}
                    onChange={e => onChangeStack(row.name, +e.target.value)}
                    min={0}
                  />
                ) : null}
              </span>
              <span className="px-2 whitespace-nowrap overflow-hidden text-ellipsis">{row.description}</span>
            </div>
          )
        })}
      </div>
      <div className="p-2 text-xs text-gray-600 border-t">
        Limits: at most 1x Tier 5, 1x Tier 4, 2x Tier 3. Tier label turns red if exceeded.
      </div>
    </div>
  )
}
