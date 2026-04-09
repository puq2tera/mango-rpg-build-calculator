"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import DamageWidget from "@/app/components/DamageWidget"
import {
  dispatchCharacterSummaryViewChange,
  getDefaultCharacterSummaryViewState,
  persistCharacterSummaryViewState,
  readCharacterSummaryViewState,
  type CharacterSummaryViewState,
} from "@/app/lib/characterSummaryViewState"
import {
  type AverageDamageFilter,
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
  type TarotEquipmentFilter,
  type TarotTierFilter,
  type TarotTypeFilter,
  type TableViewState,
} from "@/app/lib/tableViewState"

const RESETTABLE_PATHS = new Set(["/talents", "/skills", "/skills/buffs", "/equipment/tarotcards", "/equipment/runewords"])

type NavChildLink = {
  href: string
  label: string
}

type NavGroup = {
  href: string
  label: string
  children?: readonly NavChildLink[]
}

const navGroups: readonly NavGroup[] = [
  {
    href: "/Builds",
    label: "Builds",
    children: [
      { href: "/CopyPaste", label: "Copy Paste" },
      { href: "/StatFix", label: "Stat Fix" },
      { href: "/Performance", label: "Performance" },
      { href: "/DebugVars", label: "Debug" },
    ],
  },
  {
    href: "/talents",
    label: "Talents",
    children: [{ href: "/talents/TalentOverview", label: "Talent Overview" }],
  },
  {
    href: "/Skills",
    label: "Skills",
    children: [{ href: "/Skills/SkillOverview", label: "Skill Overview" }],
  },
  {
    href: "/Skills/Buffs",
    label: "Buffs",
    children: [{ href: "/Skills/BuffSorter", label: "Buff Overview" }],
  },
  { href: "/Levels", label: "Levels" },
  {
    href: "/equipment",
    label: "Equipment",
    children: [
      { href: "/equipment/Runewords", label: "Runewords" },
      { href: "/equipment/TarotCards", label: "Tarot Cards" },
    ],
  },
  { href: "/CharacterSummary", label: "Summary" },
  {
    href: "/DamageCalc",
    label: "Damage",
    children: [
      { href: "/Healing", label: "Healing" },
      { href: "/WorldBoss", label: "World Boss" },
    ],
  },
]

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

const averageDamageFilterOptions: Array<{ value: AverageDamageFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "increaseOnly", label: "Increase Only" },
  { value: "nonIncrease", label: "No Increase" },
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

const tarotEquipmentFilterOptions: Array<{ value: TarotEquipmentFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "inEquipment", label: "In Equipment" },
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
const navItemClass = "inline-flex items-center gap-1.5 py-1 text-sm font-medium transition-colors"

const optionButtonClass = (active: boolean) => (
  `rounded px-2 py-1 text-left transition ${
    active ? "bg-sky-500/20 text-sky-200" : "text-slate-200 hover:bg-slate-800"
  }`
)

const topLevelItemClass = (active: boolean, open: boolean) => (
  `${navItemClass} ${active || open ? "text-sky-200" : "text-slate-100 hover:text-sky-300"}`
)

