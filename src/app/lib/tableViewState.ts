export type TableViewPage = "talents" | "skills"
export type ClassFilter = "all" | "tank" | "warrior" | "caster" | "healer"
export type RaceFilter = "all" | "current" | "raceSpecific"
export type AvailabilityFilter = "all" | "available" | "unavailable"
export type SortMode = "default" | "damage" | "cost"
export type SortDirection = "asc" | "desc"

export type TableViewState = {
  classFilter: ClassFilter
  raceFilter: RaceFilter
  availabilityFilter: AvailabilityFilter
  sortMode: SortMode
  sortDirection: SortDirection
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
const SORT_DIRECTIONS = new Set<SortDirection>(["asc", "desc"])

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
    sortDirection: getDefaultSortDirection("default"),
  }
}

export function getDefaultSortDirection(sortMode: SortMode): SortDirection {
  return sortMode === "default" ? "asc" : "desc"
}

export function readTableViewState(storage: Storage, page: TableViewPage): TableViewState {
  const fallback = getDefaultTableViewState()

  try {
    const parsed = JSON.parse(storage.getItem(`${STORAGE_KEY_PREFIX}${page}`) ?? "null") as Partial<TableViewState> | null

    if (!parsed) {
      return fallback
    }

    const sortMode = SORT_MODES.has(parsed.sortMode as SortMode) ? (parsed.sortMode as SortMode) : fallback.sortMode
    const fallbackSortDirection = getDefaultSortDirection(sortMode)

    return {
      classFilter: CLASS_FILTERS.has(parsed.classFilter as ClassFilter) ? (parsed.classFilter as ClassFilter) : fallback.classFilter,
      raceFilter: RACE_FILTERS.has(parsed.raceFilter as RaceFilter) ? (parsed.raceFilter as RaceFilter) : fallback.raceFilter,
      availabilityFilter: AVAILABILITY_FILTERS.has(parsed.availabilityFilter as AvailabilityFilter)
        ? (parsed.availabilityFilter as AvailabilityFilter)
        : fallback.availabilityFilter,
      sortMode,
      sortDirection: SORT_DIRECTIONS.has(parsed.sortDirection as SortDirection)
        ? (parsed.sortDirection as SortDirection)
        : fallbackSortDirection,
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
