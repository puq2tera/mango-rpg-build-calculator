"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const RESETTABLE_PATHS = new Set(["/talents", "/skills", "/skills/buffs"])

function normalizePathname(pathname: string): string {
  const trimmed = pathname.replace(/\/+$/, "")
  return (trimmed.length > 0 ? trimmed : "/").toLowerCase()
}

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

export default function TopNav() {
  const pathname = usePathname()
  const showResetUi = RESETTABLE_PATHS.has(normalizePathname(pathname))

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center gap-3 border-b border-slate-700 bg-slate-950/90 px-5 py-2 text-xs shadow-lg shadow-black/30 backdrop-blur">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
        {navLinks.map(([href, label]) => (
          <Link key={href} href={href} className="text-slate-100 transition-colors hover:text-sky-300">
            {label}
          </Link>
        ))}
      </div>

      {showResetUi ? (
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event("resetManagedTableUi"))}
          className="shrink-0 rounded border border-slate-700 bg-slate-950/90 px-2 py-1 text-slate-200 hover:bg-slate-800"
          title="Reset column order, widths, and collapsed columns"
        >
          Reset UI
        </button>
      ) : null}
    </nav>
  )
}
