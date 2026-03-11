"use client"

import { useEffect, useState } from "react"
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  DUNGEON_UNLOCKS_STORAGE_KEY,
  dungeonUnlockTooltips,
  dungeonUnlockTags,
  isDungeonUnlockTag,
  type DungeonUnlockTag,
} from "../data/dungeon_unlocks"
import {
  heroPointGainsByRace,
  heroPointStats,
  heroPointStatsByGroup,
  type HeroPointStat,
} from "../data/heropoint_data"
import { dispatchBuildSnapshotUpdated } from "../lib/buildEvents"
import { calculateHeroPointAvailability } from "../lib/heroPoints"
import {
  createDefaultManualLevelRange,
  getManualRangeMaxTotalLevel,
  manualRangeClasses,
  normalizeManualLevelRanges,
  parseManualLevelTranscript,
  type ManualLevelRange,
  type ManualRangeClass,
} from "../lib/manualLevelRanges"
import { skill_data } from "../data/skill_data"
import { talent_data } from "../data/talent_data"
import race_data, { race_data_by_tag, type RaceTag } from "../data/race_data"

const STORAGE_KEYS = {
  levels: "SelectedLevels",
  statPoints: "SelectedStatPoints",
  training: "SelectedTraining",
  heroPoints: "SelectedHeroPoints",
  savedLevelOrder: "SelectedLevelOrder",
  manualLevelRanges: "SelectedManualLevelRanges",
  manualLevelRangesCollapsed: "SelectedManualLevelRangesCollapsed",
  dungeonUnlocks: DUNGEON_UNLOCKS_STORAGE_KEY,
  race: "SelectedRace",
}

const DEFAULT_RACE: RaceTag = race_data[0].tag
const isRaceTag = (value: string): value is RaceTag => value in race_data_by_tag
const TRAINING_GOLD_PER_POINT = 15

function parseStoredStringArray(raw: string | null): string[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === "string") : []
  } catch {
    return []
  }
}

function parseStoredBoolean(raw: string | null, fallback = false): boolean {
  if (!raw) return fallback

  try {
    return JSON.parse(raw) === true
  } catch {
    return fallback
  }
}

function parseStoredJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback

  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function normalizeStoredClassOrder(raw: string | null): Cls[] {
  const parsed = parseStoredJson<string[]>(raw, [])
  const seen = new Set<Cls>()
  const ordered = parsed.filter((value): value is Cls => manualRangeClasses.includes(value as Cls))
    .filter((value) => {
      if (seen.has(value)) {
        return false
      }

      seen.add(value)
      return true
    })

  return ordered.length === manualRangeClasses.length ? ordered : [...manualRangeClasses]
}

function getXpToNextLevel(level: number): number {
  const lvl = Math.max(0, Math.floor(level))

  if (lvl <= 120) {
    return 60 + (4 * lvl) + (500 * Math.floor(lvl / 20))
  }

  if (lvl <= 259) {
    const extraAfter140 = lvl >= 140 ? 1000 * (Math.floor((lvl - 140) / 20) + 1) : 0
    return 6544 + (4 * (lvl - 121)) + extraAfter140
  }

  if (lvl <= 340) {
    return 21150 + (6 * (lvl - 260)) + (1500 * Math.floor((lvl - 260) / 20))
  }

  if (lvl <= 359) {
    return 41454 + (9 * (lvl - 341))
  }

  return 43875 + (9 * (lvl - 360)) + (2250 * Math.floor((lvl - 360) / 20))
}

function cumulativeLevelExpCost(levelCount: number): number {
  const levels = Math.max(0, Math.floor(levelCount))
  let totalExp = 0
  for (let lvl = 0; lvl < levels; lvl++) {
    totalExp += getXpToNextLevel(lvl)
  }
  return totalExp
}

function formatWhole(value: number): string {
  return Math.max(0, Math.round(value)).toLocaleString()
}

type ManualRangeImportNotice = {
  tone: "success" | "warning" | "error"
  lines: string[]
}

type Cls = ManualRangeClass
type LevelsByClass = Record<Cls, number>

const classKeys: Cls[] = [...manualRangeClasses]
const classLabel: Record<Cls, string> = { tank: "Tank", warrior: "Warrior", caster: "Caster", healer: "Healer" }
const classCellBg: Record<Cls, string> = {
  tank: "bg-emerald-900/45",
  warrior: "bg-rose-900/45",
  caster: "bg-sky-900/40",
  healer: "bg-fuchsia-900/40",
}

function createEmptyLevelsByClass(): LevelsByClass {
  return { tank: 0, warrior: 0, caster: 0, healer: 0 }
}