const submenuLinkClass = (active: boolean) => (
  `block rounded-xl px-3 py-2 text-sm transition ${
    active
      ? "bg-sky-500/15 text-sky-100"
      : "text-slate-200 hover:bg-slate-800/80 hover:text-sky-100"
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
const hasAverageDamageFilter = (page: TableViewPage | null): page is "talents" | "buffs" | "tarot" =>
  page === "talents" || page === "buffs" || page === "tarot"

export default function TopNav() {
  const pathname = usePathname()
  const normalizedPathname = normalizePathname(pathname)
  const showResetUi = RESETTABLE_PATHS.has(normalizedPathname)
  const tablePage = getTableViewPageFromPathname(normalizedPathname)
  const showSummaryControls = normalizedPathname === "/charactersummary"
  const navRef = useRef<HTMLElement | null>(null)
  const navLinksRef = useRef<HTMLDivElement | null>(null)
  const [openMenu, setOpenMenu] = useState<"filter" | "sort" | null>(null)
  const [openNavGroup, setOpenNavGroup] = useState<string | null>(null)
  const [viewState, setViewState] = useState<TableViewState>(getDefaultTableViewState)
  const [summaryViewState, setSummaryViewState] = useState<CharacterSummaryViewState>(getDefaultCharacterSummaryViewState)
  const controlsRef = useRef<HTMLDivElement | null>(null)
  const showFilterControls = tablePage !== null
  const sortPage = isSortPage(tablePage) ? tablePage : null
  const showSortControls = sortPage !== null
  const showAverageDamageFilter = hasAverageDamageFilter(tablePage)

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
    setOpenNavGroup(null)

    if (!tablePage) {
      setViewState(getDefaultTableViewState())
    } else {
      setViewState(readTableViewState(localStorage, tablePage))
    }
  }, [normalizedPathname, tablePage])

  useEffect(() => {
    if (!showSummaryControls) {
      setSummaryViewState(getDefaultCharacterSummaryViewState())
      return
    }

    setSummaryViewState(readCharacterSummaryViewState(localStorage))
  }, [showSummaryControls])

  useEffect(() => {
    if (!openMenu && !openNavGroup) {
      return
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node

      if (openMenu && !controlsRef.current?.contains(target)) {
        setOpenMenu(null)
      }

      if (openNavGroup && !navLinksRef.current?.contains(target)) {
        setOpenNavGroup(null)
      }
    }

    window.addEventListener("mousedown", handlePointerDown)
    return () => {
      window.removeEventListener("mousedown", handlePointerDown)
    }
  }, [openMenu, openNavGroup])

  const hasActiveFilters = tablePage === "tarot"
    ? (
      (showAverageDamageFilter && viewState.averageDamageFilter !== "all") ||
      viewState.tarotTierFilter !== "all" ||
      viewState.tarotTypeFilter !== "all" ||
      viewState.selectionFilter !== "all" ||
      viewState.tarotEquipmentFilter !== "all"
    )
    : (
      (showAverageDamageFilter && viewState.averageDamageFilter !== "all") ||
      Object.values(viewState.classFilter).some((mode) => mode !== "any") ||
      viewState.raceFilter !== "all" ||
      viewState.availabilityFilter !== "all"
    )
  const hasActiveSort = (
    viewState.sortMode !== "default" ||
    viewState.sortDirection !== getDefaultSortDirection("default")
  )
  const hasCustomSummaryView = (
    summaryViewState.showEmptyRowsAndColumns !== getDefaultCharacterSummaryViewState().showEmptyRowsAndColumns ||
    summaryViewState.showEmptyGroups !== getDefaultCharacterSummaryViewState().showEmptyGroups
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

  const updateSummaryViewState = (patch: Partial<CharacterSummaryViewState>) => {
    const nextSummaryViewState = { ...summaryViewState, ...patch }
    setSummaryViewState(nextSummaryViewState)
    persistCharacterSummaryViewState(localStorage, nextSummaryViewState)
    dispatchCharacterSummaryViewChange({ viewState: nextSummaryViewState })
  }

  const handleSortOptionClick = (sortMode: SortMode) => {
    const nextSortDirection = viewState.sortMode === sortMode
      ? (viewState.sortDirection === "asc" ? "desc" : "asc")
      : getDefaultSortDirection(sortMode)

    updateViewState({ sortMode, sortDirection: nextSortDirection })
  }

  const handleResetUiClick = () => {
    setOpenMenu(null)
    setOpenNavGroup(null)

    if (tablePage) {
      const defaultViewState = getDefaultTableViewState()
      setViewState(defaultViewState)
      persistTableViewState(localStorage, tablePage, defaultViewState)
      dispatchManagedTableViewChange({ page: tablePage, viewState: defaultViewState })
    }

    window.dispatchEvent(new Event("resetManagedTableUi"))
  }

  const isPathActive = (href: string) => normalizedPathname === normalizePathname(href)

  const isGroupActive = (group: NavGroup) =>
    isPathActive(group.href) || (group.children?.some((child) => isPathActive(child.href)) ?? false)

  const handleNavLinkClick = () => {
    setOpenMenu(null)
    setOpenNavGroup(null)
  }

  const openNavigationGroup = (href: string) => {
    setOpenMenu(null)
    setOpenNavGroup(href)
  }

  const closeNavigationGroup = (href: string) => {
    setOpenNavGroup((current) => current === href ? null : current)
  }

  return (
    <nav
      ref={navRef}
      className="sticky top-0 z-50 flex items-center gap-3 border-b border-slate-700 bg-slate-950/90 px-5 py-2 text-xs shadow-lg shadow-black/30 backdrop-blur"
    >
      <div ref={navLinksRef} className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-1">
        {navGroups.map((group) => {
          const active = isGroupActive(group)
          const currentPage = isPathActive(group.href)
          const isOpen = openNavGroup === group.href
          const hasChildren = Boolean(group.children?.length)

          return (
            <div
              key={group.href}
              className="relative"
              onMouseEnter={hasChildren ? () => openNavigationGroup(group.href) : undefined}
              onMouseLeave={hasChildren ? () => closeNavigationGroup(group.href) : undefined}
              onFocusCapture={hasChildren ? () => openNavigationGroup(group.href) : undefined}
              onBlurCapture={hasChildren ? (event) => {
                const relatedTarget = event.relatedTarget

                if (relatedTarget instanceof Node && event.currentTarget.contains(relatedTarget)) {
                  return
                }

                closeNavigationGroup(group.href)
              } : undefined}
            >
              <div className={topLevelItemClass(active, isOpen)}>
                <Link
                  href={group.href}
                  onClick={handleNavLinkClick}
                  aria-current={currentPage ? "page" : undefined}
                  className="transition-colors"
                >
                  {group.label}
                </Link>

                {hasChildren ? (
                  <span className="pointer-events-none inline-flex items-center text-slate-500" aria-hidden="true">
                    <svg viewBox="0 0 12 12" className="h-3 w-3" aria-hidden="true">
                      <path
                        d="M2.25 4.5 6 8.25 9.75 4.5"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.4"
                      />
                    </svg>
                  </span>
                ) : null}
              </div>

              {hasChildren && isOpen ? (
                <div className="absolute left-0 top-full z-50 pt-2">
                  <div className="min-w-[13rem] max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-700/80 bg-slate-950/95 p-2 shadow-2xl shadow-black/40 backdrop-blur">
                    {group.children?.map((child) => {
                      const childActive = isPathActive(child.href)

                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={handleNavLinkClick}
                          aria-current={childActive ? "page" : undefined}
                          className={submenuLinkClass(childActive)}
                        >
                          {child.label}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          )
        })}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <DamageWidget />

        <div ref={controlsRef} className="relative flex items-center gap-2">
          {showFilterControls ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setOpenNavGroup(null)
                  setOpenMenu((current) => current === "filter" ? null : "filter")
                }}
                className={`${controlButtonClass} border-slate-700 bg-slate-950/90 ${hasActiveFilters || openMenu === "filter" ? "border-sky-500/60 text-sky-200" : "border-slate-700"}`}
                aria-haspopup="dialog"
                aria-expanded={openMenu === "filter"}
              >
                Filter
              </button>

              {showSortControls ? (
                <button
                  type="button"
                  onClick={() => {
                    setOpenNavGroup(null)
                    setOpenMenu((current) => current === "sort" ? null : "sort")
                  }}
                  className={`${controlButtonClass} border-slate-700 bg-slate-950/90 ${hasActiveSort || openMenu === "sort" ? "border-sky-500/60 text-sky-200" : "border-slate-700"}`}
                  aria-haspopup="dialog"
                  aria-expanded={openMenu === "sort"}
                >
                  {sortButtonLabel}
                </button>
              ) : null}
            </>
          ) : null}

          {showSummaryControls ? (
            <>
              <button
                type="button"
                onClick={() => updateSummaryViewState({ showEmptyRowsAndColumns: !summaryViewState.showEmptyRowsAndColumns })}
                className={`${controlButtonClass} border-slate-700 bg-slate-950/90 ${hasCustomSummaryView ? "border-sky-500/60 text-sky-200" : "border-slate-700"}`}
              >
                {summaryViewState.showEmptyRowsAndColumns ? "Hide empty data" : "Show empty data"}
              </button>

              <button
                type="button"
                onClick={() => updateSummaryViewState({ showEmptyGroups: !summaryViewState.showEmptyGroups })}
                className={`${controlButtonClass} border-slate-700 bg-slate-950/90 ${hasCustomSummaryView ? "border-sky-500/60 text-sky-200" : "border-slate-700"}`}
              >
                {summaryViewState.showEmptyGroups ? "Hide empty groups" : "Show empty groups"}
              </button>
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

                  {showAverageDamageFilter ? (
                    <>
                      <div className={sectionLabelClass}>Avg DMG</div>
                      <div className="grid gap-1">
                        {averageDamageFilterOptions.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => updateViewState({ averageDamageFilter: option.value })}
                            className={optionButtonClass(viewState.averageDamageFilter === option.value)}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </>
                  ) : null}
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

                  <div className={sectionLabelClass}>Equipment</div>
                  <div className="grid gap-1">
                    {tarotEquipmentFilterOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => updateViewState({ tarotEquipmentFilter: option.value })}
                        className={optionButtonClass(viewState.tarotEquipmentFilter === option.value)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>

                  {showAverageDamageFilter ? (
                    <>
                      <div className={sectionLabelClass}>Avg DMG</div>
                      <div className="grid gap-1">
                        {averageDamageFilterOptions.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => updateViewState({ averageDamageFilter: option.value })}
                            className={optionButtonClass(viewState.averageDamageFilter === option.value)}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </>
                  ) : null}
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
