"use client"

import { useEffect, useState, type ReactNode } from "react"
import { race_data_by_tag } from "@/app/data/race_data"
import { skill_data } from "@/app/data/skill_data"
import stat_data from "@/app/data/stat_data"
import tarot_data from "@/app/data/tarot_data"
import {
  computeBuildStatStages,
  readBuildSnapshot,
  type BuildSnapshot,
  type BuildStatStages,
} from "@/app/lib/buildStats"
import {
  CHARACTER_SUMMARY_VIEW_EVENT,
  getDefaultCharacterSummaryViewState,
  readCharacterSummaryViewState,
  type CharacterSummaryViewChangeDetail,
  type CharacterSummaryViewState,
} from "@/app/lib/characterSummaryViewState"
import { BUILD_SNAPSHOT_UPDATED_EVENT } from "@/app/lib/buildEvents"

type ClassKey = "tank" | "warrior" | "caster" | "healer"

type SummaryProfile = {
  raceName: string
  rebirthLevel: number
}

type SummaryState = {
  profile: SummaryProfile
  snapshot: BuildSnapshot
  stages: BuildStatStages
  charcardStages: BuildStatStages
  dungeonMainStats: Record<string, number>
  displayBaseStats: Record<string, number>
  displayDungeonStats: Record<string, number>
  totalLevels: number
  raceName: string
  nextLevelExp: number
  availableSkillPoints: number
  usedSkillPoints: number
  remainingSkillPoints: number
  availableTalentPoints: number
  usedTalentPoints: number
  remainingTalentPoints: number
  activeEffects: ActiveEffect[]
}

type ActiveEffect = {
  id: string
  title: string
  sourceType: "skill" | "tarot"
  description: string
  deltas: EffectDelta[]
}

type EffectDelta = {
  stat: string
  delta: number
  label?: string
}

type EffectSourceData = {
  description: string
  conversions?: Array<{
    source: string
    ratio: number
    resulting_stat: string
  }>
  stack_conversions?: Array<{
    source: string
    ratio: number
    resulting_stat: string
  }>
  stats?: Record<string, number>
  stack_stats?: Record<string, number>
}

type TerminalMainRow = {
  label: string
  value: string
  modifier?: string
}

type TerminalDetailRow = {
  label: string
  value: string
}

type TypeBonusRow = {
  label: string
  dmg: string
  xDmg: string
  pen: string
  xPen: string
}

type ElementRow = {
  label: string
  dmg: string
  res: string
  pen: string
}

type FinalStatsColumn = {
  label: string
  key: string
  format?: "flat" | "percent"
  headerClassName?: string
}

type FinalStatsTypeRow = {
  label: string
  key: string
}

type FinalStatsSourceSection = {
  title: string
  subtitle?: string
  stats: Record<string, number>
}

const cardClass =
  "relative overflow-hidden rounded-[26px] border border-slate-700/70 bg-slate-900/72 shadow-[0_18px_80px_rgba(2,6,23,0.45)] backdrop-blur"

const IN_GAME_STATS_GROUP_STORAGE_KEY = "characterSummary:inGameStatsOpen"

const profileDefaults: SummaryProfile = {
  raceName: "Northern Human",
  rebirthLevel: 75,
}

const classKeys: ClassKey[] = ["tank", "warrior", "caster", "healer"]

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
  "Bow DMG%",
  "Blunt%",
  "Pierce%",
  "Slash%",
  "Fire%",
  "Lightning%",
  "Water%",
  "Earth%",
  "Wind%",
  "Toxic%",
  "Neg%",
  "Holy%",
] as const

const effectPriorityIndex = new Map<string, number>(effectPriority.map((stat, index) => [stat, index]))

const dungeonDisplayElements = [
  { key: "Fire", family: "Elemental" },
  { key: "Lightning", family: "Elemental" },
  { key: "Water", family: "Elemental" },
  { key: "Earth", family: "Elemental" },
  { key: "Wind", family: "Elemental" },
  { key: "Toxic", family: "Elemental" },
  { key: "Void", family: "Void" },
  { key: "Neg", family: "Divine" },
  { key: "Holy", family: "Divine" },
  { key: "Blunt", family: "Phys" },
  { key: "Pierce", family: "Phys" },
  { key: "Slash", family: "Phys" },
] as const

const finalStatsPrimaryColumns = [
  { label: "ATK", key: "ATK", headerClassName: "bg-rose-500/20 text-rose-100" },
  { label: "MATK", key: "MATK", headerClassName: "bg-emerald-500/20 text-emerald-100" },
  { label: "DEF", key: "DEF", headerClassName: "bg-sky-500/20 text-sky-100" },
  { label: "HEAL", key: "HEAL", headerClassName: "bg-fuchsia-500/20 text-fuchsia-100" },
  { label: "HP", key: "HP", headerClassName: "bg-emerald-500/20 text-emerald-100" },
  { label: "MP", key: "MP", headerClassName: "bg-sky-500/20 text-sky-100" },
  { label: "Focus", key: "Focus", headerClassName: "bg-amber-500/20 text-amber-100" },
  { label: "MP Regen", key: "MP Regen", headerClassName: "bg-sky-500/20 text-sky-100" },
  { label: "Focus Regen", key: "Focus Regen", headerClassName: "bg-amber-500/20 text-amber-100" },
] satisfies readonly FinalStatsColumn[]

const finalStatsBonusColumns = [
  { label: "Crit Chance%", key: "Crit Chance%", format: "percent" },
  { label: "Crit DMG%", key: "Crit DMG%", format: "percent" },
  { label: "Global DMG%", key: "Dmg%", format: "percent" },
  { label: "Heal Effect%", key: "Heal Effect%", format: "percent" },
  { label: "Damage Res%", key: "DMG Res%", format: "percent" },
  { label: "Global HP%", key: "HP%", format: "percent" },
  { label: "All Res%", key: "All Res%", format: "percent" },
  { label: "Threat%", key: "Threat%", format: "percent" },
] satisfies readonly FinalStatsColumn[]

const finalStatsClassColumns = [
  { label: "Armor Save", key: "Armor Save" },
  { label: "Armor Strike", key: "Armor Strike" },
  { label: "Overdrive%", key: "Overdrive%", format: "percent" },
] satisfies readonly FinalStatsColumn[]

const finalStatsMainModifierColumns = [
  { label: "POWER", key: "POWER" },
  { label: "ATK%", key: "ATK%", format: "percent" },
  { label: "DEF%", key: "DEF%", format: "percent" },
  { label: "MATK%", key: "MATK%", format: "percent" },
  { label: "HEAL%", key: "HEAL%", format: "percent" },
  { label: "MAIN%", key: "MAIN%", format: "percent" },
] satisfies readonly FinalStatsColumn[]

const finalStatsArtifactGlobalColumns = [
  { label: "Art ATK%", key: "Art_ATK%", format: "percent" },
  { label: "Art DEF%", key: "Art_DEF%", format: "percent" },
  { label: "Art MATK%", key: "Art_MATK%", format: "percent" },
  { label: "Art HEAL%", key: "Art_HEAL%", format: "percent" },
  { label: "Global ATK%", key: "Global ATK%", format: "percent" },
  { label: "Global DEF%", key: "Global DEF%", format: "percent" },
  { label: "Global MATK%", key: "Global MATK%", format: "percent" },
  { label: "Global HEAL%", key: "Global HEAL%", format: "percent" },
] satisfies readonly FinalStatsColumn[]

const finalStatsFamilyColumns = [
  { label: "All%", key: "All%", format: "percent" },
  { label: "All Pen%", key: "All Pen%", format: "percent" },
  { label: "Phys%", key: "Phys%", format: "percent" },
  { label: "Phys Pen%", key: "Phys Pen%", format: "percent" },
  { label: "Phys Res%", key: "Phys Res%", format: "percent" },
  { label: "Phys xDmg%", key: "Phys xDmg%", format: "percent" },
  { label: "Phys xPen%", key: "Phys xPen%", format: "percent" },
] satisfies readonly FinalStatsColumn[]

