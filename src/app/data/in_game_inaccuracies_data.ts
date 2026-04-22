import type { StatNames } from "@/app/data/stat_data"

type RecordWithStats = {
  stats?: Partial<Record<StatNames, number>>
}

type StatOverride = {
  remove?: readonly StatNames[]
  set?: Partial<Record<StatNames, number>>
}

export type InGameInaccuracyCorrection = {
  from: string
  to: string
}

export type InGameInaccuracyEntry = {
  name: string
  description: string
  corrections: readonly InGameInaccuracyCorrection[]
  statOverride?: StatOverride
}

function applyInGameStatOverrides<T extends RecordWithStats>(
  records: Record<string, T>,
  entries: readonly InGameInaccuracyEntry[],
): void {
  for (const entry of entries) {
    const target = records[entry.name]
    const statOverride = entry.statOverride

    if (!target || !statOverride) {
      continue
    }

    const stats = target.stats ?? (target.stats = {})

    for (const statName of statOverride.remove ?? []) {
      delete stats[statName]
    }

    Object.assign(stats, statOverride.set ?? {})
  }
}

export const inGameTalentInaccuracies = [
  {
    name: "Time Shard of Hapnatra",
    description: "+1% Global ATK, '+4% xPhys DMG, Conversion 5% ATK to DEF",
    corrections: [
      {
        from: "4% xPhys DMG",
        to: "4% Phys xPen%",
      },
    ],
    statOverride: {
      remove: ["Phys xDmg%"],
      set: {
        "Phys xPen%": 4,
      },
    },
  },
] as const satisfies readonly InGameInaccuracyEntry[]

export const inGameSkillInaccuracies = [] as const satisfies readonly InGameInaccuracyEntry[]

export function applyInGameTalentOverrides<T extends RecordWithStats>(records: Record<string, T>): void {
  applyInGameStatOverrides(records, inGameTalentInaccuracies)
}

export function applyInGameSkillOverrides<T extends RecordWithStats>(records: Record<string, T>): void {
  applyInGameStatOverrides(records, inGameSkillInaccuracies)
}
