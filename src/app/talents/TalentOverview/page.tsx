"use client"

import { useMemo } from "react"
import { talent_data } from "@/app/data/talent_data"
import { getOrderedTalentNames } from "@/app/lib/learnCommands"
import { useLearnSelections } from "@/app/lib/useLearnSelections"

const categoryStyles: Record<string, { cell: string, badge: string }> = {
  basic: {
    cell: "bg-slate-900/70",
    badge: "border-slate-400/50 bg-slate-800 text-slate-200",
  },
  tank: {
    cell: "bg-emerald-950/65",
    badge: "border-lime-200/45 bg-emerald-900 text-lime-100",
  },
  warrior: {
    cell: "bg-rose-950/65",
    badge: "border-rose-200/45 bg-rose-900 text-rose-100",
  },
  caster: {
    cell: "bg-blue-950/65",
    badge: "border-blue-200/45 bg-blue-900 text-blue-100",
  },
  healer: {
    cell: "bg-violet-950/65",
    badge: "border-violet-200/45 bg-violet-900 text-violet-100",
  },
  hybrid: {
    cell: "bg-amber-950/65",
    badge: "border-amber-200/45 bg-amber-900 text-amber-100",
  },
  prestige: {
    cell: "bg-yellow-950/65",
    badge: "border-amber-200/45 bg-yellow-900 text-amber-100",
  },
  racial: {
    cell: "bg-cyan-950/65",
    badge: "border-cyan-200/45 bg-cyan-900 text-cyan-100",
  },
}

const columnDefinitions = [
  {
    id: "tank",
    label: "Tank",
    categories: ["tank"],
    header: "border-lime-400/50 bg-emerald-950 text-lime-50",
    badge: "border-lime-200/45 bg-emerald-900 text-lime-100",
    emptyCell: "bg-emerald-950/45",
  },
  {
    id: "warrior",
    label: "Warrior",
    categories: ["warrior"],
    header: "border-rose-400/50 bg-rose-950 text-rose-50",
    badge: "border-rose-200/45 bg-rose-900 text-rose-100",
    emptyCell: "bg-rose-950/45",
  },
  {
    id: "caster",
    label: "Caster",
    categories: ["caster"],
    header: "border-blue-400/50 bg-blue-950 text-blue-50",
    badge: "border-blue-200/45 bg-blue-900 text-blue-100",
    emptyCell: "bg-blue-950/45",
  },
  {
    id: "healer",
    label: "Healer",
    categories: ["healer"],
    header: "border-violet-400/50 bg-violet-950 text-violet-50",
    badge: "border-violet-200/45 bg-violet-900 text-violet-100",
    emptyCell: "bg-violet-950/45",
  },
  {
    id: "racial",
    label: "Racial",
    categories: ["racial"],
    header: "border-cyan-300/50 bg-cyan-950 text-cyan-50",
    badge: "border-cyan-200/45 bg-cyan-900 text-cyan-100",
    emptyCell: "bg-cyan-950/45",
  },
  {
    id: "general",
    label: "Hybrid/Prestige",
    categories: ["basic", "hybrid", "prestige"],
    header: "border-amber-300/50 bg-amber-950 text-amber-50",
    badge: "border-amber-200/45 bg-amber-900 text-amber-100",
    emptyCell: "bg-slate-950/70",
  },
] as const

const categoryToColumnId = {
  basic: "general",
  hybrid: "general",
  prestige: "general",
  tank: "tank",
  warrior: "warrior",
  caster: "caster",
  healer: "healer",
  racial: "racial",
} as const

const combinedColumnStyles = {
  header: "border-sky-400/50 bg-sky-950 text-sky-50",
  badge: "border-sky-200/45 bg-sky-900 text-sky-100",
  emptyCell: "bg-slate-950/70",
}

function getTalentCategory(talentName: string): string {
  return talent_data[talentName]?.category ?? "basic"
}

function getTalentStyles(talentName: string) {
  return categoryStyles[getTalentCategory(talentName)] ?? categoryStyles.basic
}

