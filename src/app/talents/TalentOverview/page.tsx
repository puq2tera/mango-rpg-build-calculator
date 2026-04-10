"use client"

import { useMemo } from "react"
import LearnCommandOutput from "@/app/components/LearnCommandOutput"
import {
  buildLearnCommandBatches,
  DEFAULT_LEARN_COMMAND_MAX_LENGTH,
  DEFAULT_TALENT_LEARN_COMMAND_PREFIX,
  getOrderedTalentNames,
} from "@/app/lib/learnCommands"
import { useLearnSelections } from "@/app/lib/useLearnSelections"

export default function TalentOverview() {
  const { isHydrated, selectedTalents } = useLearnSelections()

  const orderedTalentNames = useMemo(
    () => getOrderedTalentNames(selectedTalents),
    [selectedTalents],
  )
  const commandBatches = useMemo(
    () => buildLearnCommandBatches(
      orderedTalentNames,
      DEFAULT_TALENT_LEARN_COMMAND_PREFIX,
      DEFAULT_LEARN_COMMAND_MAX_LENGTH,
    ),
    [orderedTalentNames],
  )

  if (!isHydrated) {
    return <div className="p-4 text-sm text-slate-300">Loading talent overview...</div>
  }

  return (
    <div className="min-h-[calc(100vh-var(--top-nav-height))] bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.11),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(249,115,22,0.08),transparent_26%)]">
      <div className="w-full px-4 py-6">
        <div className="space-y-6">
          <LearnCommandOutput
            title="Talent Learn Commands"
            subtitle="Commands use the current selected talent list and are split at 300 characters."
            orderedNames={orderedTalentNames}
            batches={commandBatches}
            maxLength={DEFAULT_LEARN_COMMAND_MAX_LENGTH}
            emptyMessage="No talents are selected."
          />
        </div>
      </div>
    </div>
  )
}
