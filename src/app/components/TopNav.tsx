"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  dispatchManagedTableViewChange,
  getDefaultTableViewState,
  getTableViewPageFromPathname,
  normalizePathname,
  persistTableViewState,
  readTableViewState,
  type TableViewPage,
  type TableViewState,
} from "@/app/lib/tableViewState"

const RESETTABLE_PATHS = new Set(["/talents", "/skills", "/skills/buffs"])

const navLinks = [
  ["/talents", "Talents"],
  ["/talents/TalentOverview", "Talent Overview"],
  ["/Skills", "Skills"],
  ["/Skills/SkillOverview", "Skill Overview"],
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

const classFilterOptions: Array<{ value: TableViewState["classFilter"]; label: string }> = [
  { value: "all", label: "All Classes" },
  { value: "tank", label: "Tank" },
  { value: "warrior", label: "Warrior" },
  { value: "caster", label: "Caster" },
  { value: "healer", label: "Healer" },
]

const raceFilterOptions: Array<{ value: TableViewState["raceFilter"]; label: string }> = [
  { value: "all", label: "All Races" },
  { value: "current", label: "Current Race" },
  { value: "raceSpecific", label: "Race-Specific" },
]

const availabilityFilterOptions: Array<{ value: TableViewState["availabilityFilter"]; label: string }> = [
  { value: "all", label: "All" },
  { value: "available", label: "Available Only" },
  { value: "unavailable", label: "Unavailable Only" },
]

const sortOptions = (page: TableViewPage): Array<{ value: TableViewState["sortMode"]; label: string }> => [
  { value: "default", label: "Default" },
  { value: "damage", label: "DMG Increase" },
  { value: "cost", label: page === "talents" ? "TP Spent" : "SP Spent" },
]

const controlButtonClass =
  "shrink-0 rounded border px-2 py-1 text-slate-200 transition hover:bg-slate-800"

const sectionLabelClass = "px-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400"

const optionButtonClass = (active: boolean) => (
  `rounded px-2 py-1 text-left transition ${
    active ? "bg-sky-500/20 text-sky-200" : "text-slate-200 hover:bg-slate-800"
  }`
)

export default function TopNav() {
  const pathname = usePathname()
  const normalizedPathname = normalizePathname(pathname)
  const showResetUi = RESETTABLE_PATHS.has(normalizedPathname)
  const tablePage = getTableViewPageFromPathname(normalizedPathname)
  const [openMenu, setOpenMenu] = useState<"filter" | "sort" | null>(null)
  const [viewState, setViewState] = useState<TableViewState>(getDefaultTableViewState)
  const controlsRef = useRef<HTMLDivElement | null>(null)

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

  const hasActiveFilters = (
    viewState.classFilter !== "all" ||
    viewState.raceFilter !== "all" ||
    viewState.availabilityFilter !== "all"
  )

  const updateViewState = (patch: Partial<TableViewState>) => {
    if (!tablePage) {
      return
    }

    const nextViewState = { ...viewState, ...patch }
    setViewState(nextViewState)
    persistTableViewState(localStorage, tablePage, nextViewState)
    dispatchManagedTableViewChange({ page: tablePage, viewState: nextViewState })
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center gap-3 border-b border-slate-700 bg-slate-950/90 px-5 py-2 text-xs shadow-lg shadow-black/30 backdrop-blur">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
        {navLinks.map(([href, label]) => (
          <Link key={href} href={href} className="text-slate-100 transition-colors hover:text-sky-300">
            {label}
          </Link>
        ))}
      </div>

      <div ref={controlsRef} className="relative flex shrink-0 items-center gap-2">
        {tablePage ? (
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

            <button
              type="button"
              onClick={() => setOpenMenu((current) => current === "sort" ? null : "sort")}
              className={`${controlButtonClass} border-slate-700 bg-slate-950/90 ${viewState.sortMode !== "default" || openMenu === "sort" ? "border-sky-500/60 text-sky-200" : "border-slate-700"}`}
              aria-haspopup="dialog"
              aria-expanded={openMenu === "sort"}
            >
              Sort
            </button>
          </>
        ) : null}

        {showResetUi ? (
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event("resetManagedTableUi"))}
            className={`${controlButtonClass} border-slate-700 bg-slate-950/90`}
            title="Reset column order, widths, and collapsed columns"
          >
            Reset UI
          </button>
        ) : null}

        {tablePage && openMenu === "filter" ? (
          <div className="absolute right-0 top-full mt-2 grid min-w-[14rem] gap-2 rounded-md border border-slate-700 bg-slate-950/95 p-2 shadow-xl shadow-black/40">
            <div className={sectionLabelClass}>Class</div>
            <div className="grid gap-1">
              {classFilterOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => updateViewState({ classFilter: option.value })}
                  className={optionButtonClass(viewState.classFilter === option.value)}
                >
                  {option.label}
                </button>
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
          </div>
        ) : null}

        {tablePage && openMenu === "sort" ? (
          <div className="absolute right-0 top-full mt-2 grid min-w-[12rem] gap-1 rounded-md border border-slate-700 bg-slate-950/95 p-2 shadow-xl shadow-black/40">
            {sortOptions(tablePage).map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => updateViewState({ sortMode: option.value })}
                className={optionButtonClass(viewState.sortMode === option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </nav>
  )
}
