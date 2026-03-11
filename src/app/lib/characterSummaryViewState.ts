export type CharacterSummaryViewState = {
  showEmptyRowsAndColumns: boolean
  showEmptyGroups: boolean
}

export type CharacterSummaryViewChangeDetail = {
  viewState: CharacterSummaryViewState
}

export const CHARACTER_SUMMARY_VIEW_EVENT = "characterSummaryViewChanged"

const STORAGE_KEY = "characterSummary:viewState"

export function getDefaultCharacterSummaryViewState(): CharacterSummaryViewState {
  return {
    showEmptyRowsAndColumns: true,
    showEmptyGroups: true,
  }
}

export function readCharacterSummaryViewState(storage: Storage): CharacterSummaryViewState {
  const fallback = getDefaultCharacterSummaryViewState()

  try {
    const parsed = JSON.parse(storage.getItem(STORAGE_KEY) ?? "null") as Partial<CharacterSummaryViewState> | null

    if (!parsed) {
      return fallback
    }

    return {
      showEmptyRowsAndColumns:
        typeof parsed.showEmptyRowsAndColumns === "boolean"
          ? parsed.showEmptyRowsAndColumns
          : fallback.showEmptyRowsAndColumns,
      showEmptyGroups:
        typeof parsed.showEmptyGroups === "boolean"
          ? parsed.showEmptyGroups
          : fallback.showEmptyGroups,
    }
  } catch {
    return fallback
  }
}

export function persistCharacterSummaryViewState(storage: Storage, state: CharacterSummaryViewState): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function dispatchCharacterSummaryViewChange(detail: CharacterSummaryViewChangeDetail): void {
  window.dispatchEvent(new CustomEvent<CharacterSummaryViewChangeDetail>(CHARACTER_SUMMARY_VIEW_EVENT, { detail }))
}
