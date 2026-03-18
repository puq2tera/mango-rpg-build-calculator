import {
  getTalentConversionOutputLine,
  getTalentConversionSourceLine,
  getTalentConversionTooltip,
  type TalentConversionGroup,
} from "@/app/lib/talentConversionSummary"

export function MyConversionsGrid({
  conversions,
}: {
  conversions: readonly TalentConversionGroup[]
}) {
  return (
    <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
      {conversions.map((conversion) => (
        <div
          key={conversion.id}
          title={getTalentConversionTooltip(conversion)}
          className="cursor-help rounded-2xl border border-slate-700/70 bg-slate-950/55 p-4 shadow-[0_12px_32px_rgba(2,6,23,0.18)] transition hover:border-sky-300/35"
        >
          <div className="font-mono text-sm leading-6 break-words whitespace-pre-wrap text-slate-100">
            {getTalentConversionSourceLine(conversion)}
          </div>

          <div className="mt-2 space-y-1.5 pl-4">
            {conversion.rows.map((row) => (
              <div key={row.id} className="font-mono text-sm leading-6 break-words whitespace-pre-wrap text-slate-300">
                {getTalentConversionOutputLine(row)}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
