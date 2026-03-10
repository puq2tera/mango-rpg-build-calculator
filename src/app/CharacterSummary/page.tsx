"use client"

import { useEffect, useState } from "react"
import { race_data_by_tag } from "@/app/data/race_data"
import { skill_data } from "@/app/data/skill_data"
import tarot_data from "@/app/data/tarot_data"
import {
  computeBuildStatStages,
  readBuildSnapshot,
  type BuildSnapshot,
  type BuildStatStages,
} from "@/app/lib/buildStats"
import { BUILD_SNAPSHOT_UPDATED_EVENT } from "@/app/lib/buildEvents"

type ClassKey = "tank" | "warrior" | "caster" | "healer"

type SummaryProfile = {
  handle: string
  raceName: string
  rebirthLevel: number
}

type SummaryState = {
  profile: SummaryProfile
  snapshot: BuildSnapshot
  stages: BuildStatStages
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

const cardClass =
  "relative overflow-hidden rounded-[26px] border border-slate-700/70 bg-slate-900/72 shadow-[0_18px_80px_rgba(2,6,23,0.45)] backdrop-blur"

const profileDefaults: SummaryProfile = {
  handle: "puq2",
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
  "Phys%",
  "Phys Pen%",
  "Elemental%",
  "Elemental Pen%",
  "Divine%",
  "Divine Pen%",
  "Void%",
  "Void Pen%",
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

function formatEffectDelta(delta: number, stat: string): string {
  const digits = Math.abs(delta) < 1 && delta !== 0 ? 2 : 0
  const absolute = digits === 0 ? formatWhole(Math.abs(delta)) : formatFixed(Math.abs(delta), digits)
  const suffix = stat.includes("%") ? "%" : ""
  return `${delta >= 0 ? "+" : "-"}${absolute}${suffix} ${getReadableStatLabel(stat)}`
}

function getStat(stats: Record<string, number>, key: string): number {
  return stats[key] ?? 0
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
    case "Divine%":
      return "Divine DMG"
    case "Void%":
      return "Void DMG"
    default:
      return stat.replace(/%/g, "").trim()
  }
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

function getEffectDeltas(
  currentStats: Record<string, number>,
  previousStats: Record<string, number>,
): EffectDelta[] {
  const keys = new Set([...Object.keys(currentStats), ...Object.keys(previousStats)])
  const result: EffectDelta[] = []

  for (const key of keys) {
    const delta = (currentStats[key] ?? 0) - (previousStats[key] ?? 0)
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
  const currentStats = stages.StatsDmgReady
  const effects: ActiveEffect[] = []

  for (const skillName of snapshot.selectedBuffs) {
    const skill = skill_data[skillName]
    if (!skill) continue

    const withoutStages = computeBuildStatStages(snapshot, {
      selectedBuffs: snapshot.selectedBuffs.filter((entry) => entry !== skillName),
      buffStacks: snapshot.selectedBuffStacks,
      selectedTarots: snapshot.selectedTarots,
      tarotStacks: snapshot.tarotStacks,
    })

    const deltas = getEffectDeltas(currentStats, withoutStages.StatsDmgReady)
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

    const withoutStages = computeBuildStatStages(snapshot, {
      selectedBuffs: snapshot.selectedBuffs,
      buffStacks: snapshot.selectedBuffStacks,
      selectedTarots: snapshot.selectedTarots.filter((entry) => entry !== tarotName),
      tarotStacks: snapshot.tarotStacks,
    })

    const deltas = getEffectDeltas(currentStats, withoutStages.StatsDmgReady)
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
  const totalLevels = classKeys.reduce((total, classKey) => total + (snapshot.selectedLevels[classKey] ?? 0), 0)
  const availableSkillPoints = Math.ceil(totalLevels / 2)
  const usedSkillPoints = getUsedSkillPoints(snapshot)
  const availableTalentPoints = Math.floor(totalLevels / 2)
  const usedTalentPoints = snapshot.selectedTalents.length

  return {
    profile: profileDefaults,
    snapshot,
    stages,
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

function getTypeBonusRows(stats: Record<string, number>): TypeBonusRow[] {
  const categories = [
    { label: "PHYS", dmg: "Phys%", xDmg: "Phys xDmg%", pen: "Phys Pen%", xPen: "Phys xPen%" },
    { label: "ELE", dmg: "Elemental%", xDmg: "Elemental xDmg%", pen: "Elemental Pen%", xPen: "Elemental xPen%" },
    { label: "DIV", dmg: "Divine%", xDmg: "Divine xDmg%", pen: "Divine Pen%", xPen: "Divine xPen%" },
    { label: "VOID", dmg: "Void%", xDmg: "Void xDmg%", pen: "Void Pen%", xPen: "Void xPen%" },
  ] as const

  return categories.map((category) => ({
    label: category.label,
    dmg: category.label === "VOID" && getStat(stats, category.dmg) === 0 ? "X" : formatWhole(getStat(stats, category.dmg)),
    xDmg: formatWhole(getStat(stats, category.xDmg)),
    pen: category.label === "VOID" && getStat(stats, category.pen) === 0 ? "X" : formatWhole(getStat(stats, category.pen)),
    xPen: formatWhole(getStat(stats, category.xPen)),
  }))
}

function getElementRows(stats: Record<string, number>): ElementRow[] {
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

  return elements.map((element) => ({
    label: element.label,
    dmg: formatWhole(getStat(stats, `${element.key}%`)),
    res: formatWhole(getStat(stats, `${element.key} Res%`)),
    pen: formatWhole(getStat(stats, `${element.key} Pen%`)),
  }))
}

function getBaseMainRows(stats: Record<string, number>): TerminalMainRow[] {
  return [
    { label: "Health", value: `${formatWhole(getStat(stats, "HP"))} / ${formatWhole(getStat(stats, "HP"))}` },
    { label: "Mana", value: formatWhole(getStat(stats, "MP")) },
    { label: "Focus", value: formatWhole(getStat(stats, "Focus")) },
    { label: "ATK", value: formatWhole(getStat(stats, "ATK")), modifier: formatSignedPercent(getStat(stats, "ATK%")) },
    { label: "MATK", value: formatWhole(getStat(stats, "MATK")), modifier: formatSignedPercent(getStat(stats, "MATK%")) },
    { label: "DEF", value: formatWhole(getStat(stats, "DEF")), modifier: formatSignedPercent(getStat(stats, "DEF%")) },
    { label: "HEAL", value: formatWhole(getStat(stats, "HEAL")), modifier: formatSignedPercent(getStat(stats, "HEAL%")) },
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
      value: formatPercent(getStat(baseStats, "Overdrive%") / 100, 1),
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
      value: formatPercent(getStat(stats, "Overdrive%") / 100, 1),
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

function GuildCard({
  summary,
}: {
  summary: SummaryState
}) {
  const baseStats = summary.stages.StatsBase

  return (
    <section className={`${cardClass} p-5 sm:p-6`}>
      <GlowLayer />
      <div className="relative space-y-5">
        <CardHeader
          eyebrow="Equivalent In-Game Stats"
          title="Guild Card"
          subtitle={`Live build sync for @${summary.profile.handle}`}
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

function CharacterCard({
  summary,
}: {
  summary: SummaryState
}) {
  return (
    <section className={`${cardClass} p-5 sm:p-6`}>
      <GlowLayer />
      <div className="relative space-y-5">
        <CardHeader
          eyebrow={`@${summary.profile.handle}'s Character Card`}
          title="Point Summary"
          subtitle="Calculated build point totals"
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <DetailTile label="Available Skill Points" value={formatWhole(summary.availableSkillPoints)} />
          <DetailTile label="Used Skill Points" value={formatWhole(summary.usedSkillPoints)} />
          <DetailTile label="Remaining Skill Points" value={formatWhole(summary.remainingSkillPoints)} />
          <DetailTile label="Available Talent Points" value={formatWhole(summary.availableTalentPoints)} />
          <DetailTile label="Used Talent Points" value={formatWhole(summary.usedTalentPoints)} />
          <DetailTile label="Remaining Talent Points" value={formatWhole(summary.remainingTalentPoints)} />
        </div>
      </div>
    </section>
  )
}

function TerminalCard({
  eyebrow,
  title,
  mainRows,
  detailRows,
  typeRows,
  elementRows,
}: {
  eyebrow?: string
  title: string
  mainRows: TerminalMainRow[]
  detailRows: TerminalDetailRow[]
  typeRows: TypeBonusRow[]
  elementRows: ElementRow[]
}) {
  return (
    <section className={`${cardClass} p-5 sm:p-6`}>
      <GlowLayer />
      <div className="relative space-y-5">
        <CardHeader eyebrow={eyebrow} title={title} />

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
          eyebrow={`@${summary.profile.handle}'s Skill Buffs/Debuffs`}
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
                      {formatEffectDelta(delta.delta, delta.stat)}
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

  const baseStats = summary.stages.StatsBase
  const preEffectStats = summary.stages.StatsBuffReady
  const finalStats = summary.stages.StatsDmgReady

  return (
    <div className="p-4 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <GuildCard summary={summary} />

        <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
          <CharacterCard summary={summary} />
          <TerminalCard
            eyebrow="Character Card"
            title="Base Stats & Multipliers"
            mainRows={getBaseMainRows(baseStats)}
            detailRows={getBaseDetailRows(preEffectStats)}
            typeRows={getTypeBonusRows(preEffectStats)}
            elementRows={getElementRows(preEffectStats)}
          />
        </div>

        <TerminalCard
          eyebrow={`@${summary.profile.handle}'s Stats`}
          title="Dungeon Character Card"
          mainRows={getDungeonMainRows(finalStats)}
          detailRows={getDungeonDetailRows(finalStats)}
          typeRows={getTypeBonusRows(finalStats)}
          elementRows={getElementRows(finalStats)}
        />

        <BuffCard summary={summary} />
      </div>
    </div>
  )
}