export default function TalentOverview() {
  const { isHydrated, selectedTalents } = useLearnSelections()

  const orderedTalentNames = useMemo(
    () => getOrderedTalentNames(selectedTalents),
    [selectedTalents],
  )

  const talentsByColumn = useMemo(() => {
    const grouped = Object.fromEntries(columnDefinitions.map((column) => [column.id, [] as string[]])) as Record<string, string[]>

    for (const talentName of orderedTalentNames) {
      const category = getTalentCategory(talentName)
      const columnId = categoryToColumnId[category as keyof typeof categoryToColumnId] ?? "general"
      grouped[columnId].push(talentName)
    }

    return grouped
  }, [orderedTalentNames])

  const rowCount = useMemo(() => (
    Math.max(
      orderedTalentNames.length,
      ...columnDefinitions.map((column) => talentsByColumn[column.id]?.length ?? 0),
    )
  ), [orderedTalentNames.length, talentsByColumn])

  if (!isHydrated) {
    return <div className="p-4 text-sm text-slate-300">Loading talent overview...</div>
  }

  return (
    <div className="min-h-[calc(100vh-var(--top-nav-height))] bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.11),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(249,115,22,0.08),transparent_26%)]">
      <div className="w-full px-4 py-6">
        {orderedTalentNames.length === 0 ? (
          <div className="px-4 py-8 text-sm text-slate-300">
            No talents are selected.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1320px] table-fixed border-separate border-spacing-0">
              <thead>
                <tr>
                  {columnDefinitions.map((column) => {
                    return (
                      <th
                        key={column.id}
                        className={`border-b border-r px-3 py-3 text-left align-top ${column.header}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold">{column.label}</span>
                          <span className={`rounded-full border px-2 py-0.5 text-[11px] font-mono ${column.badge}`}>
                            {talentsByColumn[column.id]?.length ?? 0}
                          </span>
                        </div>
                      </th>
                    )
                  })}
                  <th className={`border-b px-3 py-3 text-left align-top ${combinedColumnStyles.header}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold">Combined Order</span>
                      <span className={`rounded-full border px-2 py-0.5 text-[11px] font-mono ${combinedColumnStyles.badge}`}>
                        {orderedTalentNames.length}
                      </span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: rowCount }, (_, rowIndex) => (
                  <tr key={rowIndex} className="align-top">
                    {columnDefinitions.map((column) => {
                      const talentName = talentsByColumn[column.id]?.[rowIndex] ?? ""
                      const talentStyles = talentName ? getTalentStyles(talentName) : null

                      return (
                        <td
                          key={column.id}
                          className={`border-r border-b border-slate-800/70 px-3 py-2 text-sm text-slate-100 ${talentStyles?.cell ?? column.emptyCell}`}
                        >
                          {talentName ? (
                            <div className="flex items-start gap-2">
                              <span className={`mt-0.5 shrink-0 rounded border px-1.5 py-0.5 text-[11px] font-mono ${talentStyles?.badge ?? column.badge}`}>
                                {rowIndex + 1}
                              </span>
                              <span>{talentName}</span>
                            </div>
                          ) : (
                            <span className="text-slate-600"> </span>
                          )}
                        </td>
                      )
                    })}
                    <td className={`border-b border-slate-800/70 px-3 py-2 text-sm text-slate-100 ${orderedTalentNames[rowIndex] ? getTalentStyles(orderedTalentNames[rowIndex]).cell : combinedColumnStyles.emptyCell}`}>
                      {orderedTalentNames[rowIndex] ? (
                        <div className="flex items-start gap-2">
                          <span className={`mt-0.5 shrink-0 rounded border px-1.5 py-0.5 text-[11px] font-mono ${getTalentStyles(orderedTalentNames[rowIndex]).badge}`}>
                            {rowIndex + 1}
                          </span>
                          <span>{orderedTalentNames[rowIndex]}</span>
                        </div>
                      ) : (
                        <span className="text-slate-600"> </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