const finalStatsMagicFamilyColumns = [
  { label: "Elemental%", key: "Elemental%", format: "percent" },
  { label: "Elemental Pen%", key: "Elemental Pen%", format: "percent" },
  { label: "Elemental Res%", key: "Elemental Res%", format: "percent" },
  { label: "Elemental xDmg%", key: "Elemental xDmg%", format: "percent" },
  { label: "Elemental xPen%", key: "Elemental xPen%", format: "percent" },
  { label: "Divine%", key: "Divine%", format: "percent" },
  { label: "Divine Pen%", key: "Divine Pen%", format: "percent" },
  { label: "Divine Res%", key: "Divine Res%", format: "percent" },
  { label: "Divine xDmg%", key: "Divine xDmg%", format: "percent" },
  { label: "Divine xPen%", key: "Divine xPen%", format: "percent" },
] satisfies readonly FinalStatsColumn[]

const finalStatsSpecialFamilyColumns = [
  { label: "Magic%", key: "Magic%", format: "percent" },
  { label: "Magic xDmg%", key: "Magic xDmg%", format: "percent" },
  { label: "Magic xPen%", key: "Magic xPen%", format: "percent" },
  { label: "NonVoid Pen%", key: "NonVoid Pen%", format: "percent" },
  { label: "Ele !Water Res%", key: "Elemental_Except_Water Res%", format: "percent" },
] satisfies readonly FinalStatsColumn[]

const finalStatsResourceColumns = [
  { label: "Focus%", key: "Focus%", format: "percent" },
  { label: "MP%", key: "MP%", format: "percent" },
  { label: "Temp MP", key: "Temp MP" },
  { label: "Temp HP", key: "Temp HP" },
  { label: "HP Regen", key: "HP Regen" },
  { label: "HP Regen%", key: "HP Regen%", format: "percent" },
  { label: "Buff%", key: "Buff%", format: "percent" },
  { label: "EXP Bonus", key: "EXP Bonus" },
  { label: "Hero Points", key: "Hero Points" },
] satisfies readonly FinalStatsColumn[]

const finalStatsArmorIgnoreColumns = [
  { label: "Blunt Armor Ignore%", key: "Blunt Armor Ignore%", format: "percent" },
  { label: "Void Armor Ignore%", key: "Void Armor Ignore%", format: "percent" },
  { label: "Phys Armor Ignore%", key: "Phys Armor Ignore%", format: "percent" },
  { label: "Magic Armor Ignore%", key: "Magic Armor Ignore%", format: "percent" },
] satisfies readonly FinalStatsColumn[]

const finalStatsSkillDamageColumns = [
  { label: "Spear DMG%", key: "Spear DMG%", format: "percent" },
  { label: "Sword DMG%", key: "Sword DMG%", format: "percent" },
  { label: "Bow DMG%", key: "Bow DMG%", format: "percent" },
  { label: "Hammer DMG%", key: "Hammer DMG%", format: "percent" },
  { label: "Fire DMG%", key: "Fire DMG%", format: "percent" },
  { label: "Fist DMG%", key: "Fist DMG%", format: "percent" },
  { label: "Dagger DMG%", key: "Dagger DMG%", format: "percent" },
  { label: "Shadow Break DMG%", key: "Shadow Break DMG%", format: "percent" },
] satisfies readonly FinalStatsColumn[]

const finalStatsDotColumns = [
  { label: "Neg DOT%", key: "Neg DOT%", format: "percent" },
  { label: "Void DOT%", key: "Void DOT%", format: "percent" },
  { label: "Holy DOT%", key: "Holy DOT%", format: "percent" },
  { label: "Fire DOT%", key: "Fire DOT%", format: "percent" },
  { label: "Toxic DOT%", key: "Toxic DOT%", format: "percent" },
  { label: "Slash DOT%", key: "Slash DOT%", format: "percent" },
  { label: "Pierce DOT%", key: "Pierce DOT%", format: "percent" },
] satisfies readonly FinalStatsColumn[]

const finalStatsSpecialCritColumns = [
  { label: "Bow Crit Chance%", key: "Bow Crit Chance%", format: "percent" },
  { label: "Bow Crit DMG%", key: "Bow Crit DMG%", format: "percent" },
  { label: "Fist Crit DMG%", key: "Fist Crit DMG%", format: "percent" },
  { label: "Dagger Crit DMG%", key: "Dagger Crit DMG%", format: "percent" },
  { label: "Elemental Crit DMG%", key: "Elemental Crit DMG%", format: "percent" },
  { label: "Holy Crit DMG%", key: "Holy Crit DMG%", format: "percent" },
  { label: "Shadow Break Crit Chance%", key: "Shadow Break Crit Chance%", format: "percent" },
] satisfies readonly FinalStatsColumn[]

const finalStatsTypeRows = [
  { label: "Blunt", key: "Blunt" },
  { label: "Pierce", key: "Pierce" },
  { label: "Slash", key: "Slash" },
  { label: "Fire", key: "Fire" },
  { label: "Water", key: "Water" },
  { label: "Lightning", key: "Lightning" },
  { label: "Wind", key: "Wind" },
  { label: "Earth", key: "Earth" },
  { label: "Toxic", key: "Toxic" },
  { label: "Negative", key: "Neg" },
  { label: "Holy", key: "Holy" },
  { label: "Void", key: "Void" },
] satisfies readonly FinalStatsTypeRow[]

const finalStatsTypeMetrics = [
  { key: "dmg", label: "DMG%", suffix: "%" },
  { key: "pen", label: "PEN%", suffix: " Pen%" },
  { key: "res", label: "RES%", suffix: " Res%" },
  { key: "xDmg", label: "xDMG%", suffix: " xDmg%" },
  { key: "xPen", label: "xPEN%", suffix: " xPen%" },
] as const

const explicitFinalStatsKeys = new Set<string>([
  ...finalStatsPrimaryColumns.map((column) => column.key),
  ...finalStatsBonusColumns.map((column) => column.key),
  ...finalStatsClassColumns.map((column) => column.key),
  ...finalStatsMainModifierColumns.map((column) => column.key),
  ...finalStatsArtifactGlobalColumns.map((column) => column.key),
  ...finalStatsFamilyColumns.map((column) => column.key),
  ...finalStatsMagicFamilyColumns.map((column) => column.key),
  ...finalStatsSpecialFamilyColumns.map((column) => column.key),
  ...finalStatsResourceColumns.map((column) => column.key),
  ...finalStatsArmorIgnoreColumns.map((column) => column.key),
  ...finalStatsSkillDamageColumns.map((column) => column.key),
  ...finalStatsDotColumns.map((column) => column.key),
  ...finalStatsSpecialCritColumns.map((column) => column.key),
])

for (const row of finalStatsTypeRows) {
  explicitFinalStatsKeys.add(`${row.key}%`)
  explicitFinalStatsKeys.add(`${row.key} Pen%`)
  explicitFinalStatsKeys.add(`${row.key} Res%`)
  explicitFinalStatsKeys.add(`${row.key} xDmg%`)
  explicitFinalStatsKeys.add(`${row.key} xPen%`)
}

function getXpToNextLevel(level: number): number {
  const normalizedLevel = Math.max(0, Math.floor(level))

  if (normalizedLevel <= 120) {
    return 60 + (4 * normalizedLevel) + (500 * Math.floor(normalizedLevel / 20))
  }

  if (normalizedLevel <= 259) {
    const extraAfter140 = normalizedLevel >= 140 ? 1000 * (Math.floor((normalizedLevel - 140) / 20) + 1) : 0
    return 6544 + (4 * (normalizedLevel - 121)) + extraAfter140
  }

  if (normalizedLevel <= 340) {
    return 21150 + (6 * (normalizedLevel - 260)) + (1500 * Math.floor((normalizedLevel - 260) / 20))
  }

  if (normalizedLevel <= 359) {
    return 41454 + (9 * (normalizedLevel - 341))
  }

  return 43875 + (9 * (normalizedLevel - 360)) + (2250 * Math.floor((normalizedLevel - 360) / 20))
}

function formatWhole(value: number): string {
  if (!Number.isFinite(value)) {
    return "0"
  }

  return Math.round(value).toLocaleString("en-US")
}

