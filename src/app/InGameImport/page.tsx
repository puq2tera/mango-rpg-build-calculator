"use client"

import { useEffect, useMemo, useState } from "react"
import CopyTextButton from "@/app/components/CopyTextButton"
import { DUNGEON_UNLOCKS_STORAGE_KEY } from "@/app/data/dungeon_unlocks"
import { ADDITIONAL_STAGE_STATS_STORAGE_KEY, STAGE_STAT_OVERRIDES_STORAGE_KEY } from "@/app/lib/additionalStageStats"
import { dispatchBuildSnapshotUpdated } from "@/app/lib/buildEvents"
import {
  ENABLED_EQUIPMENT_STORAGE_KEY,
  EQUIPMENT_AUTO_LINKED_TAROTS_STORAGE_KEY,
  EQUIPMENT_SLOTS_STORAGE_KEY,
} from "@/app/lib/equipmentSlots"
import { EQUIPMENT_SCRIPT_GROUPS_STORAGE_KEY } from "@/app/lib/equipmentScripts"
import {
  applyInGameImport,
  buildEquipmentImportSlotMarker,
  buildTarotImportRowMarker,
  buildInGameImportCoverageRows,
  countManualLevelRangesByClass,
  countHeroPointDeltas,
  countMainStatValues,
  countSkillPointCost,
  createDefaultInGameImportInputs,
  dedupeManualLevelRanges,
  type EquipmentImportTargetKey,
  type TarotImportRowKey,
  getHeroPointAccountingGap,
  getStoredManualLevelFallbackTotal,
  getMissingClassLevelsByImportedRanges,
  getSkillPointAccountingGap,
  hasReadyInGameImport,
  parseInGameImportInputs,
  type InGameImportCoverageRow,
  type InGameImportInputs,
  type ParsedInGameImport,
  type ParsedTranscriptPageCoverage,
} from "@/app/lib/inGameImport"
import {
  BUFF_SELECTION_STORAGE_KEY,
  SKILL_SELECTION_STORAGE_KEY,
  TALENT_SELECTION_STORAGE_KEY,
} from "@/app/lib/learnCommands"
import { MANUAL_TAROT_SELECTION_STORAGE_KEY } from "@/app/lib/tarotSelections"

type FeedbackTone = "success" | "error" | "info"

type FeedbackState = {
  tone: FeedbackTone
  text: string
}

type SectionTone = "ready" | "partial" | "empty"

type SectionSummary = {
  text: string
  tone: SectionTone
}

type ClassLevelCounts = Record<"tank" | "warrior" | "caster" | "healer", number>

type MultiEntrySectionKey = "skills" | "talents" | "tarots" | "equipment"
type SingleEntrySectionKey = Exclude<keyof InGameImportInputs, MultiEntrySectionKey>

type InGameImportPageInputs = Omit<InGameImportInputs, MultiEntrySectionKey> & {
  skills: string[]
  talents: string[]
  tarots: string[]
  equipment: string[]
}

type ImportSectionConfig = {
  key: keyof InGameImportPageInputs
  title: string
  subtitle: string
  command: string
  placeholder: string
  minHeightClass: string
}

type SectionCommandDisplay = {
  label: string
  copyText: string | null
}

type EquipmentImportRowConfig = {
  label: string
  commandType: string
  importTarget: EquipmentImportTargetKey
}

type TarotImportRowConfig = {
  key: TarotImportRowKey
  label: string
}

type StoredInGameImportPageInputs = Partial<Record<
  keyof InGameImportPageInputs | "searchAuthor" | "searchDate" | "equipmentInputOrderVersion",
  unknown
>>

const INPUT_STORAGE_KEY = "inGameImport:inputs"
const EQUIPMENT_INPUT_ORDER_VERSION = 2
const CLEAR_EXISTING_BUILD_STORAGE_KEYS = [
  SKILL_SELECTION_STORAGE_KEY,
  TALENT_SELECTION_STORAGE_KEY,
  BUFF_SELECTION_STORAGE_KEY,
  "selectedBuffStacks",
  MANUAL_TAROT_SELECTION_STORAGE_KEY,
  "tarotStacks",
  "SelectedRace",
  DUNGEON_UNLOCKS_STORAGE_KEY,
  "SelectedLevels",
  "SelectedLevelOrder",
  "SelectedStatPoints",
  "SelectedStatPointsVersion",
  "SelectedTraining",
  "SelectedHeroPoints",
  "SelectedManualLevelRanges",
  "SelectedManualLevelRangesCollapsed",
  "SelectedManualTrainingEntries",
  "SelectedManualTrainingCollapsed",
  "SelectedRunes",
  EQUIPMENT_SLOTS_STORAGE_KEY,
  ENABLED_EQUIPMENT_STORAGE_KEY,
  EQUIPMENT_AUTO_LINKED_TAROTS_STORAGE_KEY,
  EQUIPMENT_SCRIPT_GROUPS_STORAGE_KEY,
  "Artifact",
  ADDITIONAL_STAGE_STATS_STORAGE_KEY,
  STAGE_STAT_OVERRIDES_STORAGE_KEY,
] as const
const searchCommandSectionKeys = new Set<keyof InGameImportPageInputs>(["skills", "talents", "levelUps", "training", "heroTraining"])
const legacyEquipmentInputOrder: readonly EquipmentImportTargetKey[] = [
  "Helm",
  "Armor",
  "Amulet",
  "Ring1",
  "Ring2",
  "Mainhand",
  "Offhand",
  "Runeshard",
] as const
const equipmentCommandSlotOrder: readonly EquipmentImportRowConfig[] = [
  { label: "Helm", commandType: "Helm", importTarget: "Helm" },
  { label: "Armor", commandType: "Armor", importTarget: "Armor" },
  { label: "Mainhand", commandType: "Mainhand", importTarget: "Mainhand" },
  { label: "Offhand", commandType: "Offhand", importTarget: "Offhand" },
  { label: "Ring1", commandType: "Ring1", importTarget: "Ring1" },
  { label: "Ring2", commandType: "Ring2", importTarget: "Ring2" },
  { label: "Amulet", commandType: "Amulet", importTarget: "Amulet" },
  { label: "Runeshard", commandType: "Runeshard", importTarget: "Runeshard" },
] as const
const equipmentCurrentInputOrder: readonly EquipmentImportTargetKey[] = equipmentCommandSlotOrder.map(
  ({ importTarget }) => importTarget,
)
const tarotImportRowOrder: readonly TarotImportRowConfig[] = [
  { key: "EquippedList", label: "Equipped List" },
  { key: "FiveStar", label: "5-Star" },
  { key: "FourStar", label: "4-Star" },
  { key: "ThreeStar1", label: "3-Star 1" },
  { key: "ThreeStar2", label: "3-Star 2" },
] as const
const artifactRuneTierOrder = ["Low", "Middle", "High", "Legacy", "Divine"] as const
const sectionConfigs: readonly ImportSectionConfig[] = [
  {
    key: "guildCard",
    title: "Guild Card",
    subtitle: "Race, total levels, class levels, and current skill/talent points.",
    command: "cz gc",
    placeholder: `cz gc
Guild Card
Race
Northern Human
Total Levels
411 / 485
T/W/C/H Levels
51/200/60/100
Skill/Talent Points
59 / 120`,
    minHeightClass: "min-h-[12rem]",
  },
  {
    key: "statCard",
    title: "Stat Card",
    subtitle: "Allocated stat points, available stat points, and current hero points. Supports `cz statcard` or pasted `cz statup` result blocks.",
    command: "cz statcard",
    placeholder: `cz statcard
...
391 Stat Points Available to Allocate
484 Hero Points Available
...
    ATK  : +20

or

cz statup matk 485
Stat Up Record
MATK : +485
0 Stat Points left to allocate`,
    minHeightClass: "min-h-[12rem]",
  },
  {
    key: "artifact",
    title: "Artifact",
    subtitle: "Imports artifact level, ATK/DEF/MATK/HEAL bonuses, and equipped runes.",
    command: "cz artifact",
    placeholder: `Username or User ID's Artifact - Level 2390 / 2391 :star:+197
:sparkle: Artifact
:crossed_swords: +ATK %
404
:shield: +DEF %
406
:fire: +MATK %
366
:blue_heart: +Healpower %
391
Low : 9
    Experience, Experience, Experience`,
    minHeightClass: "min-h-[14rem]",
  },
  {
    key: "tarots",
    title: "Tarots",
    subtitle: "Paste one `equippedcards` result, then the matching 5-star, 4-star, and two 3-star `viewmycard` results.",
    command: "cz tarot equippedcards Username or User ID",
    placeholder: "Paste the tarot outputs into the matching rows below.",
    minHeightClass: "min-h-[14rem]",
  },
  {
    key: "training",
    title: "Training",
    subtitle: "Optional. Adds imported `training` or `xtraining` results onto current training.",
    command: "cz xtraining",
    placeholder: `cz xtraining
Training Complete!
[ atk ] Training
+4`,
    minHeightClass: "min-h-[12rem]",
  },
  {
    key: "skills",
    title: "Skill Pages",
    subtitle: "Paste each `skillpage` result into its matching page row, or paste `learnskill` / `xlearnskill` commands into any row.",
    command: "cz skillpage 1",
    placeholder: "Paste a `skillpage` result or `learnskill` / `xlearnskill` command into a row below.",
    minHeightClass: "min-h-[14rem]",
  },
  {
    key: "talents",
    title: "Talent Pages",
    subtitle: "Paste each `talentpage` result into its matching page row, or paste `learntalent` / `xlearntalent` commands into any row.",
    command: "cz talentpage 1",
    placeholder: "Paste a `talentpage` result or `learntalent` / `xlearntalent` command into a row below.",
    minHeightClass: "min-h-[14rem]",
  },
  {
    key: "levelUps",
    title: "Level Up",
    subtitle: "Optional. Merges `levelup` or `xlevelup` transcript ranges into Stat Fix manual ranges.",
    command: "cz xlevelup",
    placeholder: `cz xlevelup
Level Up!
Total Level
270
+HP
6,491`,
    minHeightClass: "min-h-[12rem]",
  },
  {
    key: "heroTraining",
    title: "Hero Training",
    subtitle: "Optional. Adds imported `herotraining` results onto current hero training.",
    command: "cz herotraining",
    placeholder: `cz herotraining
:star: Hero Training
atkmulti
+4
Hero PTs Spent
1`,
    minHeightClass: "min-h-[12rem]",
  },
  {
    key: "equipment",
    title: "Equipment",
    subtitle: "Paste each `itemequipview` result into the matching Helm, Armor, Mainhand, Offhand, Ring1, Ring2, Amulet, or Runeshard row.",
    command: "cz itemequipview Helm",
    placeholder: "Paste an `itemequipview` result into the matching slot row below.",
    minHeightClass: "min-h-[14rem]",
  },
] as const

