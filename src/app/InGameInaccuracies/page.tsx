import Link from "next/link"
import {
  inGameSkillInaccuracies,
  inGameTalentInaccuracies,
  type InGameInaccuracyEntry,
} from "@/app/data/in_game_inaccuracies_data"

const pageShellClass =
  "min-h-[calc(100vh-var(--top-nav-height))] bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.14),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(251,191,36,0.12),transparent_28%),linear-gradient(180deg,rgba(2,6,23,0.98),rgba(15,23,42,0.94))] text-slate-100"

const panelClass =
  "overflow-hidden rounded-[28px] border border-slate-800/80 bg-slate-950/70 shadow-[0_24px_72px_rgba(2,6,23,0.38)] backdrop-blur"

function InaccuracySection({
  title,
  href,
  hrefLabel,
  entries,
}: {
  title: string
  href: string
  hrefLabel: string
  entries: readonly InGameInaccuracyEntry[]
}) {
  return (
    <section className={panelClass}>
      <div className="flex items-center justify-between gap-3 border-b border-slate-800/80 px-6 py-5">
        <div>
          <h2 className="text-lg font-semibold text-slate-50">{title}</h2>
          <p className="mt-1 text-sm text-slate-400">{entries.length} listed</p>
        </div>
        <Link
          href={href}
          className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-sky-400/60 hover:text-sky-100"
        >
          {hrefLabel}
        </Link>
      </div>
      {entries.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0">
            <thead>
              <tr className="bg-slate-950/50 text-left text-xs uppercase tracking-[0.14em] text-slate-400">
                <th className="border-b border-slate-800/80 px-6 py-3 font-semibold">Name</th>
                <th className="border-b border-slate-800/80 px-6 py-3 font-semibold">In-Game Description</th>
                <th className="border-b border-slate-800/80 px-6 py-3 font-semibold">Override</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.name} className="align-top">
                  <td className="border-b border-slate-800/70 px-6 py-4 text-sm font-semibold text-slate-100">
                    {entry.name}
                  </td>
                  <td className="border-b border-slate-800/70 px-6 py-4 text-sm leading-6 text-slate-200">
                    {entry.description}
                  </td>
                  <td className="border-b border-slate-800/70 px-6 py-4 text-sm text-slate-200">
                    <div className="space-y-2">
                      {entry.corrections.map((correction) => (
                        <div
                          key={`${entry.name}-${correction.from}-${correction.to}`}
                          className="inline-flex max-w-full items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1.5"
                        >
                          <span className="truncate text-amber-100">{correction.from}</span>
                          <span className="text-amber-300">-&gt;</span>
                          <span className="truncate font-semibold text-emerald-200">{correction.to}</span>
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="min-h-20 px-6 py-4" />
      )}
    </section>
  )
}

export default function InGameInaccuraciesPage() {
  return (
    <div className={pageShellClass}>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className={panelClass}>
          <div className="flex flex-col gap-3 px-6 py-6">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-300">
              Reference
            </span>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-50">In-Game Inaccuracies</h1>
              <p className="max-w-3xl text-sm leading-6 text-slate-300">
                This page tracks known cases where the in-game wording or displayed effect differs from the value
                used in the calculator. Entries here also drive the code-level stat overrides.
              </p>
            </div>
          </div>
        </section>

        <div className="grid gap-6">
          <InaccuracySection
            title="Talents"
            href="/talents"
            hrefLabel="Open talents"
            entries={inGameTalentInaccuracies}
          />
          <InaccuracySection
            title="Skills"
            href="/Skills"
            hrefLabel="Open skills"
            entries={inGameSkillInaccuracies}
          />
        </div>
      </div>
    </div>
  )
}
