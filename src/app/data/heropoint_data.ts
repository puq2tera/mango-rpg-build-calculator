import type { RaceTag } from "./race_data"

type HeroPointGroup = "main" | "damage" | "resist" | "penetration"

export const heroPointStats = [
  { id: "atkmulti", cost: 1, group: "main" },
  { id: "defmulti", cost: 1, group: "main" },
  { id: "matkmulti", cost: 1, group: "main" },
  { id: "healmulti", cost: 1, group: "main" },
  { id: "elefire", cost: 1, group: "damage" },
  { id: "elelightning", cost: 1, group: "damage" },
  { id: "elewater", cost: 1, group: "damage" },
  { id: "eleearth", cost: 1, group: "damage" },
  { id: "elewind", cost: 1, group: "damage" },
  { id: "eletoxic", cost: 1, group: "damage" },
  { id: "elevoid", cost: 2, group: "damage" },
  { id: "elenegative", cost: 1, group: "damage" },
  { id: "eleholy", cost: 1, group: "damage" },
  { id: "eleblunt", cost: 1, group: "damage" },
  { id: "elepierce", cost: 1, group: "damage" },
  { id: "eleslash", cost: 1, group: "damage" },
  { id: "resfire", cost: 2, group: "resist" },
  { id: "reslightning", cost: 2, group: "resist" },
  { id: "reswater", cost: 2, group: "resist" },
  { id: "researth", cost: 2, group: "resist" },
  { id: "reswind", cost: 2, group: "resist" },
  { id: "restoxic", cost: 2, group: "resist" },
  { id: "resvoid", cost: 3, group: "resist" },
  { id: "resnegative", cost: 2, group: "resist" },
  { id: "resholy", cost: 2, group: "resist" },
  { id: "resblunt", cost: 2, group: "resist" },
  { id: "respierce", cost: 2, group: "resist" },
  { id: "resslash", cost: 2, group: "resist" },
  { id: "penvoid", cost: 2, group: "penetration" },
] as const satisfies ReadonlyArray<{ id: string; cost: number; group: HeroPointGroup }>

export type HeroPointStat = (typeof heroPointStats)[number]
export type HeroPointStatId = HeroPointStat["id"]

export const heroPointStatsByGroup: Record<HeroPointGroup, HeroPointStat[]> = {
  main: heroPointStats.filter((stat) => stat.group === "main"),
  damage: heroPointStats.filter((stat) => stat.group === "damage"),
  resist: heroPointStats.filter((stat) => stat.group === "resist"),
  penetration: heroPointStats.filter((stat) => stat.group === "penetration"),
}

function buildRaceHeroPointGains(values: readonly number[]): Record<HeroPointStatId, number> {
  if (values.length !== heroPointStats.length) {
    throw new Error(`Expected ${heroPointStats.length} hero point values, got ${values.length}`)
  }

  return heroPointStats.reduce(
    (acc, stat, index) => {
      acc[stat.id] = values[index]
      return acc
    },
    {} as Record<HeroPointStatId, number>
  )
}