function getDefaultLevelClassSequence(levels: LevelsByClass, classOrder: readonly Cls[]): Cls[] {
  const sequence: Cls[] = []

  for (const className of classOrder) {
    const classLevels = Math.max(0, Math.floor(levels[className] ?? 0))
    for (let i = 0; i < classLevels; i++) {
      sequence.push(className)
    }
  }

  return sequence
}

function getManualRangeOverride(ranges: readonly ManualLevelRange[], totalLevel: number): ManualLevelRange | null {
  for (let i = ranges.length - 1; i >= 0; i--) {
    const range = ranges[i]
    if (totalLevel >= range.startLevel && totalLevel <= range.endLevel) {
      return range
    }
  }

  return null
}

function getSyncedLevelsFromManualRanges(
  ranges: readonly ManualLevelRange[],
  currentLevels: LevelsByClass,
  classOrder: readonly Cls[],
): LevelsByClass {
  const maxTotalLevel = getManualRangeMaxTotalLevel(ranges)
  const defaultSequence = getDefaultLevelClassSequence(currentLevels, classOrder)
  const syncedLevels = createEmptyLevelsByClass()
  let lastResolvedClass: Cls = defaultSequence[0] ?? classOrder[0] ?? "healer"

  for (let totalLevel = 1; totalLevel <= maxTotalLevel; totalLevel++) {
    const override = getManualRangeOverride(ranges, totalLevel)
    const resolvedClass = override?.className ?? defaultSequence[totalLevel - 1] ?? lastResolvedClass

    syncedLevels[resolvedClass] += 1
    lastResolvedClass = resolvedClass
  }

  return syncedLevels
}

type LevelRequirementRowProps = {
  classNameKey: Cls
  levels: LevelsByClass
  requiredLevelsByClass: LevelsByClass
  classLevelDeficit: LevelsByClass
  onLevelChange: (className: Cls, value: number) => void
}

function LevelRequirementRow({
  classNameKey,
  levels,
  requiredLevelsByClass,
  classLevelDeficit,
  onLevelChange,
}: LevelRequirementRowProps) {
  const {
    attributes,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: classNameKey })

  return (
    <tr
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.7 : 1,
      }}
      className={isDragging ? "bg-slate-900/85" : ""}
    >
      <td className={`border px-2 py-1 font-semibold ${classCellBg[classNameKey]}`}>
        <div className="flex items-center gap-2">
          <button
            ref={setActivatorNodeRef}
            type="button"
            {...attributes}
            {...listeners}
            className="rounded border border-slate-500 px-1 py-0.5 text-[10px] text-slate-200 cursor-grab active:cursor-grabbing"
            title={`Drag to reorder ${classLabel[classNameKey]}`}
            aria-label={`Drag to reorder ${classLabel[classNameKey]}`}
          >
            ::
          </button>
          <span>{classLabel[classNameKey]}</span>
        </div>
      </td>
      <td className="border px-2 py-1">
        <input
          type="number"
          min={0}
          value={levels[classNameKey]}
          onChange={(event) => onLevelChange(classNameKey, Number(event.target.value) || 0)}
          className="w-20 border bg-slate-950 px-1 text-center"
        />
      </td>
      <td className="border px-2 py-1">{requiredLevelsByClass[classNameKey]}</td>
      <td className="border px-2 py-1">{classLevelDeficit[classNameKey]}</td>
    </tr>
  )
}

