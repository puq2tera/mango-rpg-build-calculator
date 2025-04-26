const Mainstats = ["ATK", "DEF", "HEAL", "MATK"]
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

export default { Mainstats, AllElements, SkillTypes, Elemental, Physical, Divine, xPenMapping }