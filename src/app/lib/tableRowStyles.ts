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
    "bg-slate-950/10 hover:bg-slate-800/70",
    "bg-slate-900/28 hover:bg-slate-800/74",
  ],
  selected: [
    "bg-sky-800/55 text-sky-50 hover:bg-sky-700/65",
    "bg-cyan-800/55 text-sky-50 hover:bg-cyan-700/65",
  ],
  unavailable: [
    "bg-zinc-950/95 text-slate-600 ring-1 ring-inset ring-zinc-800/70 hover:bg-zinc-900/95",
    "bg-zinc-900/95 text-slate-600 ring-1 ring-inset ring-zinc-700/70 hover:bg-zinc-800/95",
  ],
  selectedUnavailable: [
    "bg-zinc-900/95 text-slate-500 ring-1 ring-inset ring-slate-500/30 hover:bg-zinc-800/95",
    "bg-zinc-800/95 text-slate-500 ring-1 ring-inset ring-slate-400/30 hover:bg-zinc-700/95",
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
