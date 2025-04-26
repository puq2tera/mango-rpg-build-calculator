const ClassNames: string[] = ["tank", "warrior", "caster", "healer"]
const Mainstats = ["ATK", "DEF", "MATK", "HEAL"]
const AllElements = ["Slash", "Pierce", "Blunt", "Fire", "Water", "Lightning", "Wind", "Earth", "Toxic", "Neg", "Holy", "Void"]
const SkillTypes = ["Sword", "Spear", "Void", "Fire", "Shadow Break"]

const Elemental = ["Fire", "Water", "Lightning", "Wind", "Earth", "Toxic"]
const Physical = ["Slash", "Pierce", "Blunt"]
const Divine = ["Neg", "Holy"]

const xPenMapping: Record<string, string[]> = {
    "Phys xPen%": ["Blunt Pen%", "Pierce Pen%", "Slash Pen%"],
    "Divine xPen%": ["Neg Pen%", "Holy Pen%"],
    "Void xPen%": ["Void Pen%"],
    "Elemental xPen%": ["Fire Pen%", "Water Pen%", "Lightning Pen%", "Wind Pen%", "Earth Pen%", "Toxic Pen%"]
}

const heroStats: [string, number][] = [
  ["atkmulti", 1], ["defmulti", 1], ["matkmulti", 1], ["healmulti", 1],
  ["elefire", 1], ["elelightning", 1], ["elewater", 1], ["eleearth", 1], ["elewind", 1], ["eletoxic", 2], ["elevoid", 2], ["elenegative", 1], ["eleholy", 1], ["eleblunt", 1], ["elepierce", 1], ["eleslash", 1],
  ["resfire", 2], ["reslightning", 2], ["reswater", 2], ["researth", 2], ["reswind", 2], ["restoxic", 3], ["resvoid", 3], ["resnegative", 2], ["resholy", 2], ["resblunt", 2], ["respierce", 2], ["resslash", 2],
  ["penvoid", 1]
]

const ClassMainStatValues: Record<string, Record<string, number>> = {
  "tank": {
    "ATK": 7,
    "DEF": 2,
    "MATK": 1,
    "HEAL": 1
  },
  "warrior": {
    "ATK": 2,
    "DEF": 7,
    "MATK": 1,
    "HEAL": 1
  },
  "caster": {
    "ATK": 1,
    "DEF": 1,
    "MATK": 7,
    "HEAL": 1.5
  },
  "healer": {
    "ATK": 1,
    "DEF": 1,
    "MATK": 1.5,
    "HEAL": 7
  }
}

export default { Mainstats, AllElements, SkillTypes, Elemental, Physical, Divine, xPenMapping, heroStats, ClassMainStatValues, ClassNames }