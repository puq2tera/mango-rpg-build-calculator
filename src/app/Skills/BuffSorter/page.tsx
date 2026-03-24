"use client"
import { useEffect, useState } from "react"
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { SortableItem } from "@/app/components/SortableItem"
import { skill_data } from "@/app/data/skill_data"
import { BUILD_SNAPSHOT_UPDATED_EVENT, dispatchBuildSnapshotUpdated } from "@/app/lib/buildEvents"
import { computeBuildStatStages, readBuildSnapshot } from "@/app/lib/buildStats"
import { computeSkillDisplayEffectStats, formatWhole } from "@/app/lib/debugComparisonSummary"
import { BUFF_SELECTION_STORAGE_KEY } from "@/app/lib/learnCommands"
import { isInternalThreatStat } from "@/app/lib/threat"

const effectPriority = [
  "ATK",
  "DEF",
  "MATK",
  "HEAL",
  "HP",
  "MP",
  "Focus",
  "Threat%",
  "All Res%",
  "Dmg%",
  "DMG Res%",
  "Crit Chance%",
  "Crit DMG%",
  "Bow Crit Chance%",
  "Bow Crit DMG%",
  "Phys%",
  "Phys Pen%",
  "Elemental%",
  "Elemental Pen%",
  "Divine%",
  "Divine Pen%",
  "Void%",
  "Void Pen%",
  "Bow%",
]

const effectPriorityIndex = new Map(effectPriority.map((stat, index) => [stat, index]))

function getReadableStatLabel(stat: string): string {
  switch (stat) {
    case "HP":
      return "Health"
    case "MP":
      return "Mana"
    case "HEAL":
      return "Healpower"
    case "Dmg%":
      return "Global Damage"
    case "All Res%":
      return "All Resist"
    case "DMG Res%":
      return "Damage Resist"
    case "Crit Chance%":
      return "Crit Chance"
    case "Crit DMG%":
      return "Crit Damage"
    case "Bow Crit Chance%":
      return "Bow Crit Chance"
    case "Bow Crit DMG%":
      return "Bow Crit Damage"
    case "Threat%":
      return "Threat Modifier"
    case "Neg%":
      return "Negative DMG"
    case "Holy%":
      return "Holy DMG"
    case "Phys%":
      return "Physical DMG"
    case "Elemental%":
      return "Elemental DMG"
    case "Elemental Pen%":
      return "Elemental Pen"
    case "Divine%":
      return "Divine DMG"
    case "Divine Pen%":
      return "Divine Pen"
    case "Void%":
      return "Void DMG"
    case "Void Pen%":
      return "Void Pen"
    case "Bow%":
      return "Elebow"
    case "All%":
      return "All Damage"
    default:
      return stat.replace(/%/g, "").trim()
  }
}

function formatEffectDelta(delta: number, stat: string): string {
  const digits = Math.abs(delta) < 1 && delta !== 0 ? 2 : 0
  const absolute = digits === 0
    ? formatWhole(Math.abs(delta))
    : Math.abs(delta).toLocaleString("en-US", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    })
  const suffix = stat.includes("%") ? "%" : ""
  return `${delta >= 0 ? "+" : "-"}${absolute}${suffix} ${getReadableStatLabel(stat)}`
}

function getBuffStatsDescription(
  skillName: string,
  sourceStats: Record<string, number>,
  buffStacks: Record<string, number>,
  selectedBuffNames: readonly string[],
): string {
  const effectStats = computeSkillDisplayEffectStats(skillName, sourceStats, buffStacks, selectedBuffNames)
  const effects = Object.entries(effectStats)
    .filter(([stat, value]) => !isInternalThreatStat(stat) && Math.abs(value) >= 0.0001)
    .sort(([leftStat, leftValue], [rightStat, rightValue]) => {
      const leftPriority = effectPriorityIndex.get(leftStat) ?? Number.MAX_SAFE_INTEGER
      const rightPriority = effectPriorityIndex.get(rightStat) ?? Number.MAX_SAFE_INTEGER

      if (leftPriority !== rightPriority) {
        return leftPriority - rightPriority
      }

      const magnitudeDifference = Math.abs(rightValue) - Math.abs(leftValue)
      if (magnitudeDifference !== 0) {
        return magnitudeDifference
      }

      return leftStat.localeCompare(rightStat)
    })
    .map(([stat, value]) => formatEffectDelta(value, stat))

  return effects.length > 0 ? effects.join(", ") : "No direct stat changes"
}

export default function BuffPriorityEditor() {
  const [buffs, setBuffs] = useState<string[]>([])
  const [buffDescriptions, setBuffDescriptions] = useState<Record<string, string>>({})
  const [isHydrated, setIsHydrated] = useState(false)
  const sensors = useSensors(useSensor(PointerSensor))

  useEffect(() => {
    const syncBuffOverview = () => {
      const snapshot = readBuildSnapshot(localStorage)
      const stages = computeBuildStatStages(snapshot)
      const descriptions = snapshot.selectedBuffs.reduce<Record<string, string>>((result, buffName) => {
        result[buffName] = getBuffStatsDescription(
          buffName,
          stages.StatsBuffReady,
          snapshot.selectedBuffStacks,
          snapshot.selectedBuffs,
        )
        return result
      }, {})

      setBuffs(snapshot.selectedBuffs)
      setBuffDescriptions(descriptions)
    }

    syncBuffOverview()
    window.addEventListener(BUILD_SNAPSHOT_UPDATED_EVENT, syncBuffOverview)

    return () => {
      window.removeEventListener(BUILD_SNAPSHOT_UPDATED_EVENT, syncBuffOverview)
    }
  }, [])

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  const handleReorder = (from: number, to: number) => {
    const reordered = arrayMove(buffs, from, to)
    setBuffs(reordered)
    localStorage.setItem(BUFF_SELECTION_STORAGE_KEY, JSON.stringify(reordered))
    dispatchBuildSnapshotUpdated()
  }

  if (!isHydrated) return <div className="p-4">Loading...</div>

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={({ active, over }) => {
        if (!over || active.id === over.id) return
        const oldIndex = buffs.indexOf(active.id as string)
        const newIndex = buffs.indexOf(over.id as string)
        handleReorder(oldIndex, newIndex)
      }}
    >
      <div className="space-y-2">
        <div
          className="grid rounded border border-slate-700/80 bg-slate-900/80 text-xs font-semibold uppercase tracking-[0.14em] text-slate-300"
          style={{ gridTemplateColumns: "minmax(220px, 320px) minmax(280px, 1fr) minmax(320px, 1.2fr)" }}
        >
          {["Name", "Stats", "Description"].map((label) => (
            <span key={label} className="px-2 py-2 border-r border-slate-700 last:border-r-0 box-border">
              {label}
            </span>
          ))}
        </div>

        <SortableContext items={buffs} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {buffs.map((buff) => (
              <SortableItem
                key={buff}
                skillName={buff}
                statsText={buffDescriptions[buff] ?? "No direct stat changes"}
                description={skill_data[buff]?.description ?? ""}
              />
            ))}
          </div>
        </SortableContext>
      </div>
    </DndContext>
  )
}
