"use client"

import { useMemo } from "react"
import type { LearnCommandBatch } from "@/app/lib/learnCommands"
import CopyTextButton from "@/app/components/CopyTextButton"

type LearnCommandOutputProps = {
  batches: LearnCommandBatch[]
  emptyMessage: string
  maxLength: number
  orderedNames: string[]
  subtitle: string
  title: string
}

export default function LearnCommandOutput({
  batches,
  emptyMessage,
  maxLength,
  orderedNames,
  subtitle,
  title,
}: LearnCommandOutputProps) {
  const combinedCommands = useMemo(
    () => batches.map((batch) => batch.text).join("\n"),
    [batches],
  )
  const orderedNameList = useMemo(
    () => orderedNames.join("\n"),
    [orderedNames],
  )

  return (
    <section className="rounded-3xl border border-slate-800/80 bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(8,13,21,0.94))] p-5 shadow-[0_28px_80px_rgba(2,6,23,0.35)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-300">
            Learn Output
          </div>
          <h2 className="text-xl font-semibold text-slate-50">{title}</h2>
          <p className="max-w-3xl text-sm text-slate-400">{subtitle}</p>
        </div>
        {batches.length > 0 ? (
          <CopyTextButton
            label="Copy all commands"
            text={combinedCommands}
          />
        ) : null}
      </div>

      {batches.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-700 bg-slate-950/65 px-4 py-5 text-sm text-slate-400">
          {emptyMessage}
        </div>
      ) : (
        <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(260px,0.75fr)]">
          <div className="space-y-3">
            {batches.map((batch, index) => (
              <article
                key={`${batch.text}-${index}`}
                className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Batch {index + 1}
                    </div>
                    <div className="mt-1 text-sm text-slate-300">
                      {batch.entries.length} names, {batch.length}/{maxLength} chars
                    </div>
                  </div>
                  <CopyTextButton label="Copy batch" text={batch.text} />
                </div>
                <textarea
                  readOnly
                  value={batch.text}
                  rows={Math.min(7, Math.max(3, batch.entries.length + 1))}
                  className="mt-3 w-full resize-y rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 font-mono text-sm leading-6 text-slate-100"
                />
              </article>
            ))}
          </div>

          <aside className="rounded-2xl border border-slate-800 bg-slate-950/65 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Ordered Names
                </div>
                <div className="mt-1 text-sm text-slate-300">
                  {orderedNames.length} total
                </div>
              </div>
              <CopyTextButton label="Copy names" text={orderedNameList} />
            </div>
            <textarea
              readOnly
              value={orderedNameList}
              rows={Math.min(16, Math.max(6, orderedNames.length))}
              className="mt-3 w-full resize-y rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 font-mono text-sm leading-6 text-slate-100"
            />
          </aside>
        </div>
      )}
    </section>
  )
}
