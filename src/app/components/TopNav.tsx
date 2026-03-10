"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import DamageWidget from "@/app/components/DamageWidget"
import {
  type AvailabilityFilter,
  type ClassFilterKey,
  type ClassFilterMode,
  dispatchManagedTableViewChange,
  getDefaultClassFilter,
  getDefaultSortDirection,
  getDefaultTableViewState,
  getTableViewPageFromPathname,
  normalizePathname,
  persistTableViewState,
  readTableViewState,
  type RaceFilter,
  type SelectionFilter,
  type TableViewPage,
  type SortMode,
  type TarotTierFilter,
  type TarotTypeFilter,
  type TableViewState,
} from "@/app/lib/tableViewState"

const RESETTABLE_PATHS = new Set(["/talents", "/skills", "/skills/buffs", "/equipment/tarotcards"])

const navLinks = [
  ["/talents", "Talents"],
  ["/talents/TalentOverview", "Talent Overview"],
  ["/Skills", "Skills"],
  ["/Skills/SkillOverview", "Skill Overview"],
  ["/CopyPaste", "Copy Paste"],
  ["/Levels", "Levels"],
  ["/Skills/Buffs", "Buffs"],
  ["/Skills/BuffSorter", "Buff Overview"],
  ["/equipment", "Equipment"],
  ["/equipment/Runewords", "Runewords"],
  ["/equipment/TarotCards", "Tarot Cards"],
  ["/CharacterSummary", "Character Summary"],
  ["/DamageCalc", "Damage"],
  ["/Healing", "Healing"],
  ["/WorldBoss", "World Boss"],
  ["/DebugVars", "Debug"],
] as const

const classFilterOptions: Array<{ value: ClassFilterKey; label: string }> = [
  { value: "tank", label: "Tank" },
  { value: "warrior", label: "Warrior" },
  { value: "caster", label: "Caster" },
  { value: "healer", label: "Healer" },
]

const classFilterModeOptions: Array<{ value: ClassFilterMode; label: string }> = [
  { value: "any", label: "Any" },
  { value: "required", label: "Required" },
  { value: "optional", label: "Optional" },
  { value: "excluded", label: "Excluded" },
]

const raceFilterOptions: Array<{ value: RaceFilter; label: string }> = [
  { value: "all", label: "All Races" },
  { value: "current", label: "Current Race" },
  { value: "raceSpecific", label: "Race-Specific" },
]

const availabilityFilterOptions: Array<{ value: AvailabilityFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "available", label: "Available Only" },
  { value: "unavailable", label: "Unavailable Only" },
]

const tarotTierFilterOptions: Array<{ value: TarotTierFilter; label: string }> = [
  { value: "all", label: "All Tiers" },
  { value: "5", label: "Tier 5" },
  { value: "4", label: "Tier 4" },
  { value: "3", label: "Tier 3" },
]

const tarotTypeFilterOptions: Array<{ value: TarotTypeFilter; label: string }> = [
  { value: "all", label: "All Types" },
  { value: "active", label: "Active" },
  { value: "passive", label: "Passive" },
]

const selectionFilterOptions: Array<{ value: SelectionFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "selected", label: "Selected" },
  { value: "unselected", label: "Unselected" },
]

const sortOptions = (page: TableViewPage): Array<{ value: TableViewState["sortMode"]; label: string }> => {
  if (page === "tarot") {
    return [
      { value: "default", label: "Default" },
      { value: "damage", label: "DMG Increase" },
      { value: "tier", label: "Tier" },
    ]
  }

  return [
    { value: "default", label: "Default" },
    { value: "damage", label: "DMG Increase" },
    { value: "cost", label: page === "talents" ? "TP Spent" : "SP Spent" },
  ]
}

const controlButtonClass =
  "shrink-0 rounded border px-2 py-1 text-slate-200 transition hover:bg-slate-800"

const sectionLabelClass = "px-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400"

const optionButtonClass = (active: boolean) => (
  `rounded px-2 py-1 text-left transition ${
    active ? "bg-sky-500/20 text-sky-200" : "text-slate-200 hover:bg-slate-800"
  }`
)

const classFilterModeButtonClass = (mode: ClassFilterMode, active: boolean) => {
  if (active) {
    if (mode === "required") {
      return "rounded border border-emerald-500/70 bg-emerald-500/15 px-2 py-1 text-center text-[11px] text-emerald-200 transition"
    }

    if (mode === "optional") {
      return "rounded border border-sky-500/70 bg-sky-500/15 px-2 py-1 text-center text-[11px] text-sky-200 transition"
    }

    if (mode === "excluded") {
      return "rounded border border-rose-500/70 bg-rose-500/15 px-2 py-1 text-center text-[11px] text-rose-200 transition"
    }

    return "rounded border border-slate-500/70 bg-slate-800 px-2 py-1 text-center text-[11px] text-slate-100 transition"
  }

  return "rounded border border-slate-700 px-2 py-1 text-center text-[11px] text-slate-300 transition hover:bg-slate-800"
}

