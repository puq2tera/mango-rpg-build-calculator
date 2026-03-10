import type { StatNames } from "./stat_data"

type RaceDefinition = {
  name: string
  tag: string
  isHuman: boolean
  description: string
  stats: Partial<Record<StatNames, number>>
}

export const HUMANOID_PREREQ_TOKEN = "HeroSeed"

export const race_data = [
  {
    name: "Skeleton",
    tag: "Skeleton",
    isHuman: false,
    description: "+50% Negative Resist, +25% Slash/Pierce/Water Resist, -25% Blunt/Fire, -50% Holy Resist",
    stats: {
      "Neg Res%": 50,
      "Slash Res%": 25,
      "Pierce Res%": 25,
      "Water Res%": 25,
      "Blunt Res%": -25,
      "Fire Res%": -25,
      "Holy Res%": -50
    }
  },
  {
    name: "Zombie",
    tag: "Zombie",
    isHuman: false,
    description: "+50% Negative Resist, 25% Water Resist, -25% Fire Resist, -50% Holy",
    stats: {
      "Neg Res%": 50,
      "Water Res%": 25,
      "Fire Res%": -25,
      "Holy Res%": -50
    }
  },
  {
    name: "Wood Elf",
    tag: "WoodElf",
    isHuman: true,
    description: "+5% Crit Chance, -10% DEF",
    stats: {
      "Crit Chance%": 5,
      "DEF%": -10
    }
  },
  {
    name: "Dwarf",
    tag: "Dwarf",
    isHuman: true,
    description: "+5% ATK, +5% DEF, -5% Crit Chance",
    stats: {
      "ATK%": 5,
      "DEF%": 5,
      "Crit Chance%": -5
    }
  },
  {
    name: "Orc",
    tag: "Orc",
    isHuman: false,
    description: "+5% ATK, +5% DEF, -5% MATK, -5% Heal",
    stats: {
      "ATK%": 5,
      "DEF%": 5,
      "MATK%": -5,
      "HEAL%": -5
    }
  },
  {
    name: "Goblin",
    tag: "Goblin",
    isHuman: false,
    description: "+5% Crit Chance, -5% ATK, -5% DEF",
    stats: {
      "Crit Chance%": 5,
      "ATK%": -5,
      "DEF%": -5
    }
  },
  {
    name: "Lizardman",
    tag: "Lizardman",
    isHuman: false,
    description: "+25% Water Resist, -25% Lightning Resist",
    stats: {
      "Water Res%": 25,
      "Lightning Res%": -25
    }
  },
  {
    name: "Giant",
    tag: "Giant",
    isHuman: false,
    description: "+10% ATK, +10% DEF, -10% Crit Chance",
    stats: {
      "ATK%": 10,
      "DEF%": 10,
      "Crit Chance%": -10
    }
  },
  {
    name: "Dragonspawn",
    tag: "Dragonspawn",
    isHuman: false,
    description: "+15% DEF, +15% ATK, -15% MATK, -15% Wind/Water/Lightning Resist",
    stats: {
      "DEF%": 15,
      "ATK%": 15,
      "MATK%": -15,
      "Wind Res%": -15,
      "Water Res%": -15,
      "Lightning Res%": -15
    }
  },
  {
    name: "Dark Elf",
    tag: "DarkElf",
    isHuman: true,
    description: "+5% Crit Chance, +5% MATK, -5% ATK, -10% DEF",
    stats: {
      "Crit Chance%": 5,
      "MATK%": 5,
      "ATK%": -5,
      "DEF%": -10
    }
  },
  {
    name: "Demon",
    tag: "Demon",
    isHuman: false,
    description: "+50% Fire Resist, -50% Holy",
    stats: {
      "Fire Res%": 50,
      "Holy Res%": -50
    }
  },
  {
    name: "Angel",
    tag: "Angel",
    isHuman: false,
    description: "+50% Holy Resist, -50% Negative Resist",
    stats: {
      "Holy Res%": 50,
      "Neg Res%": -50
    }
  },
  {
    name: "Vampire",
    tag: "Vampire",
    isHuman: false,
    description: "+50% Negative Resist, +5% ATK, +5% DEF, -25% Fire Resist, -50% Holy Resist",
    stats: {
      "Neg Res%": 50,
      "ATK%": 5,
      "DEF%": 5,
      "Fire Res%": -25,
      "Holy Res%": -50
    }
  },
  {
    name: "Insectoid",
    tag: "Insectoid",
    isHuman: false,
    description: "+5% ATK, +5% DEF, +10% Toxic Resist, -10% Fire Resist",
    stats: {
      "ATK%": 5,
      "DEF%": 5,
      "Toxic Res%": 10,
      "Fire Res%": -10
    }
  },
  {
    name: "Ogre",
    tag: "Ogre",
    isHuman: false,
    description: "+10% ATK, +5% DEF, -5% MATK, -5% Heal, +25 HP, -5% Crit Chance",
    stats: {
      "ATK%": 10,
      "DEF%": 5,
      "MATK%": -5,
      "HEAL%": -5,
      "HP": 25,
      "Crit Chance%": -5
    }
  },
  {
    name: "Troll",
    tag: "Troll",
    isHuman: false,
    description: "+10% ATK, +10% DEF, -5% MATK, -5% Heal, -25% Fire/Toxic Resist",
    stats: {
      "ATK%": 10,
      "DEF%": 10,
      "MATK%": -5,
      "HEAL%": -5,
      "Fire Res%": -25,
      "Toxic Res%": -25
    }
  },
  {
    name: "Quogga",
    tag: "Quogga",
    isHuman: false,
    description: "+10% ATK, +5% Physical Resist, -20% DEF, -25% Lightning Resist",
    stats: {
      "ATK%": 10,
      "Slash Res%": 5,
      "Pierce Res%": 5,
      "Blunt Res%": 5,
      "DEF%": -20,
      "Lightning Res%": -25
    }
  },
  {
    name: "Minotaur",
    tag: "Minotaur",
    isHuman: false,
    description: "+5% ATK, +5% DEF, -5% MATK, -5% Heal",
    stats: {
      "ATK%": 5,
      "DEF%": 5,
      "MATK%": -5,
      "HEAL%": -5
    }
  },
  {
    name: "Tigerman",
    tag: "Tigerman",
    isHuman: false,
    description: "+10% ATK, -10% DEF",
    stats: {
      "ATK%": 10,
      "DEF%": -10
    }
  },
  {
    name: "Goatman",
    tag: "Goatman",
    isHuman: false,
    description: "+5% ATK, -5% DEF",
    stats: {
      "ATK%": 5,
      "DEF%": -5
    }
  },
  {
    name: "Rainbow Human",
    tag: "RainbowMan",
    isHuman: true,
    description: "+5% MATK, -5% DEF, +3 EXP Bonus",
    stats: {
      "MATK%": 5,
      "DEF%": -5,
      "EXP Bonus": 3
    }
  },
  {
    name: "Northern Human",
    tag: "NorthMan",
    isHuman: true,
    description: "+4 EXP Bonus",
    stats: {
      "EXP Bonus": 4
    }
  },
  {
    name: "Southern Human",
    tag: "SouthMan",
    isHuman: true,
    description: "+5% ATK, -5% DEF, +3 EXP Bonus",
    stats: {
      "ATK%": 5,
      "DEF%": -5,
      "EXP Bonus": 3
    }
  },
  {
    name: "Half-Golem",
    tag: "HalfGolem",
    isHuman: false,
    description: "+50% Holy/Toxic/Negative Resist, +10% DEF, -20% Crit Chance",
    stats: {
      "Holy Res%": 50,
      "Toxic Res%": 50,
      "Neg Res%": 50,
      "DEF%": 10,
      "Crit Chance%": -20
    }
  },
  {
    name: "Frogman",
    tag: "Frogman",
    isHuman: false,
    description: "+25% Water Resist, -35% Lightning Resist, +5% MATK",
    stats: {
      "Water Res%": 25,
      "Lightning Res%": -35,
      "MATK%": 5
    }
  },
  {
    name: "Elemental",
    tag: "Elemental",
    isHuman: false,
    description: "+5% MATK, -5% ATK",
    stats: {
      "MATK%": 5,
      "ATK%": -5
    }
  },
  {
    name: "Tengu",
    tag: "Tengu",
    isHuman: false,
    description: "+10% MATK, -10% DEF",
    stats: {
      "MATK%": 10,
      "DEF%": -10
    }
  },
  {
    name: "Birdman",
    tag: "Birdman",
    isHuman: false,
    description: "+5% Crit Chance, +5% ATK, -15% DEF, -25% Lightning Resist",
    stats: {
      "Crit Chance%": 5,
      "ATK%": 5,
      "DEF%": -15,
      "Lightning Res%": -25
    }
  },
  {
    name: "Slime",
    tag: "Slime",
    isHuman: false,
    description: "+10% Slash/Pierce/Water/Toxic Resist, -10% DEF, -40% Lightning Resist",
    stats: {
      "Slash Res%": 10,
      "Pierce Res%": 10,
      "Water Res%": 10,
      "Toxic Res%": 10,
      "DEF%": -10,
      "Lightning Res%": -40
    }
  },
  {
    name: "Tree Spirit",
    tag: "TreeSpirit",
    isHuman: false,
    description: "+5% Heal, +5% Def, +25% Earth Resist, -25% Fire Resist",
    stats: {
      "HEAL%": 5,
      "DEF%": 5,
      "Earth Res%": 25,
      "Fire Res%": -25
    }
  },
  {
    name: "Arachnoid",
    tag: "Arachnoid",
    isHuman: false,
    description: "+10% ATK, -10% DEF, +10% Toxic Resist, -15% Fire Resist",
    stats: {
      "ATK%": 10,
      "DEF%": -10,
      "Toxic Res%": 10,
      "Fire Res%": -15
    }
  },
  {
    name: "Ghost",
    tag: "Ghost",
    isHuman: false,
    description: "+5% MATK, -5% ATK, +50% Negative Resist, -50% Holy Resist",
    stats: {
      "MATK%": 5,
      "ATK%": -5,
      "Neg Res%": 50,
      "Holy Res%": -50
    }
  },
  {
    name: "Kitsune",
    tag: "Kitsune",
    isHuman: false,
    description: "+25% Fire Resist, -25% Holy Resist, +5% ATK/MATK",
    stats: {
      "Fire Res%": 25,
      "Holy Res%": -25,
      "ATK%": 5,
      "MATK%": 5
    }
  },
  {
    name: "Succubus",
    tag: "Succubus",
    isHuman: false,
    description: "+10% Physical Resist, +5% Void Resist, -10% Holy Resist, -5% Crit Chance",
    stats: {
      "Slash Res%": 10,
      "Pierce Res%": 10,
      "Blunt Res%": 10,
      "Void Res%": 5,
      "Holy Res%": -10,
      "Crit Chance%": -5
    }
  },
] as const satisfies readonly RaceDefinition[]

export type RaceEntry = (typeof race_data)[number]
export type RaceTag = RaceEntry["tag"]

export function getRacePrereqTokens(race: RaceEntry): string[] {
  return race.isHuman
    ? [race.tag, race.name, HUMANOID_PREREQ_TOKEN]
    : [race.tag, race.name]
}

export const allRacePrereqTokens = new Set(race_data.flatMap((race) => getRacePrereqTokens(race)))

export const race_data_by_tag: Record<RaceTag, RaceEntry> = race_data.reduce(
  (acc, race) => {
    acc[race.tag] = race
    return acc
  },
  {} as Record<RaceTag, RaceEntry>
)

export default race_data
