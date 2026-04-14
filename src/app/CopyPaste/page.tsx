"use client"

import { useMemo } from "react"
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

export default function CopyPastePage() {
  const { isHydrated, selectedSkills, selectedTalents } = useLearnSelections()
  const orderedTalentNames = useMemo(
    () => getOrderedTalentNames(selectedTalents),
    [selectedTalents],
  )
  const orderedSkillNames = useMemo(
    () => getOrderedSkillNames(selectedSkills),
    [selectedSkills],
  )
  const talentBatches = useMemo(
    () => buildLearnCommandBatches(
      orderedTalentNames,
      DEFAULT_TALENT_LEARN_COMMAND_PREFIX,
      DEFAULT_LEARN_COMMAND_MAX_LENGTH,
    ),
    [orderedTalentNames],
  )
  const skillBatches = useMemo(
    () => buildLearnCommandBatches(
      orderedSkillNames,
      DEFAULT_SKILL_LEARN_COMMAND_PREFIX,
      DEFAULT_LEARN_COMMAND_MAX_LENGTH,
    ),
    [orderedSkillNames],
  )

  if (!isHydrated) {
    return <div className="p-4 text-sm text-slate-300">Loading copy paste output...</div>
  }

  return (
    <main className="min-h-[calc(100vh-var(--top-nav-height))] bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.12),transparent_32%),radial-gradient(circle_at_top_right,rgba(249,115,22,0.10),transparent_28%)]">
      <div className="w-full px-4 py-6">
        <div className="space-y-8">
          <LearnCommandOutput
            title="Talent Learn Commands"
            subtitle=""
            batches={talentBatches}
            maxLength={DEFAULT_LEARN_COMMAND_MAX_LENGTH}
            emptyMessage="No talents are selected."
          />

          <LearnCommandOutput
            title="Skill Learn Commands"
            subtitle=""
            batches={skillBatches}
            maxLength={DEFAULT_LEARN_COMMAND_MAX_LENGTH}
            emptyMessage="No skills are selected."
          />
        </div>
      </div>
    </main>
  )
}
