export type StatInfoData = { multi: number };

export const StatsInfo: Record<string, StatInfoData> = {
  // Mainstats
  "ATK":   { multi: 1 },
  "DEF":   { multi: 1 },
  "MATK":  { multi: 1 },
  "HEAL":  { multi: 1 },
  "POWER": { multi: 1 },

  "ATK%":  { multi: 0.01 },
  "DEF%":  { multi: 0.01 },
  "MATK%": { multi: 0.01 },
  "HEAL%": { multi: 0.01 },

  "Art_ATK%":  { multi: 0.01 },
  "Art_DEF%":  { multi: 0.01 },
  "Art_MATK%": { multi: 0.01 },
  "Art_HEAL%": { multi: 0.01 },

  "Global ATK%":  { multi: 0.01 },
  "Global DEF%":  { multi: 0.01 },
  "Global MATK%": { multi: 0.01 },
  "Global HEAL%": { multi: 0.01 },

  // Elemental
  "Fire%":      { multi: 0.01 },
  "Water%":     { multi: 0.01 },
  "Lightning%": { multi: 0.01 },
  "Wind%":      { multi: 0.01 },
  "Earth%":     { multi: 0.01 },
  "Toxic%":     { multi: 0.01 },

  "Fire Pen%":      { multi: 0.01 },
  "Water Pen%":     { multi: 0.01 },
  "Lightning Pen%": { multi: 0.01 },
  "Wind Pen%":      { multi: 0.01 },
  "Earth Pen%":     { multi: 0.01 },
  "Toxic Pen%":     { multi: 0.01 },

  "Fire Res%":      { multi: 0.01 },
  "Water Res%":     { multi: 0.01 },
  "Lightning Res%": { multi: 0.01 },
  "Wind Res%":      { multi: 0.01 },
  "Earth Res%":     { multi: 0.01 },
  "Toxic Res%":     { multi: 0.01 },

  "Elemental%":      { multi: 0.01 },
  "Elemental Pen%":  { multi: 0.01 },
  "Elemental Res%":  { multi: 0.01 },
  "Elemental xDmg%": { multi: 0.01 },
  "Elemental xPen%": { multi: 0.01 },

  // Phys
  "Slash%":  { multi: 0.01 },
  "Pierce%": { multi: 0.01 },
  "Blunt%":  { multi: 0.01 },

  "Slash Pen%":  { multi: 0.01 },
  "Pierce Pen%": { multi: 0.01 },
  "Blunt Pen%":  { multi: 0.01 },

  "Slash Res%":  { multi: 0.01 },
  "Pierce Res%": { multi: 0.01 },
  "Blunt Res%":  { multi: 0.01 },

  "Phys%":      { multi: 0.01 },
  "Phys Pen%":  { multi: 0.01 },
  "Phys Res%":  { multi: 0.01 },
  "Phys xDmg%": { multi: 0.01 },
  "Phys xPen%": { multi: 0.01 },

  // Divine
  "Neg%":  { multi: 0.01 },
  "Holy%": { multi: 0.01 },

  "Neg Pen%":  { multi: 0.01 },
  "Holy Pen%": { multi: 0.01 },

  "Neg Res%":  { multi: 0.01 },
  "Holy Res%": { multi: 0.01 },

  "Divine%":     { multi: 0.01 },
  "Divine Pen%": { multi: 0.01 },
  "Divine Res%": { multi: 0.01 },

  // Void
  "Void%":      { multi: 0.01 },
  "Void Pen%":  { multi: 0.01 },
  "Void xPen%": { multi: 0.01 },
  "Void Res%":  { multi: 0.01 },

  // Weird
  "NonVoid Pen%":                { multi: 0.01 },
  "Elemental_Except_Water Res%": { multi: 0.01 },
  "Magic%":                      { multi: 0.01 },

  // All
  "All%":     { multi: 0.01 },
  "All Pen%": { multi: 0.01 },
  "All Res%": { multi: 0.01 },

  // Crit
  "Crit Chance%": { multi: 0.01 },
  "Crit DMG%":    { multi: 0.01 },

  // Character Stats
  "Focus":       { multi: 1 },
  "Focus Regen": { multi: 1 },

  "MP":       { multi: 1 },
  "MP Regen": { multi: 1 },
  "MP%":      { multi: 0.01 },

  "HP":        { multi: 1 },
  "HP Regen":  { multi: 1 },
  "HP%":       { multi: 0.01 },
  "HP Regen%": { multi: 0.01 },
  "Temp HP":   { multi: 1 },

  // Other
  "Threat%":      { multi: 0.01 },
  "Dmg%":         { multi: 0.01 },
  "DMG Res%":     { multi: 0.01 },
  "Buff%":        { multi: 0.01 },
  "Heal Effect%": { multi: 0.01 },
  "EXP Bonus":    { multi: 1 },

  // Class level bonuses
  "Overdrive%":   { multi: 0.01 },
  "Armor Save":   { multi: 1 },
  "Armor Strike": { multi: 1 },

  // Skill Specific
  "Blunt Armor Ignore%": { multi: 0.01 },
  "Void Armor Ignore%":  { multi: 0.01 },
  "Phys Armor Ignore%":  { multi: 0.01 },
  "Magic Armor Ignore%": { multi: 0.01 },

  "Spear DMG%":        { multi: 0.01 },
  "Sword DMG%":        { multi: 0.01 },
  "Hammer DMG%":       { multi: 0.01 },
  "Fire DMG%":         { multi: 0.01 },
  "Fist DMG%":         { multi: 0.01 },
  "Dagger DMG%":       { multi: 0.01 },
  "Shadow Break DMG%": { multi: 0.01 },

  "Void DOT%":  { multi: 0.01 },
  "Holy DOT%":  { multi: 0.01 },
  "Slash DOT%": { multi: 0.01 },

  "Bow Crit DMG%":       { multi: 0.01 },
  "Fist Crit DMG%":      { multi: 0.01 },
  "Dagger Crit DMG%":    { multi: 0.01 },
  "Elemental Crit DMG%": { multi: 0.01 },
  "Holy Crit DMG%":      { multi: 0.01 },

  "Shadow Break Crit Chance%": { multi: 0.01 },

  // Buff specific post stats
  "Post Crit Chance%": { multi: 0.01 },
  "Post ATK":          { multi: 1 },
  "Post HEAL":         { multi: 1 },
  "Post Slash Pen%":   { multi: 0.01 },
  "Post Fire Pen%":    { multi: 0.01 },
};