const getDirectionArrow = (direction: TableViewState["sortDirection"]) => direction === "asc" ? "↑" : "↓"
const isSortPage = (page: TableViewPage | null): page is TableViewPage => page !== null
const isSkillLikeFilterPage = (page: TableViewPage | null): page is "talents" | "skills" | "buffs" =>
  page === "talents" || page === "skills" || page === "buffs"

export default function TopNav() {
  const pathname = usePathname()
  const normalizedPathname = normalizePathname(pathname)
  const showResetUi = RESETTABLE_PATHS.has(normalizedPathname)
  const tablePage = getTableViewPageFromPathname(normalizedPathname)
  const navRef = useRef<HTMLElement | null>(null)
  const [openMenu, setOpenMenu] = useState<"filter" | "sort" | null>(null)
  const [viewState, setViewState] = useState<TableViewState>(getDefaultTableViewState)
  const controlsRef = useRef<HTMLDivElement | null>(null)
  const showFilterControls = tablePage !== null
  const sortPage = isSortPage(tablePage) ? tablePage : null
  const showSortControls = sortPage !== null

  useLayoutEffect(() => {
    const nav = navRef.current
    if (!nav) {
      return
    }

    const root = document.documentElement
    const updateNavHeight = () => {
      root.style.setProperty("--top-nav-height", `${nav.offsetHeight}px`)
    }

    updateNavHeight()

    const resizeObserver = new ResizeObserver(updateNavHeight)
    resizeObserver.observe(nav)
    window.addEventListener("resize", updateNavHeight)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener("resize", updateNavHeight)
      root.style.removeProperty("--top-nav-height")
    }
  }, [])

  useEffect(() => {
    setOpenMenu(null)

    if (!tablePage) {
      setViewState(getDefaultTableViewState())
      return
    }

    setViewState(readTableViewState(localStorage, tablePage))
  }, [tablePage])

  useEffect(() => {
    if (!openMenu) {
      return
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!controlsRef.current?.contains(event.target as Node)) {
        setOpenMenu(null)
      }
    }

    window.addEventListener("mousedown", handlePointerDown)
    return () => {
      window.removeEventListener("mousedown", handlePointerDown)
    }
  }, [openMenu])

  const hasActiveFilters = tablePage === "tarot"
    ? (
      viewState.tarotTierFilter !== "all" ||
      viewState.tarotTypeFilter !== "all" ||
      viewState.selectionFilter !== "all"
    )
    : (
      Object.values(viewState.classFilter).some((mode) => mode !== "any") ||
      viewState.raceFilter !== "all" ||
      viewState.availabilityFilter !== "all"
    )
  const hasActiveSort = (
    viewState.sortMode !== "default" ||
    viewState.sortDirection !== getDefaultSortDirection("default")
  )
  const sortButtonLabel = hasActiveSort ? `Sort ${getDirectionArrow(viewState.sortDirection)}` : "Sort"

  const updateViewState = (patch: Partial<TableViewState>) => {
    if (!tablePage) {
      return
    }

    const nextViewState = { ...viewState, ...patch }
    setViewState(nextViewState)
    persistTableViewState(localStorage, tablePage, nextViewState)
    dispatchManagedTableViewChange({ page: tablePage, viewState: nextViewState })
  }

  const updateClassFilter = (classKey: ClassFilterKey, mode: ClassFilterMode) => {
    updateViewState({
      classFilter: {
        ...viewState.classFilter,
        [classKey]: mode,
      },
    })
  }

  const handleSortOptionClick = (sortMode: SortMode) => {
    const nextSortDirection = viewState.sortMode === sortMode
      ? (viewState.sortDirection === "asc" ? "desc" : "asc")
      : getDefaultSortDirection(sortMode)

    updateViewState({ sortMode, sortDirection: nextSortDirection })
  }

  const handleResetUiClick = () => {
    setOpenMenu(null)

    if (tablePage) {
      const defaultViewState = getDefaultTableViewState()
      setViewState(defaultViewState)
      persistTableViewState(localStorage, tablePage, defaultViewState)
      dispatchManagedTableViewChange({ page: tablePage, viewState: defaultViewState })
    }

    window.dispatchEvent(new Event("resetManagedTableUi"))
  }

  return (
    <nav
      ref={navRef}
      className="sticky top-0 z-50 flex items-center gap-3 border-b border-slate-700 bg-slate-950/90 px-5 py-2 text-xs shadow-lg shadow-black/30 backdrop-blur"
    >
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
        {navLinks.map(([href, label]) => (
          <Link key={href} href={href} className="text-slate-100 transition-colors hover:text-sky-300">
            {label}
          </Link>
        ))}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <DamageWidget />

        <div ref={controlsRef} className="relative flex items-center gap-2">
          {showFilterControls ? (
            <>
              <button
                type="button"
                onClick={() => setOpenMenu((current) => current === "filter" ? null : "filter")}
                className={`${controlButtonClass} border-slate-700 bg-slate-950/90 ${hasActiveFilters || openMenu === "filter" ? "border-sky-500/60 text-sky-200" : "border-slate-700"}`}
                aria-haspopup="dialog"
                aria-expanded={openMenu === "filter"}
              >
                Filter
              </button>

              {showSortControls ? (
                <button
                  type="button"
                  onClick={() => setOpenMenu((current) => current === "sort" ? null : "sort")}
                  className={`${controlButtonClass} border-slate-700 bg-slate-950/90 ${hasActiveSort || openMenu === "sort" ? "border-sky-500/60 text-sky-200" : "border-slate-700"}`}
                  aria-haspopup="dialog"
                  aria-expanded={openMenu === "sort"}
                >
                  {sortButtonLabel}
                </button>
              ) : null}
            </>
          ) : null}

          {showResetUi ? (
            <button
              type="button"
              onClick={handleResetUiClick}
              className={`${controlButtonClass} border-slate-700 bg-slate-950/90`}
              title="Reset column order, widths, collapsed columns, filters, and sorting"
            >
              Reset UI
            </button>
          ) : null}

          {showFilterControls && openMenu === "filter" ? (
            <div className="absolute right-0 top-full mt-2 grid w-[22rem] max-w-[calc(100vw-2rem)] gap-2 rounded-md border border-slate-700 bg-slate-950/95 p-2 shadow-xl shadow-black/40">
              {isSkillLikeFilterPage(tablePage) ? (
                <>
                  <div className="flex items-center justify-between px-1">
                    <div className={sectionLabelClass}>Class</div>
                    <button
                      type="button"
                      onClick={() => updateViewState({ classFilter: getDefaultClassFilter() })}
                      className="rounded px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="grid gap-2">
                    {classFilterOptions.map((option) => (
                      <div key={option.value} className="grid gap-1 rounded border border-slate-800/80 bg-slate-900/60 p-2">
                        <div className="px-1 text-[11px] font-medium text-slate-200">{option.label}</div>
                        <div className="grid grid-cols-4 gap-1">
                          {classFilterModeOptions.map((modeOption) => (
                            <button
                              key={modeOption.value}
                              type="button"
                              onClick={() => updateClassFilter(option.value, modeOption.value)}
                              className={classFilterModeButtonClass(
                                modeOption.value,
                                viewState.classFilter[option.value] === modeOption.value,
                              )}
                            >
                              {modeOption.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className={sectionLabelClass}>Race</div>
                  <div className="grid gap-1">
                    {raceFilterOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => updateViewState({ raceFilter: option.value })}
                        className={optionButtonClass(viewState.raceFilter === option.value)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>

                  <div className={sectionLabelClass}>Availability</div>
                  <div className="grid gap-1">
                    {availabilityFilterOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => updateViewState({ availabilityFilter: option.value })}
                        className={optionButtonClass(viewState.availabilityFilter === option.value)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </>
              ) : null}

              {tablePage === "tarot" ? (
                <>
                  <div className={sectionLabelClass}>Tier</div>
                  <div className="grid gap-1">
                    {tarotTierFilterOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => updateViewState({ tarotTierFilter: option.value })}
                        className={optionButtonClass(viewState.tarotTierFilter === option.value)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>

                  <div className={sectionLabelClass}>Type</div>
                  <div className="grid gap-1">
                    {tarotTypeFilterOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => updateViewState({ tarotTypeFilter: option.value })}
                        className={optionButtonClass(viewState.tarotTypeFilter === option.value)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>

                  <div className={sectionLabelClass}>Selection</div>
                  <div className="grid gap-1">
                    {selectionFilterOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => updateViewState({ selectionFilter: option.value })}
                        className={optionButtonClass(viewState.selectionFilter === option.value)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </>
              ) : null}
            </div>
          ) : null}

          {sortPage && openMenu === "sort" ? (
            <div className="absolute right-0 top-full mt-2 grid min-w-[12rem] gap-1 rounded-md border border-slate-700 bg-slate-950/95 p-2 shadow-xl shadow-black/40">
              {sortOptions(sortPage).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSortOptionClick(option.value)}
                  className={`${optionButtonClass(viewState.sortMode === option.value)} flex items-center justify-between gap-3`}
                  title={viewState.sortMode === option.value ? "Click again to reverse direction" : undefined}
                >
                  <span>{option.label}</span>
                  <span className={`text-[10px] ${viewState.sortMode === option.value ? "text-sky-200" : "text-slate-500"}`}>
                    {viewState.sortMode === option.value ? getDirectionArrow(viewState.sortDirection) : ""}
                  </span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </nav>
  )
}