export default function LevelsPage() {
  const [levels, setLevels] = useState<LevelsByClass>(createEmptyLevelsByClass())
  const [statPoints, setStatPoints] = useState({ ATK: 0, DEF: 0, MATK: 0, HEAL: 0 })
  const [training, setTraining] = useState({ ATK: 0, DEF: 0, MATK: 0, HEAL: 0 })
  const [heroPoints, setHeroPoints] = useState<Record<string, number>>({})
  const [manualLevelRanges, setManualLevelRanges] = useState<ManualLevelRange[]>([])
  const [manualRangesCollapsed, setManualRangesCollapsed] = useState(false)
  const [manualRangeImportNotice, setManualRangeImportNotice] = useState<ManualRangeImportNotice | null>(null)
  const [selectedDungeonUnlocks, setSelectedDungeonUnlocks] = useState<DungeonUnlockTag[]>([])
  const [selectedTalents, setSelectedTalents] = useState<string[]>([])
  const [selectedBuffs, setSelectedBuffs] = useState<string[]>([])
  const [classOrder, setClassOrder] = useState<Cls[]>([...manualRangeClasses])
  const [selectedRace, setSelectedRace] = useState<RaceTag>(DEFAULT_RACE)
  const [loaded, setLoaded] = useState(false)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  useEffect(() => {
    const storedLevels = localStorage.getItem(STORAGE_KEYS.levels)
    const storedStatPoints = localStorage.getItem(STORAGE_KEYS.statPoints)
    const storedTraining = localStorage.getItem(STORAGE_KEYS.training)
    const storedHeroPoints = localStorage.getItem(STORAGE_KEYS.heroPoints)
    const storedLevelOrder = localStorage.getItem(STORAGE_KEYS.savedLevelOrder)
    const storedManualLevelRanges = localStorage.getItem(STORAGE_KEYS.manualLevelRanges)
    const storedManualLevelRangesCollapsed = localStorage.getItem(STORAGE_KEYS.manualLevelRangesCollapsed)
    const storedDungeonUnlocks = localStorage.getItem(STORAGE_KEYS.dungeonUnlocks)
    const storedRace = localStorage.getItem(STORAGE_KEYS.race)
    const storedSelectedTalents = localStorage.getItem("selectedTalents")
    const storedSelectedBuffs = localStorage.getItem("selectedBuffs")

    setLevels(parseStoredJson(storedLevels, createEmptyLevelsByClass()))
    setStatPoints(parseStoredJson(storedStatPoints, { ATK: 0, DEF: 0, MATK: 0, HEAL: 0 }))
    setTraining(parseStoredJson(storedTraining, { ATK: 0, DEF: 0, MATK: 0, HEAL: 0 }))
    setHeroPoints(parseStoredJson(storedHeroPoints, {}))
    setClassOrder(normalizeStoredClassOrder(storedLevelOrder))
    setManualLevelRanges(normalizeManualLevelRanges(parseStoredJson(storedManualLevelRanges, [])))
    setManualRangesCollapsed(parseStoredBoolean(storedManualLevelRangesCollapsed))
    setSelectedDungeonUnlocks(parseStoredStringArray(storedDungeonUnlocks).filter(isDungeonUnlockTag))
    if (storedRace && isRaceTag(storedRace)) setSelectedRace(storedRace)
    setSelectedTalents(parseStoredStringArray(storedSelectedTalents))
    setSelectedBuffs(parseStoredStringArray(storedSelectedBuffs))

    setLoaded(true)
  }, [])

  useEffect(() => {
    if (!loaded) return
    localStorage.setItem(STORAGE_KEYS.levels, JSON.stringify(levels))
    dispatchBuildSnapshotUpdated()
  }, [levels, loaded])

  useEffect(() => {
    if (!loaded) return
    localStorage.setItem(STORAGE_KEYS.statPoints, JSON.stringify(statPoints))
    dispatchBuildSnapshotUpdated()
  }, [statPoints, loaded])

  useEffect(() => {
    if (!loaded) return
    localStorage.setItem(STORAGE_KEYS.training, JSON.stringify(training))
    dispatchBuildSnapshotUpdated()
  }, [training, loaded])

  useEffect(() => {
    if (!loaded) return
    localStorage.setItem(STORAGE_KEYS.heroPoints, JSON.stringify(heroPoints))
    dispatchBuildSnapshotUpdated()
  }, [heroPoints, loaded])

  useEffect(() => {
    if (!loaded) return
    localStorage.setItem(STORAGE_KEYS.savedLevelOrder, JSON.stringify(classOrder))
    dispatchBuildSnapshotUpdated()
  }, [classOrder, loaded])

  useEffect(() => {
    if (!loaded) return
    localStorage.setItem(STORAGE_KEYS.manualLevelRanges, JSON.stringify(manualLevelRanges))
    dispatchBuildSnapshotUpdated()
  }, [manualLevelRanges, loaded])

  useEffect(() => {
    if (!loaded) return
    localStorage.setItem(STORAGE_KEYS.manualLevelRangesCollapsed, JSON.stringify(manualRangesCollapsed))
  }, [manualRangesCollapsed, loaded])

  useEffect(() => {
    if (!loaded) return
    localStorage.setItem(STORAGE_KEYS.dungeonUnlocks, JSON.stringify(selectedDungeonUnlocks))
    dispatchBuildSnapshotUpdated()
  }, [selectedDungeonUnlocks, loaded])

  useEffect(() => {
    if (!loaded) return
    localStorage.setItem(STORAGE_KEYS.race, selectedRace)
    dispatchBuildSnapshotUpdated()
  }, [selectedRace, loaded])

  if (!loaded) {
    return <div className="p-4">Loading...</div>
  }

  const totalLevels = Object.values(levels).reduce((a, b) => a + b, 0)
  const maxManualRangeLevel = getManualRangeMaxTotalLevel(manualLevelRanges)
  const needsManualLevelSync = maxManualRangeLevel > totalLevels
  const availableSkillPoints = Math.ceil(totalLevels / 2)
  const availableTalentPoints = Math.floor(totalLevels / 2)
  const totalStatPoints = totalLevels
  const usedStatPoints = Object.values(statPoints).reduce((a, b) => a + b, 0)
  const remainingStatPoints = totalStatPoints - usedStatPoints
  const totalTraining = Object.values(training).reduce((a, b) => a + b, 0)
  const { availablePoints: availableHeroPoints } = calculateHeroPointAvailability(totalLevels, selectedRace, selectedTalents)

  const totalHeroPoints = heroPointStats.reduce((sum, { id, cost }) => {
    return sum + (heroPoints[id] ?? 0) * cost
  }, 0)

  const requiredLevelsByClass: LevelsByClass = { tank: 0, warrior: 0, caster: 0, healer: 0 }
  let requiredTotalLevel = 0
  let totalExpForTalents = 0
  let totalExpForSkills = 0
  let totalGoldForTalents = 0
  let totalGoldForSkills = 0
  let totalTalentPointsUsed = 0
  let totalSkillPointsUsed = 0

  for (const talentName of selectedTalents) {
    const talent = talent_data[talentName]
    if (!talent) continue

    requiredTotalLevel = Math.max(requiredTotalLevel, talent.total_level ?? 0)
    requiredLevelsByClass.tank = Math.max(requiredLevelsByClass.tank, talent.class_levels.tank_levels ?? 0)
    requiredLevelsByClass.warrior = Math.max(requiredLevelsByClass.warrior, talent.class_levels.warrior_levels ?? 0)
    requiredLevelsByClass.caster = Math.max(requiredLevelsByClass.caster, talent.class_levels.caster_levels ?? 0)
    requiredLevelsByClass.healer = Math.max(requiredLevelsByClass.healer, talent.class_levels.healer_levels ?? 0)

    totalExpForTalents += talent.exp ?? 0
    totalGoldForTalents += talent.gold ?? 0
    totalTalentPointsUsed += 1
  }

  for (const buffName of selectedBuffs) {
    const skill = skill_data[buffName]
    if (!skill) continue

    requiredLevelsByClass.tank = Math.max(requiredLevelsByClass.tank, skill.class_levels.tank_levels ?? 0)
    requiredLevelsByClass.warrior = Math.max(requiredLevelsByClass.warrior, skill.class_levels.warrior_levels ?? 0)
    requiredLevelsByClass.caster = Math.max(requiredLevelsByClass.caster, skill.class_levels.caster_levels ?? 0)
    requiredLevelsByClass.healer = Math.max(requiredLevelsByClass.healer, skill.class_levels.healer_levels ?? 0)

    totalExpForSkills += skill.exp ?? 0
    totalGoldForSkills += skill.gold ?? 0
    totalSkillPointsUsed += skill.sp ?? 0
  }

  const classLevelDeficit: LevelsByClass = {
    tank: Math.max(0, requiredLevelsByClass.tank - levels.tank),
    warrior: Math.max(0, requiredLevelsByClass.warrior - levels.warrior),
    caster: Math.max(0, requiredLevelsByClass.caster - levels.caster),
    healer: Math.max(0, requiredLevelsByClass.healer - levels.healer),
  }

  const classLevelsNeeded = classKeys.reduce((sum, className) => sum + classLevelDeficit[className], 0)
  const requiredLevelForTalentPoints = totalTalentPointsUsed * 2
  const totalSkillPointsRequired = totalSkillPointsUsed + totalTraining
  const requiredLevelForSkillPoints = Math.max(0, (totalSkillPointsRequired * 2) - 1)
  const pointBasedRequiredLevel = Math.max(requiredLevelForTalentPoints, requiredLevelForSkillPoints)
  const totalRequiredLevel = Math.max(requiredTotalLevel, pointBasedRequiredLevel)
  const totalLevelDeficit = Math.max(0, totalRequiredLevel - totalLevels)
  const levelsNeeded = Math.max(totalLevelDeficit, classLevelsNeeded)
  const targetTotalLevels = totalLevels + levelsNeeded
  const requiredIsekaiLevel = Math.max(0, Math.ceil((targetTotalLevels - 110) / 5))

  const skillPointDeficit = Math.max(0, totalSkillPointsRequired - availableSkillPoints)
  const talentPointDeficit = Math.max(0, totalTalentPointsUsed - availableTalentPoints)

  const totalExpForLevels = cumulativeLevelExpCost(targetTotalLevels)
  const totalGoldForTraining = totalTraining * TRAINING_GOLD_PER_POINT
  const totalExp = totalExpForTalents + totalExpForSkills + totalExpForLevels
  const totalGold = totalGoldForTalents + totalGoldForSkills + totalGoldForTraining
  const remainingHeroPoints = availableHeroPoints - totalHeroPoints

  const costClass = (cost: number) =>
    cost === 1 ? "bg-emerald-900/45" :
    cost === 2 ? "bg-amber-800/50" :
    cost === 3 ? "bg-rose-800/55" : ""
  const selectedDungeonUnlockSet = new Set(selectedDungeonUnlocks)

  const selectedRaceData = race_data_by_tag[selectedRace]
  const selectedRaceHeroPointGains = heroPointGainsByRace[selectedRace]

  const renderHeroPointInput = ({ id, cost }: HeroPointStat) => (
    <div key={id} className={`border ${costClass(cost)}`}>
      <label className="block font-mono text-xs text-slate-300 px-1">{id}</label>
      <div className="text-[11px] text-slate-400 text-center">Gain: {selectedRaceHeroPointGains[id]}</div>
      <input
        type="number"
        value={heroPoints[id] ?? 0}
        onChange={(e) => setHeroPoints({ ...heroPoints, [id]: +e.target.value })}
        className="border px-1 text-center w-full"
      />
    </div>
  )

  const addManualRange = () => {
    setManualLevelRanges((prev) => [...prev, createDefaultManualLevelRange()])
  }

  const updateManualRange = <K extends keyof ManualLevelRange>(
    index: number,
    key: K,
    value: ManualLevelRange[K],
  ) => {
    setManualLevelRanges((prev) =>
      prev.map((range, i) => {
        if (i !== index) return range
        return { ...range, [key]: value }
      })
    )
  }

  const removeManualRange = (index: number) => {
    setManualLevelRanges((prev) => prev.filter((_, i) => i !== index))
  }

  const importManualRangesFromText = (rawTranscript: string) => {
    const transcript = rawTranscript.trim()

    if (transcript.length === 0) {
      setManualRangeImportNotice({
        tone: "error",
        lines: ["Paste a Guild Card and one or more `xlevelup` results into the import box."],
      })
      return
    }

    const { ranges, warnings } = parseManualLevelTranscript(
      transcript,
      getManualRangeMaxTotalLevel(manualLevelRanges),
    )

    if (ranges.length === 0) {
      setManualRangeImportNotice({
        tone: "error",
        lines: warnings.length > 0 ? warnings : ["The pasted text did not produce any ranges."],
      })
      return
    }

    setManualLevelRanges((prev) => [...prev, ...ranges])
    setManualRangeImportNotice({
      tone: warnings.length > 0 ? "warning" : "success",
      lines: [`Imported ${ranges.length} manual range${ranges.length === 1 ? "" : "s"}.`, ...warnings],
    })
  }

  const toggleDungeonUnlock = (tag: DungeonUnlockTag) => {
    setSelectedDungeonUnlocks((prev) =>
      prev.includes(tag) ? prev.filter((entry) => entry !== tag) : [...prev, tag]
    )
  }

  const handleLevelChange = (className: Cls, value: number) => {
    setLevels((prev) => ({
      ...prev,
      [className]: Math.max(0, Math.floor(value)),
    }))
  }

  const handleClassOrderDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) {
      return
    }

    setClassOrder((prev) => {
      const oldIndex = prev.indexOf(active.id as Cls)
      const newIndex = prev.indexOf(over.id as Cls)

      if (oldIndex < 0 || newIndex < 0) {
        return prev
      }

      return arrayMove(prev, oldIndex, newIndex)
    })
  }

  const syncLevelsToManualRanges = () => {
    const syncedLevels = getSyncedLevelsFromManualRanges(manualLevelRanges, levels, classOrder)
    setLevels(syncedLevels)
    setManualRangeImportNotice({
      tone: "success",
      lines: [`Synced chosen levels to ${getManualRangeMaxTotalLevel(manualLevelRanges)} total levels from manual ranges.`],
    })
  }

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-xl font-bold">Level Summary</h1>

      <h2 className="text-lg font-bold">Race</h2>
      <div className="max-w-3xl border p-3 space-y-2 bg-slate-900/60">
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <label htmlFor="race-select" className="font-semibold">Selected Race</label>
          <select
            id="race-select"
            value={selectedRace}
            onChange={(e) => {
              if (isRaceTag(e.target.value)) setSelectedRace(e.target.value)
            }}
            className="border px-2 py-1 bg-slate-900"
          >
            {race_data.map((race) => (
              <option key={race.tag} value={race.tag}>{race.name}</option>
            ))}
          </select>
          <span className="text-xs text-slate-300">Tag: {selectedRaceData.tag}</span>
        </div>
        <p className="text-sm text-slate-200">{selectedRaceData.description}</p>
      </div>

      <h2 className="text-lg font-bold">Dungeon Unlocks</h2>
      <div className="max-w-6xl border p-3 space-y-3 bg-slate-900/60">
        <div className="text-sm text-slate-300">
          Selected: {selectedDungeonUnlocks.length} / {dungeonUnlockTags.length}
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {dungeonUnlockTags.map((tag) => {
            const checked = selectedDungeonUnlockSet.has(tag)
            const tooltip = dungeonUnlockTooltips[tag]
            return (
              <label
                key={tag}
                title={tooltip}
                className={`flex cursor-pointer items-center gap-3 border px-3 py-2 transition ${
                  checked
                    ? "border-amber-700/70 bg-amber-900/30"
                    : "border-slate-700 bg-slate-900/40 hover:bg-slate-800/65"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleDungeonUnlock(tag)}
                  className="h-4 w-4"
                />
                <span className="font-mono text-sm">{tag}</span>
              </label>
            )
          })}
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-bold">Levels Required</h2>
        <p className="text-sm text-slate-300">
          Set chosen class levels directly in this table. Drag rows by the handle to reorder the class list.
          The calculator applies class levels in the same top-to-bottom order shown here.
        </p>
        <div className="overflow-x-auto">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleClassOrderDragEnd}>
            <table className="table-fixed border text-sm text-center">
              <thead className="bg-slate-800/85">
                <tr>
                  <th>Class</th>
                  <th>Chosen</th>
                  <th>Required</th>
                  <th>Needed</th>
                </tr>
              </thead>
              <SortableContext items={classOrder} strategy={verticalListSortingStrategy}>
                <tbody>
                  {classOrder.map((classKey) => (
                    <LevelRequirementRow
                      key={classKey}
                      classNameKey={classKey}
                      levels={levels}
                      requiredLevelsByClass={requiredLevelsByClass}
                      classLevelDeficit={classLevelDeficit}
                      onLevelChange={handleLevelChange}
                    />
                  ))}
                </tbody>
              </SortableContext>
              <tbody>
                <tr>
                  <th colSpan={2} className="border px-2 py-1">Total Levels</th>
                  <th className="border px-2 py-1">Levels Needed</th>
                  <th className="border px-2 py-1">Isekai Level Required</th>
                </tr>
                <tr>
                  <td colSpan={2} className="border px-2 py-1">{totalLevels}</td>
                  <td className="border px-2 py-1">{levelsNeeded}</td>
                  <td className="border px-2 py-1">{requiredIsekaiLevel}</td>
                </tr>
              </tbody>
            </table>
          </DndContext>
        </div>
      </div>

      <section className="overflow-hidden rounded-[30px] border border-slate-800/80 bg-slate-950/35 shadow-[0_18px_60px_rgba(2,6,23,0.22)]">
        <div className={`flex flex-wrap items-center justify-between gap-3 ${manualRangesCollapsed ? "px-4 py-2.5 sm:px-5" : "px-5 py-4 sm:px-6"}`}>
          <div className="space-y-1">
            <div className="text-xl font-semibold text-slate-50">Manual Levelup Ranges</div>
            {!manualRangesCollapsed ? (
              <div className="text-sm text-slate-400">
                Import level-up transcripts and manage manual total-level stat override ranges.
              </div>
            ) : null}
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-full border border-slate-700/80 bg-slate-950/70 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">
              {manualLevelRanges.length} Saved
            </div>
            <button
              type="button"
              onClick={() => setManualRangesCollapsed((prev) => !prev)}
              aria-expanded={!manualRangesCollapsed}
              aria-controls="manual-levelup-ranges-panel"
              className="rounded-full border border-slate-700/80 bg-slate-900/80 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-200 transition hover:border-sky-300/40 hover:text-sky-100"
            >
              {manualRangesCollapsed ? "Show" : "Hide"}
            </button>
          </div>
        </div>

        {!manualRangesCollapsed ? (
          <div id="manual-levelup-ranges-panel" className="space-y-3 border-t border-slate-800/70 p-4 sm:p-6">
            <div className="max-w-5xl border p-3 space-y-3 bg-slate-900/60">
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-100">Paste level-up transcript</span>
                <input
                  type="text"
                  placeholder="Paste level-up transcript here"
                  onPaste={(e) => {
                    e.preventDefault()
                    const text = e.clipboardData.getData("text")
                    importManualRangesFromText(text)
                    e.currentTarget.value = ""
                  }}
                  className="w-full border bg-slate-950 px-1 py-1 text-sm text-slate-100"
                />
              </label>
              <p className="text-xs text-slate-400">
                Paste a `xlevelup` transcript directly into the box to import it, including class scaling lines.
              </p>
              {manualRangeImportNotice ? (
                <div
                  className={`space-y-1 border px-3 py-2 text-sm ${
                    manualRangeImportNotice.tone === "error"
                      ? "border-rose-700/70 bg-rose-950/35 text-rose-100"
                      : manualRangeImportNotice.tone === "warning"
                        ? "border-amber-700/70 bg-amber-950/30 text-amber-100"
                        : "border-emerald-700/70 bg-emerald-950/25 text-emerald-100"
                  }`}
                >
                  {manualRangeImportNotice.lines.map((line, index) => (
                    <div key={`${line}-${index}`}>{line}</div>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="border px-3 py-1 bg-slate-800/85 hover:bg-slate-700/90"
                onClick={addManualRange}
              >
                Add Range
              </button>
              {needsManualLevelSync ? (
                <button
                  type="button"
                  className="border border-amber-300/70 bg-amber-400 px-3 py-1 font-semibold text-slate-950 hover:bg-amber-300"
                  onClick={syncLevelsToManualRanges}
                >
                  Sync levels
                </button>
              ) : null}
            </div>
            <div className="overflow-x-auto">
              <table className="table-fixed border text-xs md:text-sm text-center">
                <thead className="bg-slate-800/85">
                  <tr>
                    <th className="border px-2 py-1">Class</th>
                    <th className="border px-2 py-1">Start</th>
                    <th className="border px-2 py-1">End</th>
                    <th className="border px-2 py-1">HP</th>
                    <th className="border px-2 py-1">ATK</th>
                    <th className="border px-2 py-1">DEF</th>
                    <th className="border px-2 py-1">MATK</th>
                    <th className="border px-2 py-1">HEAL</th>
                    <th className="border px-2 py-1">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {manualLevelRanges.map((range, i) => (
                    <tr key={`${range.className}-${i}`}>
                      <td className="border px-1 py-1">
                        <select
                          value={range.className}
                          onChange={(e) => updateManualRange(i, "className", e.target.value as Cls)}
                          className="w-full border"
                        >
                          <option value="tank">tank</option>
                          <option value="warrior">warrior</option>
                          <option value="caster">caster</option>
                          <option value="healer">healer</option>
                        </select>
                      </td>
                      <td className="border px-1 py-1">
                        <input
                          type="number"
                          min={1}
                          value={range.startLevel}
                          onChange={(e) => updateManualRange(i, "startLevel", Math.max(1, Number(e.target.value) || 1))}
                          className="w-16 text-center border"
                        />
                      </td>
                      <td className="border px-1 py-1">
                        <input
                          type="number"
                          min={1}
                          value={range.endLevel}
                          onChange={(e) => updateManualRange(i, "endLevel", Math.max(1, Number(e.target.value) || 1))}
                          className="w-16 text-center border"
                        />
                      </td>
                      <td className="border px-1 py-1">
                        <input
                          type="number"
                          value={range.hpGain}
                          onChange={(e) => updateManualRange(i, "hpGain", Number(e.target.value) || 0)}
                          className="w-16 text-center border"
                        />
                      </td>
                      <td className="border px-1 py-1">
                        <input
                          type="number"
                          value={range.atkGain}
                          onChange={(e) => updateManualRange(i, "atkGain", Number(e.target.value) || 0)}
                          className="w-16 text-center border"
                        />
                      </td>
                      <td className="border px-1 py-1">
                        <input
                          type="number"
                          value={range.defGain}
                          onChange={(e) => updateManualRange(i, "defGain", Number(e.target.value) || 0)}
                          className="w-16 text-center border"
                        />
                      </td>
                      <td className="border px-1 py-1">
                        <input
                          type="number"
                          value={range.matkGain}
                          onChange={(e) => updateManualRange(i, "matkGain", Number(e.target.value) || 0)}
                          className="w-16 text-center border"
                        />
                      </td>
                      <td className="border px-1 py-1">
                        <input
                          type="number"
                          value={range.healGain}
                          onChange={(e) => updateManualRange(i, "healGain", Number(e.target.value) || 0)}
                          className="w-16 text-center border"
                        />
                      </td>
                      <td className="border px-1 py-1">
                        <button
                          type="button"
                          className="border px-2 py-1 bg-rose-900/35 hover:bg-rose-900/45"
                          onClick={() => removeManualRange(i)}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-slate-400">
              Start and end always refer to total level.
              Example: `10-14` means the five overall levels that ended at total level 14, even if those levels were split across different classes.
            </p>
          </div>
        ) : null}
      </section>

      <table className="table-fixed border text-sm text-center">
        <thead className="bg-slate-800/85">
          <tr>
            <th>Point Type</th>
            <th>Used</th>
            <th>Available</th>
            <th>Needed</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border px-2 py-1">Skill Points</td>
            <td className="border px-2 py-1">{totalSkillPointsRequired}</td>
            <td className="border px-2 py-1">{availableSkillPoints}</td>
            <td className="border px-2 py-1">{skillPointDeficit}</td>
          </tr>
          <tr>
            <td className="border px-2 py-1">Talent Points</td>
            <td className="border px-2 py-1">{totalTalentPointsUsed}</td>
            <td className="border px-2 py-1">{availableTalentPoints}</td>
            <td className="border px-2 py-1">{talentPointDeficit}</td>
          </tr>
        </tbody>
      </table>

      <h2 className="text-lg font-bold">EXP / Gold Summary</h2>
      <table className="table-fixed border text-sm text-left">
        <tbody>
          <tr><td className="border px-2">Total EXP for Talents</td><td className="border px-2">{formatWhole(totalExpForTalents)}</td></tr>
          <tr><td className="border px-2">Total EXP for Skills</td><td className="border px-2">{formatWhole(totalExpForSkills)}</td></tr>
          <tr><td className="border px-2">Total EXP for Levels</td><td className="border px-2">{formatWhole(totalExpForLevels)}</td></tr>
          <tr><td className="border px-2">Total EXP</td><td className="border px-2">{formatWhole(totalExp)}</td></tr>
          <tr><td className="border px-2">Total Gold</td><td className="border px-2">{formatWhole(totalGold)}</td></tr>
        </tbody>
      </table>

      <h2 className="text-lg font-bold">Stat Points</h2>
      <table className="text-center text-sm border">
        <thead>
          <tr>
            <th colSpan={2} className="bg-amber-900/40 px-2 py-1 border">Chosen</th>
            <th colSpan={2} className="bg-amber-900/40 px-2 py-1 border">Remaining</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan={2} className="border px-2 py-1">{usedStatPoints}</td>
            <td colSpan={2} className="border px-2 py-1">{remainingStatPoints}</td>
          </tr>
        </tbody>
        <thead>
          <tr>
            <th className="bg-emerald-800/45 border">T</th>
            <th className="bg-rose-800/45 border">W</th>
            <th className="bg-sky-800/45 border">C</th>
            <th className="bg-fuchsia-800/45 border">H</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            {(["ATK", "DEF", "MATK", "HEAL"] as const).map((k) => (
              <td key={k} className="border">
                <input
                  type="number"
                  value={statPoints[k]}
                  onChange={(e) => setStatPoints({ ...statPoints, [k]: +e.target.value })}
                  className="w-16 text-center"
                />
              </td>
            ))}
          </tr>
        </tbody>
      </table>

      <h2 className="text-lg font-bold">Training</h2>
      <table className="text-center text-sm border">
        <thead>
          <tr>
            <th colSpan={4} className="bg-slate-800/85 border">Total Chosen: {totalTraining}</th>
          </tr>
          <tr>
            <th className="bg-emerald-800/45 border">T</th>
            <th className="bg-rose-800/45 border">W</th>
            <th className="bg-sky-800/45 border">C</th>
            <th className="bg-fuchsia-800/45 border">H</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            {(["DEF", "ATK", "MATK", "HEAL"] as const).map((k) => (
              <td key={k} className="border">
                <input
                  type="number"
                  value={training[k]}
                  onChange={(e) => setTraining({ ...training, [k]: +e.target.value })}
                  className="w-16 text-center"
                />
              </td>
            ))}
          </tr>
        </tbody>
      </table>

      <h2 className="text-lg font-bold">Hero Points</h2>

      <table className="text-center text-sm border mb-2">
        <thead>
          <tr>
            <th className="bg-amber-900/40 border">Chosen</th>
            <th className="bg-amber-900/40 border">Available</th>
            <th className="bg-amber-900/40 border">Remaining</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border px-2 py-1">{totalHeroPoints}</td>
            <td className="border px-2 py-1">{availableHeroPoints}</td>
            <td className="border px-2 py-1">{remainingHeroPoints}</td>
          </tr>
        </tbody>
      </table>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div>
          <h3 className="bg-emerald-800/55 text-center font-bold">Main Stats</h3>
          {heroPointStatsByGroup.main.map(renderHeroPointInput)}
        </div>

        <div>
          <h3 className="bg-sky-800/45 text-center font-bold">Elemental Damage</h3>
          {heroPointStatsByGroup.damage.map(renderHeroPointInput)}
        </div>

        <div>
          <h3 className="bg-emerald-800/55 text-center font-bold">Elemental Resists</h3>
          {heroPointStatsByGroup.resist.map(renderHeroPointInput)}
        </div>

        <div>
          <h3 className="bg-cyan-900/40 text-center font-bold">Ele Pen</h3>
          {heroPointStatsByGroup.penetration.map(renderHeroPointInput)}
        </div>
      </div>

      <div className="w-40 border mt-4 text-sm">
        <div className="bg-slate-700/90 text-center font-bold">Key</div>
        <div className="bg-emerald-900/45 px-2">1 point</div>
        <div className="bg-amber-800/50 px-2">2 points</div>
        <div className="bg-rose-800/55 px-2">3 points</div>
      </div>
    </div>
  )
}
