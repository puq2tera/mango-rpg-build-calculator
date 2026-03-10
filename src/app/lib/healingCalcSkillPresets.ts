import { skill_data, type Skill } from "@/app/data/skill_data"
import stat_data from "@/app/data/stat_data"

export const healingBaseStats = ["ATK", "MATK", "HEAL", "DEF", "HP"] as const

export type HealingBaseStat = (typeof healingBaseStats)[number]

export type HealingCalcSkillPreset = {
  name: string
  description: string
  baseStat: HealingBaseStat
  skillHealPercent: number
  skillFlatHeal: number
  threatPercent: number
}

type HealingEffectType = "heal" | "tempHp" | "overheal"

type ParsedHealingEffect = {
  baseStat: HealingBaseStat
  skillHealPercent: number
  skillFlatHeal: number
  effectType: HealingEffectType
}

function normalizeHealingStatName(value: string): HealingBaseStat | null {
  const normalized = value.trim().toUpperCase()

  if (normalized === "HEALPOWER") {
    return "HEAL"
  }

  if (normalized === "HP" || normalized === "MAX HP" || normalized === "MAX HEALTH") {
    return "HP"
  }

  return stat_data.Mainstats.includes(normalized) ? normalized as HealingBaseStat : null
}

function parseAmountToken(value: string): number {
  const normalized = value.replace(/,/g, "").trim()
  const isThousands = /k$/i.test(normalized)
  const numericValue = Number.parseFloat(isThousands ? normalized.slice(0, -1) : normalized)

  if (!Number.isFinite(numericValue)) {
    return 0
  }

  return isThousands ? numericValue * 1000 : numericValue
}

function parseThreatPercent(description: string): number {
  const match = description.match(/([+-]?\d+(?:\.\d+)?)%\s*Threat(?: Generated)?/i)
  return match ? Number.parseFloat(match[1]) : 0
}

function parseDirectHealingEffect(description: string): ParsedHealingEffect | null {
  const flatAndPercentMatch = description.match(
    /\b(?:Recover Target Life|Recover Party HP|Heal Party HP|Heal Party|Heal self)\b[^.]*?\b(?:by|for)\s*(\d[\d,]*(?:\.\d+)?[kK]?)\s*\+\s*(\d+(?:\.\d+)?)%\s*(Healpower|Heal|DEF|MATK|ATK)\b/i,
  )

  if (flatAndPercentMatch) {
    const baseStat = normalizeHealingStatName(flatAndPercentMatch[3])

    if (!baseStat) {
      return null
    }

    return {
      baseStat,
      skillHealPercent: Number.parseFloat(flatAndPercentMatch[2]),
      skillFlatHeal: parseAmountToken(flatAndPercentMatch[1]),
      effectType: "heal",
    }
  }

  const percentOnlyMatch = description.match(
    /\b(?:Recover Target Life|Recover Party HP|Heal Party HP|Heal Party|Heal self)\b[^.]*?\b(?:by|for)\s*(\d+(?:\.\d+)?)%\s*(Healpower|Heal|DEF|MATK|ATK)\b/i,
  )

  if (percentOnlyMatch) {
    const baseStat = normalizeHealingStatName(percentOnlyMatch[2])

    if (!baseStat) {
      return null
    }

    return {
      baseStat,
      skillHealPercent: Number.parseFloat(percentOnlyMatch[1]),
      skillFlatHeal: 0,
      effectType: "heal",
    }
  }

  const maxHpMatch = description.match(
    /\bHeal self\b[^.]*?\b(?:by|for)\s*(\d+(?:\.\d+)?)%\s*(?:of\s*(?:your\s*)?)?(?:max health|max hp)\b/i,
  )

  if (maxHpMatch) {
    return {
      baseStat: "HP",
      skillHealPercent: Number.parseFloat(maxHpMatch[1]),
      skillFlatHeal: 0,
      effectType: "heal",
    }
  }

  return null
}

function parseConversionHealingEffect(skill: Skill): ParsedHealingEffect | null {
  const description = skill.description.toLowerCase()
  const effectType = description.includes("overheal")
    ? "overheal"
    : description.includes("temp hp") || description.includes("temporary hp")
      ? "tempHp"
      : null

  if (!effectType) {
    return null
  }

  const relevantConversion = skill.conversions?.find((conversion) => {
    if (conversion.ratio <= 0) {
      return false
    }

    if (conversion.resulting_stat !== "Temp HP" && conversion.resulting_stat !== "HP") {
      return false
    }

    return normalizeHealingStatName(String(conversion.source)) !== null
  })

  if (!relevantConversion) {
    return null
  }

  const baseStat = normalizeHealingStatName(String(relevantConversion.source))

  if (!baseStat) {
    return null
  }

  return {
    baseStat,
    skillHealPercent: relevantConversion.ratio * 100,
    skillFlatHeal: 0,
    effectType,
  }
}

function buildHealingCalcSkillPreset(name: string, skill: Skill): HealingCalcSkillPreset | null {
  const parsedEffect = parseDirectHealingEffect(skill.description) ?? parseConversionHealingEffect(skill)

  if (!parsedEffect) {
    return null
  }

  const threatPercent = parseThreatPercent(skill.description)

  return {
    name,
    description: skill.description,
    baseStat: parsedEffect.baseStat,
    skillHealPercent: parsedEffect.skillHealPercent,
    skillFlatHeal: parsedEffect.skillFlatHeal,
    threatPercent,
  }
}

export const healingCalcSkillPresets: HealingCalcSkillPreset[] = Object.entries(skill_data)
  .map(([name, skill]) => buildHealingCalcSkillPreset(name, skill))
  .filter((preset): preset is HealingCalcSkillPreset => preset !== null)
  .sort((left, right) => left.name.localeCompare(right.name))
