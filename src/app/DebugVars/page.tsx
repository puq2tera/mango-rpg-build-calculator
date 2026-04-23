"use client"

import { useEffect, useMemo, useRef, useState, type Dispatch, type KeyboardEvent, type ReactNode, type SetStateAction } from "react"
import { BUILD_SNAPSHOT_UPDATED_EVENT } from "@/app/lib/buildEvents"
import { readBuildManagerState, type StoredBuildProfile } from "@/app/lib/buildStorage"
import {
  buildDebugSummary,
  getCalcSkillBuffs,
  getCharacterCardData,
  getDungeonCardData,
  getGuildCardRows,
  type CalcSkillBuff,
  type LabelValueRow,
  type SummaryState,
  type TerminalCardData,
} from "@/app/lib/debugComparisonSummary"
import {
  buildSavedBuildCalculatedResults,
  calculateSavedBuildSkillResult,
  doesSavedBuildSkillSupportBuffStacks,
  getDefaultSavedBuildSkillComparisonMode,
  getSavedBuildComparisonModeLabel,
  getSavedBuildCalculatedValue,
  getSavedBuildSkillDefaultStackCount,
  getSavedBuildSkillComparisonOptions,
  isSavedBuildComparisonMode,
  isSavedBuildSkillComparisonModeAvailable,
  type SavedBuildCalculatedResult,
  type SavedBuildComparisonMode,
} from "@/app/lib/debugSavedBuildSkillMatcher"
import {
  compareComparableValues,
  createComparableValue,
  getBuffEffectSignature,
  parseBuffs,
  parseConversions,
  parseGuildCard,
  parseTerminalCard,
  type ComparableValue,
  type ParsedBuff,
  type ParsedElementRow,
  type ParsedLabelValueRow,
  type ParsedTerminalCard,
  type ParsedTerminalDetailRow,
  type ParsedTerminalMainRow,
  type ParsedTypeBonusRow,
} from "@/app/lib/debugPasteParser"
import {
  getTalentConversionComparisonRows,
} from "@/app/lib/talentConversionSummary"

type PasteInputs = {
  guildCard: string
  characterCard: string
  dungeonStats: string
  buffs: string
  conversions: string
}

type ComparableRow = {
  label: string
  calc?: ComparableValue
  inGame?: ComparableValue
}

type BuffEffectComparable = {
  display: string
  signature: string
}

type ComparableBuff = {
  name: string
  normalizedName: string
  effects: BuffEffectComparable[]
}

type ComparedBuff = {
  name: string
  calc?: ComparableBuff
  inGame?: ComparableBuff
  status: "match" | "different" | "missing-calc" | "missing-game"
}

type SavedBuildResultTableRow = {
  id: string
  buildId: string
  skillName: string
  mode: SavedBuildComparisonMode
  stackCount: string
  expectedValue: string
}

type SavedBuildResultStatus = "perfect" | "close" | "off" | "incomplete"

const INPUT_STORAGE_KEY = "debugVars:comparisonInputs"
const SAVED_BUILD_RESULT_TABLE_STORAGE_KEY = "debugVars:savedBuildResultTable"
const PASTE_INPUTS_COLLAPSED_STORAGE_KEY = "debugVars:pasteInputsCollapsed"

const panelClass =
  "rounded-[28px] border border-slate-800/80 bg-[linear-gradient(145deg,rgba(6,11,20,0.97),rgba(15,23,42,0.9))] shadow-[0_28px_90px_rgba(2,6,23,0.42)]"

const textareaClass =
  "min-h-[8.5rem] w-full rounded-xl border border-slate-700/80 bg-slate-950/80 px-3 py-2.5 font-mono text-xs text-slate-100 shadow-inner outline-none transition placeholder:text-slate-500 focus:border-sky-300/50 focus:ring-2 focus:ring-sky-400/20"

const compactCardClass =
  "rounded-2xl border border-slate-800/80 bg-slate-950/55 px-4 py-3.5 shadow-[0_16px_40px_rgba(2,6,23,0.22)]"

const compactFieldClass =
  "w-full rounded-lg border border-slate-700/80 bg-slate-950/80 px-2.5 py-1.5 text-xs text-slate-100 outline-none transition focus:border-sky-400/70"

const compactButtonClass =
  "rounded-lg border border-slate-700/80 bg-slate-950/90 px-2.5 py-1.5 text-xs font-semibold text-slate-100 transition hover:border-sky-400/50 hover:text-sky-200 disabled:cursor-not-allowed disabled:opacity-50"

const compactPrimaryButtonClass =
  "rounded-lg border border-sky-500/50 bg-sky-500/10 px-2.5 py-1.5 text-xs font-semibold text-sky-100 transition hover:bg-sky-500/15 disabled:cursor-not-allowed disabled:opacity-50"

const emptyStateClass =
  "rounded-2xl border border-dashed border-slate-700/80 bg-slate-950/40 px-4 py-8 text-center text-sm text-slate-400"

const defaultInputs: PasteInputs = {
  guildCard: "",
  characterCard: "",
  dungeonStats: "",
  buffs: "",
  conversions: "",
}

function createSavedBuildResultRow(defaultBuildId = ""): SavedBuildResultTableRow {
  return {
    id:
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    buildId: defaultBuildId,
    skillName: "",
    mode: "maxcrit",
    stackCount: "",
    expectedValue: "",
  }
}

function normalizeSavedBuildResultRows(value: unknown): SavedBuildResultTableRow[] {
  if (!Array.isArray(value)) {
    return [createSavedBuildResultRow()]
  }

  const rows = value
    .filter((entry): entry is Partial<SavedBuildResultTableRow> => typeof entry === "object" && entry !== null)
    .map((entry) => ({
      id: typeof entry.id === "string" && entry.id.length > 0 ? entry.id : createSavedBuildResultRow().id,
      buildId: typeof entry.buildId === "string" ? entry.buildId : "",
      skillName: typeof entry.skillName === "string" ? entry.skillName : "",
      mode: isSavedBuildComparisonMode(entry.mode) ? entry.mode : "maxcrit",
      stackCount: typeof entry.stackCount === "string"
        ? entry.stackCount
        : typeof entry.stackCount === "number" && Number.isFinite(entry.stackCount)
          ? String(Math.max(0, Math.floor(entry.stackCount)))
          : "",
      expectedValue: typeof entry.expectedValue === "string" ? entry.expectedValue : "",
    }))

  return rows.length > 0 ? rows : [createSavedBuildResultRow()]
}

function getDefaultSkillNameForBuild(
  buildId: string,
  resultByBuildId: ReadonlyMap<string, SavedBuildCalculatedResult>,
): string {
  return resultByBuildId.get(buildId)?.skills[0]?.name ?? ""
}

function getDefaultComparisonModeForSkill(
  buildId: string,
  skillName: string,
  resultByBuildId: ReadonlyMap<string, SavedBuildCalculatedResult>,
): SavedBuildComparisonMode {
  const buildResult = resultByBuildId.get(buildId)
  return buildResult && skillName
    ? (getDefaultSavedBuildSkillComparisonMode(buildResult, skillName) ?? "maxcrit")
    : "maxcrit"
}

function getNextComparisonModeForSkill(
  buildResult: SavedBuildCalculatedResult | null,
  skillName: string,
  currentMode: SavedBuildComparisonMode,
): SavedBuildComparisonMode {
  if (!buildResult || !skillName) {
    return "maxcrit"
  }

  if (isSavedBuildSkillComparisonModeAvailable(buildResult, skillName, currentMode)) {
    return currentMode
  }

  return getDefaultSavedBuildSkillComparisonMode(buildResult, skillName) ?? "maxcrit"
}

function isSavedBuildBuffMode(mode: SavedBuildComparisonMode): boolean {
  return mode.startsWith("buff:")
}

function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
}

const buffNameAliases = new Map<string, string>([
  [normalizeName("Essence Protect"), normalizeName("Essence Guard")],
])