const cardClass =
  "rounded-[22px] border border-slate-800/80 bg-slate-950/75 shadow-[0_20px_64px_rgba(2,6,23,0.4)] backdrop-blur"

const textareaBaseClass =
  "w-full rounded-[18px] border border-slate-700 bg-slate-950/90 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-sky-400/70"

const rowTextareaClass =
  "h-11 w-full resize-none overflow-y-auto rounded-xl border border-slate-700 bg-slate-950/90 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-sky-400/70"

const secondaryButtonClass =
  "rounded-xl border border-slate-700 bg-slate-950/90 px-3 py-2 text-sm font-semibold text-slate-100 transition hover:border-sky-400/50 hover:text-sky-200 disabled:cursor-not-allowed disabled:opacity-50"

const primaryButtonClass =
  "rounded-xl border border-sky-500/60 bg-sky-500/10 px-3 py-2 text-sm font-semibold text-sky-100 transition hover:bg-sky-500/15 disabled:cursor-not-allowed disabled:opacity-50"

const dangerButtonClass =
  "rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm font-semibold text-rose-100 transition hover:bg-rose-500/15 disabled:cursor-not-allowed disabled:opacity-50"

const feedbackClassByTone: Record<FeedbackTone, string> = {
  success: "border-emerald-500/40 bg-emerald-500/10 text-emerald-100",
  error: "border-rose-500/40 bg-rose-500/10 text-rose-100",
  info: "border-slate-700 bg-slate-900/80 text-slate-200",
}

const sectionToneClass: Record<SectionTone, string> = {
  ready: "border-emerald-500/40 bg-emerald-500/10 text-emerald-100",
  partial: "border-amber-500/40 bg-amber-500/10 text-amber-100",
  empty: "border-slate-700 bg-slate-900/80 text-slate-300",
}

const sectionSummaryBoxClass: Record<SectionTone, string> = {
  ready: "border-emerald-500/40 bg-emerald-500/10 text-emerald-100",
  partial: "border-amber-500/40 bg-amber-500/10 text-amber-100",
  empty: "border-rose-500/40 bg-rose-500/10 text-rose-100",
}

const coverageStatusClass: Record<InGameImportCoverageRow["status"], string> = {
  ok: "border-emerald-500/40 bg-emerald-500/10 text-emerald-100",
  missing: "border-amber-500/40 bg-amber-500/10 text-amber-100",
  warning: "border-rose-500/40 bg-rose-500/10 text-rose-100",
  "needs-source": "border-slate-700 bg-slate-900/80 text-slate-300",
}

const coverageStatusLabel: Record<InGameImportCoverageRow["status"], string> = {
  ok: "OK",
  missing: "Missing",
  warning: "Mismatch",
  "needs-source": "Need Input",
}

const coverageStatusOrder: Record<InGameImportCoverageRow["status"], number> = {
  missing: 0,
  warning: 1,
  "needs-source": 2,
  ok: 3,
}

function createDefaultPageInputs(): InGameImportPageInputs {
  const defaults = createDefaultInGameImportInputs()

  return {
    ...defaults,
    skills: [""],
    talents: [""],
    tarots: Array.from({ length: tarotImportRowOrder.length }, () => ""),
    equipment: Array.from({ length: equipmentCommandSlotOrder.length }, () => ""),
  }
}

function normalizeTranscriptText(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\u3164/g, " ")
}

function normalizeSearchAuthor(value: string): string {
  const trimmedValue = value.trim()
  const mentionMatch = trimmedValue.match(/^<@!?(\d+)>$/)

  if (mentionMatch) {
    return mentionMatch[1]
  }

  return trimmedValue.replace(/^@/, "")
}

function normalizeSearchDate(value: string): string {
  const trimmedValue = value.trim()
  const match = trimmedValue.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) {
    return trimmedValue
  }

  const year = Number(match[1])
  const monthIndex = Number(match[2]) - 1
  const day = Number(match[3])
  const parsedDate = new Date(Date.UTC(year, monthIndex, day))
  if (
    Number.isNaN(parsedDate.getTime())
    || parsedDate.getUTCFullYear() !== year
    || parsedDate.getUTCMonth() !== monthIndex
    || parsedDate.getUTCDate() !== day
  ) {
    return trimmedValue
  }

  parsedDate.setUTCDate(parsedDate.getUTCDate() - 1)
  return parsedDate.toISOString().slice(0, 10)
}

function splitStoredBlocks(value: string): string[] {
  return normalizeTranscriptText(value)
    .split(/\n{2,}/)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
}

function reorderEquipmentInputs(
  values: readonly string[],
  sourceOrder: readonly EquipmentImportTargetKey[],
  targetOrder: readonly EquipmentImportTargetKey[],
): string[] {
  const valuesByTarget = new Map<EquipmentImportTargetKey, string>()

  for (const [index, target] of sourceOrder.entries()) {
    valuesByTarget.set(target, values[index] ?? "")
  }

  return targetOrder.map((target) => valuesByTarget.get(target) ?? "")
}

function normalizeListInput(
  value: unknown,
  minimumLength: number,
  fixedLength = false,
): string[] {
  const fromArray = Array.isArray(value)
    ? value.map((entry) => typeof entry === "string" ? entry : "")
    : typeof value === "string"
      ? splitStoredBlocks(value)
      : []

  const nextList = fixedLength
    ? Array.from({ length: minimumLength }, (_, index) => fromArray[index] ?? "")
    : [...fromArray]

  if (!fixedLength && nextList.length < minimumLength) {
    nextList.push(...Array.from({ length: minimumLength - nextList.length }, () => ""))
  }

  return nextList
}

