import stat_data from "@/app/data/stat_data"
import { skill_data } from "@/app/data/skill_data"
import { defaultDamageCalcInputs, defaultDamageCalcState, type DamageCalcInputs } from "@/app/lib/damageCalc"

type AttackPresetInputKey =
  | "skillDmg"
  | "skillCritDmg"
  | "skillPen"
  | "skillCritChance"
  | "threatDef"
  | "armorIgnore"
  | "resIgnore"
  | "dot"
  | "secondSkillDmg"

type RawAttackPreset = {
  name: string
  description: string
  damageType: string | null
  element: string | null
  penElement: string | null
  mainStat: string | null
  secondStat: string | null
  skillType: string | null
  inputs: Pick<DamageCalcInputs, AttackPresetInputKey>
  isThreatOnly: boolean
}

export type DamageCalcAttackPreset = {
  name: string
  description: string
  note: string | null
  mainStat: string
  secondStat: string
  element: string
  penElement: string
  skillType: string
  inputs: Pick<DamageCalcInputs, AttackPresetInputKey>
}

export const attackPresetInputKeys: AttackPresetInputKey[] = [
  "skillDmg",
  "skillCritDmg",
  "skillPen",
  "skillCritChance",
  "threatDef",
  "armorIgnore",
  "resIgnore",
  "dot",
  "secondSkillDmg",
]

const highestElementGroups = {
  "Highest Phys": ["Slash", "Pierce", "Blunt"],
  "Highest Magic": ["Fire", "Water", "Lightning", "Wind", "Earth", "Toxic", "Neg", "Holy", "Void"],
  "Highest Elemental": ["Fire", "Water", "Lightning", "Wind", "Earth", "Toxic"],
  "Highest Divine": ["Neg", "Holy", "Void"],
} as const

type DynamicElementSource = keyof typeof highestElementGroups

function isDynamicElementSource(value: string): value is DynamicElementSource {
  return value in highestElementGroups
}

function normalizeElementName(value: unknown): string | null {
  if (typeof value !== "string" || value.length === 0) {
    return null
  }

  if (isDynamicElementSource(value)) {
    return value
  }

  if (stat_data.AllElements.includes(value)) {
    return value
  }

  const cleaned = value.replace(/ Pen%$/, "").replace(/%$/, "")
  return stat_data.AllElements.includes(cleaned) ? cleaned : null
}

function normalizeMainStatName(value: unknown): string | null {
  return typeof value === "string" && stat_data.Mainstats.includes(value) ? value : null
}

function normalizeSkillTypeName(value: unknown): string | null {
  return typeof value === "string" && stat_data.SkillTypes.includes(value) ? value : null
}

function toPercentValue(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0
  }

  return Math.abs(value) <= 1 ? value * 100 : value
}

function toSkillPercent(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0
  }

  return Math.abs(value) >= 100 ? value : value * 100
}

function resolveHighestElement(
  stats: Record<string, number>,
  source: DynamicElementSource,
  mode: "damage" | "pen",
): string {
  const best = highestElementGroups[source].reduce<{ element: string; score: number }>((result, element) => {
    const score =
      mode === "pen"
        ? (stats[`${element} Pen%`] ?? 0)
        : (stats[`${element}%`] ?? 0) + (stats[`${element} xDmg%`] ?? 0)

    return score > result.score ? { element, score } : result
  }, { element: defaultDamageCalcState.element, score: Number.NEGATIVE_INFINITY })

  return best.element
}

function resolveElementName(
  source: string | null,
  stats: Record<string, number>,
  mode: "damage" | "pen",
): string {
  if (source && isDynamicElementSource(source)) {
    return resolveHighestElement(stats, source, mode)
  }

  return source ?? (mode === "pen" ? defaultDamageCalcState.penElement : defaultDamageCalcState.element)
}

function buildPresetNote(
  preset: RawAttackPreset,
  resolvedElement: string,
  resolvedPenElement: string,
): string | null {
  const parts: string[] = []

  if (preset.isThreatOnly) {
    parts.push("Threat-only preset")
  }

  if (preset.damageType && preset.damageType !== resolvedElement) {
    parts.push(`Damage: ${preset.damageType}`)
  }

  if (preset.element && isDynamicElementSource(preset.element)) {
    parts.push(`Scale: ${resolvedElement} (${preset.element})`)
  } else if (preset.element && preset.damageType && preset.element !== preset.damageType) {
    parts.push(`Scale: ${resolvedElement}`)
  }

  if (preset.penElement && isDynamicElementSource(preset.penElement)) {
    parts.push(`Pen: ${resolvedPenElement} (${preset.penElement})`)
  } else if (preset.penElement && preset.penElement !== resolvedElement) {
    parts.push(`Pen: ${resolvedPenElement}`)
  }

  return parts.length > 0 ? parts.join(" · ") : null
}

const rawAttackPresets: RawAttackPreset[] = Object.entries(skill_data)
  .filter(([, skill]) => skill.type?.is_attack && skill.dmg_stats && Object.keys(skill.dmg_stats).length > 0)
  .map(([name, skill]) => {
    const dmg = skill.dmg_stats ?? {}
    const isThreatOnly = !dmg.dmg_element && /\bthreat\b/i.test(skill.description) && !/\bdeals?\b/i.test(skill.description)

    return {
      name,
      description: skill.description,
      damageType: normalizeElementName(dmg.dmg_element),
      element: normalizeElementName(dmg.element ?? dmg.dmg_element),
      penElement: normalizeElementName(dmg.pen_element ?? dmg.dmg_element ?? dmg.element),
      mainStat: normalizeMainStatName(dmg.stat),
      secondStat: normalizeMainStatName(dmg.stat2),
      skillType: normalizeSkillTypeName(dmg.skill_type),
      inputs: {
        skillDmg: isThreatOnly ? 0 : toSkillPercent(dmg.ratio),
        skillCritDmg:
          typeof dmg.crit_dmg === "number" && Number.isFinite(dmg.crit_dmg)
            ? toPercentValue(dmg.crit_dmg)
            : defaultDamageCalcInputs.skillCritDmg,
        skillPen: toPercentValue(dmg.skill_pen),
        skillCritChance: toPercentValue(dmg.crit_chance),
        threatDef: isThreatOnly ? toSkillPercent(dmg.ratio) : toSkillPercent(dmg.threat),
        armorIgnore: toPercentValue(dmg.armor_ignore ?? dmg.armor_break),
        resIgnore: toPercentValue(dmg.res_ignore),
        dot: toPercentValue(dmg.dot),
        secondSkillDmg: isThreatOnly ? 0 : toSkillPercent(dmg.ratio2),
      },
      isThreatOnly,
    }
  })
  .sort((left, right) => left.name.localeCompare(right.name))

export function getDamageCalcAttackPresets(stats: Record<string, number>): DamageCalcAttackPreset[] {
  return rawAttackPresets.map((preset) => {
    const resolvedElement = resolveElementName(preset.element, stats, "damage")
    const resolvedPenElement = resolveElementName(preset.penElement, stats, "pen")

    return {
      name: preset.name,
      description: preset.description,
      note: buildPresetNote(preset, resolvedElement, resolvedPenElement),
      mainStat: preset.mainStat ?? defaultDamageCalcState.mainStat,
      secondStat: preset.secondStat ?? defaultDamageCalcState.secondStat,
      element: resolvedElement,
      penElement: resolvedPenElement,
      skillType: preset.skillType ?? defaultDamageCalcState.skillType,
      inputs: preset.inputs,
    }
  })
}