function formatFixed(value: number, digits = 1): string {
  if (!Number.isFinite(value)) {
    return "0"
  }

  return value.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

function formatSignedPercent(value: number, digits = 0): string {
  const absolute = digits === 0 ? formatWhole(Math.abs(value)) : formatFixed(Math.abs(value), digits)
  return `${value >= 0 ? "+" : "-"}${absolute}%`
}

function formatPercent(value: number, digits = 0): string {
  const formatted = digits === 0 ? formatWhole(value) : formatFixed(value, digits)
  return `${formatted}%`
}

function formatPrecisePercent(value: number, maxDigits = 6): string {
  if (!Number.isFinite(value)) {
    return "0%"
  }

  return `${value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDigits,
  })}%`
}

function isZeroStat(value: number): boolean {
  return Math.abs(value) < 0.0001
}

function countNonZeroStats(stats: Record<string, number>): number {
  return Object.values(stats).filter((value) => !isZeroStat(value)).length
}

function getRaceStats(snapshot: BuildSnapshot): Record<string, number> {
  if (!snapshot.selectedRace || !(snapshot.selectedRace in race_data_by_tag)) {
    return {}
  }

  const raceStats = race_data_by_tag[snapshot.selectedRace as keyof typeof race_data_by_tag].stats

  return Object.entries(raceStats).reduce<Record<string, number>>((result, [stat, value]) => {
    if (typeof value === "number" && Number.isFinite(value) && !isZeroStat(value)) {
      result[stat] = value
    }

    return result
  }, {})
}

function subtractStats(
  sourceStats: Record<string, number>,
  statsToSubtract: Record<string, number>,
): Record<string, number> {
  const result: Record<string, number> = { ...sourceStats }

  for (const [stat, value] of Object.entries(statsToSubtract)) {
    const nextValue = (result[stat] ?? 0) - value

    if (isZeroStat(nextValue)) {
      delete result[stat]
    } else {
      result[stat] = nextValue
    }
  }

  return result
}

function formatFinalStatsValue(value: number, format: FinalStatsColumn["format"] = "flat"): string {
  return format === "percent" ? `${formatWhole(value)}%` : formatWhole(value)
}

function getFinalStatsColumnFormat(stat: string): FinalStatsColumn["format"] {
  return stat.includes("%") ? "percent" : "flat"
}

function getFinalStatsCellClass(value: number): string {
  return `rounded-xl border px-3 py-2 text-center font-mono tabular-nums ${
    isZeroStat(value)
      ? "border-slate-800/80 bg-slate-950/60 text-slate-600"
      : "border-slate-700/70 bg-slate-900/90 text-slate-100"
  }`
}

function formatEffectDelta(delta: number, stat: string, label?: string): string {
  const digits = Math.abs(delta) < 1 && delta !== 0 ? 2 : 0
  const absolute = digits === 0 ? formatWhole(Math.abs(delta)) : formatFixed(Math.abs(delta), digits)
  const suffix = stat.includes("%") ? "%" : ""
  return `${delta >= 0 ? "+" : "-"}${absolute}${suffix} ${label ?? getReadableStatLabel(stat)}`
}

function getStat(stats: Record<string, number>, key: string): number {
  return stats[key] ?? 0
}

function subtractSharedResist(totalResist: number, allResist: number): number {
  return Math.max(0, totalResist - allResist)
}

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
    case "Bow DMG%":
      return "Elebow"
    case "All%":
      return "All Damage"
    default:
      return stat.replace(/%/g, "").trim()
  }
}

function getRemainingFinalStatsColumns(stats: Record<string, number>): FinalStatsColumn[] {
  return Object.keys(stats)
    .filter((stat) => !explicitFinalStatsKeys.has(stat) && !isZeroStat(stats[stat] ?? 0))
    .sort((left, right) => {
      const leftPriority = effectPriorityIndex.get(left) ?? Number.MAX_SAFE_INTEGER
      const rightPriority = effectPriorityIndex.get(right) ?? Number.MAX_SAFE_INTEGER

      if (leftPriority !== rightPriority) {
        return leftPriority - rightPriority
      }

      return left.localeCompare(right)
    })
    .map((stat) => ({
      label: stat,
      key: stat,
      format: getFinalStatsColumnFormat(stat),
    }))
}

function readStoredDisclosureState(storageKey: string, fallback: boolean): boolean {
  if (typeof window === "undefined") {
    return fallback
  }

  const rawValue = window.localStorage.getItem(storageKey)

  if (rawValue === "true") {
    return true
  }

  if (rawValue === "false") {
    return false
  }

  return fallback
}

function getVisibleFinalStatsColumns(
  columns: readonly FinalStatsColumn[],
  stats: Record<string, number>,
  showEmptyRowsAndColumns: boolean,
): FinalStatsColumn[] {
  if (showEmptyRowsAndColumns) {
    return [...columns]
  }

  return columns.filter((column) => !isZeroStat(getStat(stats, column.key)))
}

function getVisibleFinalStatsTypeMetrics(
  stats: Record<string, number>,
  showEmptyRowsAndColumns: boolean,
) {
  if (showEmptyRowsAndColumns) {
    return [...finalStatsTypeMetrics]
  }

  return finalStatsTypeMetrics.filter((metric) =>
    finalStatsTypeRows.some((row) => !isZeroStat(getStat(stats, `${row.key}${metric.suffix}`))),
  )
}

function getVisibleFinalStatsTypeRows(
  stats: Record<string, number>,
  metrics: readonly (typeof finalStatsTypeMetrics)[number][],
  showEmptyRowsAndColumns: boolean,
) {
  if (showEmptyRowsAndColumns) {
    return [...finalStatsTypeRows]
  }

  return finalStatsTypeRows.filter((row) =>
    metrics.some((metric) => !isZeroStat(getStat(stats, `${row.key}${metric.suffix}`))),
  )
}

function getRaceName(snapshot: BuildSnapshot): string {
  if (snapshot.selectedRace && snapshot.selectedRace in race_data_by_tag) {
    return race_data_by_tag[snapshot.selectedRace as keyof typeof race_data_by_tag].name
  }

  return profileDefaults.raceName
}

function getUsedSkillPoints(snapshot: BuildSnapshot): number {
  return snapshot.selectedBuffs.reduce((total, skillName) => total + (skill_data[skillName]?.sp ?? 0), 0)
}

function isTarotEquipmentSlot(slot: BuildSnapshot["equipmentSlots"][number] | undefined): boolean {
  return slot?.type === "Tarot"
}

function getCharcardSnapshot(snapshot: BuildSnapshot): BuildSnapshot {
  return {
    ...snapshot,
    enabledEquipment: snapshot.enabledEquipment.filter((index) => !isTarotEquipmentSlot(snapshot.equipmentSlots[index])),
  }
}

function mergeStats(...sources: Record<string, number>[]): Record<string, number> {
  const merged: Record<string, number> = {}

  for (const source of sources) {
    for (const [stat, value] of Object.entries(source)) {
      merged[stat] = (merged[stat] ?? 0) + value
    }
  }

  return merged
}

function addExpandedStat(target: Record<string, number>, stat: string, value: number): void {
  if (!Number.isFinite(value) || Math.abs(value) < 0.0001) {
    return
  }

  target[stat] = (target[stat] ?? 0) + value
  const info = stat_data.StatsInfo[stat as keyof typeof stat_data.StatsInfo]
  if (!info?.sub_stats) {
    return
  }

  for (const subStat of info.sub_stats) {
    target[subStat] = (target[subStat] ?? 0) + value
  }
}

function getMergedDisplayStatValue(
  sourceStats: Record<string, number>,
  activeExpandedStats: Record<string, number>,
  stat: string,
): number {
  return (sourceStats[stat] ?? 0) + (activeExpandedStats[stat] ?? 0)
}

function getHighestDisplayStatValue(
  sourceStats: Record<string, number>,
  activeExpandedStats: Record<string, number>,
  stats: readonly string[],
): number {
  return stats.reduce(
    (highest, stat) => Math.max(highest, getMergedDisplayStatValue(sourceStats, activeExpandedStats, stat)),
    0,
  )
}

function getDisplayConversionSourceValue(
  sourceStats: Record<string, number>,
  activeExpandedStats: Record<string, number>,
  sourceStat: string,
): number {
  switch (sourceStat) {
    case "Highest Phys%":
      return getHighestDisplayStatValue(sourceStats, activeExpandedStats, ["Slash%", "Pierce%", "Blunt%"])
    case "Highest Phys Pen%":
      return getHighestDisplayStatValue(sourceStats, activeExpandedStats, ["Slash Pen%", "Pierce Pen%", "Blunt Pen%"])
    case "Highest Magic%":
      return getHighestDisplayStatValue(sourceStats, activeExpandedStats, [
        "Fire%",
        "Water%",
        "Lightning%",
        "Wind%",
        "Earth%",
        "Toxic%",
        "Neg%",
        "Holy%",
        "Void%",
      ])
    case "Highest Magic Pen%":
      return getHighestDisplayStatValue(sourceStats, activeExpandedStats, [
        "Fire Pen%",
        "Water Pen%",
        "Lightning Pen%",
        "Wind Pen%",
        "Earth Pen%",
        "Toxic Pen%",
        "Neg Pen%",
        "Holy Pen%",
        "Void Pen%",
      ])
    case "Post Crit Chance%":
      return getMergedDisplayStatValue(sourceStats, activeExpandedStats, "Crit Chance%")
    default:
      return sourceStats[sourceStat] ?? 0
  }
}

