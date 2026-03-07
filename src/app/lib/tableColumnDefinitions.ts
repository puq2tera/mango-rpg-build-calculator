import { __columnWidths as talentColumnWidths } from "@/app/data/talent_data"
import type { ManagedColumnDefinition } from "@/app/lib/managedColumns"

const parseWidth = (value: string | undefined, fallback: number): number => {
  const parsed = Number.parseInt(value ?? "", 10)
  return Number.isFinite(parsed) ? parsed : fallback
}

export type TalentColumnId =
  | "name"
  | "preReq"
  | "tag"
  | "blockedTag"
  | "gold"
  | "exp"
  | "tp"
  | "lvl"
  | "tank"
  | "warrior"
  | "caster"
  | "healer"
  | "description"
  | "avgDamageChange"

export type SkillColumnId =
  | "name"
  | "preReq"
  | "tag"
  | "blockedTag"
  | "gold"
  | "exp"
  | "sp"
  | "spSpent"
  | "tank"
  | "warrior"
  | "caster"
  | "healer"
  | "description"

export type BuffColumnId = SkillColumnId | "avgDamageChange"

export type TarotColumnId =
  | "name"
  | "avgDamageChange"
  | "tier"
  | "skillName"
  | "stack"
  | "description"

export const talentTableColumns: readonly ManagedColumnDefinition<TalentColumnId>[] = [
  { id: "name", label: "Name", defaultWidth: parseWidth(talentColumnWidths[0], 220), minWidth: 120 },
  {
    id: "avgDamageChange",
    label: "Avg DMG Change",
    title: "Change in Damage Calculator average damage using your saved calculator settings",
    defaultWidth: 110,
    minWidth: 100,
  },
  { id: "tank", label: "T", title: "Tank", defaultWidth: 40, minWidth: 40 },
  { id: "warrior", label: "W", title: "Warrior", defaultWidth: 40, minWidth: 40 },
  { id: "caster", label: "C", title: "Caster", defaultWidth: 40, minWidth: 40 },
  { id: "healer", label: "H", title: "Healer", defaultWidth: 40, minWidth: 40 },
  { id: "description", label: "Description", defaultWidth: parseWidth(talentColumnWidths[12], 640), minWidth: 160 },
  { id: "preReq", label: "PreReq", defaultWidth: parseWidth(talentColumnWidths[1], 220), minWidth: 120 },
  { id: "tag", label: "Tag", defaultWidth: parseWidth(talentColumnWidths[2], 120), minWidth: 80 },
  { id: "blockedTag", label: "BlockedTag", defaultWidth: parseWidth(talentColumnWidths[3], 140), minWidth: 90 },
  { id: "gold", label: "Gold", defaultWidth: 45, minWidth: 45 },
  { id: "exp", label: "Exp", defaultWidth: 55, minWidth: 50 },
  { id: "tp", label: "TP", defaultWidth: 40, minWidth: 40 },
  { id: "lvl", label: "Lvl", defaultWidth: 40, minWidth: 40 },
]

export const skillTableColumns: readonly ManagedColumnDefinition<SkillColumnId>[] = [
  { id: "name", label: "Name", defaultWidth: 220, minWidth: 120 },
  { id: "tank", label: "T", title: "Tank", defaultWidth: 56, minWidth: 40 },
  { id: "warrior", label: "W", title: "Warrior", defaultWidth: 56, minWidth: 40 },
  { id: "caster", label: "C", title: "Caster", defaultWidth: 56, minWidth: 40 },
  { id: "healer", label: "H", title: "Healer", defaultWidth: 56, minWidth: 40 },
  { id: "description", label: "Description", defaultWidth: 720, minWidth: 180 },
  { id: "preReq", label: "PreReq", defaultWidth: 220, minWidth: 120 },
  { id: "tag", label: "Tag", defaultWidth: 140, minWidth: 80 },
  { id: "blockedTag", label: "BlockedTag", defaultWidth: 160, minWidth: 90 },
  { id: "gold", label: "Gold", defaultWidth: 64, minWidth: 48 },
  { id: "exp", label: "Exp", defaultWidth: 72, minWidth: 56 },
  { id: "sp", label: "SP", defaultWidth: 56, minWidth: 48 },
  { id: "spSpent", label: "SP Spent", defaultWidth: 86, minWidth: 72 },
]

export const buffTableColumns: readonly ManagedColumnDefinition<BuffColumnId>[] = [
  {
    id: "name",
    label: "Name",
    defaultWidth: 220,
    minWidth: 120,
  },
  {
    id: "avgDamageChange",
    label: "Avg DMG Change",
    title: "Change in Damage Calculator average damage using your saved calculator settings",
    defaultWidth: 110,
    minWidth: 100,
  },
  { id: "tank", label: "T", title: "Tank", defaultWidth: 56, minWidth: 40 },
  { id: "warrior", label: "W", title: "Warrior", defaultWidth: 56, minWidth: 40 },
  { id: "caster", label: "C", title: "Caster", defaultWidth: 56, minWidth: 40 },
  { id: "healer", label: "H", title: "Healer", defaultWidth: 56, minWidth: 40 },
  { id: "description", label: "Description", defaultWidth: 720, minWidth: 180 },
  { id: "preReq", label: "PreReq", defaultWidth: 220, minWidth: 120 },
  { id: "tag", label: "Tag", defaultWidth: 140, minWidth: 80 },
  { id: "blockedTag", label: "BlockedTag", defaultWidth: 160, minWidth: 90 },
  { id: "gold", label: "Gold", defaultWidth: 64, minWidth: 48 },
  { id: "exp", label: "Exp", defaultWidth: 72, minWidth: 56 },
  { id: "sp", label: "SP", defaultWidth: 56, minWidth: 48 },
  { id: "spSpent", label: "SP Spent", defaultWidth: 86, minWidth: 72 },
]

export const tarotTableColumns: readonly ManagedColumnDefinition<TarotColumnId>[] = [
  { id: "name", label: "Name", defaultWidth: 280, minWidth: 120 },
  {
    id: "avgDamageChange",
    label: "Avg DMG Change",
    title: "Change in Damage Calculator average damage using your saved calculator settings",
    defaultWidth: 110,
    minWidth: 100,
  },
  { id: "tier", label: "Tier", defaultWidth: 80, minWidth: 64 },
  { id: "skillName", label: "Skill", defaultWidth: 220, minWidth: 120 },
  { id: "stack", label: "Stack", defaultWidth: 100, minWidth: 84 },
  { id: "description", label: "Description", defaultWidth: 720, minWidth: 180 },
]
