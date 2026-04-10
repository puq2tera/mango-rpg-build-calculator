"use client"

import { useMemo } from "react"
import LearnCommandOutput from "@/app/components/LearnCommandOutput"
import {
  buildLearnCommandBatches,
  DEFAULT_LEARN_COMMAND_MAX_LENGTH,
  DEFAULT_SKILL_LEARN_COMMAND_PREFIX,
  getOrderedSkillNames,
} from "@/app/lib/learnCommands"
import { useLearnSelections } from "@/app/lib/useLearnSelections"

export default function SkillOverview() {
  const { isHydrated, selectedSkills } = useLearnSelections()

  const orderedSkillNames = useMemo(
    () => getOrderedSkillNames(selectedSkills),
    [selectedSkills],
  )
  const commandBatches = useMemo(
    () => buildLearnCommandBatches(
      orderedSkillNames,
      DEFAULT_SKILL_LEARN_COMMAND_PREFIX,
      DEFAULT_LEARN_COMMAND_MAX_LENGTH,
    ),
    [orderedSkillNames],
  )

  if (!isHydrated) {
    return <div className="p-4 text-sm text-slate-300">Loading skill overview...</div>
  }

  return (
    <div className="min-h-[calc(100vh-var(--top-nav-height))] bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.14),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.08),transparent_24%)]">
      <div className="w-full px-4 py-6">
        <div className="space-y-6">
          <LearnCommandOutput
            title="Skill Learn Commands"
            subtitle="Commands use the current selected skill list and are split at 300 characters."
            orderedNames={orderedSkillNames}
            batches={commandBatches}
            maxLength={DEFAULT_LEARN_COMMAND_MAX_LENGTH}
            emptyMessage="No skills are selected."
          />
        </div>
      </div>
    </div>
  )
}
