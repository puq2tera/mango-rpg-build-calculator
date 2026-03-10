export type TableViewPage = "talents" | "skills" | "buffs" | "tarot"
export const CLASS_FILTER_KEYS = ["tank", "warrior", "caster", "healer"] as const
export type ClassFilterKey = typeof CLASS_FILTER_KEYS[number]
export type ClassFilterMode = "any" | "required" | "optional" | "excluded"
export type ClassFilter = Record<ClassFilterKey, ClassFilterMode>
export type RaceFilter = "all" | "current" | "raceSpecific"
export type AvailabilityFilter = "all" | "available" | "unavailable"
export type SortMode = "default" | "damage" | "cost" | "tier"
export type SortDirection = "asc" | "desc"
export type TarotTierFilter = "all" | "3" | "4" | "5"
export type TarotTypeFilter = "all" | "active" | "passive"
export type SelectionFilter = "all" | "selected" | "unselected"

export type TableViewState = {
  classFilter: ClassFilter
  raceFilter: RaceFilter
  availabilityFilter: AvailabilityFilter
  sortMode: SortMode
  sortDirection: SortDirection
  tarotTierFilter: TarotTierFilter
  tarotTypeFilter: TarotTypeFilter
  selectionFilter: SelectionFilter
}

export type ManagedTableViewChangeDetail = {
  page: TableViewPage
  viewState: TableViewState
}

export const MANAGED_TABLE_VIEW_EVENT = "managedTableViewChanged"

const STORAGE_KEY_PREFIX = "managedTableView:"

const LEGACY_CLASS_FILTERS = new Set(["all", ...CLASS_FILTER_KEYS] as const)
const CLASS_FILTER_MODES = new Set<ClassFilterMode>(["any", "required", "optional", "excluded"])
const RACE_FILTERS = new Set<RaceFilter>(["all", "current", "raceSpecific"])
const AVAILABILITY_FILTERS = new Set<AvailabilityFilter>(["all", "available", "unavailable"])
const SORT_MODES = new Set<SortMode>(["default", "damage", "cost", "tier"])
const SORT_DIRECTIONS = new Set<SortDirection>(["asc", "desc"])
const TAROT_TIER_FILTERS = new Set<TarotTierFilter>(["all", "3", "4", "5"])
const TAROT_TYPE_FILTERS = new Set<TarotTypeFilter>(["all", "active", "passive"])
const SELECTION_FILTERS = new Set<SelectionFilter>(["all", "selected", "unselected"])

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

  if (normalizedPathname === "/skills/buffs") {
    return "buffs"
  }

  if (normalizedPathname === "/equipment/tarotcards") {
    return "tarot"
  }

  return null
}

export function getDefaultTableViewState(): TableViewState {
  return {
    classFilter: getDefaultClassFilter(),
    raceFilter: "all",
    availabilityFilter: "all",
    sortMode: "default",
    sortDirection: getDefaultSortDirection("default"),
    tarotTierFilter: "all",
    tarotTypeFilter: "all",
    selectionFilter: "all",
  }
}

export function getDefaultSortDirection(sortMode: SortMode): SortDirection {
  return sortMode === "default" ? "asc" : "desc"
}

export function getDefaultClassFilter(): ClassFilter {
  return {
    tank: "any",
    warrior: "any",
    caster: "any",
    healer: "any",
  }
}

function readClassFilterMode(rawMode: unknown, fallback: ClassFilterMode): ClassFilterMode {
  if (rawMode === "ignore") {
    return "any"
  }

  return CLASS_FILTER_MODES.has(rawMode as ClassFilterMode) ? (rawMode as ClassFilterMode) : fallback
}

function readClassFilter(rawClassFilter: unknown, fallback: ClassFilter): ClassFilter {
  if (typeof rawClassFilter === "string" && LEGACY_CLASS_FILTERS.has(rawClassFilter as typeof CLASS_FILTER_KEYS[number] | "all")) {
    if (rawClassFilter === "all") {
      return fallback
    }

    return {
      ...getDefaultClassFilter(),
      [rawClassFilter]: "required",
    }
  }

  if (!rawClassFilter || typeof rawClassFilter !== "object" || Array.isArray(rawClassFilter)) {
    return fallback
  }

  const parsed = rawClassFilter as Partial<Record<ClassFilterKey, unknown>>

  return {
    tank: readClassFilterMode(parsed.tank, fallback.tank),
    warrior: readClassFilterMode(parsed.warrior, fallback.warrior),
    caster: readClassFilterMode(parsed.caster, fallback.caster),
    healer: readClassFilterMode(parsed.healer, fallback.healer),
  }
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
      classFilter: readClassFilter(parsed.classFilter, fallback.classFilter),
      raceFilter: RACE_FILTERS.has(parsed.raceFilter as RaceFilter) ? (parsed.raceFilter as RaceFilter) : fallback.raceFilter,
      availabilityFilter: AVAILABILITY_FILTERS.has(parsed.availabilityFilter as AvailabilityFilter)
        ? (parsed.availabilityFilter as AvailabilityFilter)
        : fallback.availabilityFilter,
      sortMode,
      sortDirection: SORT_DIRECTIONS.has(parsed.sortDirection as SortDirection)
        ? (parsed.sortDirection as SortDirection)
        : fallbackSortDirection,
      tarotTierFilter: TAROT_TIER_FILTERS.has(parsed.tarotTierFilter as TarotTierFilter)
        ? (parsed.tarotTierFilter as TarotTierFilter)
        : fallback.tarotTierFilter,
      tarotTypeFilter: TAROT_TYPE_FILTERS.has(parsed.tarotTypeFilter as TarotTypeFilter)
        ? (parsed.tarotTypeFilter as TarotTypeFilter)
        : fallback.tarotTypeFilter,
      selectionFilter: SELECTION_FILTERS.has(parsed.selectionFilter as SelectionFilter)
        ? (parsed.selectionFilter as SelectionFilter)
        : fallback.selectionFilter,
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