function addDisplayEffectStat(
  rawStats: Record<string, number>,
  expandedStats: Record<string, number>,
  stat: string,
  value: number,
): void {
  const info = stat_data.StatsInfo[stat as keyof typeof stat_data.StatsInfo]
  if (!info || !Number.isFinite(value) || Math.abs(value) < 0.0001) {
    return
  }

  rawStats[stat] = (rawStats[stat] ?? 0) + value
  addExpandedStat(expandedStats, stat, value)
}

function applyDisplayFlatEffectStat(
  rawStats: Record<string, number>,
  expandedStats: Record<string, number>,
  sourceStats: Record<string, number>,
  targetStat: string,
  targetValue: number,
  stackCount = 1,
  flatStatScale = 1,
): void {
  const info = stat_data.StatsInfo[targetStat as keyof typeof stat_data.StatsInfo]
  if (!info) {
    return
  }

  const buff = getMergedDisplayStatValue(sourceStats, expandedStats, "Buff%")
  const normalizedTargetValue = info.multi === 0.01
    ? targetValue * flatStatScale
    : targetValue
  const resultValue = Math.floor(normalizedTargetValue * stackCount * (1 + buff))

  addDisplayEffectStat(rawStats, expandedStats, targetStat, resultValue)
}

function applyDisplayConversionEffect(
  rawStats: Record<string, number>,
  expandedStats: Record<string, number>,
  sourceStats: Record<string, number>,
  sourceStat: string,
  ratio: number,
  targetStat: string,
  stackCount = 1,
): void {
  const info = stat_data.StatsInfo[targetStat as keyof typeof stat_data.StatsInfo]
  if (!info) {
    return
  }

  const buff = getMergedDisplayStatValue(sourceStats, expandedStats, "Buff%")
  const sourceValue = getDisplayConversionSourceValue(sourceStats, expandedStats, sourceStat)
  const resultValue = Math.floor(sourceValue * ratio * stackCount * (1 + buff))

  addDisplayEffectStat(rawStats, expandedStats, targetStat, resultValue)
}

function computeDisplayEffectStats(
  selectedNames: readonly string[],
  stackDict: Record<string, number>,
  sourceStats: Record<string, number>,
  sourceData: Record<string, EffectSourceData | undefined>,
  flatStatScale = 1,
): Record<string, number> {
  const rawStats: Record<string, number> = {}
  const expandedStats: Record<string, number> = {}

  for (const name of selectedNames) {
    const effectData = sourceData[name]
    if (!effectData) {
      continue
    }

    if (effectData.conversions) {
      for (const { source, ratio, resulting_stat } of effectData.conversions) {
        applyDisplayConversionEffect(rawStats, expandedStats, sourceStats, source, ratio, resulting_stat)
      }
    }

    if (effectData.stack_conversions) {
      for (const { source, ratio, resulting_stat } of effectData.stack_conversions) {
        applyDisplayConversionEffect(
          rawStats,
          expandedStats,
          sourceStats,
          source,
          ratio,
          resulting_stat,
          stackDict[name] ?? 0,
        )
      }
    }

    if (effectData.stats) {
      for (const [stat, value] of Object.entries(effectData.stats)) {
        applyDisplayFlatEffectStat(rawStats, expandedStats, sourceStats, stat, value ?? 0, 1, flatStatScale)
      }
    }

    if (effectData.stack_stats) {
      for (const [stat, value] of Object.entries(effectData.stack_stats)) {
        applyDisplayFlatEffectStat(rawStats, expandedStats, sourceStats, stat, value ?? 0, stackDict[name] ?? 0, flatStatScale)
      }
    }
  }

  return rawStats
}

function getDisplayBaseStats(stages: BuildStatStages): Record<string, number> {
  return mergeStats(
    stages.StatsTalents,
    stages.StatsLevels,
    stages.StatsEquipment,
    stages.StatsRunes,
    stages.StatsArtifact,
    stages.StatsConverted,
  )
}

function getRawDungeonDisplayStats(snapshot: BuildSnapshot, stages: BuildStatStages): Record<string, number> {
  const buffStats = computeDisplayEffectStats(
    snapshot.selectedBuffs,
    snapshot.selectedBuffStacks,
    stages.StatsBuffReady,
    skill_data as Record<string, EffectSourceData | undefined>,
    100,
  )
  const tarotStats = computeDisplayEffectStats(
    snapshot.selectedTarots,
    snapshot.tarotStacks,
    stages.StatsBuffReady,
    tarot_data as Record<string, EffectSourceData | undefined>,
  )

  return mergeStats(getDisplayBaseStats(stages), buffStats, tarotStats)
}

function getDungeonMainStats(snapshot: BuildSnapshot, stages: BuildStatStages): Record<string, number> {
  const dungeonMainStats = { ...stages.StatsDmgReady }

  // The "Focus" buff restores current focus; it does not raise the cap shown on the dungeon card.
  if (snapshot.selectedBuffs.includes("Focus")) {
    dungeonMainStats.Focus = stages.StatsBuffReady.Focus ?? dungeonMainStats.Focus
  }

  return dungeonMainStats
}

function getCalculatedOutDungeonStats(rawStats: Record<string, number>): Record<string, number> {
  const calculatedStats: Record<string, number> = { ...rawStats }

  calculatedStats["All%"] = 0
  calculatedStats["All Pen%"] = 0
  calculatedStats["All Res%"] = 0
  calculatedStats["Phys%"] = 0
  calculatedStats["Phys Pen%"] = 0
  calculatedStats["Phys Res%"] = 0
  calculatedStats["Phys xPen%"] = 0
  calculatedStats["Elemental%"] = 0
  calculatedStats["Elemental Pen%"] = 0
  calculatedStats["Elemental Res%"] = 0
  calculatedStats["Elemental xPen%"] = 0
  calculatedStats["Divine%"] = 0
  calculatedStats["Divine Pen%"] = 0
  calculatedStats["Divine Res%"] = 0
  calculatedStats["Divine xPen%"] = 0
  calculatedStats["Void xPen%"] = 0

  for (const { key, family } of dungeonDisplayElements) {
    const damageFamilyBonus = family === "Void" ? 0 : getStat(rawStats, `${family}%`)
    const resistFamilyBonus = family === "Void" ? 0 : getStat(rawStats, `${family} Res%`)
    const penFamilyBonus = family === "Void" ? 0 : getStat(rawStats, `${family} Pen%`)
    const xPenFamilyBonus = getStat(rawStats, `${family} xPen%`)
    const specificPen = getStat(rawStats, `${key} Pen%`) + getStat(rawStats, "All Pen%") + penFamilyBonus
    const xPen = getStat(rawStats, `${key} xPen%`) + xPenFamilyBonus

    calculatedStats[`${key}%`] = getStat(rawStats, `${key}%`) + getStat(rawStats, "All%") + damageFamilyBonus
    calculatedStats[`${key} Res%`] = getStat(rawStats, `${key} Res%`) + getStat(rawStats, "All Res%") + resistFamilyBonus
    calculatedStats[`${key} Pen%`] = Math.floor(specificPen * (1 + (xPen / 100)))
  }

  return calculatedStats
}

function getDisplayDungeonStats(snapshot: BuildSnapshot, stages: BuildStatStages): Record<string, number> {
  return getCalculatedOutDungeonStats(getRawDungeonDisplayStats(snapshot, stages))
}

function getEffectDeltas(stats: Record<string, number>): EffectDelta[] {
  const result: EffectDelta[] = []

  for (const [key, delta] of Object.entries(stats)) {
    if (Math.abs(delta) < 0.0001) {
      continue
    }

    result.push({ stat: key, delta })
  }

  result.sort((left, right) => {
    const leftPriority = effectPriorityIndex.get(left.stat) ?? Number.MAX_SAFE_INTEGER
    const rightPriority = effectPriorityIndex.get(right.stat) ?? Number.MAX_SAFE_INTEGER

    if (leftPriority !== rightPriority) {
      return leftPriority - rightPriority
    }

    const deltaDifference = Math.abs(right.delta) - Math.abs(left.delta)
    if (deltaDifference !== 0) {
      return deltaDifference
    }

    return left.stat.localeCompare(right.stat)
  })

  return result.slice(0, 6)
}

