import { StatNames } from "../data/stat_data"

// export type Tarot = {
//     tier: string
//     is_active: boolean
//     skill_name: string
//     description: string
//     stat: StatNames
//     stat_base: number
//     stat_scaling: number
//     stack_conversions: Array<{
//         source: StatNames
//         ratio: number
//         resulting_stat: StatNames
//     }>
// }

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
    }    
}

export default tarot_data;