"use client"

import { useMemo, useState } from "react"
import LearnCommandOutput from "@/app/components/LearnCommandOutput"
import {
  buildLearnCommandBatches,
  DEFAULT_LEARN_COMMAND_MAX_LENGTH,
  DEFAULT_SKILL_LEARN_COMMAND_PREFIX,
  DEFAULT_TALENT_LEARN_COMMAND_PREFIX,
  getOrderedSkillNames,
  getOrderedTalentNames,
} from "@/app/lib/learnCommands"
import { useLearnSelections } from "@/app/lib/useLearnSelections"

const settingsInputClass =
  "w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-100"

const summaryCardClass =
  "rounded-2xl border border-slate-800/80 bg-slate-950/60 px-4 py-4 shadow-[0_16px_40px_rgba(2,6,23,0.22)]"

export default function CopyPastePage() {
  const { isHydrated, selectedSkills, selectedTalents } = useLearnSelections()
  const [maxLength, setMaxLength] = useState(DEFAULT_LEARN_COMMAND_MAX_LENGTH)
  const [talentPrefix, setTalentPrefix] = useState(DEFAULT_TALENT_LEARN_COMMAND_PREFIX)
  const [skillPrefix, setSkillPrefix] = useState(DEFAULT_SKILL_LEARN_COMMAND_PREFIX)

  const orderedTalentNames = useMemo(
    () => getOrderedTalentNames(selectedTalents),
    [selectedTalents],
  )
  const orderedSkillNames = useMemo(
    () => getOrderedSkillNames(selectedSkills),
    [selectedSkills],
  )
  const talentBatches = useMemo(
    () => buildLearnCommandBatches(orderedTalentNames, talentPrefix, maxLength),
    [maxLength, orderedTalentNames, talentPrefix],
  )
  const skillBatches = useMemo(
    () => buildLearnCommandBatches(orderedSkillNames, skillPrefix, maxLength),
    [maxLength, orderedSkillNames, skillPrefix],
  )
  const totalBatches = talentBatches.length + skillBatches.length
  const totalSelections = orderedTalentNames.length + orderedSkillNames.length

  if (!isHydrated) {
    return <div className="p-4 text-sm text-slate-300">Loading copy paste output...</div>
  }

  return (
    <div className="min-h-[calc(100vh-var(--top-nav-height))] bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.12),transparent_32%),radial-gradient(circle_at_top_right,rgba(249,115,22,0.10),transparent_28%)]">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <section className="rounded-[28px] border border-slate-800/80 bg-[linear-gradient(135deg,rgba(7,12,20,0.96),rgba(15,23,42,0.88))] px-6 py-6 shadow-[0_40px_100px_rgba(2,6,23,0.45)]">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-3xl space-y-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.26em] text-sky-300">
                Copy Paste
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-50">
                Generate learn commands for your current build
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-slate-400">
                The output is generated from your currently selected talents and skills, ordered so dependencies stay ahead
                of the things that depend on them. Commands are chunked automatically to stay under your character limit.
              </p>
            </div>

            <div className="grid min-w-[18rem] gap-3 sm:grid-cols-3">
              <div className={summaryCardClass}>
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Talents</div>
                <div className="mt-2 text-3xl font-semibold text-slate-50">{orderedTalentNames.length}</div>
              </div>
              <div className={summaryCardClass}>
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Skills</div>
                <div className="mt-2 text-3xl font-semibold text-slate-50">{orderedSkillNames.length}</div>
              </div>
              <div className={summaryCardClass}>
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Command Batches</div>
                <div className="mt-2 text-3xl font-semibold text-slate-50">{totalBatches}</div>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[180px_minmax(0,1fr)_minmax(0,1fr)]">
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Char Limit</span>
              <input
                type="number"
                min={32}
                value={maxLength}
                onChange={(event) => setMaxLength(Math.max(32, Number(event.target.value) || DEFAULT_LEARN_COMMAND_MAX_LENGTH))}
                className={settingsInputClass}
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Talent Prefix</span>
              <input
                type="text"
                value={talentPrefix}
                onChange={(event) => setTalentPrefix(event.target.value)}
                className={settingsInputClass}
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Skill Prefix</span>
              <input
                type="text"
                value={skillPrefix}
                onChange={(event) => setSkillPrefix(event.target.value)}
                className={settingsInputClass}
              />
            </label>
          </div>

          <div className="mt-4 text-sm text-slate-400">
            {totalSelections === 0
              ? "Nothing is selected yet. Choose talents or skills first, then return here for ready-to-paste commands."
              : "The command prefixes are editable here, so you can adjust them if your in-game syntax differs."}
          </div>
        </section>

        <div className="mt-6 space-y-6">
          <LearnCommandOutput
            title="Talent Learn Commands"
            subtitle="Selected talents, ordered by prerequisites and split into paste-ready batches."
            orderedNames={orderedTalentNames}
            batches={talentBatches}
            maxLength={maxLength}
            emptyMessage="No talents are selected."
          />

          <LearnCommandOutput
            title="Skill Learn Commands"
            subtitle="Selected skills, ordered by prerequisites and split into paste-ready batches."
            orderedNames={orderedSkillNames}
            batches={skillBatches}
            maxLength={maxLength}
            emptyMessage="No skills are selected."
          />
        </div>
      </div>
    </div>
  )
}
