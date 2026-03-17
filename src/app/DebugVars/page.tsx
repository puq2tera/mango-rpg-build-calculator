"use client"

import { useEffect, useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from "react"
import { BUILD_SNAPSHOT_UPDATED_EVENT } from "@/app/lib/buildEvents"
import {
  buildDebugSummary,
  formatWhole,
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
  compareComparableValues,
  createComparableValue,
  getBuffEffectSignature,
  parseBuffs,
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

type PasteInputs = {
  guildCard: string
  characterCard: string
  dungeonStats: string
  buffs: string
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

const INPUT_STORAGE_KEY = "debugVars:comparisonInputs"

const panelClass =
  "rounded-[28px] border border-slate-800/80 bg-[linear-gradient(145deg,rgba(6,11,20,0.97),rgba(15,23,42,0.9))] shadow-[0_28px_90px_rgba(2,6,23,0.42)]"

const textareaClass =
  "min-h-[8.5rem] w-full rounded-xl border border-slate-700/80 bg-slate-950/80 px-3 py-2.5 font-mono text-xs text-slate-100 shadow-inner outline-none transition placeholder:text-slate-500 focus:border-sky-300/50 focus:ring-2 focus:ring-sky-400/20"

const compactCardClass =
  "rounded-2xl border border-slate-800/80 bg-slate-950/55 px-4 py-3.5 shadow-[0_16px_40px_rgba(2,6,23,0.22)]"

const emptyStateClass =
  "rounded-2xl border border-dashed border-slate-700/80 bg-slate-950/40 px-4 py-8 text-center text-sm text-slate-400"

const defaultInputs: PasteInputs = {
  guildCard: "",
  characterCard: "",
  dungeonStats: "",
  buffs: "",
}

function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
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

const defaultResourceCapComparisonLabels = new Set(["Mana", "Focus"])
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
}: {
  inputs: PasteInputs
  setInputs: Dispatch<SetStateAction<PasteInputs>>
  onClear: () => void
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
          <div className="text-xl font-semibold text-slate-50">Paste Inputs</div>
          <div className="mt-1 text-sm text-slate-400">
            Unmatched rows stay visible so parser gaps and unsupported fields are obvious.
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
    normalizedName: normalizeName(buff.name),
    effects: buff.effects.map((effect) => ({
      display: effect.label,
      signature: `${effect.stat}:${effect.value}`,
    })),
  }))
  const inGameComparable = inGameBuffs.map<ComparableBuff>((buff) => ({
    name: buff.name,
    normalizedName: buff.normalizedName,
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
            Buff names are matched case-insensitively. Effect rows compare by parsed stat key and amount when possible.
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
  hasInput,
  children,
}: {
  title: string
  subtitle: string
  hasInput: boolean
  children: ReactNode
}) {
  return (
    <section className={panelClass}>
      <div className="border-b border-slate-800/80 px-5 py-4 sm:px-6">
        <div className="text-lg font-semibold text-slate-50">{title}</div>
        <div className="mt-1 text-xs leading-5 text-slate-400">{subtitle}</div>
      </div>

      <div className="p-4 sm:p-5">
        {hasInput ? children : (
          <div className={emptyStateClass}>
            Paste the corresponding in-game output above to generate a comparison.
          </div>
        )}
      </div>
    </section>
  )
}

function getCharacterComparisonSections(calcCard: TerminalCardData, parsedCard: ParsedTerminalCard) {
  return [
    {
      title: "Main Stats",
      subtitle: "Health compares current HP to level HP and max HP to total HP. Mana and Focus use max caps when the paste shows current / max.",
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
  const [inputs, setInputs] = useState<PasteInputs>(defaultInputs)

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
        })
      }
    } catch {
      setInputs(defaultInputs)
    }

    const refresh = () => {
      setSummary(buildDebugSummary(window.localStorage))
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

    window.localStorage.setItem(INPUT_STORAGE_KEY, JSON.stringify(inputs))
  }, [inputs])

  const parsedGuildCard = useMemo(() => parseGuildCard(inputs.guildCard), [inputs.guildCard])
  const parsedCharacterCard = useMemo(() => parseTerminalCard(inputs.characterCard), [inputs.characterCard])
  const parsedDungeonStats = useMemo(() => parseTerminalCard(inputs.dungeonStats), [inputs.dungeonStats])
  const parsedBuffs = useMemo(() => parseBuffs(inputs.buffs), [inputs.buffs])

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

  if (!summary) {
    return (
      <div className="p-4 sm:p-6">
        <div className={`${panelClass} mx-auto max-w-7xl px-6 py-8`}>
          <div className="text-sm text-slate-300">Loading debug comparison...</div>
        </div>
      </div>
    )
  }

  const hasGuildInput = inputs.guildCard.trim().length > 0
  const hasCharacterInput = inputs.characterCard.trim().length > 0
  const hasDungeonInput = inputs.dungeonStats.trim().length > 0
  const hasBuffInput = inputs.buffs.trim().length > 0

  return (
    <div className="min-h-[calc(100vh-var(--top-nav-height))] bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.12),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(249,115,22,0.08),transparent_32%)] p-4 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-4">
        <section className={`${panelClass} px-5 py-4 sm:px-6`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.26em] text-sky-300">Debug Comparison</div>
            <div className="text-xs text-slate-400">Current calculator snapshot</div>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className={compactCardClass}>
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Race</div>
              <div className="mt-1.5 text-lg font-semibold text-slate-50">{summary.raceName}</div>
            </div>
            <div className={compactCardClass}>
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Total Levels</div>
              <div className="mt-1.5 text-lg font-semibold text-slate-50">{formatWhole(summary.totalLevels)}</div>
            </div>
            <div className={compactCardClass}>
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Selected Buffs</div>
              <div className="mt-1.5 text-lg font-semibold text-slate-50">{formatWhole(summary.snapshot.selectedBuffs.length)}</div>
            </div>
            <div className={compactCardClass}>
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Skill / Talent</div>
              <div className="mt-1.5 text-lg font-semibold text-slate-50">
                {formatWhole(summary.remainingSkillPoints)} / {formatWhole(summary.remainingTalentPoints)}
              </div>
            </div>
          </div>
        </section>

        <PasteInputTable inputs={inputs} setInputs={setInputs} onClear={() => setInputs(defaultInputs)} />

        <ComparisonBlock
          title="Guild Card Comparison"
          subtitle="Checks the guild card values against the calculator’s current build snapshot."
          hasInput={hasGuildInput}
        >
          <ComparisonTable
            title="Guild Card Fields"
            subtitle="Numeric rows show deltas as in-game minus calc."
            rows={guildRows}
          />
        </ComparisonBlock>

        <ComparisonBlock
          title="Character Card Comparison"
          subtitle="Compares the out-of-dungeon character card against the calculator’s current display values."
          hasInput={hasCharacterInput}
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

        <ComparisonBlock
          title="Dungeon Card Comparison"
          subtitle="Compares the dungeon card against the calculator’s current dungeon values. Note: Overdrive Scaling is currently broken for dungeon output."
          hasInput={hasDungeonInput}
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

        <ComparisonBlock
          title="Buff Comparison"
          subtitle="Compares pasted buff names and parsed effect lines against the calculator’s selected skill buffs."
          hasInput={hasBuffInput}
        >
          <BuffComparisonSection calcBuffs={calcBuffs} inGameBuffs={parsedBuffs} />
        </ComparisonBlock>
      </div>
    </div>
  )
}