export type StatNames = keyof typeof StatsInfo;
const ClassNames: string[] = ["tank", "warrior", "caster", "healer"]
const Mainstats = ["ATK", "DEF", "MATK", "HEAL"]
const AllElements = ["Slash", "Pierce", "Blunt", "Fire", "Water", "Lightning", "Wind", "Earth", "Toxic", "Neg", "Holy", "Void"]
export type Mainstats_type = "ATK" | "DEF" | "MATK" | "HEAL"
export type AllElements_type = "Slash" | "Pierce" | "Blunt" | "Fire" | "Water" | "Lightning" | "Wind" | "Earth" | "Toxic" | "Neg" | "Holy" | "Void"
const SkillTypes = ["Sword", "Spear", "Void", "Fire", "Shadow Break"]
export const PostBuffTypes: StatNames[] = ["Post Crit Chance%" , "Post ATK" , "Post HEAL" , "Post Slash Pen%" , "Post Fire Pen%"]

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
const ClassScalingStats: Record<string, string> = {
  "tank": "Armor Save",
  "warrior": "Overdrive%",
  "caster": "Crit DMG%",
  "healer": "Armor Strike"
}

const ClassMainStatValues: Record<string, Record<string, number>> = {
  "tank": {
    "ATK": 2.5,
    "DEF": 7,
    "MATK": 1.5,
    "HEAL": 1.5,
    "HP": 22.5,
    "MP": 1,
    "Armor Save": 1,
    "Armor Save Scaling": 0.03 //round down
  },
  "warrior": {
    "ATK": 7,
    "DEF": 2.5,
    "MATK": 1.5,
    "HEAL": 1.5,
    "HP": 20.5,
    "MP": 1,
    "Focus": 2,
    "Overdrive%": 0.00075,
    "Overdrive% Scaling": 0.000002 //cap at 0.08 scaling
  },
  "caster": {
    "ATK": 1.5,
    "DEF": 1.5,
    "MATK": 7,
    "HEAL": 3.5,
    "HP": 19.5,
    "MP": 3,
    "Crit DMG%": 3,
    "Crit DMG% Scaling" : 0.03 //round down
  },
  "healer": {
    "ATK": 1.5,
    "DEF": 1.5,
    "MATK": 2.5,
    "HEAL": 7,
    "HP": 15,
    "MP": 3,
    "Armor Strike": 25,
    "Armor Strike Scaling": 60
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
  PostBuffTypes,
  ClassScalingStats,
  StatsInfo
}

export default stat_data