function normalizeBuffName(value: string): string {
  const normalized = normalizeName(value)
  return buffNameAliases.get(normalized) ?? normalized
}

function getOrderedUnionLabels<CalcRow extends { label: string }, InGameRow extends { label: string }>(
  calcRows: readonly CalcRow[],
  inGameRows: readonly InGameRow[],
): string[] {
  const labels: string[] = []
  const seen = new Set<string>()

  for (const row of calcRows) {
    if (seen.has(row.label)) {
      continue
    }

    seen.add(row.label)
    labels.push(row.label)
  }

  for (const row of inGameRows) {
    if (seen.has(row.label)) {
      continue
    }

    seen.add(row.label)
    labels.push(row.label)
  }

  return labels
}

const defaultResourceCapComparisonLabels = new Set(["Health", "Mana", "Focus"])
const dungeonResourceCapComparisonLabels = new Set(["Health", "Mana", "Focus"])

function normalizeMainResourceComparableValue(
  label: string,
  value: ComparableValue,
  resourceCapComparisonLabels = defaultResourceCapComparisonLabels,
): ComparableValue {
  if (!resourceCapComparisonLabels.has(label) || value.numericParts.length < 2) {
    return value
  }

  const maxValue = value.numericParts[value.numericParts.length - 1]
  if (!Number.isFinite(maxValue)) {
    return value
  }

  return {
    ...value,
    numericParts: [maxValue],
  }
}

function buildLabelValueComparisonRows(
  calcRows: readonly LabelValueRow[],
  inGameRows: readonly ParsedLabelValueRow[],
): ComparableRow[] {
  const calcMap = new Map(
    calcRows.map((row) => [row.label, normalizeMainResourceComparableValue(row.label, createComparableValue(row.value))]),
  )
  const inGameMap = new Map(
    inGameRows.map((row) => [row.label, normalizeMainResourceComparableValue(row.label, row.value)]),
  )

  return getOrderedUnionLabels(calcRows, inGameRows).map((label) => ({
    label,
    calc: calcMap.get(label),
    inGame: inGameMap.get(label),
  }))
}

function mainRowToComparableValue(row: { value: string; modifier?: string }): ComparableValue {
  return createComparableValue(row.modifier ? `${row.value} | ${row.modifier}` : row.value)
}

function typeRowToComparableValue(row: { dmg: string; xDmg: string; pen: string; xPen: string }): ComparableValue {
  return createComparableValue(`${row.dmg} | ${row.xDmg} | ${row.pen} | ${row.xPen}`)
}

function elementRowToComparableValue(row: { dmg: string; res: string; pen: string }): ComparableValue {
  return createComparableValue(`${row.dmg} | ${row.res} | ${row.pen}`)
}

function buildMainRowComparisonRows(
  calcRows: readonly { label: string; value: string; modifier?: string }[],
  inGameRows: readonly ParsedTerminalMainRow[],
  resourceCapComparisonLabels = defaultResourceCapComparisonLabels,
): ComparableRow[] {
  const calcMap = new Map(
    calcRows.map((row) => [
      row.label,
      normalizeMainResourceComparableValue(row.label, mainRowToComparableValue(row), resourceCapComparisonLabels),
    ]),
  )
  const inGameMap = new Map(
    inGameRows.map((row) => [
      row.label,
      normalizeMainResourceComparableValue(
        row.label,
        createComparableValue(row.modifier ? `${row.value.display} | ${row.modifier.display}` : row.value.display),
        resourceCapComparisonLabels,
      ),
    ]),
  )

  return getOrderedUnionLabels(calcRows, inGameRows).map((label) => ({
    label,
    calc: calcMap.get(label),
    inGame: inGameMap.get(label),
  }))
}

function buildDetailRowComparisonRows(
  calcRows: readonly { label: string; value: string }[],
  inGameRows: readonly ParsedTerminalDetailRow[],
): ComparableRow[] {
  const calcMap = new Map(calcRows.map((row) => [row.label, createComparableValue(row.value)]))
  const inGameMap = new Map(inGameRows.map((row) => [row.label, row.value]))

  return getOrderedUnionLabels(calcRows, inGameRows).map((label) => ({
    label,
    calc: calcMap.get(label),
    inGame: inGameMap.get(label),
  }))
}

function buildTypeRowComparisonRows(
  calcRows: readonly { label: string; dmg: string; xDmg: string; pen: string; xPen: string }[],
  inGameRows: readonly ParsedTypeBonusRow[],
): ComparableRow[] {
  const calcMap = new Map(calcRows.map((row) => [row.label, typeRowToComparableValue(row)]))
  const inGameMap = new Map(
    inGameRows.map((row) => [
      row.label,
      createComparableValue(`${row.dmg.display} | ${row.xDmg.display} | ${row.pen.display} | ${row.xPen.display}`),
    ]),
  )

  return getOrderedUnionLabels(calcRows, inGameRows).map((label) => ({
    label,
    calc: calcMap.get(label),
    inGame: inGameMap.get(label),
  }))
}

function buildElementRowComparisonRows(
  calcRows: readonly { label: string; dmg: string; res: string; pen: string }[],
  inGameRows: readonly ParsedElementRow[],
): ComparableRow[] {
  const calcMap = new Map(calcRows.map((row) => [row.label, elementRowToComparableValue(row)]))
  const inGameMap = new Map(
    inGameRows.map((row) => [row.label, createComparableValue(`${row.dmg.display} | ${row.res.display} | ${row.pen.display}`)]),
  )

  return getOrderedUnionLabels(calcRows, inGameRows).map((label) => ({
    label,
    calc: calcMap.get(label),
    inGame: inGameMap.get(label),
  }))
}

function getComparisonSummary(rows: readonly ComparableRow[]) {
  return rows.reduce(
    (summary, row) => {
      const result = compareComparableValues(row.calc, row.inGame)

      if (result.status === "match") summary.match += 1
      if (result.status === "different") summary.different += 1
      if (result.status === "missing-calc") summary.missingCalc += 1
      if (result.status === "missing-game") summary.missingGame += 1

      return summary
    },
    { match: 0, different: 0, missingCalc: 0, missingGame: 0 },
  )
}

function getStatusClass(status: ReturnType<typeof compareComparableValues>["status"]): string {
  switch (status) {
    case "match":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
    case "different":
      return "border-amber-500/30 bg-amber-500/10 text-amber-100"
    case "missing-calc":
      return "border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-100"
    case "missing-game":
      return "border-sky-500/30 bg-sky-500/10 text-sky-100"
  }
}

function formatStatusLabel(status: ReturnType<typeof compareComparableValues>["status"]): string {
  switch (status) {
    case "match":
      return "Match"
    case "different":
      return "Different"
    case "missing-calc":
      return "Missing Calc"
    case "missing-game":
      return "Missing In Game"
  }
}

