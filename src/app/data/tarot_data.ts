import { StatNames } from "./stat_data"

export type Tarot = {
    tier: number
    is_active?: boolean | false
    skill_name: string
    skill_data?: {
        is_buff: boolean
        is_attack: boolean
        free_turn: boolean
    }
    description: string
    stat_bonus: StatNames
    stat_base: number
    stat_scale: number


    stats?: Partial<Record<StatNames, number>>
    stack_stats?: Partial<Record<StatNames, number>>
    conversions?: Array<{
        source: StatNames
        ratio: number
        resulting_stat: StatNames
    }>
    stack_conversions?: Array<{
        source: StatNames
        ratio: number
        resulting_stat: StatNames
    }>
    dmg_stats?:{
        dmg_element: string // This is the actual dmg it deals
        element: string // Scales on this
        pen_element: string // Scales on this
        stat: string
        ratio: number
        stat2: string
        ratio2: number 
        skill_type: string
        skill_pen: number
        armor_ignore: number
        crit_chance: number
        crit_dmg: number
        threat: number
        dot: number
        armor_break: number
    }
}

const tarot_data: Record<string, Tarot> = {
    "The Eclipse": {
        tier: 5,
        is_active: true,
        skill_name: "Goal of all Life is Death",
        skill_data: {
            is_buff: true,
            is_attack: false,
            free_turn: true
        },
        description: "[ ⧖, 1 Charge ] Raise self Negative Pen by 100% and lower self Elenegative by 90%. 100% of Negative DMG is inflicted as DOT. Lasts 1 Turn.",
        stat_bonus: "Neg Pen%",
        stat_base: 5,
        stat_scale: 1,
        stats: {
          "Neg DOT%": 100
        },
        conversions: [
            { source: "Neg Pen%", ratio: 1, resulting_stat: "Neg Pen%" },
            { source: "Neg%", ratio: -0.9, resulting_stat: "Neg%" },
        ],  
    },
    "Arbiter of Eternity (Death)": {
        tier: 5,
        skill_name: "Circle of Death",
        description: "Increase self Elenegative by 10% and 5% of Negative DMG inflicted as DOT for next hit. Activates (Circle of Life) after. Gain HP Regen equal to 4% Max HP for 5 Turns. Loop",
        stat_bonus: "Neg Pen%",
        stat_base: 5,
        stat_scale: 1,
        stats: {
            "Neg DOT%": 5
        },
        conversions: [
            { source: "Neg%", ratio: 0.1, resulting_stat: "Neg%"}
        ]
    },
    "Arbiter of Eternity (Life)": {
        tier: 5,
        skill_name: "Circle of Life",
        description: "Gain HP Regen equal to 4% Max HP for 5 Turns. Loop. Activates (Circle of Death) after",
        stat_bonus: "Neg Pen%",
        stat_base: 5,
        stat_scale: 1,
        conversions: [
            { source: "HP", ratio: 0.04, resulting_stat: "HP Regen"}
        ]
    },
    "Cyclone Flail Princess": {
        tier: 5,
        skill_name: "Cyclone Momentum",
        description: "Increase self Elehammer by 10% per turn up to a cap of 150%.",
        stat_bonus: "Blunt Pen%",
        stat_base: 5,
        stat_scale: 1,
        stack_stats: {
            "Hammer%": 10
        }
    },
    "Fortress Casters": {
        tier: 3,
        skill_name: "Prepared Caster",
        description: "Start with extra HP equal to 8% MATK",
        stat_bonus: "MATK%",
        stat_base: 8,
        stat_scale: 1,
        conversions: [
            { source: "MATK", ratio: 0.08, resulting_stat: "HP"}
        ]
    }
}

export default tarot_data;