function normalizeEquipmentListInput(value: unknown, storedOrderVersion = 1): string[] {
  const fromArray = Array.isArray(value)
    ? value.map((entry) => typeof entry === "string" ? entry : "")
    : typeof value === "string"
      ? splitStoredBlocks(value)
      : []

  const legacyExpandedArray = fromArray.length === 6
    ? [
        fromArray[0] ?? "",
        fromArray[1] ?? "",
        fromArray[2] ?? "",
        fromArray[3] ?? "",
        "",
        fromArray[4] ?? "",
        "",
        fromArray[5] ?? "",
      ]
    : fromArray

  const reorderedArray = storedOrderVersion >= EQUIPMENT_INPUT_ORDER_VERSION
    ? legacyExpandedArray
    : reorderEquipmentInputs(legacyExpandedArray, legacyEquipmentInputOrder, equipmentCurrentInputOrder)

  return Array.from({ length: equipmentCommandSlotOrder.length }, (_, index) => reorderedArray[index] ?? "")
}

function normalizePageInputs(raw: unknown): InGameImportPageInputs {
  const defaults = createDefaultPageInputs()

  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return defaults
  }

  const value = raw as Partial<Record<keyof InGameImportPageInputs | "equipmentInputOrderVersion", unknown>>
  const storedEquipmentInputOrderVersion =
    typeof value.equipmentInputOrderVersion === "number" && Number.isFinite(value.equipmentInputOrderVersion)
      ? Math.max(1, Math.floor(value.equipmentInputOrderVersion))
      : 1

  return {
    guildCard: typeof value.guildCard === "string" ? value.guildCard : defaults.guildCard,
    statCard: typeof value.statCard === "string" ? value.statCard : defaults.statCard,
    artifact: typeof value.artifact === "string" ? value.artifact : defaults.artifact,
    levelUps: typeof value.levelUps === "string" ? value.levelUps : defaults.levelUps,
    training: typeof value.training === "string" ? value.training : defaults.training,
    heroTraining: typeof value.heroTraining === "string" ? value.heroTraining : defaults.heroTraining,
    skills: normalizeListInput(value.skills, 1),
    talents: normalizeListInput(value.talents, 1),
    tarots: normalizeListInput(value.tarots, tarotImportRowOrder.length, true),
    equipment: normalizeEquipmentListInput(value.equipment, storedEquipmentInputOrderVersion),
  }
}

function serializePageInputs(inputs: InGameImportPageInputs): InGameImportInputs {
  return {
    guildCard: inputs.guildCard,
    statCard: inputs.statCard,
    artifact: inputs.artifact,
    levelUps: inputs.levelUps,
    training: inputs.training,
    heroTraining: inputs.heroTraining,
    skills: inputs.skills.map((entry) => entry.trim()).filter((entry) => entry.length > 0).join("\n\n"),
    talents: inputs.talents.map((entry) => entry.trim()).filter((entry) => entry.length > 0).join("\n\n"),
    tarots: inputs.tarots
      .map((entry, index) => {
        const trimmedEntry = entry.trim()
        if (trimmedEntry.length === 0) {
          return ""
        }

        const row = tarotImportRowOrder[index]
        return row
          ? `${buildTarotImportRowMarker(row.key)}\n${trimmedEntry}`
          : trimmedEntry
      })
      .filter((entry) => entry.length > 0)
      .join("\n\n"),
    equipment: inputs.equipment
      .map((entry, index) => {
        const trimmedEntry = entry.trim()
        if (trimmedEntry.length === 0) {
          return ""
        }

        const row = equipmentCommandSlotOrder[index]
        return row
          ? `${buildEquipmentImportSlotMarker(row.importTarget)}\n${trimmedEntry}`
          : trimmedEntry
      })
      .filter((entry) => entry.length > 0)
      .join("\n\n"),
  }
}

function hasAnyInputValue(inputs: InGameImportPageInputs): boolean {
  return [
    inputs.guildCard,
    inputs.statCard,
    inputs.artifact,
    inputs.levelUps,
    inputs.training,
    inputs.heroTraining,
    ...inputs.skills,
    ...inputs.talents,
    ...inputs.tarots,
    ...inputs.equipment,
  ].some((value) => value.trim().length > 0)
}

function trimTrailingEmptyEntries(entries: string[]): string[] {
  const nextEntries = [...entries]

  while (nextEntries.length > 1 && nextEntries[nextEntries.length - 1]?.trim().length === 0) {
    nextEntries.pop()
  }

  return nextEntries.length > 0 ? nextEntries : [""]
}

function getHighestFilledIndex(entries: readonly string[]): number {
  for (let index = entries.length - 1; index >= 0; index -= 1) {
    if (entries[index]?.trim().length > 0) {
      return index + 1
    }
  }

  return 0
}

function getPageRowCount(entries: readonly string[], coverage: ParsedTranscriptPageCoverage | null): number {
  return Math.max(coverage?.totalPages ?? 0, getHighestFilledIndex(entries), 1)
}

function hasStoredBuildData(storage: Storage): boolean {
  return CLEAR_EXISTING_BUILD_STORAGE_KEYS.some((key) => storage.getItem(key) !== null)
}

function CommandCopyChip({ command }: { command: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <code className="rounded bg-slate-900 px-2 py-1 text-xs text-sky-100">{command}</code>
      <CopyTextButton
        iconOnly
        label={`Copy ${command}`}
        text={command}
        className="h-8 w-8"
      />
    </div>
  )
}

function CommandDisplay({ command }: { command: SectionCommandDisplay }) {
  if (command.copyText === null) {
    return (
      <span className="rounded bg-slate-900 px-2 py-1 text-xs text-sky-100">
        {command.label}
      </span>
    )
  }

  return <CommandCopyChip command={command.copyText} />
}

function formatPageCoverage(coverage: ParsedTranscriptPageCoverage | null): string {
  if (!coverage) {
    return "No page count"
  }

  return `${coverage.foundPages.length}/${coverage.totalPages} pages`
}

function buildAuthorSearchCommand(searchAuthor: string, searchDate: string, command: string): string | null {
  const normalizedSearchAuthor = normalizeSearchAuthor(searchAuthor)
  const normalizedSearchDate = normalizeSearchDate(searchDate)

  if (normalizedSearchAuthor.length === 0) {
    return null
  }

  return normalizedSearchDate.length > 0
    ? `from: ${normalizedSearchAuthor} after: ${normalizedSearchDate} ${command}`
    : `from: ${normalizedSearchAuthor} ${command}`
}

function getLevelUpSearchCommands(searchAuthor: string, searchDate: string): SectionCommandDisplay[] {
  return ["cz xlevelup", "cz levelup"].map((command) => ({
    label: command,
    copyText: buildAuthorSearchCommand(searchAuthor, searchDate, command),
  }))
}

function getSkillLearnSearchCommands(searchAuthor: string, searchDate: string): SectionCommandDisplay[] {
  return ["cz learnskill", "cz xlearnskill"].map((command) => ({
    label: command,
    copyText: buildAuthorSearchCommand(searchAuthor, searchDate, command),
  }))
}

function getTalentLearnSearchCommands(searchAuthor: string, searchDate: string): SectionCommandDisplay[] {
  return ["cz learntalent", "cz xlearntalent"].map((command) => ({
    label: command,
    copyText: buildAuthorSearchCommand(searchAuthor, searchDate, command),
  }))
}

function getUtilitySearchCommands(searchAuthor: string): SectionCommandDisplay[] {
  return ["cz isekai", "cz respec", "cz respecvoucher"].map((command) => ({
    label: command,
    copyText: buildAuthorSearchCommand(searchAuthor, "", command),
  }))
}

function summarizeStatBreakdown(values: Record<"ATK" | "DEF" | "MATK" | "HEAL", number>): string {
  const parts = ([
    ["ATK", values.ATK],
    ["DEF", values.DEF],
    ["MATK", values.MATK],
    ["HEAL", values.HEAL],
  ] as const)
    .filter(([, value]) => value > 0)
    .map(([label, value]) => `${label} +${value}`)

  return parts.length > 0 ? parts.join(", ") : "No imported rows"
}

