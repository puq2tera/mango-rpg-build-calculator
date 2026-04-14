"use client"

import { useMemo } from "react"
import { skill_data } from "@/app/data/skill_data"
import { getOrderedSkillNames } from "@/app/lib/learnCommands"
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
}

const columnDefinitions = [
  {
    id: "tank",
    label: "Tank",
    header: "border-lime-400/50 bg-emerald-950 text-lime-50",
    badge: "border-lime-200/45 bg-emerald-900 text-lime-100",
    emptyCell: "bg-emerald-950/45",
  },
  {
    id: "warrior",
    label: "Warrior",
    header: "border-rose-400/50 bg-rose-950 text-rose-50",
    badge: "border-rose-200/45 bg-rose-900 text-rose-100",
    emptyCell: "bg-rose-950/45",
  },
  {
    id: "caster",
    label: "Caster",
    header: "border-blue-400/50 bg-blue-950 text-blue-50",
    badge: "border-blue-200/45 bg-blue-900 text-blue-100",
    emptyCell: "bg-blue-950/45",
  },
  {
    id: "healer",
    label: "Healer",
    header: "border-violet-400/50 bg-violet-950 text-violet-50",
    badge: "border-violet-200/45 bg-violet-900 text-violet-100",
    emptyCell: "bg-violet-950/45",
  },
  {
    id: "general",
    label: "Hybrid/Prestige",
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
} as const

const combinedColumnStyles = {
  header: "border-sky-400/50 bg-sky-950 text-sky-50",
  badge: "border-sky-200/45 bg-sky-900 text-sky-100",
  emptyCell: "bg-slate-950/70",
}

function getSkillCategory(skillName: string): string {
  return skill_data[skillName]?.category ?? "basic"
}

function getSkillStyles(skillName: string) {
  return categoryStyles[getSkillCategory(skillName)] ?? categoryStyles.basic
}

export default function SkillOverview() {
  const { isHydrated, selectedSkills } = useLearnSelections()

  const orderedSkillNames = useMemo(
    () => getOrderedSkillNames(selectedSkills),
    [selectedSkills],
  )

  const skillsByColumn = useMemo(() => {
    const grouped = Object.fromEntries(columnDefinitions.map((column) => [column.id, [] as string[]])) as Record<string, string[]>

    for (const skillName of orderedSkillNames) {
      const category = getSkillCategory(skillName)
      const columnId = categoryToColumnId[category as keyof typeof categoryToColumnId] ?? "general"
      grouped[columnId].push(skillName)
    }

    return grouped
  }, [orderedSkillNames])

  const rowCount = useMemo(() => (
    Math.max(
      orderedSkillNames.length,
      ...columnDefinitions.map((column) => skillsByColumn[column.id]?.length ?? 0),
    )
  ), [orderedSkillNames.length, skillsByColumn])

  if (!isHydrated) {
    return <div className="p-4 text-sm text-slate-300">Loading skill overview...</div>
  }

  return (
    <div className="min-h-[calc(100vh-var(--top-nav-height))] bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.14),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.08),transparent_24%)]">
      <div className="w-full px-4 py-6">
        {orderedSkillNames.length === 0 ? (
          <div className="px-4 py-8 text-sm text-slate-300">
            No skills are selected.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1180px] table-fixed border-separate border-spacing-0">
              <thead>
                <tr>
                  {columnDefinitions.map((column) => (
                    <th
                      key={column.id}
                      className={`border-b border-r px-3 py-3 text-left align-top ${column.header}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold">{column.label}</span>
                        <span className={`rounded-full border px-2 py-0.5 text-[11px] font-mono ${column.badge}`}>
                          {skillsByColumn[column.id]?.length ?? 0}
                        </span>
                      </div>
                    </th>
                  ))}
                  <th className={`border-b px-3 py-3 text-left align-top ${combinedColumnStyles.header}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold">Combined Order</span>
                      <span className={`rounded-full border px-2 py-0.5 text-[11px] font-mono ${combinedColumnStyles.badge}`}>
                        {orderedSkillNames.length}
                      </span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: rowCount }, (_, rowIndex) => (
                  <tr key={rowIndex} className="align-top">
                    {columnDefinitions.map((column) => {
                      const skillName = skillsByColumn[column.id]?.[rowIndex] ?? ""
                      const skillStyles = skillName ? getSkillStyles(skillName) : null

                      return (
                        <td
                          key={column.id}
                          className={`border-r border-b border-slate-800/70 px-3 py-2 text-sm text-slate-100 ${skillStyles?.cell ?? column.emptyCell}`}
                        >
                          {skillName ? (
                            <div className="flex items-start gap-2">
                              <span className={`mt-0.5 shrink-0 rounded border px-1.5 py-0.5 text-[11px] font-mono ${skillStyles?.badge ?? column.badge}`}>
                                {rowIndex + 1}
                              </span>
                              <span>{skillName}</span>
                            </div>
                          ) : (
                            <span className="text-slate-600"> </span>
                          )}
                        </td>
                      )
                    })}
                    <td className={`border-b border-slate-800/70 px-3 py-2 text-sm text-slate-100 ${orderedSkillNames[rowIndex] ? getSkillStyles(orderedSkillNames[rowIndex]).cell : combinedColumnStyles.emptyCell}`}>
                      {orderedSkillNames[rowIndex] ? (
                        <div className="flex items-start gap-2">
                          <span className={`mt-0.5 shrink-0 rounded border px-1.5 py-0.5 text-[11px] font-mono ${getSkillStyles(orderedSkillNames[rowIndex]).badge}`}>
                            {rowIndex + 1}
                          </span>
                          <span>{orderedSkillNames[rowIndex]}</span>
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
