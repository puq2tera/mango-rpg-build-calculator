export type TableViewPage = "talents" | "skills"
export type ClassFilter = "all" | "tank" | "warrior" | "caster" | "healer"
export type RaceFilter = "all" | "current" | "raceSpecific"
export type AvailabilityFilter = "all" | "available" | "unavailable"
export type SortMode = "default" | "damage" | "cost"

export type TableViewState = {
  classFilter: ClassFilter
  raceFilter: RaceFilter
  availabilityFilter: AvailabilityFilter
  sortMode: SortMode
}

export type ManagedTableViewChangeDetail = {
  page: TableViewPage
  viewState: TableViewState
}

export const MANAGED_TABLE_VIEW_EVENT = "managedTableViewChanged"

const STORAGE_KEY_PREFIX = "managedTableView:"

const CLASS_FILTERS = new Set<ClassFilter>(["all", "tank", "warrior", "caster", "healer"])
const RACE_FILTERS = new Set<RaceFilter>(["all", "current", "raceSpecific"])
const AVAILABILITY_FILTERS = new Set<AvailabilityFilter>(["all", "available", "unavailable"])
const SORT_MODES = new Set<SortMode>(["default", "damage", "cost"])

export function normalizePathname(pathname: string): string {
  const trimmed = pathname.replace(/\/+$/, "")
  return (trimmed.length > 0 ? trimmed : "/").toLowerCase()
}

export function getTableViewPageFromPathname(pathname: string): TableViewPage | null {
  const normalizedPathname = normalizePathname(pathname)

  if (normalizedPathname === "/talents") {
    return "talents"
  }

  if (normalizedPathname === "/skills") {
    return "skills"
  }

  return null
}

export function getDefaultTableViewState(): TableViewState {
  return {
    classFilter: "all",
    raceFilter: "all",
    availabilityFilter: "all",
    sortMode: "default",
  }
}

export function readTableViewState(storage: Storage, page: TableViewPage): TableViewState {
  const fallback = getDefaultTableViewState()

  try {
    const parsed = JSON.parse(storage.getItem(`${STORAGE_KEY_PREFIX}${page}`) ?? "null") as Partial<TableViewState> | null

    if (!parsed) {
      return fallback
    }

    return {
      classFilter: CLASS_FILTERS.has(parsed.classFilter as ClassFilter) ? (parsed.classFilter as ClassFilter) : fallback.classFilter,
      raceFilter: RACE_FILTERS.has(parsed.raceFilter as RaceFilter) ? (parsed.raceFilter as RaceFilter) : fallback.raceFilter,
      availabilityFilter: AVAILABILITY_FILTERS.has(parsed.availabilityFilter as AvailabilityFilter)
        ? (parsed.availabilityFilter as AvailabilityFilter)
        : fallback.availabilityFilter,
      sortMode: SORT_MODES.has(parsed.sortMode as SortMode) ? (parsed.sortMode as SortMode) : fallback.sortMode,
    }
  } catch {
    return fallback
  }
}

export function persistTableViewState(storage: Storage, page: TableViewPage, state: TableViewState): void {
  storage.setItem(`${STORAGE_KEY_PREFIX}${page}`, JSON.stringify(state))
}

export function dispatchManagedTableViewChange(detail: ManagedTableViewChangeDetail): void {
  window.dispatchEvent(new CustomEvent<ManagedTableViewChangeDetail>(MANAGED_TABLE_VIEW_EVENT, { detail }))
}
