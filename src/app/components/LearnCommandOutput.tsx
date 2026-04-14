"use client"

import type { LearnCommandBatch } from "@/app/lib/learnCommands"
import CopyTextButton from "@/app/components/CopyTextButton"

type LearnCommandOutputProps = {
  batches: LearnCommandBatch[]
  emptyMessage: string
  maxLength: number
  subtitle: string
  title: string
}

export default function LearnCommandOutput({
  batches,
  emptyMessage,
  maxLength,
  subtitle,
  title,
}: LearnCommandOutputProps) {
  return (
    <section className="space-y-3">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-slate-50">{title}</h2>
        {subtitle ? (
          <p className="max-w-3xl text-sm text-slate-400">{subtitle}</p>
        ) : null}
      </div>

      {batches.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-700 bg-slate-950/65 px-4 py-5 text-sm text-slate-400">
          {emptyMessage}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/70">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/80 text-left">
                  <th className="w-16 px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Copy
                  </th>
                  <th className="w-40 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Summary
                  </th>
                  <th className="px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Command
                  </th>
                </tr>
              </thead>
              <tbody>
                {batches.map((batch, index) => (
                  <tr
                    key={`${batch.text}-${index}`}
                    className="border-b border-slate-800/80 last:border-b-0"
                  >
                    <td className="px-3 py-2 align-middle">
                      <CopyTextButton
                        label={`Copy command ${index + 1}`}
                        copiedLabel="Copied"
                        iconOnly
                        text={batch.text}
                      />
                    </td>
                    <td className="px-3 py-2 align-middle text-xs whitespace-nowrap text-slate-300">
                      {batch.entries.length} names, {batch.length}/{maxLength} chars
                    </td>
                    <td className="px-3 py-2 align-middle">
                      <div className="overflow-x-auto whitespace-nowrap font-mono text-sm leading-none text-slate-100">
                        {batch.text}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  )
}
