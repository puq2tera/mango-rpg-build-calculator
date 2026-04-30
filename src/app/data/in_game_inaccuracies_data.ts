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
  {
    name: "Mark of Golem Ninja 1",
    description: "+1% Global ATK, +50% ATK, +30% DEF",
    corrections: [
      {
        from: "50% ATK",
        to: "50 ATK",
      },
      {
        from: "30% DEF",
        to: "30 DEF",
      },
    ],
    statOverride: {
      remove: ["ATK%", "DEF%"],
      set: {
        "ATK": 50,
        "DEF": 30,
      },
    },
  },
  {
    name: "Mark of Golem Ninja 2",
    description: "+1% Global ATK, +50% ATK, +30% DEF",
    corrections: [
      {
        from: "50% ATK",
        to: "50 ATK",
      },
      {
        from: "30% DEF",
        to: "30 DEF",
      },
    ],
    statOverride: {
      remove: ["ATK%", "DEF%"],
      set: {
        "ATK": 50,
        "DEF": 30,
      },
    },
  },
  {
    name: "Mark of Golem Ninja 3",
    description: "+3% Global ATK, +50% ATK, +30% DEF",
    corrections: [
      {
        from: "50% ATK",
        to: "50 ATK",
      },
      {
        from: "30% DEF",
        to: "30 DEF",
      },
    ],
    statOverride: {
      remove: ["ATK%", "DEF%"],
      set: {
        "ATK": 50,
        "DEF": 30,
      },
    },
  },
  {
    name: "Emissary of Fortune",
    description: "+12% Heal, +5% Crit Chance, +25% Crit Damage",
    corrections: [
      {
        from: "12% HEAL",
        to: "10% HEAL",
      }
    ],
    statOverride: {
      remove: ["HEAL%"],
      set: {
        "HEAL%": 10
      },
    },
  },
  {
    name: "Dagger Path 3",
    description: "+2% Slash Damage, +2% Pierce Damage, +2% Crit Chance",
    corrections: [
      {
        from: "2% Pierce Damage",
        to: "",
      }
    ],
    statOverride: {
      remove: ["Pierce%"]
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
