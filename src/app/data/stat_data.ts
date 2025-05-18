export type StatNames = 
    //Mainstats
    | 'ATK' | 'DEF' | 'MATK' | 'HEAL' | 'POWER'
    | 'ATK%' | 'DEF%' | 'MATK%' | 'HEAL%'
    //Elemental
    | "Fire%" | "Water%" | "Lightning%" | "Wind%" | "Earth%" | "Toxic%"
    | "Fire Pen%" | "Water Pen%" | "Lightning Pen%" | "Wind Pen%" | "Earth Pen%" | "Toxic Pen%"
    | "Fire Res%" | "Water Res%" | "Lightning Res%" | "Wind Res%" | "Earth Res%" | "Toxic Res%"
    | "Elemental%" | "Elemental Pen%" | "Elemental Res%" | "Elemental xDmg%" | "Elemental xPen%"
    //Phys
    | "Slash%" | "Pierce%" | "Blunt%"
    | "Slash Pen%" | "Pierce Pen%" | "Blunt Pen%"
    | "Slash Res%" | "Pierce Res%" | "Blunt Res%"
    | "Phys%" | "Phys Pen%" | "Phys Res%" | "Phys xPen%"
    //Divine
    | "Neg%" | "Holy%"
    | "Neg Pen%" | "Holy Pen%"
    | "Neg Res%" | "Holy Res%"
    | "Divine%" | "Divine Pen%" | "Divine Res%"
    //Void
    | "Void%"
    | "Void Pen%"
    | "Void Res%"
    //Weird
    | "NonVoid Pen%" // in game its called "allresnovoid"
    | "Magic%" // Elemental + Divine + Void
    //All
    | "All%" | "All Pen%" | "All Res%"
    //Crit
    | "Crit Chance%" | "Crit DMG%"
    //Character Stats
    | "Focus" | "Focus Regen"
    | "MP" | "MP Regen"
    | "HP" | "HP Regen" | "HP Regen%" | "Temp HP"
    //Other
    | "Threat%"
    | "Dmg%"
    | "DMG Res%"
    | "Buff%"
    | "Heal Effect%"
    | "EXP Gain%"
    //Skill Specific
    | "Blunt Armor Ignore%" | "Void Armor Ignore%" | "Phys Armor Ignore%" | "Magic Armor Ignore%"
    | "Spear DMG%" | "Sword DMG%" | "Hammer DMG%" 
    | "Void DOT%" | "Holy DOT%" | "Slash DOT%"
    | "Bow Crit DMG%" | "Fist Crit DMG%" | "Dagger Crit DMG%" | "Elemental Crit DMG%" | "Holy Crit DMG%"
    //Buff specific post stats
    | "Post Crit Chance%" | "Post ATK" | "Post HEAL" | "Post Slash Pen%" | "Post Fire Pen%"

const ClassNames: string[] = ["tank", "warrior", "caster", "healer"]
const Mainstats = ["ATK", "DEF", "MATK", "HEAL"]
const AllElements = ["Slash", "Pierce", "Blunt", "Fire", "Water", "Lightning", "Wind", "Earth", "Toxic", "Neg", "Holy", "Void"]
export type Mainstats_type = "ATK" | "DEF" | "MATK" | "HEAL"
export type AllElements_type = "Slash" | "Pierce" | "Blunt" | "Fire" | "Water" | "Lightning" | "Wind" | "Earth" | "Toxic" | "Neg" | "Holy" | "Void"
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

const stat_data = {
  Mainstats,
  AllElements,
  SkillTypes,
  Elemental,
  Physical,
  Divine,
  xPenMapping,
  heroStats,
  ClassMainStatValues,
  ClassNames,
}

export default stat_data