function getActiveEffects(snapshot: BuildSnapshot, stages: BuildStatStages): ActiveEffect[] {
  const effects: ActiveEffect[] = []
  const sourceStats = stages.StatsBuffReady

  for (const skillName of snapshot.selectedBuffs) {
    const skill = skill_data[skillName]
    if (!skill) continue

    const deltas = getEffectDeltas(
      computeDisplayEffectStats(
        [skillName],
        snapshot.selectedBuffStacks,
        sourceStats,
        skill_data as Record<string, EffectSourceData | undefined>,
        100,
      ),
    )
    if (deltas.length === 0) continue

    effects.push({
      id: `skill:${skillName}`,
      title: skillName,
      sourceType: "skill",
      description: skill.description,
      deltas,
    })
  }

  for (const tarotName of snapshot.selectedTarots) {
    const tarot = tarot_data[tarotName]
    if (!tarot) continue

    const deltas = getEffectDeltas(
      computeDisplayEffectStats(
        [tarotName],
        snapshot.tarotStacks,
        sourceStats,
        tarot_data as Record<string, EffectSourceData | undefined>,
      ),
    )
    if (deltas.length === 0) continue

    effects.push({
      id: `tarot:${tarotName}`,
      title: tarot.skill_name,
      sourceType: "tarot",
      description: tarot.description,
      deltas,
    })
  }

  return effects
}

function buildSummaryState(storage: Storage): SummaryState {
  const snapshot = readBuildSnapshot(storage)
  const stages = computeBuildStatStages(snapshot)
  const charcardStages = computeBuildStatStages(getCharcardSnapshot(snapshot))
  const dungeonMainStats = getDungeonMainStats(snapshot, stages)
  const displayBaseStats = getDisplayBaseStats(charcardStages)
  const displayDungeonStats = getDisplayDungeonStats(snapshot, stages)
  const totalLevels = classKeys.reduce((total, classKey) => total + (snapshot.selectedLevels[classKey] ?? 0), 0)
  const availableSkillPoints = Math.ceil(totalLevels / 2)
  const usedSkillPoints = getUsedSkillPoints(snapshot)
  const availableTalentPoints = Math.floor(totalLevels / 2)
  const usedTalentPoints = snapshot.selectedTalents.length

  return {
    profile: profileDefaults,
    snapshot,
    stages,
    charcardStages,
    dungeonMainStats,
    displayBaseStats,
    displayDungeonStats,
    totalLevels,
    raceName: getRaceName(snapshot),
    nextLevelExp: getXpToNextLevel(totalLevels),
    availableSkillPoints,
    usedSkillPoints,
    remainingSkillPoints: Math.max(0, availableSkillPoints - usedSkillPoints),
    availableTalentPoints,
    usedTalentPoints,
    remainingTalentPoints: Math.max(0, availableTalentPoints - usedTalentPoints),
    activeEffects: getActiveEffects(snapshot, stages),
  }
}

function getTypeBonusRows(
  stats: Record<string, number>,
  options?: {
    maskVoidDamage?: boolean
    maskVoidPen?: boolean
  },
): TypeBonusRow[] {
  const categories = [
    { label: "PHYS", dmg: "Phys%", xDmg: "Phys xDmg%", pen: "Phys Pen%", xPen: "Phys xPen%" },
    { label: "ELE", dmg: "Elemental%", xDmg: "Elemental xDmg%", pen: "Elemental Pen%", xPen: "Elemental xPen%" },
    { label: "DIV", dmg: "Divine%", xDmg: "Divine xDmg%", pen: "Divine Pen%", xPen: "Divine xPen%" },
    { label: "VOID", dmg: "Void%", xDmg: "Void xDmg%", pen: "Void Pen%", xPen: "Void xPen%" },
  ] as const

  return categories.map((category) => ({
    label: category.label,
    dmg: category.label === "VOID" && options?.maskVoidDamage
      ? "X"
      : category.label === "VOID" && getStat(stats, category.dmg) === 0
        ? "X"
        : formatWhole(getStat(stats, category.dmg)),
    xDmg: formatWhole(getStat(stats, category.xDmg)),
    pen: category.label === "VOID" && options?.maskVoidPen
      ? "X"
      : category.label === "VOID" && getStat(stats, category.pen) === 0
        ? "X"
        : formatWhole(getStat(stats, category.pen)),
    xPen: formatWhole(getStat(stats, category.xPen)),
  }))
}

function getElementRows(
  stats: Record<string, number>,
  options?: {
    addAllDamage?: boolean
    omitAllDamageFor?: string[]
    subtractAllResist?: boolean
  },
): ElementRow[] {
  const elements = [
    { label: "Fire", key: "Fire" },
    { label: "Lightning", key: "Lightning" },
    { label: "Water", key: "Water" },
    { label: "Earth", key: "Earth" },
    { label: "Wind", key: "Wind" },
    { label: "Toxic", key: "Toxic" },
    { label: "Void", key: "Void" },
    { label: "Negative", key: "Neg" },
    { label: "Holy", key: "Holy" },
    { label: "Blunt", key: "Blunt" },
    { label: "Pierce", key: "Pierce" },
    { label: "Slash", key: "Slash" },
  ] as const
  const allDamage = options?.addAllDamage ? getStat(stats, "All%") : 0
  const omitAllDamageFor = new Set(options?.omitAllDamageFor ?? [])
  const allResist = options?.subtractAllResist ? getStat(stats, "All Res%") : 0

  return elements.map((element) => ({
    label: element.label,
    dmg: formatWhole(getStat(stats, `${element.key}%`) + (omitAllDamageFor.has(element.label) ? 0 : allDamage)),
    res: formatWhole(subtractSharedResist(getStat(stats, `${element.key} Res%`), allResist)),
    pen: formatWhole(getStat(stats, `${element.key} Pen%`)),
  }))
}

function getBaseMainRows(
  valueStats: Record<string, number>,
  modifierStats: Record<string, number>,
): TerminalMainRow[] {
  return [
    { label: "Health", value: `${formatWhole(getStat(valueStats, "HP"))} / ${formatWhole(getStat(valueStats, "HP"))}` },
    { label: "Mana", value: formatWhole(getStat(valueStats, "MP")) },
    { label: "Focus", value: formatWhole(getStat(valueStats, "Focus")) },
    { label: "ATK", value: formatWhole(getStat(valueStats, "ATK")), modifier: formatSignedPercent(getStat(modifierStats, "ATK%")) },
    { label: "MATK", value: formatWhole(getStat(valueStats, "MATK")), modifier: formatSignedPercent(getStat(modifierStats, "MATK%")) },
    { label: "DEF", value: formatWhole(getStat(valueStats, "DEF")), modifier: formatSignedPercent(getStat(modifierStats, "DEF%")) },
    { label: "HEAL", value: formatWhole(getStat(valueStats, "HEAL")), modifier: formatSignedPercent(getStat(modifierStats, "HEAL%")) },
  ]
}

function getDungeonMainRows(stats: Record<string, number>): TerminalMainRow[] {
  return [
    { label: "Health", value: `${formatWhole(getStat(stats, "HP"))} / ${formatWhole(getStat(stats, "HP"))}` },
    { label: "Mana", value: `${formatWhole(getStat(stats, "MP"))} / ${formatWhole(getStat(stats, "MP"))}` },
    { label: "Focus", value: `${formatWhole(getStat(stats, "Focus"))} / ${formatWhole(getStat(stats, "Focus"))}` },
    { label: "ATK", value: formatWhole(getStat(stats, "ATK")) },
    { label: "MATK", value: formatWhole(getStat(stats, "MATK")) },
    { label: "DEF", value: formatWhole(getStat(stats, "DEF")) },
    { label: "HEAL", value: formatWhole(getStat(stats, "HEAL")) },
  ]
}