function ComparisonTable({
  title,
  subtitle,
  rows,
}: {
  title: string
  subtitle: string
  rows: ComparableRow[]
}) {
  const summary = getComparisonSummary(rows)

  return (
    <section className={compactCardClass}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-base font-semibold text-slate-50">{title}</div>
          <div className="mt-1 text-xs leading-5 text-slate-400">{subtitle}</div>
        </div>

        <div className="flex flex-wrap gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em]">
          <div className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-emerald-100">
            {summary.match} Match
          </div>
          <div className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-amber-100">
            {summary.different} Diff
          </div>
          <div className="rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 px-2.5 py-1 text-fuchsia-100">
            {summary.missingCalc} Parser Only
          </div>
          <div className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-1 text-sky-100">
            {summary.missingGame} Calc Only
          </div>
        </div>
      </div>

      <div className="mt-3 overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-y-1.5 text-xs">
          <thead>
            <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              <th className="px-2.5 py-1">Field</th>
              <th className="px-2.5 py-1">Calc</th>
              <th className="px-2.5 py-1">In Game</th>
              <th className="px-2.5 py-1">Delta</th>
              <th className="px-2.5 py-1">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const result = compareComparableValues(row.calc, row.inGame)

              return (
                <tr key={row.label} className="align-top">
                  <td className="rounded-l-xl border border-slate-800/80 bg-slate-950/65 px-2.5 py-2 font-medium text-slate-100">
                    {row.label}
                  </td>
                  <td className="border-y border-slate-800/80 bg-slate-950/55 px-2.5 py-2 font-mono text-slate-200">
                    {row.calc?.display ?? "—"}
                  </td>
                  <td className="border-y border-slate-800/80 bg-slate-950/55 px-2.5 py-2 font-mono text-slate-200">
                    {row.inGame?.display ?? "—"}
                  </td>
                  <td className="border-y border-slate-800/80 bg-slate-950/55 px-2.5 py-2 font-mono text-slate-300">
                    {result.delta ?? "—"}
                  </td>
                  <td className="rounded-r-xl border border-slate-800/80 bg-slate-950/65 px-2.5 py-2">
                    <div className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${getStatusClass(result.status)}`}>
                      {formatStatusLabel(result.status)}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function PasteInputTable({
  inputs,
  setInputs,
  onClear,
  isCollapsed,
  onToggleCollapsed,
}: {
  inputs: PasteInputs
  setInputs: Dispatch<SetStateAction<PasteInputs>>
  onClear: () => void
  isCollapsed: boolean
  onToggleCollapsed: () => void
}) {
  const rows = [
    {
      label: "Guild Card",
      description: "Race, levels, main stats, and rebirth level.",
      placeholder: "Guild Card\nRace\nNorthern Human\nTotal Levels\n355 / 485\nT/W/C/H Levels\n50/200/5/100",
      value: inputs.guildCard,
      update: (value: string) => setInputs((current) => ({ ...current, guildCard: value })),
    },
    {
      label: "Character Card",
      description: "Out-of-dungeon card with damage type and element tables.",
      placeholder: "@name's Character Card\nBase Stats & Multipliers\n❤️ Health   388,949 / 388,949\n️🗡️ ATK     4,108  |  +805%",
      value: inputs.characterCard,
      update: (value: string) => setInputs((current) => ({ ...current, characterCard: value })),
    },
    {
      label: "Dungeon Stats",
      description: "Dungeon card with the same stat blocks and tables.",
      placeholder: "Dungeon Character Card\n❤️ Health   388,949 / 388,949\n️🗡️ ATK     239,447\nCrit Chance/Damage | 128% / 471%",
      value: inputs.dungeonStats,
      update: (value: string) => setInputs((current) => ({ ...current, dungeonStats: value })),
    },
    {
      label: "Buffs / Debuffs",
      description: "Active skill buffs and debuffs compared to selected buffs.",
      placeholder: "◘ Fervant Arrows: +45 elebow\nSide-Effect: +51,245 atk\n\n◘ Hate of the Living: +32,881 def",
      value: inputs.buffs,
      update: (value: string) => setInputs((current) => ({ ...current, buffs: value })),
    },
    {
      label: "Conversions",
      description: "My Conversions source blocks compared by source stat token.",
      placeholder: "◘ maxHP : 516,737\n⇒ 5% ⇒ 25,836 maxHP",
      value: inputs.conversions,
      update: (value: string) => setInputs((current) => ({ ...current, conversions: value })),
    },
  ] satisfies {
    label: string
    description: string
    placeholder: string
    value: string
    update: (value: string) => void
  }[]

  return (
    <section className={panelClass}>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800/80 px-5 py-4 sm:px-6">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-xl font-semibold text-slate-50">Paste Inputs</div>
            <button
              type="button"
              onClick={onToggleCollapsed}
              aria-expanded={!isCollapsed}
              className="rounded-full border border-slate-700/80 bg-slate-900/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-200 transition hover:border-sky-300/40 hover:text-sky-100"
            >
              {isCollapsed ? "Expand" : "Collapse"}
            </button>
          </div>
          <div className="mt-1 text-sm text-slate-400">
            {isCollapsed
              ? "Expand to edit pasted sections."
              : "Unmatched rows stay visible so parser gaps and unsupported fields are obvious."}
          </div>
        </div>

        <button
          type="button"
          onClick={onClear}
          className="rounded-full border border-slate-700/80 bg-slate-900/80 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-200 transition hover:border-sky-300/40 hover:text-sky-100"
        >
          Clear Pasted Text
        </button>
      </div>

      {isCollapsed ? null : (
        <div className="overflow-x-auto p-4 sm:p-5">
          <table className="min-w-full table-fixed border-separate border-spacing-0 text-sm">
            <thead>
              <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                <th className="w-56 px-3 py-2">Section</th>
                <th className="px-3 py-2">Paste</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row.label} className="align-top">
                  <td
                    className={`border border-slate-800/80 bg-slate-950/55 px-3 py-3 ${
                      index === 0 ? "rounded-tl-2xl" : ""
                    } ${index === rows.length - 1 ? "rounded-bl-2xl" : ""}`}
                  >
                    <div className="text-sm font-semibold text-slate-50">{row.label}</div>
                    <div className="mt-1 text-xs leading-5 text-slate-400">{row.description}</div>
                  </td>
                  <td
                    className={`border border-l-0 border-slate-800/80 bg-slate-950/35 px-3 py-3 ${
                      index === 0 ? "rounded-tr-2xl" : ""
                    } ${index === rows.length - 1 ? "rounded-br-2xl" : ""}`}
                  >
                    <textarea
                      value={row.value}
                      onChange={(event) => row.update(event.target.value)}
                      placeholder={row.placeholder}
                      spellCheck={false}
                      className={textareaClass}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function getBuffComparisonStatus(calc?: ComparableBuff, inGame?: ComparableBuff): ComparedBuff["status"] {
  if (!calc && !inGame) {
    return "match"
  }

  if (!calc) {
    return "missing-calc"
  }

  if (!inGame) {
    return "missing-game"
  }

  const calcSignatures = [...new Set(calc.effects.map((effect) => effect.signature))].sort()
  const inGameSignatures = [...new Set(inGame.effects.map((effect) => effect.signature))].sort()

  if (
    calcSignatures.length === inGameSignatures.length
    && calcSignatures.every((signature, index) => signature === inGameSignatures[index])
  ) {
    return "match"
  }

  return "different"
}

function buildBuffComparisons(calcBuffs: readonly CalcSkillBuff[], inGameBuffs: readonly ParsedBuff[]): ComparedBuff[] {
  const calcComparable = calcBuffs.map<ComparableBuff>((buff) => ({
    name: buff.name,
    normalizedName: normalizeBuffName(buff.name),
    effects: buff.effects.map((effect) => ({
      display: effect.label,
      signature: `${effect.stat}:${effect.value}`,
    })),
  }))
  const inGameComparable = inGameBuffs.map<ComparableBuff>((buff) => ({
    name: buff.name,
    normalizedName: normalizeBuffName(buff.name),
    effects: buff.effects.map((effect) => ({
      display: effect.display,
      signature: getBuffEffectSignature(effect),
    })),
  }))

  const calcMap = new Map(calcComparable.map((buff) => [buff.normalizedName, buff]))
  const inGameMap = new Map(inGameComparable.map((buff) => [buff.normalizedName, buff]))
  const orderedNames: string[] = []
  const seen = new Set<string>()

  for (const buff of calcComparable) {
    if (seen.has(buff.normalizedName)) {
      continue
    }

    seen.add(buff.normalizedName)
    orderedNames.push(buff.normalizedName)
  }

  for (const buff of inGameComparable) {
    if (seen.has(buff.normalizedName)) {
      continue
    }

    seen.add(buff.normalizedName)
    orderedNames.push(buff.normalizedName)
  }

  return orderedNames.map((normalizedName) => {
    const calc = calcMap.get(normalizedName)
    const inGame = inGameMap.get(normalizedName)

    return {
      name: calc?.name ?? inGame?.name ?? normalizedName,
      calc,
      inGame,
      status: getBuffComparisonStatus(calc, inGame),
    }
  })
}

function BuffComparisonSection({
  calcBuffs,
  inGameBuffs,
}: {
  calcBuffs: readonly CalcSkillBuff[]
  inGameBuffs: readonly ParsedBuff[]
}) {
  const comparedBuffs = buildBuffComparisons(calcBuffs, inGameBuffs)
  const summary = comparedBuffs.reduce(
    (counts, buff) => {
      if (buff.status === "match") counts.match += 1
      if (buff.status === "different") counts.different += 1
      if (buff.status === "missing-calc") counts.missingCalc += 1
      if (buff.status === "missing-game") counts.missingGame += 1
      return counts
    },
    { match: 0, different: 0, missingCalc: 0, missingGame: 0 },
  )

  return (
    <section className={compactCardClass}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-base font-semibold text-slate-50">Buff Comparison</div>
          <div className="mt-1 text-xs leading-5 text-slate-400">
            Buff names are matched case-insensitively, with a small alias list for known in-game naming drift. Effect rows compare by parsed stat key and amount when possible.
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em]">
          <div className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-emerald-100">
            {summary.match} Match
          </div>
          <div className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-amber-100">
            {summary.different} Diff
          </div>
          <div className="rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 px-2.5 py-1 text-fuchsia-100">
            {summary.missingCalc} Parser Only
          </div>
          <div className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-1 text-sky-100">
            {summary.missingGame} Calc Only
          </div>
        </div>
      </div>

      {comparedBuffs.length === 0 ? (
        <div className="mt-3 text-sm text-slate-400">No calc buffs or pasted buffs to compare.</div>
      ) : (
        <div className="mt-3 grid gap-3 xl:grid-cols-2 2xl:grid-cols-3">
          {comparedBuffs.map((buff) => (
            <article key={buff.name} className="rounded-xl border border-slate-800/80 bg-slate-950/55 p-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm font-semibold text-slate-50">{buff.name}</div>
                <div className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${getStatusClass(buff.status)}`}>
                  {formatStatusLabel(buff.status)}
                </div>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Calc</div>
                  <div className="mt-2 flex min-h-[2.5rem] flex-wrap gap-1.5">
                    {buff.calc?.effects.length ? (
                      buff.calc.effects.map((effect) => (
                        <div
                          key={`${buff.name}:calc:${effect.signature}`}
                          className="rounded-full border border-slate-700/80 bg-slate-900/90 px-2.5 py-1 font-mono text-[11px] text-slate-100"
                        >
                          {effect.display}
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-slate-500">—</div>
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">In Game</div>
                  <div className="mt-2 flex min-h-[2.5rem] flex-wrap gap-1.5">
                    {buff.inGame?.effects.length ? (
                      buff.inGame.effects.map((effect) => (
                        <div
                          key={`${buff.name}:game:${effect.signature}`}
                          className="rounded-full border border-slate-700/80 bg-slate-900/90 px-2.5 py-1 font-mono text-[11px] text-slate-100"
                        >
                          {effect.display}
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-slate-500">—</div>
                    )}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

function ComparisonBlock({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: ReactNode
}) {
  return (
    <section className={panelClass}>
      <div className="border-b border-slate-800/80 px-5 py-4 sm:px-6">
        <div className="text-lg font-semibold text-slate-50">{title}</div>
        <div className="mt-1 text-xs leading-5 text-slate-400">{subtitle}</div>
      </div>

      <div className="p-4 sm:p-5">{children}</div>
    </section>
  )
}

function normalizeSearchValue(value: string): string {
  return value.trim().toLocaleLowerCase()
}

function SavedBuildSkillCombobox({
  rowId,
  value,
  options,
  onChange,
}: {
  rowId: string
  value: string
  options: SavedBuildCalculatedResult["skills"]
  onChange: (nextValue: string) => void
}) {
  const [inputValue, setInputValue] = useState(value)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const fieldRef = useRef<HTMLDivElement | null>(null)
  const listboxId = `debug-vars-build-skill-listbox-${rowId}`
  const normalizedInputValue = normalizeSearchValue(inputValue)
  const normalizedSelectedValue = normalizeSearchValue(value)
  const normalizedFilterValue =
    value.length > 0 && normalizedInputValue === normalizedSelectedValue
      ? ""
      : normalizedInputValue
  const filteredOptions = useMemo(() => {
    return options.filter((option) => {
      if (normalizedFilterValue.length === 0) {
        return true
      }

      const searchableText = [
        option.name,
        option.description,
        option.note ?? "",
      ].join("\n").toLocaleLowerCase()

      return searchableText.includes(normalizedFilterValue)
    })
  }, [normalizedFilterValue, options])

  useEffect(() => {
    setInputValue(value)
  }, [value])

  useEffect(() => {
    if (filteredOptions.length === 0) {
      setHighlightedIndex(0)
      return
    }

    setHighlightedIndex((current) => Math.min(current, filteredOptions.length - 1))
  }, [filteredOptions])

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target

      if (!(target instanceof Node)) {
        return
      }

      if (fieldRef.current?.contains(target)) {
        return
      }

      setIsDropdownOpen(false)
    }

    document.addEventListener("mousedown", handlePointerDown)
    return () => {
      document.removeEventListener("mousedown", handlePointerDown)
    }
  }, [])

  const handleOptionSelect = (nextValue: string) => {
    setInputValue(nextValue)
    onChange(nextValue)
    setIsDropdownOpen(false)
  }

  const handleInputChange = (nextValue: string) => {
    setInputValue(nextValue)
    setIsDropdownOpen(true)

    if (!nextValue) {
      onChange("")
      return
    }

    const exactOption = options.find((option) => normalizeSearchValue(option.name) === normalizeSearchValue(nextValue))
    if (!exactOption) {
      onChange("")
      return
    }

    handleOptionSelect(exactOption.name)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault()

      if (!isDropdownOpen) {
        setIsDropdownOpen(true)
        return
      }

      if (filteredOptions.length > 0) {
        setHighlightedIndex((current) => Math.min(current + 1, filteredOptions.length - 1))
      }

      return
    }

    if (event.key === "ArrowUp") {
      event.preventDefault()

      if (!isDropdownOpen) {
        setIsDropdownOpen(true)
        return
      }

      if (filteredOptions.length > 0) {
        setHighlightedIndex((current) => Math.max(current - 1, 0))
      }

      return
    }

    if (event.key === "Enter" && isDropdownOpen) {
      const highlightedOption = filteredOptions[highlightedIndex]

      if (highlightedOption) {
        event.preventDefault()
        handleOptionSelect(highlightedOption.name)
      }

      return
    }

    if (event.key === "Escape") {
      setIsDropdownOpen(false)
    }
  }

  return (
    <div ref={fieldRef} className="relative">
      <div className="flex overflow-hidden rounded-lg border border-slate-700/80 bg-slate-950/80">
        <input
          type="text"
          value={inputValue}
          onChange={(event) => handleInputChange(event.target.value)}
          onFocus={() => setIsDropdownOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={options.length > 0 ? "Select skill" : "No skills available"}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isDropdownOpen}
          aria-controls={listboxId}
          disabled={options.length === 0}
          className="w-full bg-transparent px-2.5 py-1.5 text-xs text-slate-100 outline-none placeholder:text-slate-500 disabled:cursor-not-allowed disabled:text-slate-500"
        />
        <button
          type="button"
          onClick={() => setIsDropdownOpen((current) => !current)}
          aria-label={isDropdownOpen ? "Hide skills" : "Show skills"}
          aria-expanded={isDropdownOpen}
          aria-controls={listboxId}
          disabled={options.length === 0}
          className="border-l border-slate-700/80 px-2 text-slate-300 transition hover:bg-slate-800 hover:text-slate-100 disabled:cursor-not-allowed disabled:text-slate-600"
        >
          v
        </button>
      </div>

      {isDropdownOpen ? (
        <div
          id={listboxId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-slate-700 bg-slate-950 shadow-[0_18px_40px_rgba(2,6,23,0.45)]"
        >
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, index) => (
              <button
                key={`${rowId}:${option.name}`}
                type="button"
                role="option"
                aria-selected={option.name === value}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => handleOptionSelect(option.name)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`block w-full px-3 py-2 text-left text-sm transition ${
                  index === highlightedIndex
                    ? "bg-sky-500/20 text-sky-100"
                    : option.name === value
                      ? "bg-slate-800 text-slate-100"
                      : "text-slate-200 hover:bg-slate-800"
                }`}
              >
                <div className="font-medium">{option.name}</div>
                <div className="truncate text-xs text-slate-400">{option.description}</div>
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-slate-400">
              No skills match the current filter.
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}

function formatComparisonNumber(value: number | null, maximumFractionDigits = 6): string {
  if (value === null || !Number.isFinite(value)) {
    return "—"
  }

  if (Math.abs(value - Math.round(value)) < 0.000001) {
    return Math.round(value).toLocaleString("en-US")
  }

  return value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  })
}

function formatSignedComparisonNumber(value: number | null): string {
  if (value === null || !Number.isFinite(value)) {
    return "—"
  }

  return `${value >= 0 ? "+" : "-"}${formatComparisonNumber(Math.abs(value))}`
}

function formatComparisonPercent(value: number | null): string {
  return value === null ? "—" : `${formatComparisonNumber(value)}%`
}

function getSavedBuildResultStatusClass(status: SavedBuildResultStatus): string {
  switch (status) {
    case "perfect":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
    case "close":
      return "border-sky-500/30 bg-sky-500/10 text-sky-100"
    case "off":
      return "border-rose-500/30 bg-rose-500/10 text-rose-100"
    case "incomplete":
      return "border-slate-700 bg-slate-900/80 text-slate-300"
  }
}

function getSavedBuildResultStatusLabel(status: SavedBuildResultStatus): string {
  switch (status) {
    case "perfect":
      return "Perfect"
    case "close":
      return "Within 0.001%"
    case "off":
      return "Mismatch"
    case "incomplete":
      return "Pending"
  }
}

function formatSavedBuildResultDebugValue(value: string): string {
  const normalized = value.replace(/\s+/g, " ").trim()
  return normalized.length > 0 ? normalized : "—"
}

function parseExpectedComparisonValue(value: string): number | null {
  const normalized = value.replace(/,/g, "").trim()

  if (normalized.length === 0) {
    return null
  }

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

function parseStackCountOverride(value: string): {
  value: number | null
  isValid: boolean
} {
  const normalized = value.trim()

  if (normalized.length === 0) {
    return {
      value: null,
      isValid: true,
    }
  }

  const parsed = Number(normalized)
  if (!Number.isFinite(parsed) || parsed < 0) {
    return {
      value: null,
      isValid: false,
    }
  }

  return {
    value: Math.floor(parsed),
    isValid: true,
  }
}

function formatSavedBuildResultStackLabel(stackCount: number, isOverride: boolean): string {
  return isOverride ? String(stackCount) : `Saved (${stackCount})`
}

function buildSavedBuildResultDebugBlock(
  rows: readonly SavedBuildResultTableRow[],
  buildNameById: ReadonlyMap<string, string>,
  resultByBuildId: ReadonlyMap<string, SavedBuildCalculatedResult>,
): string {
  const lines = [
    "Saved Build Result Match",
    "Row\tBuild\tBuild ID\tSkill\tStat\tStack\tExpected\tCalculated\tDelta\tDiff\tStatus\tNote",
  ]

  if (rows.length === 0) {
    lines.push("—\t—\t—\t—\t—\t—\t—\t—\t—\t—\tPending\tNo rows")
    return lines.join("\n")
  }

  rows.forEach((row, index) => {
    const evaluation = evaluateSavedBuildResultRow(row, resultByBuildId)

    lines.push([
      `${index + 1}`,
      formatSavedBuildResultDebugValue(buildNameById.get(row.buildId) ?? ""),
      formatSavedBuildResultDebugValue(row.buildId),
      formatSavedBuildResultDebugValue(row.skillName),
      getSavedBuildComparisonModeLabel(row.mode),
      formatSavedBuildResultDebugValue(evaluation.stackLabel),
      formatSavedBuildResultDebugValue(row.expectedValue),
      formatComparisonNumber(evaluation.calculatedValue),
      formatSignedComparisonNumber(evaluation.delta),
      formatComparisonPercent(evaluation.percentDifference),
      getSavedBuildResultStatusLabel(evaluation.status),
      formatSavedBuildResultDebugValue(evaluation.note),
    ].join("\t"))
  })

  return lines.join("\n")
}

function evaluateSavedBuildResultRow(
  row: SavedBuildResultTableRow,
  resultByBuildId: ReadonlyMap<string, SavedBuildCalculatedResult>,
): {
  calculatedValue: number | null
  expectedValue: number | null
  delta: number | null
  percentDifference: number | null
  status: SavedBuildResultStatus
  stackLabel: string
  note: string
} {
  if (!row.buildId) {
    return {
      calculatedValue: null,
      expectedValue: null,
      delta: null,
      percentDifference: null,
      status: "incomplete",
      stackLabel: "—",
      note: "Pick build",
    }
  }

  const calculatedResult = resultByBuildId.get(row.buildId)
  if (!calculatedResult) {
    return {
      calculatedValue: null,
      expectedValue: null,
      delta: null,
      percentDifference: null,
      status: "incomplete",
      stackLabel: "—",
      note: "Saved build missing",
    }
  }

  if (!row.skillName) {
    return {
      calculatedValue: null,
      expectedValue: null,
      delta: null,
      percentDifference: null,
      status: "incomplete",
      stackLabel: "—",
      note: "Pick skill",
    }
  }

  const comparisonOptions = getSavedBuildSkillComparisonOptions(calculatedResult, row.skillName)
  if (comparisonOptions.length === 0) {
    return {
      calculatedValue: null,
      expectedValue: null,
      delta: null,
      percentDifference: null,
      status: "incomplete",
      stackLabel: "—",
      note: "No stats available",
    }
  }

  if (!comparisonOptions.some((option) => option.key === row.mode)) {
    return {
      calculatedValue: null,
      expectedValue: null,
      delta: null,
      percentDifference: null,
      status: "incomplete",
      stackLabel: "—",
      note: "Pick stat",
    }
  }

  const usesBuffStacks = isSavedBuildBuffMode(row.mode)
    && doesSavedBuildSkillSupportBuffStacks(calculatedResult, row.skillName)
  const parsedStackCountOverride = usesBuffStacks ? parseStackCountOverride(row.stackCount) : { value: null, isValid: true }

  if (!parsedStackCountOverride.isValid) {
    return {
      calculatedValue: null,
      expectedValue: null,
      delta: null,
      percentDifference: null,
      status: "incomplete",
      stackLabel: "—",
      note: "Invalid stack",
    }
  }

  const stackLabel = usesBuffStacks
    ? formatSavedBuildResultStackLabel(
      parsedStackCountOverride.value ?? getSavedBuildSkillDefaultStackCount(calculatedResult, row.skillName),
      parsedStackCountOverride.value !== null,
    )
    : "—"
  const skillResult = calculateSavedBuildSkillResult(calculatedResult, row.skillName, {
    buffStackOverride: parsedStackCountOverride.value,
  })
  if (!skillResult) {
    return {
      calculatedValue: null,
      expectedValue: null,
      delta: null,
      percentDifference: null,
      status: "incomplete",
      stackLabel,
      note: "Skill missing",
    }
  }

  const calculatedValue = getSavedBuildCalculatedValue(skillResult, row.mode)
  if (calculatedValue === null) {
    return {
      calculatedValue: null,
      expectedValue: null,
      delta: null,
      percentDifference: null,
      status: "incomplete",
      stackLabel,
      note: "Result unavailable",
    }
  }

  const expectedValue = parseExpectedComparisonValue(row.expectedValue)
  if (row.expectedValue.trim().length === 0) {
    return {
      calculatedValue,
      expectedValue: null,
      delta: null,
      percentDifference: null,
      status: "incomplete",
      stackLabel,
      note: "Enter expected",
    }
  }

  if (expectedValue === null) {
    return {
      calculatedValue,
      expectedValue: null,
      delta: null,
      percentDifference: null,
      status: "incomplete",
      stackLabel,
      note: "Invalid value",
    }
  }
  const delta = calculatedValue - expectedValue

  if (Math.abs(delta) < 0.000001) {
    return {
      calculatedValue,
      expectedValue,
      delta,
      percentDifference: 0,
      status: "perfect",
      stackLabel,
      note: "Exact match",
    }
  }

  const percentDifference = expectedValue === 0
    ? null
    : (Math.abs(delta) / Math.abs(expectedValue)) * 100

  if (percentDifference !== null && percentDifference <= 0.001) {
    return {
      calculatedValue,
      expectedValue,
      delta,
      percentDifference,
      status: "close",
      stackLabel,
      note: "Within tolerance",
    }
  }

  return {
    calculatedValue,
    expectedValue,
    delta,
    percentDifference,
    status: "off",
    stackLabel,
    note: percentDifference === null ? "Expected is zero" : "Outside tolerance",
  }
}

function SavedBuildResultComparisonSection({
  rows,
  setRows,
  savedBuildProfiles,
  resultByBuildId,
}: {
  rows: SavedBuildResultTableRow[]
  setRows: Dispatch<SetStateAction<SavedBuildResultTableRow[]>>
  savedBuildProfiles: StoredBuildProfile[]
  resultByBuildId: ReadonlyMap<string, SavedBuildCalculatedResult>
}) {
  const [copyFeedback, setCopyFeedback] = useState<"idle" | "copied" | "failed">("idle")
  const debugBlockRef = useRef<HTMLTextAreaElement | null>(null)
  const buildNameById = useMemo(
    () => new Map(savedBuildProfiles.map((profile) => [profile.id, profile.name])),
    [savedBuildProfiles],
  )
  const debugBlockText = useMemo(
    () => buildSavedBuildResultDebugBlock(rows, buildNameById, resultByBuildId),
    [rows, buildNameById, resultByBuildId],
  )
  const statusSummary = useMemo(
    () => rows.reduce(
      (summary, row) => {
        const evaluation = evaluateSavedBuildResultRow(row, resultByBuildId)

        if (evaluation.status === "perfect") summary.perfect += 1
        if (evaluation.status === "close") summary.close += 1
        if (evaluation.status === "off") summary.off += 1

        return summary
      },
      { perfect: 0, close: 0, off: 0 },
    ),
    [rows, resultByBuildId],
  )

  useEffect(() => {
    if (copyFeedback === "idle") {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setCopyFeedback("idle")
    }, 2200)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [copyFeedback])

  const updateRow = (rowId: string, patch: Partial<SavedBuildResultTableRow>) => {
    setRows((current) => current.map((row) => row.id === rowId ? { ...row, ...patch } : row))
  }

  const removeRow = (rowId: string) => {
    setRows((current) => {
      const nextRows = current.filter((row) => row.id !== rowId)

      if (nextRows.length > 0) {
        return nextRows
      }

      const defaultBuildId = savedBuildProfiles[0]?.id ?? ""
      const fallbackRow = createSavedBuildResultRow(defaultBuildId)
      fallbackRow.skillName = getDefaultSkillNameForBuild(defaultBuildId, resultByBuildId)
      fallbackRow.mode = getDefaultComparisonModeForSkill(defaultBuildId, fallbackRow.skillName, resultByBuildId)
      return [fallbackRow]
    })
  }

  const addRow = () => {
    const defaultBuildId = savedBuildProfiles[0]?.id ?? ""
    const nextRow = createSavedBuildResultRow(defaultBuildId)
    nextRow.skillName = getDefaultSkillNameForBuild(defaultBuildId, resultByBuildId)
    nextRow.mode = getDefaultComparisonModeForSkill(defaultBuildId, nextRow.skillName, resultByBuildId)
    setRows((current) => [...current, nextRow])
  }

  const handleCopyBlock = async () => {
    const textarea = debugBlockRef.current
    textarea?.focus()
    textarea?.select()

    let didCopy = false

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(debugBlockText)
        didCopy = true
      }
    } catch {
      didCopy = false
    }

    if (!didCopy && typeof document !== "undefined") {
      didCopy = document.execCommand("copy")
    }

    setCopyFeedback(didCopy ? "copied" : "failed")
  }

  const copyButtonClass = copyFeedback === "copied"
    ? "rounded-lg border border-emerald-500/50 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-semibold text-emerald-100 transition"
    : copyFeedback === "failed"
      ? "rounded-lg border border-amber-500/50 bg-amber-500/10 px-2.5 py-1.5 text-xs font-semibold text-amber-100 transition"
      : compactButtonClass
  const copyButtonLabel = copyFeedback === "copied"
    ? "Copied"
    : copyFeedback === "failed"
      ? "Press Ctrl/Cmd+C"
      : "Copy Block"

  return (
    <section className={panelClass}>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800/80 px-5 py-4 sm:px-6">
        <div>
          <div className="text-lg font-semibold text-slate-50">Saved Build Result Match</div>
          <div className="mt-1 text-xs leading-5 text-slate-400">
            Compare any saved build&apos;s skill damage, DOT, healing, threat, or buff result to an expected number. Threat uses maximized crit threat.
          </div>
          <div className="mt-1 text-[11px] leading-5 text-slate-500">
            Build, skill, stat, and expected values are saved locally so these rows can act as regression checks.
          </div>
          <div className="mt-1 text-[11px] leading-5 text-slate-500">
            Stack only applies to buff comparisons. Leave it blank to use the saved build&apos;s current stack for that skill.
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em]">
            <div className={`rounded-full border px-2.5 py-1 ${getSavedBuildResultStatusClass("perfect")}`}>
              {statusSummary.perfect} Perfect
            </div>
            <div className={`rounded-full border px-2.5 py-1 ${getSavedBuildResultStatusClass("close")}`}>
              {statusSummary.close} Within Tolerance
            </div>
            <div className={`rounded-full border px-2.5 py-1 ${getSavedBuildResultStatusClass("off")}`}>
              {statusSummary.off} Fail
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCopyBlock}
            className={copyButtonClass}
          >
            {copyButtonLabel}
          </button>

          <button
            type="button"
            onClick={addRow}
            className={compactPrimaryButtonClass}
            disabled={savedBuildProfiles.length === 0}
          >
            Add Row
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        {savedBuildProfiles.length === 0 ? (
          <div className={emptyStateClass}>
            No saved builds found. Save a build first, then compare one of its skill results here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-1.5 text-xs">
              <thead>
                <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  <th className="px-2.5 py-1">Build</th>
                  <th className="px-2.5 py-1">Skill</th>
                  <th className="px-2.5 py-1">Stat</th>
                  <th className="px-2.5 py-1">Stack</th>
                  <th className="px-2.5 py-1">Expected</th>
                  <th className="px-2.5 py-1">Calculated</th>
                  <th className="px-2.5 py-1">Delta</th>
                  <th className="px-2.5 py-1">Diff</th>
                  <th className="px-2.5 py-1">Status</th>
                  <th className="px-2.5 py-1"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const evaluation = evaluateSavedBuildResultRow(row, resultByBuildId)
                  const buildResult = row.buildId ? resultByBuildId.get(row.buildId) ?? null : null
                  const comparisonOptions = buildResult && row.skillName
                    ? getSavedBuildSkillComparisonOptions(buildResult, row.skillName)
                    : []
                  const damageComparisonOptions = comparisonOptions.filter((option) => option.source === "damage")
                  const healingComparisonOptions = comparisonOptions.filter((option) => option.source === "healing")
                  const buffComparisonOptions = comparisonOptions.filter((option) => option.source === "buff")
                  const selectedModeValue = comparisonOptions.some((option) => option.key === row.mode)
                    ? row.mode
                    : ""
                  const supportsBuffStacks = buildResult && row.skillName
                    ? doesSavedBuildSkillSupportBuffStacks(buildResult, row.skillName)
                    : false
                  const stackInputEnabled = isSavedBuildBuffMode(row.mode) && supportsBuffStacks
                  const savedBuildStackCount = buildResult && row.skillName
                    ? getSavedBuildSkillDefaultStackCount(buildResult, row.skillName)
                    : 0

                  return (
                    <tr key={row.id} className="align-top">
                      <td className="rounded-l-xl border border-slate-800/80 bg-slate-950/65 px-2.5 py-2">
                        <select
                          value={row.buildId}
                          onChange={(event) => {
                            const nextBuildId = event.target.value
                            const nextSkillName = getDefaultSkillNameForBuild(nextBuildId, resultByBuildId)
                            updateRow(row.id, {
                              buildId: nextBuildId,
                              skillName: nextSkillName,
                              mode: getDefaultComparisonModeForSkill(nextBuildId, nextSkillName, resultByBuildId),
                              stackCount: "",
                            })
                          }}
                          className={compactFieldClass}
                        >
                          <option value="">Select saved build</option>
                          {savedBuildProfiles.map((profile) => (
                            <option key={profile.id} value={profile.id}>
                              {profile.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="border-y border-slate-800/80 bg-slate-950/55 px-2.5 py-2">
                        <SavedBuildSkillCombobox
                          rowId={row.id}
                          value={row.skillName}
                          options={buildResult?.skills ?? []}
                          onChange={(nextValue) => updateRow(row.id, {
                            skillName: nextValue,
                            mode: getNextComparisonModeForSkill(buildResult, nextValue, row.mode),
                            stackCount: "",
                          })}
                        />
                      </td>
                      <td className="border-y border-slate-800/80 bg-slate-950/55 px-2.5 py-2">
                        <select
                          value={selectedModeValue}
                          onChange={(event) => updateRow(row.id, {
                            mode: isSavedBuildComparisonMode(event.target.value) ? event.target.value : "maxcrit",
                          })}
                          className={compactFieldClass}
                          disabled={comparisonOptions.length === 0}
                        >
                          <option value="">
                            {row.skillName ? "Select stat" : "Select skill first"}
                          </option>
                          {damageComparisonOptions.length > 0 ? (
                            <optgroup label="Damage">
                              {damageComparisonOptions.map((option) => (
                                <option key={option.key} value={option.key}>
                                  {option.label}
                                </option>
                              ))}
                            </optgroup>
                          ) : null}
                          {healingComparisonOptions.length > 0 ? (
                            <optgroup label="Healing">
                              {healingComparisonOptions.map((option) => (
                                <option key={option.key} value={option.key}>
                                  {option.label}
                                </option>
                              ))}
                            </optgroup>
                          ) : null}
                          {buffComparisonOptions.length > 0 ? (
                            <optgroup label="Buff">
                              {buffComparisonOptions.map((option) => (
                                <option key={option.key} value={option.key}>
                                  {option.label}
                                </option>
                              ))}
                            </optgroup>
                          ) : null}
                        </select>
                      </td>
                      <td className="border-y border-slate-800/80 bg-slate-950/55 px-2.5 py-2">
                        <input
                          type="number"
                          inputMode="numeric"
                          min={0}
                          step={1}
                          value={row.stackCount}
                          onChange={(event) => updateRow(row.id, { stackCount: event.target.value })}
                          placeholder={supportsBuffStacks ? String(savedBuildStackCount) : "—"}
                          disabled={!stackInputEnabled}
                          className={compactFieldClass}
                        />
                      </td>
                      <td className="border-y border-slate-800/80 bg-slate-950/55 px-2.5 py-2">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={row.expectedValue}
                          onChange={(event) => updateRow(row.id, { expectedValue: event.target.value })}
                          placeholder="2000"
                          className={compactFieldClass}
                        />
                      </td>
                      <td className="border-y border-slate-800/80 bg-slate-950/55 px-2.5 py-2 font-mono text-slate-200">
                        {formatComparisonNumber(evaluation.calculatedValue)}
                      </td>
                      <td className="border-y border-slate-800/80 bg-slate-950/55 px-2.5 py-2 font-mono text-slate-300">
                        {formatSignedComparisonNumber(evaluation.delta)}
                      </td>
                      <td className="border-y border-slate-800/80 bg-slate-950/55 px-2.5 py-2 font-mono text-slate-300">
                        {formatComparisonPercent(evaluation.percentDifference)}
                      </td>
                      <td className="border-y border-slate-800/80 bg-slate-950/55 px-2.5 py-2">
                        <div className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${getSavedBuildResultStatusClass(evaluation.status)}`}>
                          {getSavedBuildResultStatusLabel(evaluation.status)}
                        </div>
                      </td>
                      <td className="rounded-r-xl border border-slate-800/80 bg-slate-950/65 px-2.5 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => removeRow(row.id)}
                          className={compactButtonClass}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4">
          <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Debug Copy Block</div>
              <div className="mt-1 text-xs leading-5 text-slate-400">
                Click into the block to select everything, or use Copy Block. Build IDs are included to make pasted debug reports more useful.
              </div>
            </div>
          </div>

          <textarea
            ref={debugBlockRef}
            readOnly
            spellCheck={false}
            value={debugBlockText}
            onFocus={(event) => event.currentTarget.select()}
            className={`${textareaClass} min-h-[10rem] text-[11px] leading-5`}
          />
        </div>
      </div>
    </section>
  )
}

function getCharacterComparisonSections(calcCard: TerminalCardData, parsedCard: ParsedTerminalCard) {
  return [
    {
      title: "Main Stats",
      subtitle: "Health, Mana, and Focus use max caps when the paste shows current / max.",
      rows: buildMainRowComparisonRows(calcCard.mainRows, parsedCard.mainRows),
    },
    {
      title: "Details",
      subtitle: "Detail lines compare the parsed displayed values, with numeric deltas when possible.",
      rows: buildDetailRowComparisonRows(calcCard.detailRows, parsedCard.detailRows),
    },
    {
      title: "Damage Types",
      subtitle: "Each row compares DMG, xDMG, PEN, and xPEN as one grouped value.",
      rows: buildTypeRowComparisonRows(calcCard.typeRows, parsedCard.typeRows),
    },
    {
      title: "Elements",
      subtitle: "Each row compares DMG, RES, and PEN as one grouped value.",
      rows: buildElementRowComparisonRows(calcCard.elementRows, parsedCard.elementRows),
    },
  ]
}

function getDungeonComparisonSections(calcCard: TerminalCardData, parsedCard: ParsedTerminalCard) {
  return [
    {
      title: "Main Stats",
      subtitle: "Health compares against max HP only. Mana and Focus use max caps when the paste shows current / max.",
      rows: buildMainRowComparisonRows(calcCard.mainRows, parsedCard.mainRows, dungeonResourceCapComparisonLabels),
    },
    {
      title: "Details",
      subtitle: "Detail lines compare the parsed displayed values, with numeric deltas when possible.",
      rows: buildDetailRowComparisonRows(calcCard.detailRows, parsedCard.detailRows),
    },
    {
      title: "Damage Types",
      subtitle: "Each row compares DMG, xDMG, PEN, and xPEN as one grouped value.",
      rows: buildTypeRowComparisonRows(calcCard.typeRows, parsedCard.typeRows),
    },
    {
      title: "Elements",
      subtitle: "Each row compares DMG, RES, and PEN as one grouped value.",
      rows: buildElementRowComparisonRows(calcCard.elementRows, parsedCard.elementRows),
    },
  ]
}

export default function DebugVarsPage() {
  const [summary, setSummary] = useState<SummaryState | null>(null)
  const [savedBuildProfiles, setSavedBuildProfiles] = useState<StoredBuildProfile[]>([])
  const [inputs, setInputs] = useState<PasteInputs>(defaultInputs)
  const [savedBuildResultRows, setSavedBuildResultRows] = useState<SavedBuildResultTableRow[]>([createSavedBuildResultRow()])
  const [isPasteInputsCollapsed, setIsPasteInputsCollapsed] = useState(false)
  const [hasLoadedPersistedDebugState, setHasLoadedPersistedDebugState] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    try {
      const storedInputs = JSON.parse(window.localStorage.getItem(INPUT_STORAGE_KEY) ?? "null") as Partial<PasteInputs> | null
      if (storedInputs) {
        setInputs({
          guildCard: typeof storedInputs.guildCard === "string" ? storedInputs.guildCard : "",
          characterCard: typeof storedInputs.characterCard === "string" ? storedInputs.characterCard : "",
          dungeonStats: typeof storedInputs.dungeonStats === "string" ? storedInputs.dungeonStats : "",
          buffs: typeof storedInputs.buffs === "string" ? storedInputs.buffs : "",
          conversions: typeof storedInputs.conversions === "string" ? storedInputs.conversions : "",
        })
      }
    } catch {
      setInputs(defaultInputs)
    }

    try {
      const storedRows = JSON.parse(window.localStorage.getItem(SAVED_BUILD_RESULT_TABLE_STORAGE_KEY) ?? "null")
      setSavedBuildResultRows(normalizeSavedBuildResultRows(storedRows))
    } catch {
      setSavedBuildResultRows([createSavedBuildResultRow()])
    }

    setIsPasteInputsCollapsed(window.localStorage.getItem(PASTE_INPUTS_COLLAPSED_STORAGE_KEY) === "true")

    setHasLoadedPersistedDebugState(true)

    const refresh = () => {
      setSummary(buildDebugSummary(window.localStorage))
      setSavedBuildProfiles(readBuildManagerState(window.localStorage).profiles)
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
    if (typeof window === "undefined" || !hasLoadedPersistedDebugState) {
      return
    }

    window.localStorage.setItem(INPUT_STORAGE_KEY, JSON.stringify(inputs))
  }, [hasLoadedPersistedDebugState, inputs])

  useEffect(() => {
    if (typeof window === "undefined" || !hasLoadedPersistedDebugState) {
      return
    }

    window.localStorage.setItem(SAVED_BUILD_RESULT_TABLE_STORAGE_KEY, JSON.stringify(savedBuildResultRows))
  }, [hasLoadedPersistedDebugState, savedBuildResultRows])

  useEffect(() => {
    if (typeof window === "undefined" || !hasLoadedPersistedDebugState) {
      return
    }

    window.localStorage.setItem(PASTE_INPUTS_COLLAPSED_STORAGE_KEY, String(isPasteInputsCollapsed))
  }, [hasLoadedPersistedDebugState, isPasteInputsCollapsed])

  const parsedGuildCard = useMemo(() => parseGuildCard(inputs.guildCard), [inputs.guildCard])
  const parsedCharacterCard = useMemo(() => parseTerminalCard(inputs.characterCard), [inputs.characterCard])
  const parsedDungeonStats = useMemo(() => parseTerminalCard(inputs.dungeonStats), [inputs.dungeonStats])
  const parsedBuffs = useMemo(() => parseBuffs(inputs.buffs), [inputs.buffs])
  const parsedConversions = useMemo(() => parseConversions(inputs.conversions), [inputs.conversions])

  const guildRows = useMemo(
    () => (summary ? buildLabelValueComparisonRows(getGuildCardRows(summary), parsedGuildCard) : []),
    [parsedGuildCard, summary],
  )
  const characterSections = useMemo(
    () => (summary ? getCharacterComparisonSections(getCharacterCardData(summary), parsedCharacterCard) : []),
    [parsedCharacterCard, summary],
  )
  const dungeonSections = useMemo(
    () => (summary ? getDungeonComparisonSections(getDungeonCardData(summary), parsedDungeonStats) : []),
    [parsedDungeonStats, summary],
  )
  const calcBuffs = useMemo(() => (summary ? getCalcSkillBuffs(summary) : []), [summary])
  const conversionRows = useMemo(
    () => (summary ? buildLabelValueComparisonRows(getTalentConversionComparisonRows(summary.snapshot, summary.charcardStages), parsedConversions) : []),
    [parsedConversions, summary],
  )
  const savedBuildCalculatedResults = useMemo(
    () => buildSavedBuildCalculatedResults(savedBuildProfiles),
    [savedBuildProfiles],
  )
  const savedBuildCalculatedResultById = useMemo(
    () => new Map(savedBuildCalculatedResults.map((result) => [result.profile.id, result])),
    [savedBuildCalculatedResults],
  )

  if (!summary) {
    return (
      <div className="p-4 sm:p-6">
        <div className={`${panelClass} px-6 py-8`}>
          <div className="text-sm text-slate-300">Loading debug comparison...</div>
        </div>
      </div>
    )
  }

  const hasGuildInput = inputs.guildCard.trim().length > 0
  const hasCharacterInput = inputs.characterCard.trim().length > 0
  const hasDungeonInput = inputs.dungeonStats.trim().length > 0
  const hasBuffInput = inputs.buffs.trim().length > 0
  const hasConversionInput = inputs.conversions.trim().length > 0

  return (
    <div className="min-h-[calc(100vh-var(--top-nav-height))] bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.12),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(249,115,22,0.08),transparent_32%)] p-4 sm:p-6">
      <div className="space-y-4">

        <PasteInputTable
          inputs={inputs}
          setInputs={setInputs}
          onClear={() => setInputs(defaultInputs)}
          isCollapsed={isPasteInputsCollapsed}
          onToggleCollapsed={() => setIsPasteInputsCollapsed((current) => !current)}
        />

        {hasGuildInput ? (
          <ComparisonBlock
            title="Guild Card Comparison"
            subtitle="Checks the guild card values against the calculator’s current build snapshot."
          >
            <ComparisonTable
              title="Guild Card Fields"
              subtitle="Numeric rows show deltas as in-game minus calc."
              rows={guildRows}
            />
          </ComparisonBlock>
        ) : null}

        {hasCharacterInput ? (
          <ComparisonBlock
            title="Character Card Comparison"
            subtitle="Compares the out-of-dungeon character card against the calculator’s current display values."
          >
            <div className="grid gap-3 xl:grid-cols-2">
              {characterSections.map((section) => (
                <ComparisonTable
                  key={section.title}
                  title={section.title}
                  subtitle={section.subtitle}
                  rows={section.rows}
                />
              ))}
            </div>
          </ComparisonBlock>
        ) : null}

        {hasDungeonInput ? (
          <ComparisonBlock
            title="Dungeon Card Comparison"
            subtitle="Compares the dungeon card against the calculator’s current dungeon values."
          >
            <div className="grid gap-3 xl:grid-cols-2">
              {dungeonSections.map((section) => (
                <ComparisonTable
                  key={section.title}
                  title={section.title}
                  subtitle={section.subtitle}
                  rows={section.rows}
                />
              ))}
            </div>
          </ComparisonBlock>
        ) : null}

        {hasBuffInput ? (
          <ComparisonBlock
            title="Buff Comparison"
            subtitle="Compares pasted buff names and parsed effect lines against the calculator’s active skill and tarot effects."
          >
            <BuffComparisonSection calcBuffs={calcBuffs} inGameBuffs={parsedBuffs} />
          </ComparisonBlock>
        ) : null}

        {hasConversionInput ? (
          <ComparisonBlock
            title="Conversions Comparison"
            subtitle="Compares pasted My Conversions blocks against the calculator’s current conversion list by source stat token."
          >
            <ComparisonTable
              title="My Conversions"
              subtitle="Each row compares the source value, conversion percent, and output value together."
              rows={conversionRows}
            />
          </ComparisonBlock>
        ) : null}

        <SavedBuildResultComparisonSection
          rows={savedBuildResultRows}
          setRows={setSavedBuildResultRows}
          savedBuildProfiles={savedBuildProfiles}
          resultByBuildId={savedBuildCalculatedResultById}
        />
      </div>
    </div>
  )
}