export const heroPointGainsByRace: Record<RaceTag, Record<HeroPointStatId, number>> = {
  Skeleton: buildRaceHeroPointGains([5, 5, 5, 5, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 1, 3, 3, 2, 2, 3, 1, 3, 1, 1, 3, 3, 0]),
  Zombie: buildRaceHeroPointGains([5, 5, 5, 5, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 1, 3, 3, 2, 2, 3, 1, 3, 1, 2, 2, 2, 0]),
  WoodElf: buildRaceHeroPointGains([4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 2, 2, 1, 6, 4, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 1]),
  Dwarf: buildRaceHeroPointGains([4, 4, 4, 4, 4, 4, 2, 4, 2, 4, 3, 2, 2, 6, 1, 6, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 1]),
  Orc: buildRaceHeroPointGains([5, 5, 5, 5, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 0]),
  Goblin: buildRaceHeroPointGains([4, 4, 5, 5, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 0]),
  Lizardman: buildRaceHeroPointGains([5, 5, 5, 5, 2, 1, 3, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 3, 2, 2, 2, 1, 2, 2, 2, 2, 2, 0]),
  Giant: buildRaceHeroPointGains([5, 5, 5, 5, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 0]),
  Dragonspawn: buildRaceHeroPointGains([5, 5, 5, 5, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 2, 1, 2, 1, 2, 2, 2, 2, 2, 0]),
  DarkElf: buildRaceHeroPointGains([4, 4, 4, 4, 2, 2, 2, 2, 2, 2, 3, 4, 4, 1, 6, 4, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 1]),
  Demon: buildRaceHeroPointGains([6, 6, 6, 4, 3, 2, 2, 2, 2, 2, 3, 2, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 1, 2, 2, 2, 0]),
  Angel: buildRaceHeroPointGains([6, 4, 6, 6, 2, 2, 2, 2, 2, 2, 2, 0, 3, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 3, 2, 2, 2, 0]),
  Vampire: buildRaceHeroPointGains([6, 6, 5, 5, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 3, 3, 2, 2, 2, 1, 3, 1, 2, 2, 2, 0]),
  Insectoid: buildRaceHeroPointGains([6, 6, 5, 5, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 3, 1, 2, 2, 2, 2, 2, 0]),
  Ogre: buildRaceHeroPointGains([6, 6, 4, 4, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 0]),
  Troll: buildRaceHeroPointGains([6, 6, 4, 4, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 2, 0]),
  Quogga: buildRaceHeroPointGains([5, 5, 5, 5, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 1, 2, 2, 3, 3, 3, 0]),
  Minotaur: buildRaceHeroPointGains([5, 6, 5, 5, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 0]),
  Tigerman: buildRaceHeroPointGains([5, 5, 5, 5, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 0]),
  Goatman: buildRaceHeroPointGains([5, 5, 5, 5, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 0]),
  RainbowMan: buildRaceHeroPointGains([4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 3, 5, 5, 1, 1, 1, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 1]),
  NorthMan: buildRaceHeroPointGains([4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 3, 4, 4, 4, 4, 4, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 1]),
  SouthMan: buildRaceHeroPointGains([4, 4, 4, 4, 1, 1, 1, 1, 1, 1, 3, 1, 1, 5, 5, 5, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 1]),
  HalfGolem: buildRaceHeroPointGains([4, 6, 4, 4, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 0]),
  Frogman: buildRaceHeroPointGains([4, 4, 6, 6, 2, 1, 3, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 3, 2, 2, 2, 1, 2, 2, 2, 2, 2, 0]),
  Elemental: buildRaceHeroPointGains([4, 4, 6, 6, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1, 1, 1, 2, 1, 2, 2, 2, 2, 2, 0]),
  Tengu: buildRaceHeroPointGains([4, 4, 6, 6, 2, 2, 2, 2, 2, 2, 3, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 0]),
  Birdman: buildRaceHeroPointGains([6, 6, 4, 4, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 0]),
  Slime: buildRaceHeroPointGains([4, 6, 5, 5, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 0]),
  TreeSpirit: buildRaceHeroPointGains([5, 6, 5, 6, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 3, 2, 2, 1, 2, 2, 2, 2, 2, 0]),
  Arachnoid: buildRaceHeroPointGains([5, 5, 5, 5, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 3, 1, 2, 2, 2, 2, 2, 0]),
  Ghost: buildRaceHeroPointGains([4, 4, 6, 6, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 3, 1, 3, 3, 3, 0]),
  Kitsune: buildRaceHeroPointGains([6, 4, 6, 5, 3, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 2, 2, 2, 2, 2, 1, 2, 1, 2, 2, 2, 0]),
  Succubus: buildRaceHeroPointGains([6, 6, 6, 4, 2, 2, 3, 2, 2, 2, 3, 2, 0, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 1, 2, 2, 2, 0]),
}

const heroPointData = {
  heroPointStats,
  heroPointStatsByGroup,
  heroPointGainsByRace,
}

export default heroPointData