function getBaseDetailRows(baseStats: Record<string, number>): TerminalDetailRow[] {
  return [
    {
      label: "Crit Chance/Damage",
      value: `${formatPercent(getStat(baseStats, "Crit Chance%"))} / ${formatPercent(getStat(baseStats, "Crit DMG%"))}`,
    },
    {
      label: "Overdrive Scaling",
      value: formatPrecisePercent(getStat(baseStats, "Overdrive%") / 100),
    },
    {
      label: "EXP Bonus",
      value: `+${formatWhole(getStat(baseStats, "EXP Bonus"))}`,
    },
    {
      label: "HP Regen/Rate",
      value: `${formatWhole(getStat(baseStats, "HP Regen"))} / ${formatPercent(getStat(baseStats, "HP Regen%"), 1)}`,
    },
    {
      label: "Global Damage",
      value: formatSignedPercent(getStat(baseStats, "Dmg%")),
    },
    {
      label: "All Resist",
      value: formatSignedPercent(getStat(baseStats, "All Res%")),
    },
    {
      label: "Threat Modifier",
      value: formatPercent(getStat(baseStats, "Threat%")),
    },
  ]
}

function getDungeonDetailRows(stats: Record<string, number>): TerminalDetailRow[] {
  return [
    {
      label: "Crit Chance/Damage",
      value: `${formatPercent(getStat(stats, "Crit Chance%"))} / ${formatPercent(getStat(stats, "Crit DMG%"))}`,
    },
    {
      label: "Overdrive Scaling",
      value: formatPrecisePercent(getStat(stats, "Overdrive%") / 100),
    },
    {
      label: "HP Regen/Rate",
      value: `${formatWhole(getStat(stats, "HP Regen"))} / ${formatPercent(getStat(stats, "HP Regen%"), 1)}`,
    },
    {
      label: "MP/Focus Regen",
      value: `${formatWhole(getStat(stats, "MP Regen"))} / ${formatWhole(getStat(stats, "Focus Regen"))}`,
    },
    {
      label: "Global Damage",
      value: formatSignedPercent(getStat(stats, "Dmg%")),
    },
    {
      label: "All Resist",
      value: formatSignedPercent(getStat(stats, "All Res%")),
    },
    {
      label: "Threat Modifier",
      value: formatPercent(getStat(stats, "Threat%")),
    },
  ]
}

function GlowLayer() {
  return (
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(125,211,252,0.14),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(251,191,36,0.08),transparent_28%)]" />
  )
}

function CardHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string
  title: string
  subtitle?: string
}) {
  return (
    <div className="space-y-1">
      {eyebrow ? <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-200/80">{eyebrow}</div> : null}
      <div className="text-xl font-semibold text-slate-50">{title}</div>
      {subtitle ? <div className="text-sm text-slate-400">{subtitle}</div> : null}
    </div>
  )
}

function DetailTile({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-2xl border border-slate-700/70 bg-slate-950/45 p-3">
      <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{label}</div>
      <div className="mt-1 text-sm font-semibold text-slate-100">{value}</div>
    </div>
  )
}

function StatGroup({
  title,
  subtitle,
  defaultOpen = true,
  storageKey,
  children,
}: {
  title: string
  subtitle?: string
  defaultOpen?: boolean
  storageKey?: string
  children: ReactNode
}) {
  const [isOpen, setIsOpen] = useState(() => storageKey ? readStoredDisclosureState(storageKey, defaultOpen) : defaultOpen)
  const toggleOpen = () => {
    setIsOpen((current) => {
      const nextValue = !current

      if (storageKey && typeof window !== "undefined") {
        window.localStorage.setItem(storageKey, String(nextValue))
      }

      return nextValue
    })
  }

  return (
    <section className="overflow-hidden rounded-[30px] border border-slate-800/80 bg-slate-950/35 shadow-[0_18px_60px_rgba(2,6,23,0.22)]">
      <div className={`flex flex-wrap items-center justify-between gap-3 ${isOpen ? "px-5 py-4 sm:px-6" : "px-4 py-2.5 sm:px-5"}`}>
        <CardHeader title={title} subtitle={isOpen ? subtitle : undefined} />
        <button
          type="button"
          onClick={toggleOpen}
          aria-expanded={isOpen}
          className="rounded-full border border-slate-700/80 bg-slate-900/80 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-200 transition hover:border-sky-300/40 hover:text-sky-100"
        >
          {isOpen ? "Hide" : "Show"}
        </button>
      </div>

      {isOpen ? (
        <div className="border-t border-slate-800/70 p-4 sm:p-6">
          {children}
        </div>
      ) : null}
    </section>
  )
}

function GuildCard({
  summary,
}: {
  summary: SummaryState
}) {
  const baseStats = summary.charcardStages.StatsBase

  return (
    <section className={`${cardClass} p-5 sm:p-6`}>
      <GlowLayer />
      <div className="relative space-y-5">
        <CardHeader
          title="Guild Card"
        />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <DetailTile label="Race" value={summary.raceName} />
          <DetailTile label="Total Levels" value={`${formatWhole(summary.totalLevels)} / 485`} />
          <DetailTile
            label="T/W/C/H Levels"
            value={classKeys.map((classKey) => formatWhole(summary.snapshot.selectedLevels[classKey] ?? 0)).join("/")}
          />
          <DetailTile label="Health" value={`${formatWhole(getStat(baseStats, "HP"))} / ${formatWhole(getStat(baseStats, "HP"))}`} />
          <DetailTile label="Mana" value={formatWhole(getStat(baseStats, "MP"))} />
          <DetailTile label="ATK" value={formatWhole(getStat(baseStats, "ATK"))} />
          <DetailTile label="DEF" value={formatWhole(getStat(baseStats, "DEF"))} />
          <DetailTile label="MATK" value={formatWhole(getStat(baseStats, "MATK"))} />
          <DetailTile label="Healpower" value={formatWhole(getStat(baseStats, "HEAL"))} />
          <DetailTile
            label="Skill/Talent Points"
            value={`${formatWhole(summary.remainingSkillPoints)} / ${formatWhole(summary.remainingTalentPoints)}`}
          />
          <DetailTile label="Rebirth LvL" value={formatWhole(summary.profile.rebirthLevel)} />
        </div>

        <div className="rounded-2xl border border-slate-700/70 bg-slate-950/55 px-4 py-3 text-sm text-slate-300">
          <span className="font-semibold text-slate-100">{formatWhole(summary.nextLevelExp)}</span> EXP needed for next level.
        </div>
      </div>
    </section>
  )
}

function TerminalCard({
  eyebrow,
  title,
  subtitle,
  mainRows,
  detailRows,
  typeRows,
  elementRows,
}: {
  eyebrow?: string
  title: string
  subtitle?: string
  mainRows: TerminalMainRow[]
  detailRows: TerminalDetailRow[]
  typeRows: TypeBonusRow[]
  elementRows: ElementRow[]
}) {
  return (
    <section className={`${cardClass} p-5 sm:p-6`}>
      <GlowLayer />
      <div className="relative space-y-5">
        <CardHeader eyebrow={eyebrow} title={title} subtitle={subtitle} />

        <div className="rounded-2xl border border-slate-700/70 bg-slate-950/55 p-4 font-mono text-sm tabular-nums">
          <div className="space-y-2">
            {mainRows.map((row) => (
              <div key={row.label} className="grid grid-cols-[5.5rem_minmax(0,1fr)_auto] items-baseline gap-3">
                <div className="text-slate-300">{row.label}</div>
                <div className="text-right text-slate-100">{row.value}</div>
                <div className="min-h-[1rem] text-right text-slate-400">{row.modifier ?? ""}</div>
              </div>
            ))}
          </div>

          <div className="my-4 h-px bg-slate-700/80" />

          <div className="space-y-2">
            {detailRows.map((row) => (
              <div key={row.label} className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-4">
                <div className="text-slate-300">{row.label}</div>
                <div className="text-right text-slate-100">{row.value}</div>
              </div>
            ))}
          </div>

          <div className="my-4 h-px bg-slate-700/80" />

          <div className="space-y-2">
            <div className="text-slate-300">DMG Type Bonuses (%)</div>
            <div className="grid grid-cols-[4rem_repeat(4,minmax(0,1fr))] gap-2 text-xs uppercase tracking-[0.14em] text-slate-500">
              <div>Type</div>
              <div className="text-right">DMG</div>
              <div className="text-right">xDMG</div>
              <div className="text-right">PEN</div>
              <div className="text-right">xPEN</div>
            </div>
            {typeRows.map((row) => (
              <div key={row.label} className="grid grid-cols-[4rem_repeat(4,minmax(0,1fr))] gap-2 text-slate-100">
                <div className="text-slate-300">{row.label}</div>
                <div className="text-right">{row.dmg}</div>
                <div className="text-right">{row.xDmg}</div>
                <div className="text-right">{row.pen}</div>
                <div className="text-right">{row.xPen}</div>
              </div>
            ))}
          </div>

          <div className="my-4 h-px bg-slate-700/80" />

          <div className="space-y-2">
            <div className="text-slate-300">Elements Table (%)</div>
            <div className="grid grid-cols-[minmax(0,1fr)_4rem_4rem_4rem] gap-2 text-xs uppercase tracking-[0.14em] text-slate-500">
              <div>Type</div>
              <div className="text-right">DMG</div>
              <div className="text-right">RES</div>
              <div className="text-right">PEN</div>
            </div>
            {elementRows.map((row) => (
              <div key={row.label} className="grid grid-cols-[minmax(0,1fr)_4rem_4rem_4rem] gap-2 text-slate-100">
                <div className="truncate text-slate-300">{row.label}</div>
                <div className="text-right">{row.dmg}</div>
                <div className="text-right">{row.res}</div>
                <div className="text-right">{row.pen}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function FinalStatsValueTable({
  columns,
  stats,
}: {
  columns: readonly FinalStatsColumn[]
  stats: Record<string, number>
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-max table-fixed border-separate border-spacing-1 whitespace-nowrap text-sm">
        <thead>
          <tr className="text-center text-xs font-semibold uppercase tracking-[0.14em]">
            {columns.map((column) => (
              <th
                key={column.label}
                className={`rounded-xl px-3 py-2 ${column.headerClassName ?? "bg-slate-800/90 text-slate-100"}`}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {columns.map((column) => {
              const value = getStat(stats, column.key)

              return (
                <td key={column.label} className={getFinalStatsCellClass(value)}>
                  {formatFinalStatsValue(value, column.format)}
                </td>
              )
            })}
          </tr>
        </tbody>
      </table>
    </div>
  )
}

function FinalStatsTableBlock({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <div className="space-y-2">
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{title}</div>
      {children}
    </div>
  )
}

function FinalStatsTypeTable({
  stats,
  rows,
  metrics,
}: {
  stats: Record<string, number>
  rows: readonly FinalStatsTypeRow[]
  metrics: readonly (typeof finalStatsTypeMetrics)[number][]
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-[42rem] table-fixed border-separate border-spacing-1 whitespace-nowrap text-sm">
        <thead>
          <tr className="text-center text-xs font-semibold uppercase tracking-[0.14em] text-slate-100">
            <th className="rounded-xl bg-slate-800/90 px-3 py-2 text-left">Type</th>
            {metrics.map((metric) => (
              <th key={metric.key} className="rounded-xl bg-slate-800/90 px-3 py-2">
                {metric.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key}>
              <td className="rounded-xl border border-slate-700/70 bg-slate-950/45 px-3 py-2 text-left font-medium text-slate-200">
                {row.label}
              </td>
              {metrics.map((metric) => {
                const value = getStat(stats, `${row.key}${metric.suffix}`)

                return (
                  <td key={`${row.key}:${metric.key}`} className={getFinalStatsCellClass(value)}>
                    {formatFinalStatsValue(value, "percent")}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function FinalStatsValueBlock({
  title,
  columns,
  stats,
  showEmptyRowsAndColumns,
}: {
  title: string
  columns: readonly FinalStatsColumn[]
  stats: Record<string, number>
  showEmptyRowsAndColumns: boolean
}) {
  const visibleColumns = getVisibleFinalStatsColumns(columns, stats, showEmptyRowsAndColumns)

  if (visibleColumns.length === 0) {
    return null
  }

  return (
    <FinalStatsTableBlock title={title}>
      <FinalStatsValueTable columns={visibleColumns} stats={stats} />
    </FinalStatsTableBlock>
  )
}

function FinalStatsTypeBlock({
  stats,
  showEmptyRowsAndColumns,
}: {
  stats: Record<string, number>
  showEmptyRowsAndColumns: boolean
}) {
  const visibleMetrics = getVisibleFinalStatsTypeMetrics(stats, showEmptyRowsAndColumns)
  const visibleRows = getVisibleFinalStatsTypeRows(stats, visibleMetrics, showEmptyRowsAndColumns)

  if (visibleMetrics.length === 0 || visibleRows.length === 0) {
    return null
  }

  return (
    <FinalStatsTableBlock title="Type Breakdown">
      <FinalStatsTypeTable stats={stats} rows={visibleRows} metrics={visibleMetrics} />
    </FinalStatsTableBlock>
  )
}

function FinalStatsSection({
  stats,
  showEmptyRowsAndColumns,
}: {
  stats: Record<string, number>
  showEmptyRowsAndColumns: boolean
}) {
  const remainingColumns = getRemainingFinalStatsColumns(stats)

  return (
    <div className="space-y-3">
      <FinalStatsValueBlock title="Core Stats" columns={finalStatsPrimaryColumns} stats={stats} showEmptyRowsAndColumns={showEmptyRowsAndColumns} />
      <FinalStatsValueBlock title="Core Bonuses" columns={finalStatsBonusColumns} stats={stats} showEmptyRowsAndColumns={showEmptyRowsAndColumns} />
      <FinalStatsValueBlock title="Class Bonuses" columns={finalStatsClassColumns} stats={stats} showEmptyRowsAndColumns={showEmptyRowsAndColumns} />
      <FinalStatsValueBlock title="Mainstat Modifiers" columns={finalStatsMainModifierColumns} stats={stats} showEmptyRowsAndColumns={showEmptyRowsAndColumns} />
      <FinalStatsValueBlock title="Artifact And Global Modifiers" columns={finalStatsArtifactGlobalColumns} stats={stats} showEmptyRowsAndColumns={showEmptyRowsAndColumns} />
      <FinalStatsValueBlock title="Damage Family Bonuses" columns={finalStatsFamilyColumns} stats={stats} showEmptyRowsAndColumns={showEmptyRowsAndColumns} />
      <FinalStatsValueBlock title="Elemental And Divine Family Bonuses" columns={finalStatsMagicFamilyColumns} stats={stats} showEmptyRowsAndColumns={showEmptyRowsAndColumns} />
      <FinalStatsValueBlock title="Magic And Special Family Bonuses" columns={finalStatsSpecialFamilyColumns} stats={stats} showEmptyRowsAndColumns={showEmptyRowsAndColumns} />
      <FinalStatsValueBlock title="Resources And Utility" columns={finalStatsResourceColumns} stats={stats} showEmptyRowsAndColumns={showEmptyRowsAndColumns} />
      <FinalStatsTypeBlock stats={stats} showEmptyRowsAndColumns={showEmptyRowsAndColumns} />
      <FinalStatsValueBlock title="Armor Ignore" columns={finalStatsArmorIgnoreColumns} stats={stats} showEmptyRowsAndColumns={showEmptyRowsAndColumns} />
      <FinalStatsValueBlock title="Skill Damage Bonuses" columns={finalStatsSkillDamageColumns} stats={stats} showEmptyRowsAndColumns={showEmptyRowsAndColumns} />
      <FinalStatsValueBlock title="DOT Bonuses" columns={finalStatsDotColumns} stats={stats} showEmptyRowsAndColumns={showEmptyRowsAndColumns} />
      <FinalStatsValueBlock title="Special Crit Bonuses" columns={finalStatsSpecialCritColumns} stats={stats} showEmptyRowsAndColumns={showEmptyRowsAndColumns} />
      {remainingColumns.length > 0 ? (
        <FinalStatsTableBlock title="Additional Stats">
          <FinalStatsValueTable columns={remainingColumns} stats={stats} />
        </FinalStatsTableBlock>
      ) : null}
    </div>
  )
}

function FinalStatsSourceCard({
  title,
  subtitle,
  stats,
  showEmptyRowsAndColumns,
  defaultOpen = false,
}: {
  title: string
  subtitle?: string
  stats: Record<string, number>
  showEmptyRowsAndColumns: boolean
  defaultOpen?: boolean
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const activeStatCount = countNonZeroStats(stats)

  return (
    <section className={`${cardClass} ${isOpen ? "p-5 sm:p-6" : "p-4 sm:p-4"}`}>
      <GlowLayer />
      <div className={`relative ${isOpen ? "space-y-4" : "space-y-0"}`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <CardHeader title={title} subtitle={isOpen ? subtitle : undefined} />
          <div className="flex items-center gap-3">
            <div className="rounded-full border border-slate-700/80 bg-slate-950/70 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">
              {formatWhole(activeStatCount)} Active
            </div>
            <button
              type="button"
              onClick={() => setIsOpen((current) => !current)}
              aria-expanded={isOpen}
              className="rounded-full border border-slate-700/80 bg-slate-900/80 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-200 transition hover:border-sky-300/40 hover:text-sky-100"
            >
              {isOpen ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        {isOpen ? (
          <div className="border-t border-slate-800/70 pt-4">
            {activeStatCount === 0 && !showEmptyRowsAndColumns ? (
              <div className="text-sm text-slate-400">All rows and columns in this group are empty.</div>
            ) : (
              <FinalStatsSection stats={stats} showEmptyRowsAndColumns={showEmptyRowsAndColumns} />
            )}
          </div>
        ) : null}
      </div>
    </section>
  )
}

function getFinalStatsSourceSections(summary: SummaryState): FinalStatsSourceSection[] {
  const raceStats = getRaceStats(summary.snapshot)
  const talentStats = subtractStats(summary.stages.StatsTalents, raceStats)

  return [
    {
      title: "Overall Stats",
      subtitle: "Final totals after conversions, buffs, and tarots",
      stats: summary.stages.StatsDmgReady,
    },
    {
      title: "Talents",
      subtitle: "Selected talents only, excluding direct race bonuses",
      stats: talentStats,
    },
    {
      title: "Buffs",
      subtitle: "Selected skill buffs",
      stats: summary.stages.StatsBuffs,
    },
    {
      title: "Tarots",
      subtitle: "Selected tarot effects",
      stats: summary.stages.StatsTarots,
    },
    {
      title: "Equipment",
      subtitle: "Enabled equipment main stats and affixes",
      stats: summary.stages.StatsEquipment,
    },
    {
      title: "Artifact",
      subtitle: "Artifact level bonuses and artifact stat modifiers",
      stats: summary.stages.StatsArtifact,
    },
    {
      title: "Runes",
      subtitle: "Equipped rune bonuses",
      stats: summary.stages.StatsRunes,
    },
    {
      title: "Levels",
      subtitle: "Class levels, stat points, training, and hero points",
      stats: summary.stages.StatsLevels,
    },
    {
      title: "Race",
      subtitle: `Direct racial bonuses from ${summary.raceName}`,
      stats: raceStats,
    },
    {
      title: "Talent Conversions",
      subtitle: "Stats added by selected talent conversions",
      stats: summary.stages.StatsConverted,
    },
  ]
}

function FinalStatsBreakdownCard({
  summary,
  viewState,
}: {
  summary: SummaryState
  viewState: CharacterSummaryViewState
}) {
  const sections = getFinalStatsSourceSections(summary)
  const visibleSections = viewState.showEmptyGroups
    ? sections
    : sections.filter((section) => countNonZeroStats(section.stats) > 0)

  return (
    <div className="space-y-4">
      {visibleSections.map((section) => (
        <FinalStatsSourceCard
          key={section.title}
          title={section.title}
          subtitle={section.subtitle}
          stats={section.stats}
          showEmptyRowsAndColumns={viewState.showEmptyRowsAndColumns}
        />
      ))}
    </div>
  )
}

function BuffCard({
  summary,
}: {
  summary: SummaryState
}) {
  return (
    <section className={`${cardClass} p-5 sm:p-6`}>
      <GlowLayer />
      <div className="relative space-y-5">
        <CardHeader
          title="Active Effects"
          subtitle="Marginal impact of each selected skill or tarot on the current build"
        />

        {summary.activeEffects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-700/80 bg-slate-950/40 px-4 py-8 text-center text-sm text-slate-400">
            No active persistent skill or tarot effects are selected.
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {summary.activeEffects.map((effect) => (
              <article key={effect.id} className="rounded-2xl border border-slate-700/70 bg-slate-950/50 p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="text-lg font-semibold text-slate-50">{effect.title}</div>
                  <div
                    className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                      effect.sourceType === "tarot"
                        ? "bg-sky-400/15 text-sky-100 ring-1 ring-inset ring-sky-300/30"
                        : "bg-emerald-400/15 text-emerald-100 ring-1 ring-inset ring-emerald-300/30"
                    }`}
                  >
                    {effect.sourceType}
                  </div>
                </div>

                <p className="mt-2 text-sm leading-6 text-slate-400">{effect.description}</p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {effect.deltas.map((delta) => (
                    <div
                      key={`${effect.id}:${delta.stat}`}
                      className="rounded-full border border-slate-700/80 bg-slate-900/90 px-3 py-1.5 font-mono text-xs text-slate-100"
                    >
                      {formatEffectDelta(delta.delta, delta.stat, delta.label)}
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default function CharacterSummary() {
  const [summary, setSummary] = useState<SummaryState | null>(null)
  const [summaryViewState, setSummaryViewState] = useState<CharacterSummaryViewState>(getDefaultCharacterSummaryViewState)

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const refresh = () => {
      setSummary(buildSummaryState(window.localStorage))
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refresh()
      }
    }

    refresh()

    window.addEventListener(BUILD_SNAPSHOT_UPDATED_EVENT, refresh)
    window.addEventListener("focus", refresh)
    window.addEventListener("talentsUpdated", refresh)
    window.addEventListener("equipmentUpdated", refresh)
    window.addEventListener("computeDmgReadyStats", refresh)
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      window.removeEventListener(BUILD_SNAPSHOT_UPDATED_EVENT, refresh)
      window.removeEventListener("focus", refresh)
      window.removeEventListener("talentsUpdated", refresh)
      window.removeEventListener("equipmentUpdated", refresh)
      window.removeEventListener("computeDmgReadyStats", refresh)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const syncViewState = () => {
      setSummaryViewState(readCharacterSummaryViewState(window.localStorage))
    }

    const handleViewStateChange = (event: Event) => {
      const detail = (event as CustomEvent<CharacterSummaryViewChangeDetail>).detail

      if (detail?.viewState) {
        setSummaryViewState(detail.viewState)
        return
      }

      syncViewState()
    }

    syncViewState()
    window.addEventListener(CHARACTER_SUMMARY_VIEW_EVENT, handleViewStateChange)

    return () => {
      window.removeEventListener(CHARACTER_SUMMARY_VIEW_EVENT, handleViewStateChange)
    }
  }, [])

  if (!summary) {
    return (
      <div className="p-6">
        <div className={`${cardClass} mx-auto max-w-7xl p-6`}>
          <GlowLayer />
          <div className="relative text-sm text-slate-300">Loading character summary...</div>
        </div>
      </div>
    )
  }

  const baseStats = summary.charcardStages.StatsBase
  const displayBaseStats = summary.displayBaseStats
  const displayDungeonStats = summary.displayDungeonStats

  return (
    <div className="p-4 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <StatGroup
          title="In game stats"
          subtitle="Current guild card, character card, dungeon card, and active effects"
          storageKey={IN_GAME_STATS_GROUP_STORAGE_KEY}
        >
          <div className="space-y-6">
            <GuildCard summary={summary} />

            <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
              <TerminalCard
                title="Character Card"
                subtitle="Note: Lightning does not receive eleglobal correctly on the in-game charcard."
                mainRows={getBaseMainRows(baseStats, displayBaseStats)}
                detailRows={getBaseDetailRows(displayBaseStats)}
                typeRows={getTypeBonusRows(displayBaseStats, { maskVoidDamage: true, maskVoidPen: true })}
                elementRows={getElementRows(displayBaseStats, { addAllDamage: true, omitAllDamageFor: ["Lightning"] })}
              />
            </div>

            <TerminalCard
              title="Dungeon Character Card"
              mainRows={getDungeonMainRows(summary.dungeonMainStats)}
              detailRows={getDungeonDetailRows(displayDungeonStats)}
              typeRows={getTypeBonusRows(displayDungeonStats, { maskVoidDamage: true, maskVoidPen: true })}
              elementRows={getElementRows(displayDungeonStats)}
            />

            <BuffCard summary={summary} />
          </div>
        </StatGroup>

        <section className="space-y-4">
          <div className="px-1 sm:px-2">
            <CardHeader
              title="Build Source Stats"
              subtitle="Source breakdown of the current build's final stat totals"
            />
          </div>
          <FinalStatsBreakdownCard summary={summary} viewState={summaryViewState} />
        </section>
      </div>
    </div>
  )
}
