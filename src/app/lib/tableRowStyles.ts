export type TableRowTone =
  | "default"
  | "selected"
  | "unavailable"
  | "selectedUnavailable"
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
  unavailable: [
    "bg-slate-950/55 text-slate-500 hover:bg-slate-900/70",
    "bg-slate-900/70 text-slate-500 hover:bg-slate-800/75",
  ],
  selectedUnavailable: [
    "bg-slate-900/80 text-slate-400 ring-1 ring-inset ring-slate-500/40 hover:bg-slate-800/85",
    "bg-slate-800/85 text-slate-400 ring-1 ring-inset ring-slate-400/40 hover:bg-slate-700/85",
  ],
  invalid: [
    "bg-slate-950/45 ring-1 ring-inset ring-amber-700/35 hover:bg-slate-800/80",
    "bg-slate-900/60 ring-1 ring-inset ring-amber-600/35 hover:bg-slate-800/85",
  ],
  selectedInvalid: [
    "bg-amber-950/45 text-amber-50 ring-1 ring-inset ring-amber-400/45 hover:bg-amber-900/55",
    "bg-amber-900/60 text-amber-50 ring-1 ring-inset ring-amber-300/45 hover:bg-amber-800/65",
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