function summarizeHeroBreakdown(deltas: Record<string, number>): string {
  const parts = Object.entries(deltas)
    .filter(([, value]) => value > 0)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key} +${value}`)

  if (parts.length === 0) {
    return "No hero training imported"
  }

  return parts.length <= 4 ? parts.join(", ") : `${parts.slice(0, 4).join(", ")}, +${parts.length - 4} more`
}

function formatPointCount(value: number, label: string): string {
  return `${value.toLocaleString("en-US")} ${label} point${value === 1 ? "" : "s"}`
}

function formatClassLevelCounts(levels: ClassLevelCounts): string {
  return `${levels.tank}/${levels.warrior}/${levels.caster}/${levels.healer}`
}

function countTotalClassLevels(levels: ClassLevelCounts | null): number {
  if (!levels) {
    return 0
  }

  return levels.tank + levels.warrior + levels.caster + levels.healer
}

function formatArtifactValue(value: number | undefined): string {
  return typeof value === "number" ? value.toLocaleString("en-US") : "?"
}

function formatArtifactRuneSummary(parsedArtifact: ParsedInGameImport["artifact"]): string {
  if (parsedArtifact.seenRuneTiers.length === 0) {
    return "Runes missing"
  }

  const counts = artifactRuneTierOrder.map((tier) => (
    parsedArtifact.runes[tier].reduce((sum, entry) => sum + entry.count, 0)
  ))

  return `Runes L/M/H/Lg/D ${counts.join("/")}`
}

function summarizeImportedTarotNames(names: readonly string[]): string {
  if (names.length === 0) {
    return "No tarots equipped"
  }

  return names.length <= 3
    ? names.join(", ")
    : `${names.slice(0, 3).join(", ")}, +${names.length - 3} more`
}

function getSectionSummaries(parsed: ParsedInGameImport): Record<keyof InGameImportPageInputs, SectionSummary> {
  const skillLearnCommandSummary: SectionSummary | null = parsed.skills.learnCommandCount > 0
    && parsed.skills.pageCoverage === null
    && parsed.skills.foundNames.length > 0
    ? {
        tone: parsed.skills.namesToApply ? "ready" : "partial",
        text: parsed.guildCard.availableSkillPoints !== null
          ? `${parsed.skills.foundNames.length} skills found from learn commands. Covers ${formatPointCount(countSkillPointCost(parsed.skills.foundNames), "skill")} spent; ${formatPointCount(parsed.guildCard.availableSkillPoints, "skill")} remain on the Guild Card.`
          : `${parsed.skills.foundNames.length} skills found from learn commands. Covers ${formatPointCount(countSkillPointCost(parsed.skills.foundNames), "skill")} spent. Paste a Guild Card to see remaining skill points.`,
      }
    : null
  const skillSummary: SectionSummary = parsed.skills.foundNames.length === 0 && !parsed.skills.pageCoverage && parsed.skills.learnCommandCount === 0
    ? { tone: "empty", text: "No skill pages or learn commands pasted yet." }
    : skillLearnCommandSummary
      ? skillLearnCommandSummary
    : parsed.skills.namesToApply
      ? { tone: "ready", text: `${parsed.skills.foundNames.length} skills found, ${formatPageCoverage(parsed.skills.pageCoverage)}.` }
      : { tone: "partial", text: `${parsed.skills.foundNames.length} skills found, ${formatPageCoverage(parsed.skills.pageCoverage)}. Paste every page into its matching row.` }

  const talentLearnCommandSummary: SectionSummary | null = parsed.talents.learnCommandCount > 0
    && parsed.talents.pageCoverage === null
    && parsed.talents.foundNames.length > 0
    ? (() => {
        if (parsed.guildCard.totalLevels === null || parsed.guildCard.availableTalentPoints === null) {
          return {
            tone: "ready",
            text: `${parsed.talents.foundNames.length} talents found from learn commands. Paste a Guild Card to see how many talents should exist.`,
          }
        }

        const expectedTalentPoints = Math.ceil(parsed.guildCard.totalLevels / 2)
        const existingTalentCount = Math.max(0, expectedTalentPoints - parsed.guildCard.availableTalentPoints)
        const missingTalentCount = Math.max(0, existingTalentCount - parsed.talents.foundNames.length)
        const extraTalentCount = Math.max(0, parsed.talents.foundNames.length - existingTalentCount)

        if (extraTalentCount > 0) {
          return {
            tone: "partial",
            text: `${parsed.talents.foundNames.length} talents found from learn commands. Missing 0 talents. ${existingTalentCount} talents exist. Found ${extraTalentCount} extra talent${extraTalentCount === 1 ? "" : "s"} beyond that count.`,
          }
        }

        return {
          tone: missingTalentCount === 0 ? "ready" : "partial",
          text: `${parsed.talents.foundNames.length} talents found from learn commands. Missing ${missingTalentCount} talent${missingTalentCount === 1 ? "" : "s"}. ${existingTalentCount} talent${existingTalentCount === 1 ? "" : "s"} exist.`,
        }
      })()
    : null
  const talentSummary: SectionSummary = parsed.talents.foundNames.length === 0 && !parsed.talents.pageCoverage && parsed.talents.learnCommandCount === 0
    ? { tone: "empty", text: "No talent pages or learn commands pasted yet." }
    : talentLearnCommandSummary
      ? talentLearnCommandSummary
    : parsed.talents.namesToApply
      ? { tone: "ready", text: `${parsed.talents.foundNames.length} talents found, ${formatPageCoverage(parsed.talents.pageCoverage)}.` }
      : { tone: "partial", text: `${parsed.talents.foundNames.length} talents found, ${formatPageCoverage(parsed.talents.pageCoverage)}. Paste every page into its matching row.` }

  const guildCardSummary: SectionSummary = parsed.guildCard.totalLevels === null && parsed.guildCard.raceTag === null
    ? { tone: "empty", text: "No Guild Card pasted yet." }
    : {
        tone: parsed.guildCard.totalLevels !== null && parsed.guildCard.availableSkillPoints !== null && parsed.guildCard.availableTalentPoints !== null ? "ready" : "partial",
        text: [
          parsed.guildCard.raceTag ? `Race ${parsed.guildCard.raceTag}` : null,
          parsed.guildCard.levels ? `Levels ${parsed.guildCard.levels.tank}/${parsed.guildCard.levels.warrior}/${parsed.guildCard.levels.caster}/${parsed.guildCard.levels.healer}` : null,
          parsed.guildCard.availableSkillPoints !== null && parsed.guildCard.availableTalentPoints !== null
            ? `SP/TP left ${parsed.guildCard.availableSkillPoints}/${parsed.guildCard.availableTalentPoints}`
            : "SP/TP left missing",
        ].filter((value): value is string => value !== null).join(", "),
      }

  const statCardSummary: SectionSummary = parsed.statCard.statPoints === null && parsed.statCard.availableStatPoints === null && parsed.statCard.availableHeroPoints === null
    ? { tone: "empty", text: "No Stat Card or statup transcript pasted yet." }
    : {
        tone: parsed.statCard.statPoints !== null && parsed.statCard.availableStatPoints !== null ? "ready" : "partial",
        text: [
          parsed.statCard.statPoints ? summarizeStatBreakdown(parsed.statCard.statPoints) : "Allocated stats missing",
          parsed.statCard.availableStatPoints !== null ? `${parsed.statCard.availableStatPoints} stat left` : "Stat points left missing",
          parsed.statCard.availableHeroPoints !== null ? `${parsed.statCard.availableHeroPoints} hero left` : "Hero points left missing",
        ].join(", "),
      }

  const artifactFieldCount = Object.keys(parsed.artifact.values).length
  const hasArtifactRunes = parsed.artifact.seenRuneTiers.length > 0
  const hasCompleteArtifact =
    parsed.artifact.values.Level !== undefined
    && parsed.artifact.values["ATK%"] !== undefined
    && parsed.artifact.values["DEF%"] !== undefined
    && parsed.artifact.values["MATK%"] !== undefined
    && parsed.artifact.values["HEAL%"] !== undefined
    && parsed.artifact.seenRuneTiers.length === artifactRuneTierOrder.length
  const artifactSummary: SectionSummary = artifactFieldCount === 0 && !hasArtifactRunes
    ? { tone: "empty", text: "No artifact block pasted yet." }
    : {
        tone: hasCompleteArtifact ? "ready" : "partial",
        text: [
          parsed.artifact.values.Level !== undefined ? `Level ${parsed.artifact.values.Level.toLocaleString("en-US")}` : "Level missing",
          `ATK/DEF/MATK/HEAL ${formatArtifactValue(parsed.artifact.values["ATK%"])}/${formatArtifactValue(parsed.artifact.values["DEF%"])}/${formatArtifactValue(parsed.artifact.values["MATK%"])}/${formatArtifactValue(parsed.artifact.values["HEAL%"])}`,
          formatArtifactRuneSummary(parsed.artifact),
        ].join(", "),
      }

  const tarotSummary: SectionSummary = parsed.tarots.namesToApply === null && parsed.tarots.viewCardsFound.length === 0
    ? { tone: "empty", text: "No tarot transcripts pasted yet." }
    : parsed.tarots.namesToApply === null
      ? {
          tone: "partial",
          text: `${parsed.tarots.viewCardsFound.length} tarot view card transcript${parsed.tarots.viewCardsFound.length === 1 ? "" : "s"} found. Paste the equipped tarot list first.`,
        }
      : parsed.tarots.equippedNames.length === 0
        ? {
            tone: "ready",
            text: "Equipped tarot list parsed. No tarots are equipped.",
          }
        : parsed.tarots.missingDetailNames.length === 0
          ? {
              tone: "ready",
              text: `${parsed.tarots.equippedNames.length} equipped tarot${parsed.tarots.equippedNames.length === 1 ? "" : "s"}: ${summarizeImportedTarotNames(parsed.tarots.equippedNames)}. Awakening imported for all equipped cards.`,
            }
          : {
              tone: "partial",
              text: `${parsed.tarots.equippedNames.length} equipped tarot${parsed.tarots.equippedNames.length === 1 ? "" : "s"}: ${summarizeImportedTarotNames(parsed.tarots.equippedNames)}. Awakening imported for ${parsed.tarots.equippedNames.length - parsed.tarots.missingDetailNames.length}/${parsed.tarots.equippedNames.length}. Paste ${parsed.tarots.missingDetailNames.length} more viewmycard transcript${parsed.tarots.missingDetailNames.length === 1 ? "" : "s"}.`,
            }

  const dedupedManualLevelRanges = dedupeManualLevelRanges(parsed.manualLevelRanges)
  const duplicateManualRangeCount = Math.max(0, parsed.manualLevelRanges.length - dedupedManualLevelRanges.length)
  const importedClassLevels = countManualLevelRangesByClass(dedupedManualLevelRanges)
  const missingClassLevels = getMissingClassLevelsByImportedRanges(parsed.guildCard.levels, dedupedManualLevelRanges)
  const missingClassLevelTotal = countTotalClassLevels(missingClassLevels)
  const importedClassLevelTotal = countTotalClassLevels(importedClassLevels)
  const duplicateManualRangeNote = duplicateManualRangeCount > 0
    ? ` ${duplicateManualRangeCount} duplicate range${duplicateManualRangeCount === 1 ? "" : "s"} will be ignored on import.`
    : ""
  const levelSummary: SectionSummary = missingClassLevels
    ? missingClassLevelTotal === 0
      ? {
          tone: "ready",
          text: `${dedupedManualLevelRanges.length} manual range${dedupedManualLevelRanges.length === 1 ? "" : "s"} parsed. Imported T/W/C/H ${formatClassLevelCounts(importedClassLevels)}. No class levels missing.${duplicateManualRangeNote}`,
        }
      : {
          tone: "partial",
          text: `${dedupedManualLevelRanges.length} manual range${dedupedManualLevelRanges.length === 1 ? "" : "s"} parsed. Imported T/W/C/H ${formatClassLevelCounts(importedClassLevels)}. Missing T/W/C/H ${formatClassLevelCounts(missingClassLevels)}.${duplicateManualRangeNote}`,
        }
    : importedClassLevelTotal > 0
      ? {
          tone: "partial",
          text: `${dedupedManualLevelRanges.length} manual range${dedupedManualLevelRanges.length === 1 ? "" : "s"} parsed. Imported T/W/C/H ${formatClassLevelCounts(importedClassLevels)}. Paste a Guild Card to see what is missing.${duplicateManualRangeNote}`,
        }
      : { tone: "empty", text: "No level-up ranges imported." }

  const trainingPoints = countMainStatValues(parsed.trainingTotals)
  const skillPointGap = getSkillPointAccountingGap(parsed)
  const incompleteSkillPages = parsed.skills.pageCoverage ? !parsed.skills.pageCoverage.complete : false
  const trainingGapNote = incompleteSkillPages
    ? " Skill pages are still incomplete, so this may shrink once every page is pasted."
    : ""
  const trainingSummary: SectionSummary = skillPointGap !== null
    ? skillPointGap > 0
      ? trainingPoints === 0
        ? {
            tone: "partial",
            text: `No training transcripts imported. ${skillPointGap} training point${skillPointGap === 1 ? "" : "s"} still missing from skill-point accounting.${trainingGapNote}`,
          }
        : {
            tone: "partial",
            text: `${trainingPoints} training point${trainingPoints === 1 ? "" : "s"} imported: ${summarizeStatBreakdown(parsed.trainingTotals)}. ${skillPointGap} more training point${skillPointGap === 1 ? "" : "s"} still missing from skill-point accounting.${trainingGapNote}`,
          }
      : skillPointGap < 0
        ? {
            tone: "partial",
            text: `${trainingPoints} training point${trainingPoints === 1 ? "" : "s"} imported: ${summarizeStatBreakdown(parsed.trainingTotals)}. Skill-point accounting is over by ${Math.abs(skillPointGap)}.`,
          }
        : trainingPoints === 0
          ? {
              tone: "ready",
              text: "No training transcripts imported, and no training points are missing from skill-point accounting.",
            }
          : {
              tone: "ready",
              text: `${trainingPoints} training point${trainingPoints === 1 ? "" : "s"} imported: ${summarizeStatBreakdown(parsed.trainingTotals)}. No training points missing from skill-point accounting.`,
            }
    : trainingPoints === 0
      ? { tone: "empty", text: "No training transcripts imported." }
      : { tone: "ready", text: `${trainingPoints} training point${trainingPoints === 1 ? "" : "s"} imported: ${summarizeStatBreakdown(parsed.trainingTotals)}.` }

  const heroTrainingCount = countHeroPointDeltas(parsed.heroTraining.deltas)
  const heroPointGap = getHeroPointAccountingGap(parsed)
  const incompleteTalentPages = parsed.talents.pageCoverage ? !parsed.talents.pageCoverage.complete : false
  const heroGapNote = incompleteTalentPages
    ? " Talent pages are still incomplete, so this may shrink once every page is pasted."
    : ""
  const heroTrainingSummary: SectionSummary = heroPointGap !== null
    ? heroPointGap > 0
      ? heroTrainingCount === 0
        ? {
            tone: "partial",
            text: `No hero training transcripts imported. ${heroPointGap} hero point${heroPointGap === 1 ? "" : "s"} still missing from hero-point accounting.${heroGapNote}`,
          }
        : {
            tone: "partial",
            text: `${heroTrainingCount} hero training purchase${heroTrainingCount === 1 ? "" : "s"} imported: ${summarizeHeroBreakdown(parsed.heroTraining.deltas as Record<string, number>)}. ${heroPointGap} more hero point${heroPointGap === 1 ? "" : "s"} still missing from hero-point accounting.${heroGapNote}`,
          }
      : heroPointGap < 0
        ? {
            tone: "partial",
            text: `${heroTrainingCount} hero training purchase${heroTrainingCount === 1 ? "" : "s"} imported: ${summarizeHeroBreakdown(parsed.heroTraining.deltas as Record<string, number>)}. Hero-point accounting is over by ${Math.abs(heroPointGap)}.`,
          }
        : heroTrainingCount === 0
          ? {
              tone: "ready",
              text: "No hero training transcripts imported, and no hero points are missing from hero-point accounting.",
            }
          : {
              tone: "ready",
              text: `${heroTrainingCount} hero training purchase${heroTrainingCount === 1 ? "" : "s"} imported: ${summarizeHeroBreakdown(parsed.heroTraining.deltas as Record<string, number>)}. No hero points missing from hero-point accounting.`,
            }
    : heroTrainingCount === 0
      ? { tone: "empty", text: "No hero training transcripts imported." }
      : { tone: "ready", text: `${heroTrainingCount} hero training purchase${heroTrainingCount === 1 ? "" : "s"} imported: ${summarizeHeroBreakdown(parsed.heroTraining.deltas as Record<string, number>)}.` }

  const equipmentSummary: SectionSummary = parsed.equipmentSlots.length === 0
    ? { tone: "empty", text: "No equipment blocks imported." }
    : { tone: "ready", text: `${parsed.equipmentSlots.length} equipment item${parsed.equipmentSlots.length === 1 ? "" : "s"} parsed for merge.` }

  return {
    guildCard: guildCardSummary,
    statCard: statCardSummary,
    artifact: artifactSummary,
    tarots: tarotSummary,
    skills: skillSummary,
    talents: talentSummary,
    levelUps: levelSummary,
    training: trainingSummary,
    heroTraining: heroTrainingSummary,
    equipment: equipmentSummary,
  }
}

function getSectionCommandDisplay(
  section: ImportSectionConfig,
  searchAuthor: string,
  searchDate: string,
): SectionCommandDisplay {
  switch (section.key) {
    case "skills":
    case "talents":
    case "tarots":
    case "equipment":
      return {
        label: "Use row commands below",
        copyText: null,
      }
    case "artifact":
      {
        const normalizedSearchAuthor = normalizeSearchAuthor(searchAuthor)

        return normalizedSearchAuthor.length > 0
          ? {
              label: `cz artifact ${normalizedSearchAuthor}`,
              copyText: `cz artifact ${normalizedSearchAuthor}`,
            }
          : {
              label: "Paste a Username or User ID above to build the command",
              copyText: null,
            }
      }
    case "guildCard":
      {
        const normalizedSearchAuthor = normalizeSearchAuthor(searchAuthor)
        const command = normalizedSearchAuthor.length > 0
          ? `cz gc ${normalizedSearchAuthor}`
          : section.command

        return {
          label: command,
          copyText: command,
        }
      }
    case "levelUps":
    case "training":
    case "heroTraining":
      {
        const searchCommand = buildAuthorSearchCommand(searchAuthor, searchDate, section.command)

        return searchCommand
          ? {
              label: searchCommand,
              copyText: searchCommand,
            }
          : {
              label: "Paste a Username or User ID above to build a search",
              copyText: null,
            }
      }
    case "statCard":
      return {
        label: section.command,
        copyText: section.command,
      }
    default:
      return {
        label: section.command,
        copyText: section.command,
      }
  }
}

function getSkillRowCommand(index: number): SectionCommandDisplay {
  const command = `cz skillpage ${index + 1}`

  return {
    label: command,
    copyText: command,
  }
}

function getTalentRowCommand(index: number): SectionCommandDisplay {
  const command = `cz talentpage ${index + 1}`

  return {
    label: command,
    copyText: command,
  }
}

function getMultiEntryRowPlaceholder(section: MultiEntrySectionKey, commandLabel: string): string {
  switch (section) {
    case "skills":
      return "Paste a skillpage result or learnskill/xlearnskill command here"
    case "talents":
      return "Paste a talentpage result or learntalent/xlearntalent command here"
    default:
      return `Paste ${commandLabel} output here`
  }
}

function getEquipmentRowCommand(index: number): SectionCommandDisplay {
  const row = equipmentCommandSlotOrder[index]
  const command = `cz itemequipview ${row?.commandType ?? `Slot${index + 1}`}`

  return {
    label: command,
    copyText: command,
  }
}

function getTarotRowLabel(index: number, parsedTarots: ParsedInGameImport["tarots"]): string {
  const row = tarotImportRowOrder[index]
  if (!row) {
    return `Tarot Slot ${index + 1}`
  }

  if (row.key === "EquippedList") {
    return row.label
  }

  const slot = parsedTarots.equippedSlots.find((entry) => entry.rowKey === row.key)
  return slot?.name ? `${row.label} (${slot.name})` : `${row.label} (None)`
}

function getTarotRowCommand(
  index: number,
  searchAuthor: string,
  parsedTarots: ParsedInGameImport["tarots"],
): SectionCommandDisplay {
  const row = tarotImportRowOrder[index]

  if (!row) {
    return {
      label: `Tarot Slot ${index + 1}`,
      copyText: null,
    }
  }

  if (row.key === "EquippedList") {
    const normalizedSearchAuthor = normalizeSearchAuthor(searchAuthor)

    return normalizedSearchAuthor.length > 0
      ? {
          label: `cz tarot equippedcards ${normalizedSearchAuthor}`,
          copyText: `cz tarot equippedcards ${normalizedSearchAuthor}`,
        }
      : {
          label: "Paste a Username or User ID above to build the command",
          copyText: null,
        }
  }

  const slot = parsedTarots.equippedSlots.find((entry) => entry.rowKey === row.key)
  if (!slot?.name) {
    return {
      label: `No ${row.label.toLowerCase()} tarot equipped`,
      copyText: null,
    }
  }

  const command = `cz tarot viewmycard ${slot.name}`
  return {
    label: command,
    copyText: command,
  }
}

function getTarotRowSearchCommand(
  index: number,
  searchAuthor: string,
  parsedTarots: ParsedInGameImport["tarots"],
): string | null {
  const row = tarotImportRowOrder[index]
  if (!row || row.key === "EquippedList") {
    return null
  }

  const normalizedSearchAuthor = normalizeSearchAuthor(searchAuthor)
  if (normalizedSearchAuthor.length === 0) {
    return null
  }

  const slot = parsedTarots.equippedSlots.find((entry) => entry.rowKey === row.key)
  if (!slot?.name) {
    return null
  }

  return `from: ${normalizedSearchAuthor} ${slot.name}`
}

export default function InGameImportPage() {
  const [inputs, setInputs] = useState<InGameImportPageInputs>(createDefaultPageInputs)
  const [searchAuthor, setSearchAuthor] = useState("")
  const [searchDate, setSearchDate] = useState("")
  const [manualLevelFallbackTotal, setManualLevelFallbackTotal] = useState(0)
  const [feedback, setFeedback] = useState<FeedbackState | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)
  const [hasExistingBuild, setHasExistingBuild] = useState(false)

  useEffect(() => {
    const storedInputs = window.localStorage.getItem(INPUT_STORAGE_KEY)
    if (storedInputs) {
      try {
        const parsedInputs = JSON.parse(storedInputs) as StoredInGameImportPageInputs
        setInputs(normalizePageInputs(parsedInputs))
        setSearchAuthor(typeof parsedInputs.searchAuthor === "string" ? parsedInputs.searchAuthor : "")
        setSearchDate(typeof parsedInputs.searchDate === "string" ? parsedInputs.searchDate : "")
      } catch {
        setInputs(createDefaultPageInputs())
        setSearchAuthor("")
        setSearchDate("")
      }
    }

    setManualLevelFallbackTotal(getStoredManualLevelFallbackTotal(window.localStorage))
    setHasExistingBuild(hasStoredBuildData(window.localStorage))
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (!isHydrated) {
      return
    }

    window.localStorage.setItem(INPUT_STORAGE_KEY, JSON.stringify({
      ...inputs,
      searchAuthor,
      searchDate,
      equipmentInputOrderVersion: EQUIPMENT_INPUT_ORDER_VERSION,
    }))
  }, [inputs, isHydrated, searchAuthor, searchDate])

  const parsed = useMemo(
    () => parseInGameImportInputs(serializePageInputs(inputs), {
      fallbackManualLevelTotal: manualLevelFallbackTotal,
    }),
    [inputs, manualLevelFallbackTotal],
  )
  const coverageRows = useMemo(
    () => buildInGameImportCoverageRows(parsed).sort((left, right) => (
      coverageStatusOrder[left.status] - coverageStatusOrder[right.status]
      || left.area.localeCompare(right.area)
    )),
    [parsed],
  )
  const sectionSummaries = useMemo(() => getSectionSummaries(parsed), [parsed])
  const readySectionCount = useMemo(
    () => Object.values(sectionSummaries).filter((summary) => summary.tone === "ready").length,
    [sectionSummaries],
  )
  const canImport = hasReadyInGameImport(parsed)
  const normalizedSearchAuthor = useMemo(() => normalizeSearchAuthor(searchAuthor), [searchAuthor])
  const normalizedSearchDate = useMemo(() => normalizeSearchDate(searchDate), [searchDate])
  const hasAnyInput = useMemo(
    () => hasAnyInputValue(inputs) || normalizedSearchAuthor.length > 0 || normalizedSearchDate.length > 0,
    [inputs, normalizedSearchAuthor, normalizedSearchDate],
  )
  const skillRowCount = useMemo(
    () => getPageRowCount(inputs.skills, parsed.skills.pageCoverage),
    [inputs.skills, parsed.skills.pageCoverage],
  )
  const talentRowCount = useMemo(
    () => getPageRowCount(inputs.talents, parsed.talents.pageCoverage),
    [inputs.talents, parsed.talents.pageCoverage],
  )
  const importBreakdown = useMemo(() => {
    const rows: string[] = []

    if (parsed.skills.namesToApply) {
      rows.push(`${parsed.skills.namesToApply.length} skills`)
    }

    if (parsed.talents.namesToApply) {
      rows.push(`${parsed.talents.namesToApply.length} talents`)
    }

    if (parsed.guildCard.levels || parsed.guildCard.raceTag) {
      rows.push("Guild Card")
    }

    if (parsed.statCard.statPoints) {
      rows.push("Stat Card")
    }

    if (Object.keys(parsed.artifact.values).length > 0 || parsed.artifact.seenRuneTiers.length > 0) {
      rows.push("Artifact")
    }

    if (parsed.tarots.namesToApply !== null || parsed.tarots.viewCardsFound.length > 0) {
      rows.push(parsed.tarots.equippedNames.length > 0 ? `${parsed.tarots.equippedNames.length} tarots` : "Tarots")
    }

    if (parsed.manualLevelRanges.length > 0) {
      rows.push(`${parsed.manualLevelRanges.length} level ranges`)
    }

    const importedTrainingPoints = countMainStatValues(parsed.trainingTotals)
    if (importedTrainingPoints > 0) {
      rows.push(`${importedTrainingPoints} training points`)
    }

    const importedSkillPoints = countSkillPointCost(parsed.skills.foundNames)
    if (importedSkillPoints > 0) {
      rows.push(`${importedSkillPoints} spent skill points from pages`)
    }

    const importedHeroTraining = countHeroPointDeltas(parsed.heroTraining.deltas)
    if (importedHeroTraining > 0) {
      rows.push(`${importedHeroTraining} hero training purchases`)
    }

    if (parsed.equipmentSlots.length > 0) {
      rows.push(`${parsed.equipmentSlots.length} equipment items`)
    }

    return rows
  }, [parsed])

  const updateSingleInput = (key: SingleEntrySectionKey, value: string) => {
    setInputs((current) => ({
      ...current,
      [key]: value,
    }))
  }

  const updateListInput = (key: MultiEntrySectionKey, index: number, value: string) => {
    setInputs((current) => {
      const nextList = [...current[key]]
      const targetLength = key === "equipment"
        ? equipmentCommandSlotOrder.length
        : key === "tarots"
          ? tarotImportRowOrder.length
        : Math.max(nextList.length, index + 1)

      while (nextList.length < targetLength) {
        nextList.push("")
      }

      nextList[index] = value

      return {
        ...current,
        [key]: key === "equipment"
          ? nextList.slice(0, equipmentCommandSlotOrder.length)
          : key === "tarots"
            ? nextList.slice(0, tarotImportRowOrder.length)
          : trimTrailingEmptyEntries(nextList),
      }
    })
  }

  const handleImport = () => {
    if (!canImport) {
      setFeedback({
        tone: "error",
        text: "Nothing is ready to import yet. Complete the missing pages or paste one of the supported sections first.",
      })
      return
    }

    const result = applyInGameImport(window.localStorage, parsed)

    if (result.updatedSections.length === 0) {
      setFeedback({ tone: "error", text: "Nothing was applied from the pasted sections." })
      return
    }

    setHasExistingBuild(hasStoredBuildData(window.localStorage))
    setFeedback({
      tone: "success",
      text: `Imported ${result.updatedSections.join(", ")}.`,
    })
  }

  const handleClearAll = () => {
    setInputs(createDefaultPageInputs())
    setSearchAuthor("")
    setSearchDate("")
    setFeedback({ tone: "info", text: "Cleared all import sections." })
  }

  const handleClearExistingBuild = () => {
    for (const key of CLEAR_EXISTING_BUILD_STORAGE_KEYS) {
      window.localStorage.removeItem(key)
    }

    dispatchBuildSnapshotUpdated()
    setManualLevelFallbackTotal(0)
    setHasExistingBuild(false)
    setFeedback({
      tone: "info",
      text: "Cleared the existing build. Pasted import sections were kept.",
    })
  }

  return (
    <main className="min-h-[calc(100vh-var(--top-nav-height))] bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.12),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(249,115,22,0.10),transparent_28%)]">
      <div className="flex w-full flex-col gap-5 px-4 py-6">
        <section className={`${cardClass} overflow-hidden`}>
          <div className="border-b border-slate-800/80 px-5 py-4">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-200/80">In-Game Import</p>
                <h1 className="text-2xl font-semibold text-slate-50">Split imports by source, then check the missing-info table before applying.</h1>
                <p className="max-w-4xl text-sm text-slate-300">
                  The table below compares expected points against what your pasted sections account for and tells you which
                  in-game command to use next. Skills and talents still wait for complete page coverage before they replace the
                  current build.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="rounded-full border border-slate-700 bg-slate-950/90 px-3 py-1 text-xs font-medium text-slate-300">
                  {readySectionCount} ready section{readySectionCount === 1 ? "" : "s"}
                </div>
                <div className="rounded-full border border-slate-700 bg-slate-950/90 px-3 py-1 text-xs font-medium text-slate-300">
                  {parsed.warnings.length} warning{parsed.warnings.length === 1 ? "" : "s"}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-5 px-5 py-5">
            <div className="overflow-x-auto rounded-[18px] border border-slate-800/80 bg-slate-950/50">
              <table className="min-w-full border-collapse text-sm">
                <thead className="bg-slate-900/90 text-left text-xs uppercase tracking-[0.12em] text-slate-300">
                  <tr>
                    <th className="px-3 py-3">Area</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Expected</th>
                    <th className="px-3 py-3">Accounted</th>
                    <th className="px-3 py-3">Gap</th>
                    <th className="px-3 py-3">Command</th>
                    <th className="px-3 py-3">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {coverageRows.map((row) => (
                    <tr key={row.area} className="border-t border-slate-800/70 align-top text-slate-200">
                      <td className="px-3 py-3 font-semibold text-slate-100">{row.area}</td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex rounded-full border px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${coverageStatusClass[row.status]}`}>
                          {coverageStatusLabel[row.status]}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-slate-300">{row.expected}</td>
                      <td className="px-3 py-3 text-slate-300">{row.accounted}</td>
                      <td className="px-3 py-3 font-semibold text-slate-100">{row.gap}</td>
                      <td className="px-3 py-3">
                        <CommandCopyChip command={row.command} />
                      </td>
                      <td className="px-3 py-3 text-slate-300">{row.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={handleImport} disabled={!canImport} className={primaryButtonClass}>
                Import Ready Sections
              </button>
              <button type="button" onClick={handleClearAll} disabled={!hasAnyInput} className={secondaryButtonClass}>
                Clear All Sections
              </button>
              <button type="button" onClick={handleClearExistingBuild} disabled={!hasExistingBuild} className={dangerButtonClass}>
                Clear Existing Build
              </button>
              <div className="text-sm text-slate-400">
                {importBreakdown.length === 0 ? "Nothing detected yet." : `Detected: ${importBreakdown.join(", ")}.`}
              </div>
            </div>

            {feedback ? (
              <div className={`rounded-2xl border px-4 py-3 text-sm ${feedbackClassByTone[feedback.tone]}`}>
                {feedback.text}
              </div>
            ) : null}
          </div>
        </section>

        <section className={`${cardClass} p-4`}>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-slate-100">Search User</h2>
              <p className="max-w-3xl text-sm text-slate-300">
                Paste a Username or User ID here and the Guild Card and Artifact sections will build `cz gc &lt;user&gt;`
                and `cz artifact &lt;user&gt;`, the Tarot Equipped List row will build
                `cz tarot equippedcards &lt;user&gt;`, tarot card rows add `from: &lt;user&gt; &lt;card name&gt;`, the
                Skills and Talents sections add learn-command searches, while the Level Up, Training, and Hero Training
                sections copy Discord search strings for you. Set an optional date and those searches will use one day
                earlier, like `from: &lt;user&gt; after: 2026-04-13 cz xtraining` for an entered date of `2026-04-14`.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="rounded-full border border-slate-700 bg-slate-950/90 px-3 py-1 text-xs font-medium text-slate-300">
                {normalizedSearchAuthor.length > 0 ? `Searching from: ${normalizedSearchAuthor}` : "No search user set"}
              </div>
              <div className="rounded-full border border-slate-700 bg-slate-950/90 px-3 py-1 text-xs font-medium text-slate-300">
                {normalizedSearchDate.length > 0 ? `Searches use after: ${normalizedSearchDate}` : "No after date set"}
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-4">
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-300">Username or User ID</span>
              <input
                type="text"
                value={searchAuthor}
                onChange={(event) => setSearchAuthor(event.target.value)}
                placeholder="Username or User ID"
                className="h-11 w-full rounded-xl border border-slate-700 bg-slate-950/90 px-3 text-sm text-slate-100 outline-none transition focus:border-sky-400/70"
              />
            </label>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)]">
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-300">After Date</span>
                <input
                  type="date"
                  value={searchDate}
                  onChange={(event) => setSearchDate(event.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-700 bg-slate-950/90 px-3 text-sm text-slate-100 outline-none transition focus:border-sky-400/70"
                />
              </label>

              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-300">Account Search Commands</span>
                <div className="flex flex-wrap items-center gap-2">
                  {getUtilitySearchCommands(searchAuthor).some((command) => command.copyText)
                    ? getUtilitySearchCommands(searchAuthor).map((command) => (
                        command.copyText ? <CommandCopyChip key={command.copyText} command={command.copyText} /> : null
                      ))
                    : (
                      <span className="rounded bg-slate-900 px-2 py-1 text-xs text-sky-100">
                        Paste a Username or User ID above to build the command
                      </span>
                    )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          {sectionConfigs.map((section) => {
            const summary = sectionSummaries[section.key]
            const commandDisplay = getSectionCommandDisplay(section, searchAuthor, searchDate)
            const isSkillsSection = section.key === "skills"
            const isTalentsSection = section.key === "talents"
            const isTarotsSection = section.key === "tarots"
            const isEquipmentSection = section.key === "equipment"
            const isMultiEntrySection = isSkillsSection || isTalentsSection || isTarotsSection || isEquipmentSection

            return (
              <div key={section.key} className={`${cardClass} p-4`}>
                <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <div className="text-lg font-semibold text-slate-100">{section.title}</div>
                    <div className="text-sm text-slate-300">{section.subtitle}</div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <CommandDisplay command={commandDisplay} />
                    {section.key === "levelUps" ? (
                      getLevelUpSearchCommands(searchAuthor, searchDate).slice(1).map((command) => (
                        command.copyText ? <CommandCopyChip key={command.copyText} command={command.copyText} /> : null
                      ))
                    ) : null}
                    {section.key === "skills" ? (
                      getSkillLearnSearchCommands(searchAuthor, searchDate).map((command) => (
                        command.copyText ? <CommandCopyChip key={command.copyText} command={command.copyText} /> : null
                      ))
                    ) : null}
                    {section.key === "talents" ? (
                      getTalentLearnSearchCommands(searchAuthor, searchDate).map((command) => (
                        command.copyText ? <CommandCopyChip key={command.copyText} command={command.copyText} /> : null
                      ))
                    ) : null}
                    {searchCommandSectionKeys.has(section.key) && normalizedSearchAuthor.length > 0 ? (
                      <span className="rounded bg-slate-900 px-2 py-1 text-xs text-slate-400">
                        Search
                      </span>
                    ) : null}
                    <span className={`inline-flex rounded-full border px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${sectionToneClass[summary.tone]}`}>
                      {summary.tone === "ready" ? "Ready" : summary.tone === "partial" ? "Partial" : "Empty"}
                    </span>
                  </div>
                </div>

                <div className={`mb-3 rounded-2xl border px-3 py-2 text-sm ${sectionSummaryBoxClass[summary.tone]}`}>
                  {summary.text}
                </div>

                {isMultiEntrySection ? (
                  <div className="space-y-3">
                    {Array.from({
                      length: isSkillsSection
                        ? skillRowCount
                        : isTalentsSection
                          ? talentRowCount
                          : isTarotsSection
                            ? tarotImportRowOrder.length
                          : equipmentCommandSlotOrder.length,
                    }).map((_, index) => {
                      const tarotRowLabel = isTarotsSection ? getTarotRowLabel(index, parsed.tarots) : null
                      const tarotSearchCommand = isTarotsSection
                        ? getTarotRowSearchCommand(index, searchAuthor, parsed.tarots)
                        : null
                      const equipmentRow = isEquipmentSection ? equipmentCommandSlotOrder[index] : null
                      const command = isSkillsSection
                        ? getSkillRowCommand(index)
                        : isTalentsSection
                          ? getTalentRowCommand(index)
                          : isTarotsSection
                            ? getTarotRowCommand(index, searchAuthor, parsed.tarots)
                          : getEquipmentRowCommand(index)
                      const value = isSkillsSection
                        ? (inputs.skills[index] ?? "")
                        : isTalentsSection
                          ? (inputs.talents[index] ?? "")
                          : isTarotsSection
                            ? (inputs.tarots[index] ?? "")
                          : (inputs.equipment[index] ?? "")

                      return (
                        <div key={`${section.key}-${index}`} className="space-y-2">
                          {tarotRowLabel ? (
                            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-300">
                              {tarotRowLabel}
                            </div>
                          ) : null}
                          {equipmentRow ? (
                            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-300">
                              {equipmentRow.label}
                            </div>
                          ) : null}
                          <div className="flex flex-wrap items-center gap-2">
                            <CommandDisplay command={command} />
                            {tarotSearchCommand ? <CommandCopyChip command={tarotSearchCommand} /> : null}
                          </div>
                          <textarea
                            rows={1}
                            value={value}
                            onChange={(event) => updateListInput(section.key as MultiEntrySectionKey, index, event.target.value)}
                            placeholder={getMultiEntryRowPlaceholder(section.key as MultiEntrySectionKey, command.label)}
                            className={rowTextareaClass}
                          />
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <textarea
                    value={inputs[section.key as SingleEntrySectionKey]}
                    onChange={(event) => updateSingleInput(section.key as SingleEntrySectionKey, event.target.value)}
                    placeholder={section.placeholder}
                    className={`${textareaBaseClass} ${section.minHeightClass}`}
                  />
                )}
              </div>
            )
          })}
        </section>

        <section className={`${cardClass} p-4`}>
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-200">Parser Warnings</h2>
            <span className="text-xs text-slate-400">
              {parsed.warnings.length === 0 ? "Clean" : `${parsed.warnings.length} warning${parsed.warnings.length === 1 ? "" : "s"}`}
            </span>
          </div>

          {parsed.warnings.length === 0 ? (
            <p className="text-sm text-slate-400">No parser warnings right now.</p>
          ) : (
            <div className="space-y-2">
              {parsed.warnings.map((warning, index) => (
                <div
                  key={`${warning}-${index}`}
                  className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100"
                >
                  {warning}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
