"use client"

import { useEffect, useState } from "react"
import { BUILD_SNAPSHOT_UPDATED_EVENT } from "@/app/lib/buildEvents"
import { readSelectedSkills, readSelectedTalents } from "@/app/lib/learnCommands"

type LearnSelections = {
  isHydrated: boolean
  selectedSkills: string[]
  selectedTalents: string[]
}

const defaultSelections: LearnSelections = {
  isHydrated: false,
  selectedSkills: [],
  selectedTalents: [],
}

export function useLearnSelections(): LearnSelections {
  const [selections, setSelections] = useState<LearnSelections>(defaultSelections)

  useEffect(() => {
    const refreshSelections = () => {
      setSelections({
        isHydrated: true,
        selectedSkills: readSelectedSkills(window.localStorage),
        selectedTalents: readSelectedTalents(window.localStorage),
      })
    }

    refreshSelections()

    window.addEventListener(BUILD_SNAPSHOT_UPDATED_EVENT, refreshSelections)
    window.addEventListener("talentsUpdated", refreshSelections)
    window.addEventListener("focus", refreshSelections)
    window.addEventListener("storage", refreshSelections)

    return () => {
      window.removeEventListener(BUILD_SNAPSHOT_UPDATED_EVENT, refreshSelections)
      window.removeEventListener("talentsUpdated", refreshSelections)
      window.removeEventListener("focus", refreshSelections)
      window.removeEventListener("storage", refreshSelections)
    }
  }, [])

  return selections
}
