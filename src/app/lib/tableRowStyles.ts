export type TableRowTone =
  | "default"
  | "selected"
  | "invalid"
  | "selectedInvalid"
  | "blocked"
  | "selectedBlocked"

const STRIPED_ROW_CLASSES: Record<TableRowTone, readonly [string, string]> = {
  default: [
    "bg-slate-950/25 hover:bg-slate-800/75",
    "bg-slate-900/40 hover:bg-slate-800/80",
  ],
  selected: [
    "bg-sky-800/55 text-sky-50 hover:bg-sky-700/65",
    "bg-cyan-800/55 text-sky-50 hover:bg-cyan-700/65",
  ],
  invalid: [
    "bg-rose-950/35 hover:bg-rose-900/50",
    "bg-rose-900/45 hover:bg-rose-900/55",
  ],
  selectedInvalid: [
    "bg-amber-950/40 hover:bg-amber-900/55",
    "bg-amber-900/55 hover:bg-amber-900/65",
  ],
  blocked: [
    "bg-yellow-950/35 hover:bg-yellow-900/45",
    "bg-yellow-900/45 hover:bg-yellow-900/55",
  ],
  selectedBlocked: [
    "bg-yellow-800/55 hover:bg-yellow-700/70",
    "bg-yellow-700/70 hover:bg-yellow-700/80",
  ],
}

export function getStripedRowClass(rowIndex: number, tone: TableRowTone): string {
  const parityIndex = Math.abs(rowIndex) % 2 === 0 ? 0 : 1
  return STRIPED_ROW_CLASSES[tone][parityIndex]
}
