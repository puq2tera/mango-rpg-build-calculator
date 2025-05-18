import { StatNames } from "../data/stat_data"

export type Skill = {
    category: string
    type: {
        is_buff: boolean
        is_attack: boolean
        self_cast: boolean
        free_turn: boolean
    }
    PreReq: Array<string>
    Tag: string
    BlockedTag: string
    sp: number
    gold: number
    exp: number
    sp_spent: number
    class_levels: {
        tank_levels: number
        warrior_levels: number
        caster_levels: number
        healer_levels: number
    }
    description: string
    stats: Partial<Record<StatNames, number>>
    stack_stats: Partial<Record<StatNames, number>>
    conversions: Array<{
        source: StatNames
        ratio: number
        resulting_stat: StatNames
    }>
    stack_conversions: Array<{
        source: StatNames
        ratio: number
        resulting_stat: StatNames
    }>
    dmg_stats:{
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

const defaultDmgStats = {
    dmg_element: "",
    element: "",
    pen_element: "",
    stat: "",
    ratio: 0,
    stat2: "",
    ratio2: 0,
    skill_type: "",
    skill_pen: 0,
    armor_ignore: 0,
    crit_chance: 0,
    crit_dmg: 0,
    threat: 0,
    dot: 0,
    armor_break: 0
}

const defaultSkill = {
    category: "",
    type: {
        is_buff: false,
        is_attack: false,
        self_cast: false,
        free_turn: false,
    },
    PreReq: [],
    Tag: "",
    BlockedTag: "",
    sp: 0,
    gold: 0,
    exp: 0,
    sp_spent: 0,
    class_levels: {
        tank_levels: 0,
        warrior_levels: 0,
        caster_levels: 0,
        healer_levels: 0,
    },
    description: "",
    stats: {},
    stack_stats: {},
    conversions: [],
    stack_conversions: [],
    dmg_stats:{...defaultDmgStats}
}
  

function computeColumnWidths(data: Record<string, Skill>): string[] {
    console.log("Computing talent_data column widths")
    const headers = [
        "Name", "PreReq", "Tag", "BlockedTag",
        "Gold", "Exp", "SP", "Lvl",
        "Tank", "Warrior", "Caster", "Healer",
        "Self", "Description"
    ]
    const longest = headers.map(h => h.length)

    for (const [name, t] of Object.entries(data)) {
        const values = [
            name,
            Array.isArray(t.PreReq) ? t.PreReq.join(", ") : t.PreReq,
            t.Tag,
            t.BlockedTag,
            String(t.gold),
            String(t.exp),
            String(t.sp_spent),
            String(t.class_levels.tank_levels),
            String(t.class_levels.warrior_levels),
            String(t.class_levels.caster_levels),
            String(t.class_levels.healer_levels),
            t.description
        ]
        values.forEach((v, i) => {
            longest[i] = Math.max(longest[i], v.length)
        })
    }

    return longest.map(chLen => `${Math.ceil(chLen * 8 + 32)}px`)
}


const skill_data: Record<string, Skill> = {
    "Focus": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        PreReq: ["Default Skill"],
        description: "[ ⧖ ] Heal self for 5% of Max HP and regain 10% of Max Focus. Increase Focus Regen by 15% of Focus Cap for 1 Turn.",
        conversions: [
            { source: "Focus", ratio: 0.1, resulting_stat: "Focus" },
            { source: "Focus Regen", ratio: 0.15, resulting_stat: "Focus" },
        ],     
},
"Heckle": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: true,
            self_cast: false,
            free_turn: true
        },
        sp: 1,
        gold: 25,
        exp: 25,
        class_levels: {
            tank_levels: 1,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖ ] Inflicts 360% DEF Threat, +10% Crit Damage, +50% Threat for 1 Turn",
        stats: {
    "Threat%": 0.5,
    },
        dmg_stats: {...defaultDmgStats,    stat: "DEF",     ratio: 3.6, }
},
"Taunt": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: true,
            self_cast: false,
            free_turn: true
        },
        sp: 1,
        gold: 100,
        exp: 100,
        sp_spent: 2,
        class_levels: {
            tank_levels: 10,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖ ] Inflicts 150% DEF Threat per Enemy, +50% Threat for 1 Turn",
        stats: {
    "Threat%": 0.5,
    },
        dmg_stats: {...defaultDmgStats,    stat: "DEF",     ratio: 1.5, }
},
"Insult": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: true,
            self_cast: false,
            free_turn: true
        },
        sp: 1,
        gold: 100,
        exp: 100,
        sp_spent: 2,
        class_levels: {
            tank_levels: 10,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖ ] Inflicts 400% DEF Threat, +50% Threat for 1 Turn",
        stats: {
    "Threat%": 0.5,
    },
        dmg_stats: {...defaultDmgStats,    stat: "DEF",     ratio: 4, }
},
"Challenge": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: true,
            self_cast: false,
            free_turn: true
        },
        sp: 1,
        gold: 100,
        exp: 100,
        sp_spent: 2,
        class_levels: {
            tank_levels: 10,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, 2 Charges ] Inflicts 1200% DEF Threat, +50% Threat for 1 Turn",
        conversions: [
    { source: "DEF", ratio: 0.4, resulting_stat: "DEF" },
    ],
        dmg_stats: {...defaultDmgStats,    stat: "DEF",     ratio: 12, }
},
"MA Lesser Fortress": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 1,
        gold: 100,
        exp: 100,
        sp_spent: 2,
        class_levels: {
            tank_levels: 10,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, 2 Charges ] Raises self DEF by 40% for 1 Turn, 1 MP",
        
},
"MA Fortitude": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        sp: 1,
        gold: 100,
        exp: 100,
        sp_spent: 2,
        class_levels: {
            tank_levels: 10,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ 1 Charge ] Increase self DEF by 10% for 8 Turns, 1 MP",
        conversions: [
    { source: "DEF", ratio: 0.1, resulting_stat: "DEF" },
    ],
        
},
"MA Resist Fire": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 1,
        gold: 100,
        exp: 100,
        sp_spent: 2,
        class_levels: {
            tank_levels: 10,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, 2 Charges ] Increase self Fire Resist by 125% for 3 Turns, 1 MP",
        stats: {
    "Fire Res%": 1.25,
    },
        
},
"MA Resist Water": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 1,
        gold: 100,
        exp: 100,
        sp_spent: 2,
        class_levels: {
            tank_levels: 10,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, 2 Charges ] Increase self Water Resist by 125% for 3 Turns, 1 MP",
        stats: {
    "Water Res%": 1.25,
    },
        
},
"MA Resist Earth": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 1,
        gold: 100,
        exp: 100,
        sp_spent: 2,
        class_levels: {
            tank_levels: 10,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, 2 Charges ] Increase self Earth Resist by 125% for 3 Turns, 1 MP",
        stats: {
    "Earth Res%": 1.25,
    },
        
},
"MA Resist Lightning": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 1,
        gold: 100,
        exp: 100,
        sp_spent: 2,
        class_levels: {
            tank_levels: 10,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, 2 Charges ] Increase self Lightning Resist by 125% for 3 Turns, 1 MP",
        stats: {
    "Lightning Res%": 1.25,
    },
        
},
"MA Resist Wind": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 1,
        gold: 100,
        exp: 100,
        sp_spent: 2,
        class_levels: {
            tank_levels: 10,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, 2 Charges ] Increase self Wind Resist by 125% for 3 Turns, 1 MP",
        stats: {
    "Wind Res%": 1.25,
    },
        
},
"Call of Respite": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 1,
        gold: 100,
        exp: 100,
        sp_spent: 2,
        class_levels: {
            tank_levels: 10,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, 3 Charges ] Remove 50% of target ally threat value",
        
},
"Guardian Shield": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 2,
        gold: 100,
        exp: 800,
        sp_spent: 6,
        class_levels: {
            tank_levels: 20,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, 1 Charge ] Increase Team DEF by 30% Self DEF for 1 Turn",
        conversions: [
    { source: "DEF", ratio: 0.3, resulting_stat: "DEF" },
    ],
        
},
"Blasphemy": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: true,
            self_cast: false,
            free_turn: true
        },
        sp: 1,
        gold: 100,
        exp: 800,
        sp_spent: 6,
        class_levels: {
            tank_levels: 20,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, 2 Charges ] Inflicts 1450% DEF Threat, +50% Threat for 1 Turn",
        stats: {
    "Threat%": 0.5,
    },
        dmg_stats: {...defaultDmgStats,    stat: "DEF",     ratio: 14.5, }
},
"Cry of Mockery": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: true,
            self_cast: false,
            free_turn: true
        },
        sp: 1,
        gold: 100,
        exp: 800,
        sp_spent: 6,
        class_levels: {
            tank_levels: 20,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, 3 Charges ] Inflicts 300% DEF Threat per Enemy, +50% Threat for 1 Turn",
        stats: {
    "Threat%": 0.5,
    },
        dmg_stats: {...defaultDmgStats,    stat: "DEF",     ratio: 3, }
},
"Martyr Block": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        sp: 2,
        gold: 100,
        exp: 800,
        sp_spent: 6,
        class_levels: {
            tank_levels: 20,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ 1 Charge ] Raise Ally Def by 100% DEF, Lose 100% DEF, for 2 Turns",
        conversions: [
    { source: "DEF", ratio: -1, resulting_stat: "DEF" },
    ],
        
},
"MA Fortress": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 2,
        gold: 100,
        exp: 800,
        sp_spent: 6,
        class_levels: {
            tank_levels: 20,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, 2 Charges ] Raises self DEF by 60% for 1 Turn, 2 MP",
        conversions: [
    { source: "DEF", ratio: 0.6, resulting_stat: "DEF" },
    ],
        
},
"MA Dull Pain": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 2,
        gold: 100,
        exp: 800,
        sp_spent: 6,
        class_levels: {
            tank_levels: 20,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, 1 Charge ] Receive Temporary HP to 100% DEF for 2 Turns, 2 MP",
        conversions: [
    { source: "DEF", ratio: 1, resulting_stat: "Temp HP" },
    ],
        
},
"Recoil Sunder": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: true,
            self_cast: false,
            free_turn: false
        },
        sp: 2,
        gold: 100,
        exp: 800,
        sp_spent: 6,
        class_levels: {
            tank_levels: 20,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ Blunt, 2 Charges ] Deals 150% DEF DMG, Breaks 55% Armor, -25% DEF for 2 Turns",
        conversions: [
    { source: "DEF", ratio: -0.25, resulting_stat: "DEF" },
    ],
        dmg_stats: {...defaultDmgStats,    dmg_element: "Blunt",     element: "Blunt",     pen_element: "Blunt",     stat: "DEF",     ratio: 1.5, }
},
"MA Counter": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 2,
        gold: 100,
        exp: 800,
        sp_spent: 6,
        class_levels: {
            tank_levels: 20,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖ ] Increase self ATK by 30% DEF for 2 Turns, 2 MP",
        conversions: [
    { source: "DEF", ratio: 0.3, resulting_stat: "ATK" },
    ],
        
},
"Provoke": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: true,
            self_cast: false,
            free_turn: true
        },
        sp: 2,
        gold: 100,
        exp: 800,
        sp_spent: 6,
        class_levels: {
            tank_levels: 20,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖ ] Inflicts 350% DEF Threat, +100% Crit Chance",
        dmg_stats: {...defaultDmgStats,    stat: "DEF",     ratio: 3.5, }
},
"Focus Break": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 2,
        gold: 100,
        exp: 800,
        sp_spent: 6,
        class_levels: {
            tank_levels: 20,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, 2 Charges ] Remove 75% of target ally threat value",
        
},
"Heroic Block": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: true,
            free_turn: true
        },
        PreReq: ["Shield Hero"],
        sp: 2,
        gold: 150,
        exp: 1800,
        sp_spent: 8,
        class_levels: {
            tank_levels: 30,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, 9 Charges ] Raise Ally DEF by 125% DEF for 1 Turn",
        conversions: [
    { source: "DEF", ratio: 1.25, resulting_stat: "DEF" },
    ],
        
},
"Prismatic Shield": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: true,
            free_turn: false
        },
        PreReq: ["Prismatic Hero"],
        sp: 2,
        gold: 150,
        exp: 1800,
        sp_spent: 8,
        class_levels: {
            tank_levels: 30,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ 2 Charge ] Give ally Temporary HP for 200% DEF for 2 Turns",
        conversions: [
    { source: "DEF", ratio: 2, resulting_stat: "Temp HP" },
    ],
        
},
"War Cry": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        PreReq: ["War Hero"],
        sp: 2,
        gold: 150,
        exp: 1800,
        sp_spent: 8,
        class_levels: {
            tank_levels: 30,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, 1 Charge ] Raise Team ATK by 25% DEF for 8 Turns",
        conversions: [
    { source: "DEF", ratio: 0.25, resulting_stat: "ATK" },
    ],
        
},
"Draw Hatred": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: true,
            self_cast: false,
            free_turn: true
        },
        sp: 2,
        gold: 200,
        exp: 2500,
        sp_spent: 14,
        class_levels: {
            tank_levels: 40,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, 5 Charges ] Inflicts 1000% DEF Threat, +50% Threat for 1 Turn",
        stats: {
    "Threat%": 0.5,
    },
        dmg_stats: {...defaultDmgStats,    stat: "DEF",     ratio: 10, }
},
"MA Invulnerable": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 2,
        gold: 200,
        exp: 2500,
        sp_spent: 14,
        class_levels: {
            tank_levels: 40,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, 2 Charges ] Raises self DEF by 100% for 1 Turn, 3 MP",
        conversions: [
    { source: "DEF", ratio: 1, resulting_stat: "DEF" },
    ],
        
},
"Custodian Barrier": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 2,
        gold: 200,
        exp: 2500,
        sp_spent: 14,
        class_levels: {
            tank_levels: 40,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, 2 Charges ] Increase Team DEF by 35% Self DEF for 1 Turn",
        conversions: [
    { source: "DEF", ratio: 0.35, resulting_stat: "DEF" },
    ],
        
},
"MA Fire Guard": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: true,
            free_turn: true
        },
        sp: 1,
        gold: 100,
        exp: 1250,
        sp_spent: 14,
        class_levels: {
            tank_levels: 40,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, 2 Charges ] Increase target Fire Resist by 100% for 3 Turns, 3 MP",
        stats: {
    "Fire Res%": 1,
    },
        
},
"MA Water Guard": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: true,
            free_turn: true
        },
        sp: 1,
        gold: 100,
        exp: 1250,
        sp_spent: 14,
        class_levels: {
            tank_levels: 40,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, 2 Charges ] Increase target Water Resist by 100% for 3 Turns, 3 MP",
        stats: {
    "Water Res%": 1,
    },
        
},
"MA Earth Guard": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: true,
            free_turn: true
        },
        sp: 1,
        gold: 100,
        exp: 1250,
        sp_spent: 14,
        class_levels: {
            tank_levels: 40,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, 2 Charges ] Increase target Earth Resist by 100% for 3 Turns, 3 MP",
        stats: {
    "Earth Res%": 1,
    },
        
},
"MA Lightning Guard": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: true,
            free_turn: true
        },
        sp: 1,
        gold: 100,
        exp: 1250,
        sp_spent: 14,
        class_levels: {
            tank_levels: 40,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, 2 Charges ] Increase target Lightning Resist by 100% for 3 Turns, 3 MP",
        stats: {
    "Lightning Res%": 1,
    },
        
},
"MA Wind Guard": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: true,
            free_turn: true
        },
        sp: 1,
        gold: 100,
        exp: 1250,
        sp_spent: 14,
        class_levels: {
            tank_levels: 40,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, 2 Charges ] Increase target Wind Resist by 100% for 3 Turns, 3 MP",
        stats: {
    "Wind Res%": 1,
    },
        
},
"MA Endurance": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 1,
        gold: 100,
        exp: 1250,
        sp_spent: 14,
        class_levels: {
            tank_levels: 40,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, 1 Charge ] Increase self Max HP by 25% but gain a 40% DMG Penalty for rest of the battle.",
        stats: {
    "Dmg%": -0.4,
    },
        conversions: [
    { source: "HP", ratio: 0.25, resulting_stat: "HP" },
    ],
        
},
"Instant Counter": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        sp: 2,
        gold: 200,
        exp: 2500,
        sp_spent: 14,
        class_levels: {
            tank_levels: 40,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ 2 Charges ] Increase self ATK by 35% DEF for 2 Turns",
        conversions: [
    { source: "DEF", ratio: 0.35, resulting_stat: "ATK" },
    ],
        
},
"Ignore Pain": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 2,
        gold: 200,
        exp: 2500,
        sp_spent: 14,
        class_levels: {
            tank_levels: 40,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, 1 Charge ] Gain Temporary HP by 100% DEF for 1 Turn",
        conversions: [
    { source: "DEF", ratio: 1, resulting_stat: "Temp HP" },
    ],
        
},
"Unyielding Life": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        PreReq: ["Paragon of Life"],
        sp: 2,
        gold: 225,
        exp: 3200,
        sp_spent: 16,
        class_levels: {
            tank_levels: 50,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ 2 Charges ] Heal self by 80% of your max health. Increase your HP Regen by 50% for 3 turns.",
        conversions: [
    { source: "HP Regen", ratio: 0.5, resulting_stat: "HP Regen" },
    ],
        
},
"Unyielding Fury": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        PreReq: ["Paragon of War"],
        sp: 2,
        gold: 225,
        exp: 3200,
        sp_spent: 16,
        class_levels: {
            tank_levels: 50,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, 1 Charge ] Raise self ATK by 60% DEF, lose 30% DEF, for rest of battle",
        conversions: [
    { source: "DEF", ratio: 0.6, resulting_stat: "ATK" },
    { source: "DEF", ratio: -0.3, resulting_stat: "DEF" },
    ],
        
},
"Unyielding Will": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: true,
            free_turn: true
        },
        PreReq: ["Paragon of Courage"],
        sp: 2,
        gold: 225,
        exp: 3200,
        sp_spent: 16,
        class_levels: {
            tank_levels: 50,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, 2 Charges ] Raise target max health by 5% DEF for the rest of the battle",
        conversions: [
    { source: "DEF", ratio: 0.05, resulting_stat: "HP" },
    ],
        
},
"Word of Hatred": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: true,
            self_cast: false,
            free_turn: true
        },
        sp: 3,
        gold: 250,
        exp: 4000,
        sp_spent: 22,
        class_levels: {
            tank_levels: 70,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, 4 Charges ] Inflicts 1100% DEF Threat, +50% Threat for 1 Turn",
        stats: {
    "Threat%": 0.5,
    },
        dmg_stats: {...defaultDmgStats,    stat: "DEF",     ratio: 11, }
},
"Curse of Hatred": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: true,
            self_cast: false,
            free_turn: true
        },
        sp: 3,
        gold: 250,
        exp: 4000,
        sp_spent: 22,
        class_levels: {
            tank_levels: 70,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, 2 Charges ] Inflicts 425% DEF Threat per Enemy, +50% Threat for 1 Turn",
        stats: {
    "Threat%": 0.5,
    },
        dmg_stats: {...defaultDmgStats,    stat: "DEF",     ratio: 4.25, }
},
"Intimidation": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 3,
        gold: 250,
        exp: 4000,
        sp_spent: 22,
        class_levels: {
            tank_levels: 70,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, 1 Charge ] Raise threat generated by self by 30% for 10 Turns",
        stats: {
    "Threat%": 0.3,
    },
        
},
"Guardian Draw": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: true,
            free_turn: true
        },
        sp: 3,
        gold: 250,
        exp: 4000,
        sp_spent: 22,
        class_levels: {
            tank_levels: 70,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, 1 Charge ] Reduce threat generated by target ally by 25% for 5 Turns",
        stats: {
    "Threat%": -0.25,
    },
        
},
"MA Fire Barrier": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: true,
            free_turn: true
        },
        sp: 2,
        gold: 150,
        exp: 2500,
        sp_spent: 22,
        class_levels: {
            tank_levels: 70,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, 1 Charge ] Increase target Fire Resist by 150% for 1 Turn, 4 MP",
        stats: {
    "Fire Res%": 1.5,
    },
        
},
"MA Water Barrier": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: true,
            free_turn: true
        },
        sp: 2,
        gold: 150,
        exp: 2500,
        sp_spent: 22,
        class_levels: {
            tank_levels: 70,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, 1 Charge ] Increase target Water Resist by 150% for 1 Turn, 4 MP",
        stats: {
    "Water Res%": 1.5,
    },
        
},
"MA Earth Barrier": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: true,
            free_turn: true
        },
        sp: 2,
        gold: 150,
        exp: 2500,
        sp_spent: 22,
        class_levels: {
            tank_levels: 70,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, 1 Charge ] Increase target Earth Resist by 150% for 1 Turn, 4 MP",
        stats: {
    "Earth Res%": 1.5,
    },
        
},
"MA Lightning Barrier": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: true,
            free_turn: true
        },
        sp: 2,
        gold: 150,
        exp: 2500,
        sp_spent: 22,
        class_levels: {
            tank_levels: 70,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, 1 Charge ] Increase target Lightning Resist by 150% for 1 Turn, 4 MP",
        stats: {
    "Lightning Res%": 1.5,
    },
        
},
"MA Wind Barrier": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: true,
            free_turn: true
        },
        sp: 2,
        gold: 150,
        exp: 2500,
        sp_spent: 22,
        class_levels: {
            tank_levels: 70,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, 1 Charge ] Increase target Wind Resist by 150% for 1 Turn, 4 MP",
        stats: {
    "Wind Res%": 1.5,
    },
        
},
"Momentum Counter": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 3,
        gold: 250,
        exp: 4000,
        sp_spent: 22,
        class_levels: {
            tank_levels: 70,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, 2 Charges ] Increase self ATK by 60% DEF for 2 Turns",
        conversions: [
    { source: "DEF", ratio: 0.6, resulting_stat: "ATK" },
    ],
        
},
"Body Block": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        sp: 3,
        gold: 250,
        exp: 4000,
        sp_spent: 22,
        class_levels: {
            tank_levels: 70,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ 1 Charge ] Give target Ally overheal by 150% DEF, lose 75% of your current HP",
        conversions: [
    { source: "DEF", ratio: 1.5, resulting_stat: "Temp HP" },
    ],
        
},
"Smith God's Blessing": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: true,
            free_turn: false
        },
        PreReq: ["Mark of Hephaestus"],
        sp: 3,
        gold: 300,
        exp: 5000,
        sp_spent: 26,
        class_levels: {
            tank_levels: 85,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "Give target ally DEF equal to 60% self DEF for 2 Turns. 8 MP",
        conversions: [
    { source: "DEF", ratio: 0.6, resulting_stat: "DEF" },
    ],
        
},
"War God's Blessing": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: true,
            free_turn: false
        },
        PreReq: ["Mark of Ares"],
        sp: 3,
        gold: 300,
        exp: 5000,
        sp_spent: 26,
        class_levels: {
            tank_levels: 85,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "Give target ally ATK equal to 20% self DEF for 9 Turns. 15 MP",
        conversions: [
    { source: "DEF", ratio: 0.2, resulting_stat: "ATK" },
    ],
        
},
"Valor God's Blessing": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: true,
            free_turn: false
        },
        PreReq: ["Mark of Athena"],
        sp: 3,
        gold: 300,
        exp: 5000,
        sp_spent: 26,
        class_levels: {
            tank_levels: 85,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "Give target ally HP Regen per turn equal to 8% of your Max HP for 5 Turns. 8 MP",
        conversions: [
    { source: "HP", ratio: 0.08, resulting_stat: "HP Regen" },
    ],
        
},
"Killing Intent": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: true,
            self_cast: false,
            free_turn: true
        },
        PreReq: ["DeathGodBlessing"],
        sp: 3,
        gold: 350,
        exp: 6000,
        sp_spent: 48,
        class_levels: {
            tank_levels: 100,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, 3 Charges ] Inflicts 2000% DEF Threat, +50% Threat for 1 Turn",
        stats: {
    "Threat%": 0.5,
    },
        dmg_stats: {...defaultDmgStats,    stat: "DEF",     ratio: 20, }
},
"Murderous Aura": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: true,
            self_cast: false,
            free_turn: true
        },
        PreReq: ["DeathGodBlessing"],
        sp: 3,
        gold: 350,
        exp: 6000,
        sp_spent: 48,
        class_levels: {
            tank_levels: 100,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, 1 Charge ] Inflicts 800% DEF Threat per Enemy, +50% Threat for 1 Turn",
        stats: {
    "Threat%": 0.5,
    },
        dmg_stats: {...defaultDmgStats,    stat: "DEF",     ratio: 8, }
},
"Terror Strike": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: true,
            self_cast: false,
            free_turn: false
        },
        PreReq: ["DeathGodBlessing"],
        sp: 3,
        gold: 350,
        exp: 6000,
        sp_spent: 48,
        class_levels: {
            tank_levels: 100,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ Void, 2 Charges ] Deals 750% DEF DMG, Breaks 70% Armor, -30% DEF for 3 Turns",
        conversions: [
    { source: "DEF", ratio: -0.3, resulting_stat: "DEF" },
    ],
        dmg_stats: {...defaultDmgStats,    dmg_element: "Void",     element: "Void",     pen_element: "Void",     stat: "DEF",     ratio: 7.5, }
},
"Wall of Jericho": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        PreReq: ["DeathGodBlessing"],
        sp: 3,
        gold: 350,
        exp: 6000,
        sp_spent: 48,
        class_levels: {
            tank_levels: 100,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ 4 Charges ] Increase party DEF by 100% self DEF for 1 Turn",
        conversions: [
    { source: "DEF", ratio: 1, resulting_stat: "DEF" },
    ],
        
},
"Aura of Defense": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        PreReq: ["DeathGodBlessing"],
        sp: 3,
        gold: 350,
        exp: 6000,
        sp_spent: 48,
        class_levels: {
            tank_levels: 100,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, 1 Charge ] Increase party DEF by 5% self DEF for rest of battle, costs 24% current MP",
        conversions: [
    { source: "DEF", ratio: 0.05, resulting_stat: "DEF" },
    { source: "MP", ratio: -0.24, resulting_stat: "MP" },
    ],
        
},
"MA Fire Fortress": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        PreReq: ["DeathGodBlessing"],
        sp: 2,
        gold: 200,
        exp: 4000,
        sp_spent: 48,
        class_levels: {
            tank_levels: 100,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, 1 Charge ] Increase party Fire Resist by 100% for 2 Turns, 15 MP",
        stats: {
    "Fire Res%": 1,
    },
        
},
"MA Water Fortress": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        PreReq: ["DeathGodBlessing"],
        sp: 2,
        gold: 200,
        exp: 4000,
        sp_spent: 48,
        class_levels: {
            tank_levels: 100,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, 1 Charge ] Increase party Water Resist by 100% for 2 Turns, 15 MP",
        stats: {
    "Water Res%": 1,
    },
        
},
"MA Earth Fortress": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        PreReq: ["DeathGodBlessing"],
        sp: 2,
        gold: 200,
        exp: 4000,
        sp_spent: 48,
        class_levels: {
            tank_levels: 100,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, 1 Charge ] Increase party Earth Resist by 100% for 2 Turns, 15 MP",
        stats: {
    "Earth Res%": 1,
    },
        
},
"MA Lightning Fortress": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        PreReq: ["DeathGodBlessing"],
        sp: 2,
        gold: 200,
        exp: 4000,
        sp_spent: 48,
        class_levels: {
            tank_levels: 100,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, 1 Charge ] Increase party Lightning Resist by 100% for 2 Turns, 15 MP",
        stats: {
    "Lightning Res%": 1,
    },
        
},
"MA Wind Fortress": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        PreReq: ["DeathGodBlessing"],
        sp: 2,
        gold: 200,
        exp: 4000,
        sp_spent: 48,
        class_levels: {
            tank_levels: 100,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, 1 Charge ] Increase party Wind Resist by 100% for 2 Turns, 15 MP",
        stats: {
    "Wind Res%": 1,
    },
        
},
"Victim's Aegis": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        PreReq: ["DeathGodBlessing"],
        sp: 3,
        gold: 600,
        exp: 8000,
        sp_spent: 70,
        class_levels: {
            tank_levels: 150,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ 1 Charge ] Absorb 20% of all damage taken by your team for rest of battle. 50 MP.",
        
},
"Soul Cry": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: true,
            self_cast: false,
            free_turn: false
        },
        PreReq: ["DeathGodBlessing"],
        sp: 3,
        gold: 600,
        exp: 8000,
        sp_spent: 70,
        class_levels: {
            tank_levels: 150,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ Void, 1 Charge ] Deals 1200% DEF AOE, cap 350% per Target, Breaks 50% Armor, -35% DEF for 3 Turns",
        conversions: [
    { source: "DEF", ratio: -0.35, resulting_stat: "DEF" },
    ],
        dmg_stats: {...defaultDmgStats,    dmg_element: "Void",     element: "Void",     pen_element: "Void",     stat: "DEF",     ratio: 3.5, }
},
"Martyr's Revenge": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        PreReq: ["DeathGodBlessing"],
        sp: 3,
        gold: 600,
        exp: 8000,
        sp_spent: 70,
        class_levels: {
            tank_levels: 150,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖ ] Debuff enemy Divine Resist by 20%, 12 MP",
        stats: {
    "Divine Pen%": 0.2,
    },
        
},
"Undying Soul": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        PreReq: ["DeathGodBlessing"],
        sp: 3,
        gold: 600,
        exp: 8000,
        sp_spent: 70,
        class_levels: {
            tank_levels: 150,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, 1 Charge ] Increase self Max HP by 60% but gain a 55% DMG Penalty for rest of the battle.",
        stats: {
    "Dmg%": -0.55,
    },
        conversions: [
    { source: "HP", ratio: 0.6, resulting_stat: "HP" },
    ],
        
},
"Soul Blasphemy": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: true,
            self_cast: false,
            free_turn: true
        },
        PreReq: ["DeathGodBlessing"],
        sp: 3,
        gold: 600,
        exp: 8000,
        sp_spent: 70,
        class_levels: {
            tank_levels: 150,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, 1 Charge ] Inflicts 5000% DEF Threat, Gain Temp HP equal to 50% of Max HP for 2 turns.",
        conversions: [
    { source: "HP", ratio: 0.5, resulting_stat: "Temp HP" },
    ],
        dmg_stats: {...defaultDmgStats,    stat: "DEF",     ratio: 50, }
},
"Immortal Hero": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        PreReq: ["DeathGodBlessing"],
        Tag: "HeroSoul",
        BlockedTag: "HeroSoul",
        sp: 3,
        gold: 600,
        exp: 8000,
        sp_spent: 70,
        class_levels: {
            tank_levels: 150,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ 1 Charge ] Increase self DEF by 15% for the rest of the battle.",
        conversions: [
    { source: "DEF", ratio: 0.15, resulting_stat: "DEF" },
    ],
        
},
"Deathly Shadow": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: true,
            self_cast: false,
            free_turn: true
        },
        PreReq: ["Killing Intent, PrimalEssence"],
        sp: 3,
        gold: 750,
        exp: 10000,
        sp_spent: 75,
        class_levels: {
            tank_levels: 160,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, 2 Charges ] Inflicts 2400% DEF Threat, Breaks 8% Armor, +50% Threat for 1 Turn",
        stats: {
    "Threat%": 0.5,
    },
        dmg_stats: {...defaultDmgStats,    stat: "DEF",     ratio: 24, }
},
"World Quaker": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: true,
            self_cast: false,
            free_turn: true
        },
        PreReq: ["PrimalEssence"],
        sp: 3,
        gold: 750,
        exp: 10000,
        sp_spent: 75,
        class_levels: {
            tank_levels: 160,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, Void, 2 Charges ] Deals 1350% DEF AOE, cap 550% per Target, +50% Threat for 1 Turn",
        stats: {
    "Threat%": 0.5,
    },
        dmg_stats: {...defaultDmgStats,    dmg_element: "Void",     element: "Void",     pen_element: "Void",     stat: "DEF",     ratio: 5.5, }
},
"Atlas Domination": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: true,
            self_cast: false,
            free_turn: true
        },
        PreReq: ["PrimalEssence"],
        sp: 3,
        gold: 750,
        exp: 10000,
        sp_spent: 75,
        class_levels: {
            tank_levels: 160,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, Void, 2 Charges ] Deals 1250% DEF DMG, +50% Threat for 1 Turn",
        stats: {
    "Threat%": 0.5,
    },
        dmg_stats: {...defaultDmgStats,    dmg_element: "Void",     element: "Void",     pen_element: "Void",     stat: "DEF",     ratio: 12.5, }
},
"World Guard": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        PreReq: ["Wall of Jericho, PrimalEssence"],
        sp: 3,
        gold: 750,
        exp: 10000,
        sp_spent: 75,
        class_levels: {
            tank_levels: 160,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖ ] Gain flat +100% All Res for 1 Turn, then flat +10% All Res for 24 turns",
        stats: {
            "All Res%": 0.1,
        }
},
"MA Body Defense 1": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 1,
        gold: 25,
        exp: 25,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 1,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖ ] Increase self DEF by 10% self ATK for 8 Turns, 15/-1 Focus",
        conversions: [
    { source: "ATK", ratio: 0.1, resulting_stat: "DEF" },
    ],
        
},
"Steady Shot": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: true,
            self_cast: false,
            free_turn: true
        },
        sp: 1,
        gold: 100,
        exp: 100,
        sp_spent: 2,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 10,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, Pierce ] Deals 100% ATK DMG, Pens with Void, +10% Crit DMG, Increases self Bow Crit DMG by 15% for 3 Turns, 7 Focus",
        stats: {
    "Bow Crit DMG%": 0.15,
    },
        dmg_stats: {...defaultDmgStats,    dmg_element: "Pierce",     element: "Pierce",     pen_element: "Pierce",     stat: "ATK",     ratio: 1, }
},
"Iron Fist": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: true,
            self_cast: false,
            free_turn: true
        },
        sp: 1,
        gold: 100,
        exp: 100,
        sp_spent: 2,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 10,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, Blunt ] Deals 100% ATK DMG, +10% Crit DMG, Increases self Fist Crit DMG by 15% for 3 Turns, 7 Focus",
        stats: {
    "Fist Crit DMG%": 0.15,
    },
        dmg_stats: {...defaultDmgStats,    dmg_element: "Blunt",     element: "Blunt",     pen_element: "Blunt",     stat: "ATK",     ratio: 1, }
},
"Impaling Strike": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: true,
            self_cast: false,
            free_turn: true
        },
        sp: 1,
        gold: 100,
        exp: 100,
        sp_spent: 2,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 10,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, Pierce ] Deals 110% ATK DMG, Increase self Spear DMG by 15% for 3 Turns, 7 Focus",
        stats: {
    "Spear DMG%": 0.15,
    },
        dmg_stats: {...defaultDmgStats,    dmg_element: "Pierce",     element: "Pierce",     pen_element: "Pierce",     stat: "ATK",     ratio: 1.1, }
},
"Mortal Slash": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: true,
            self_cast: false,
            free_turn: true
        },
        sp: 1,
        gold: 100,
        exp: 100,
        sp_spent: 2,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 10,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, Slash ] Deals 110% ATK DMG, Increase self Sword DMG by 15% for 3 Turns, 7 Focus",
        stats: {
    "Sword DMG%": 0.15,
    },
        dmg_stats: {...defaultDmgStats,    dmg_element: "Slash",     element: "Slash",     pen_element: "Slash",     stat: "ATK",     ratio: 1.1, }
},
"Tremor Strike": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: true,
            self_cast: false,
            free_turn: true
        },
        sp: 1,
        gold: 100,
        exp: 100,
        sp_spent: 2,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 10,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, Blunt ] Deals 110% ATK DMG, Increase self Hammer DMG by 15% for 3 Turns, 7 Focus",
        stats: {
    "Hammer DMG%": 0.15,
    },
        dmg_stats: {...defaultDmgStats,    dmg_element: "Blunt",     element: "Blunt",     pen_element: "Blunt",     stat: "ATK",     ratio: 1.1, }
},
"Backside Sever": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: true,
            self_cast: false,
            free_turn: true
        },
        sp: 1,
        gold: 100,
        exp: 100,
        sp_spent: 2,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 10,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, Slash ] Deals 100% ATK DMG, +10% Crit Damage, Increase self Dagger Crit DMG by 15% for 3 Turns, 7 Focus",
        stats: {
    "Dagger Crit DMG%": 0.15,
    },
        dmg_stats: {...defaultDmgStats,    dmg_element: "Slash",     element: "Slash",     pen_element: "Slash",     stat: "ATK",     ratio: 1, }
},
"Limit Release": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 1,
        gold: 100,
        exp: 100,
        sp_spent: 2,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 10,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, 3 Charges ] Increase self ATK by 50% for 3 Turns, reduce self DEF 75% for 4 Turns",
        conversions: [
    { source: "ATK", ratio: 0.5, resulting_stat: "ATK" },
    { source: "DEF", ratio: -0.75, resulting_stat: "DEF" },
    ],
        
},
"MA Ability Boost": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 1,
        gold: 100,
        exp: 100,
        sp_spent: 2,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 10,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖ ] Increase self ATK by 20% for 7 Turns, 20/-2 Focus",
        conversions: [
    { source: "ATK", ratio: 0.2, resulting_stat: "ATK" },
    ],
        
},
"MA Sense Weakness": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 1,
        gold: 100,
        exp: 100,
        sp_spent: 2,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 10,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖ ] Gain +10% Crit Chance for 6 Turns, 12/-1 Focus",
        stats: {
    "Crit Chance%": 0.1,
    },
        
},
"MA Exploit Weakness": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 1,
        gold: 100,
        exp: 100,
        sp_spent: 2,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 10,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖ ] Gain +40% Crit DMG for 6 Turns, 12/-1 Focus",
        stats: {
    "Crit DMG%": 0.4,
    },
        
},
"MA Recovery": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        sp: 2,
        gold: 100,
        exp: 600,
        sp_spent: 6,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 20,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ 1 Charge ] Heal self for 75% of your max health, 15 Focus",
        
},
"Precision Shot": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: true,
            self_cast: false,
            free_turn: true
        },
        sp: 2,
        gold: 100,
        exp: 600,
        sp_spent: 6,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 20,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, Pierce ] Deals 140% ATK DMG, Pens with Void, +10% Crit DMG, Increases self Bow Crit DMG by 15% for 3 Turns, 8 Focus",
        stats: {
    "Bow Crit DMG%": 0.15,
    },
        dmg_stats: {...defaultDmgStats,    dmg_element: "Pierce",     element: "Pierce",     pen_element: "Pierce",     stat: "ATK",     ratio: 1.4, }
},
"Impact Blows": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: true,
            self_cast: false,
            free_turn: true
        },
        sp: 2,
        gold: 100,
        exp: 600,
        sp_spent: 6,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 20,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, Blunt ] Deals 140% ATK DMG, +10% Crit DMG, Increases self Fist Crit DMG by 15% for 3 Turns, 8 Focus",
        stats: {
    "Fist Crit DMG%": 0.15,
    },
        dmg_stats: {...defaultDmgStats,    dmg_element: "Blunt",     element: "Blunt",     pen_element: "Blunt",     stat: "ATK",     ratio: 1.4, }
},
"Fatal Puncture": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: true,
            self_cast: false,
            free_turn: true
        },
        sp: 2,
        gold: 100,
        exp: 600,
        sp_spent: 6,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 20,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, Pierce ] Deals 155% ATK DMG, Increase self Spear DMG by 15% for 3 Turns, 8 Focus",
        stats: {
    "Spear DMG%": 0.15,
    },
        dmg_stats: {...defaultDmgStats,    dmg_element: "Pierce",     element: "Pierce",     pen_element: "Pierce",     stat: "ATK",     ratio: 1.55, }
},
"Deadly Edge": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: true,
            self_cast: false,
            free_turn: true
        },
        sp: 2,
        gold: 100,
        exp: 600,
        sp_spent: 6,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 20,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, Slash ] Deals 155% ATK DMG, Increase self Sword DMG by 15% for 3 Turns, 8 Focus",
        stats: {
    "Sword DMG%": 0.15,
    },
        dmg_stats: {...defaultDmgStats,    dmg_element: "Slash",     element: "Slash",     pen_element: "Slash",     stat: "ATK",     ratio: 1.55, }
},
"Assassinate": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: true,
            self_cast: false,
            free_turn: true
        },
        sp: 2,
        gold: 100,
        exp: 600,
        sp_spent: 6,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 20,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, Slash ] Deals 140% ATK DMG, +10% Crit Damage, Increase self Dagger Crit DMG by 15% for 3 Turns, 8 Focus",
        stats: {
    "Hammer DMG%": 0.15,
    },
        dmg_stats: {...defaultDmgStats,    dmg_element: "Slash",     element: "Slash",     pen_element: "Slash",     stat: "ATK",     ratio: 1.4, }
},
"Quake Smash": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: true,
            self_cast: false,
            free_turn: true
        },
        sp: 2,
        gold: 100,
        exp: 600,
        sp_spent: 6,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 20,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, Blunt ] Deals 155% ATK DMG, Increase self Hammer DMG by 15% for 3 Turns, 8 Focus",
        stats: {
    "Dagger Crit DMG%": 0.15,
    },
        dmg_stats: {...defaultDmgStats,    dmg_element: "Blunt",     element: "Blunt",     pen_element: "Blunt",     stat: "ATK",     ratio: 1.55, }
},
"MA Lesser Field": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 2,
        gold: 100,
        exp: 600,
        sp_spent: 6,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 20,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖ ] Gain +100% Crit Dmg for 1 Turn, 10/-1 Focus",
        stats: {
    "Crit DMG%": 1,
    },
        
},
"MA Flow Accel": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 2,
        gold: 100,
        exp: 600,
        sp_spent: 6,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 20,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖ ] Gain +50% Crit Chance by 50% for 1 Turn, 10/-1 Focus",
        stats: {
    "Crit Chance%": 0.5,
    },
        
},
"MA Endure": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        Tag: "30Guard",
        BlockedTag: "30Guard",
        sp: 2,
        gold: 150,
        exp: 1800,
        sp_spent: 8,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 30,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ Passive ] Increase self DEF by 15% ATK. Reduce self ATK by 4%.",
        conversions: [
    { source: "ATK", ratio: 0.15, resulting_stat: "DEF" },
    { source: "ATK", ratio: -0.04, resulting_stat: "ATK" },
    ],
        
},
"Focus Snipe": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: true,
            self_cast: false,
            free_turn: true
        },
        sp: 2,
        gold: 200,
        exp: 2500,
        sp_spent: 14,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 40,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, Pierce ] Deals 180% ATK DMG, Pens with Void, +10% Crit DMG, Increases self Bow Crit DMG by 15% for 3 Turns, 8 Focus",
        stats: {
    "Bow Crit DMG%": 0.15,
    },
        dmg_stats: {...defaultDmgStats,    dmg_element: "Pierce",     element: "Pierce",     pen_element: "Pierce",     stat: "ATK",     ratio: 1.8, }
},
"Fierce Strikes": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: true,
            self_cast: false,
            free_turn: true
        },
        sp: 2,
        gold: 200,
        exp: 2500,
        sp_spent: 14,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 40,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, Blunt ] Deals 180% ATK DMG, +10% Crit DMG, Increases self Fist Crit DMG by 15% for 3 Turns, 8 Focus",
        stats: {
    "Fist Crit DMG%": 0.15,
    },
        dmg_stats: {...defaultDmgStats,    dmg_element: "Blunt",     element: "Blunt",     pen_element: "Blunt",     stat: "ATK",     ratio: 1.8, }
},
"Doom Spike": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: true,
            self_cast: false,
            free_turn: true
        },
        sp: 2,
        gold: 200,
        exp: 2500,
        sp_spent: 14,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 40,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, Pierce ] Deals 200% ATK DMG, Increase self Spear DMG by 15% for 3 Turns, 8 Focus",
        stats: {
    "Spear DMG%": 0.15,
    },
        dmg_stats: {...defaultDmgStats,    dmg_element: "Pierce",     element: "Pierce",     pen_element: "Pierce",     stat: "ATK",     ratio: 2, }
},
"Dragon's Slice": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: true,
            self_cast: false,
            free_turn: true
        },
        sp: 2,
        gold: 200,
        exp: 2500,
        sp_spent: 14,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 40,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, Slash ] Deals 200% ATK DMG, Increase self Sword DMG by 15% for 3 Turns, 8 Focus",
        stats: {
    "Sword DMG%": 0.15,
    },
        dmg_stats: {...defaultDmgStats,    dmg_element: "Slash",     element: "Slash",     pen_element: "Slash",     stat: "ATK",     ratio: 2, }
},
"Quicksilver Backstab": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: true,
            self_cast: false,
            free_turn: true
        },
        sp: 2,
        gold: 200,
        exp: 2500,
        sp_spent: 14,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 40,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, Slash ] Deals 180% ATK DMG, +10% Crit Damage, Increase self Dagger Crit DMG by 15% for 3 Turns, 8 Focus",
        stats: {
    "Hammer DMG%": 0.15,
    },
        dmg_stats: {...defaultDmgStats,    dmg_element: "Slash",     element: "Slash",     pen_element: "Slash",     stat: "ATK",     ratio: 1.8, }
},
"Earthbreaker": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: true,
            self_cast: false,
            free_turn: true
        },
        sp: 2,
        gold: 200,
        exp: 2500,
        sp_spent: 14,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 40,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, Blunt ] Deals 200% ATK DMG, Increase self Hammer DMG by 15% for 3 Turns, 8 Focus",
        stats: {
    "Dagger Crit DMG%": 0.15,
    },
        dmg_stats: {...defaultDmgStats,    dmg_element: "Blunt",     element: "Blunt",     pen_element: "Blunt",     stat: "ATK",     ratio: 2, }
},
"MA Field": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 2,
        gold: 200,
        exp: 2500,
        sp_spent: 14,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 40,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖ ] Gain +150% Crit DMG for 1 Turn, 12/-1 Focus",
        stats: {
    "Crit DMG%": 1.5,
    },
        
},
"MA Focus Slashes": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 2,
        gold: 200,
        exp: 2500,
        sp_spent: 14,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 40,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖ ] Gain +20% Slash Penetration for 1 Turn, 10/-1 Focus",
        stats: {
    "Slash Pen%": 0.2,
    },
        
},
"MA Focus Pierces": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 2,
        gold: 200,
        exp: 2500,
        sp_spent: 14,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 40,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖ ] Gain +20% Pierce Penetration for 1 Turn, 10/-1 Focus",
        stats: {
    "Pierce Pen%": 0.2,
    },
        
},
"MA Focus Blunts": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 2,
        gold: 200,
        exp: 2500,
        sp_spent: 14,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 40,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖ ] Gain +20% Blunt Penetration for 1 Turn, 10/-1 Focus",
        stats: {
    "Blunt Pen%": 0.2,
    },
        
},
"MA Greater Boost": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 2,
        gold: 200,
        exp: 2500,
        sp_spent: 14,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 40,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖ ] Increase self ATK by 25% for 4 Turns, 20/-2 Focus",
        conversions: [
    { source: "ATK", ratio: 0.25, resulting_stat: "ATK" },
    ],
        
},
"MA Focus Accel": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 2,
        gold: 200,
        exp: 2500,
        sp_spent: 14,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 40,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖ ] Gain +50% Crit Chance for 4 Turns, 12/-2",
        stats: {
    "Crit Chance%": 0.5,
    },
        
},
"MA Parry": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        sp: 2,
        gold: 200,
        exp: 2500,
        sp_spent: 14,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 40,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "Increase self DEF by 40% ATK for 1 Turn, 20 Focus",
        conversions: [
    { source: "ATK", ratio: 0.4, resulting_stat: "DEF" },
    ],
        
},
"MA Shatterpoint": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 2,
        gold: 200,
        exp: 2500,
        sp_spent: 14,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 40,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖ ] Increase self Crit DMG by 10% for 5 Turns, 20/-3 Focus",
        conversions: [
    { source: "Crit DMG%", ratio: 0.1, resulting_stat: "Crit DMG%" },
    ],
        
},
"MA Regeneration": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        sp: 2,
        gold: 200,
        exp: 2500,
        sp_spent: 14,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 40,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ 1 Charge ] Give self HP Regen equal to 25% of max life for 4 turns, 15 Focus",
        conversions: [
    { source: "HP", ratio: 0.25, resulting_stat: "HP Regen" },
    ],
        
},
"Hawk Snipe": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: true,
            self_cast: false,
            free_turn: true
        },
        sp: 3,
        gold: 250,
        exp: 4000,
        sp_spent: 22,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 70,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, Pierce ] Deals 225% ATK DMG, Pens with Void, +10% Crit DMG, Increases self Bow Crit DMG by 20% for 3 Turns, 10 Focus",
        stats: {
    "Bow Crit DMG%": 0.2,
    },
        dmg_stats: {...defaultDmgStats,    dmg_element: "Pierce",     element: "Pierce",     pen_element: "Pierce",     stat: "ATK",     ratio: 2.25, }
},
"Seven Sided Strike": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: true,
            self_cast: false,
            free_turn: true
        },
        sp: 3,
        gold: 250,
        exp: 4000,
        sp_spent: 22,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 70,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, Blunt ] Deals 225% ATK DMG, +10% Crit DMG, Increases self Fist Crit DMG by 20% for 3 Turns, 10 Focus",
        stats: {
    "Fist Crit DMG%": 0.2,
    },
        dmg_stats: {...defaultDmgStats,    dmg_element: "Blunt",     element: "Blunt",     pen_element: "Blunt",     stat: "ATK",     ratio: 2.25, }
},
"Serpent's Fang": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: true,
            self_cast: false,
            free_turn: true
        },
        sp: 3,
        gold: 250,
        exp: 4000,
        sp_spent: 22,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 70,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, Pierce ] Deals 250% ATK DMG, Increase self Spear DMG by 20% for 3 Turns, 10 Focus",
        stats: {
    "Spear DMG%": 0.2,
    },
        dmg_stats: {...defaultDmgStats,    dmg_element: "Pierce",     element: "Pierce",     pen_element: "Pierce",     stat: "ATK",     ratio: 2.5, }
},
"Kensai Stroke": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: true,
            self_cast: false,
            free_turn: true
        },
        sp: 3,
        gold: 250,
        exp: 4000,
        sp_spent: 22,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 70,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, Slash ] Deals 250% ATK DMG, Increase self Sword DMG by 20% for 3 Turns, 10 Focus",
        stats: {
    "Sword DMG%": 0.2,
    },
        dmg_stats: {...defaultDmgStats,    dmg_element: "Slash",     element: "Slash",     pen_element: "Slash",     stat: "ATK",     ratio: 2.5, }
},
"Phantom Strikes": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: true,
            self_cast: false,
            free_turn: true
        },
        sp: 3,
        gold: 250,
        exp: 4000,
        sp_spent: 22,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 70,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, Slash ] Deals 225% ATK DMG, +10% Crit Damage, Increase self Dagger Crit DMG by 20% for 3 Turns, 10 Focus",
        stats: {
    "Dagger Crit DMG%": 0.2,
    },
        dmg_stats: {...defaultDmgStats,    dmg_element: "Slash",     element: "Slash",     pen_element: "Slash",     stat: "ATK",     ratio: 2.25, }
},
"Silver Assault": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: true,
            self_cast: false,
            free_turn: true
        },
        sp: 3,
        gold: 250,
        exp: 4000,
        sp_spent: 22,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 70,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, Blunt ] Deals 250% ATK DMG, Increase self Hammer DMG by 20% for 3 Turns, 10 Focus",
        stats: {
    "Hammer DMG%": 0.2,
    },
        dmg_stats: {...defaultDmgStats,    dmg_element: "Blunt",     element: "Blunt",     pen_element: "Blunt",     stat: "ATK",     ratio: 2.5, }
},
"Silent Movements": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 3,
        gold: 250,
        exp: 4000,
        sp_spent: 22,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 70,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, 1 Charge ] Reduce self threat generated by 40% for 4 Turns",
        stats: {
    "Threat%": -0.4,
    },
        
},
"Mastered Deflection": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        sp: 3,
        gold: 250,
        exp: 4000,
        sp_spent: 22,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 70,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ 3 Charges ] Increase self DEF by 100% ATK for 1 Turn",
        conversions: [
    { source: "ATK", ratio: 1, resulting_stat: "DEF" },
    ],
        
},
"Limit Break": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 3,
        gold: 250,
        exp: 4000,
        sp_spent: 22,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 70,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, 1 Charge ] Increase self ATK by 100% ATK for 1 Turn, lose 90% of current HP",
        conversions: [
    { source: "ATK", ratio: 1, resulting_stat: "ATK" },
    ],
        
},
"MA Blood Strength": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 3,
        gold: 250,
        exp: 4000,
        sp_spent: 22,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 70,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖ ] Increase self ATK by 12% ATK and suffer HP Degen equal to 5% Max HP for 4 Turns, 10 Focus",
        conversions: [
    { source: "ATK", ratio: 0.12, resulting_stat: "ATK" },
    { source: "HP", ratio: -0.05, resulting_stat: "HP Regen" },
    ],
        
},
"MA Blood Energy": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 3,
        gold: 250,
        exp: 4000,
        sp_spent: 22,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 70,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, 1 Charge ] Gain 1 Focus/MP Regen for the rest of the battle, Lose 10% Max HP",
        stats: {
    "Focus Regen": 1,
    "MP Regen": 1,
    },
        conversions: [
    { source: "HP", ratio: -0.1, resulting_stat: "HP" },
    ],
        
},
"Arrows of Houyi": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: true,
            self_cast: false,
            free_turn: true
        },
        PreReq: ["Arrow Deity"],
        sp: 3,
        gold: 300,
        exp: 5000,
        sp_spent: 26,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 85,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, Void ] Deals 400% ATK DMG, scales via Pierce, +25% Crit DMG, increase self Crit DMG by 20% for 4 Turns. 15/-2 Focus",
        conversions: [
    { source: "Crit DMG%", ratio: 0.2, resulting_stat: "Crit DMG%" },
    ],
        dmg_stats: {...defaultDmgStats,    dmg_element: "Void",     element: "Pierce",     pen_element: "Void",     stat: "ATK",     ratio: 4, }
},
"Valkyrie's Fury": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: true,
            self_cast: false,
            free_turn: false
        },
        PreReq: ["Spear Deity"],
        sp: 3,
        gold: 300,
        exp: 5000,
        sp_spent: 26,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 85,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ Pierce ] Deals 420% ATK DMG, +50% Penetration, raise self Crit DMG by 25% for 2 Turns, ignores 30% Enemy Resist. 25/-3 Focus",
        conversions: [
    { source: "Crit DMG%", ratio: 0.25, resulting_stat: "Crit DMG%" },
    ],
        dmg_stats: {...defaultDmgStats,    dmg_element: "Pierce",     element: "Pierce",     pen_element: "Pierce",     stat: "ATK",     ratio: 4.2, }
},
"Astral Shot": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: true,
            self_cast: false,
            free_turn: true
        },
        sp: 3,
        gold: 350,
        exp: 6000,
        sp_spent: 48,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 100,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, Pierce ] Deals 290% ATK DMG, Pens with Void, +10% Crit DMG, Increases self Bow Crit DMG by 20% for 3 Turns, 15 Focus",
        stats: {
    "Bow Crit DMG%": 0.2,
    },
        dmg_stats: {...defaultDmgStats,    dmg_element: "Pierce",     element: "Pierce",     pen_element: "Pierce",     stat: "ATK",     ratio: 2.9, }
},
"Roaring Dragon Fist": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: true,
            self_cast: false,
            free_turn: true
        },
        sp: 3,
        gold: 350,
        exp: 6000,
        sp_spent: 48,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 100,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, Blunt ] Deals 290% ATK DMG, +10% Crit DMG, Increases self Fist Crit DMG by 20% for 3 Turns, 15 Focus",
        stats: {
    "Fist Crit DMG%": 0.2,
    },
        dmg_stats: {...defaultDmgStats,    dmg_element: "Blunt",     element: "Blunt",     pen_element: "Blunt",     stat: "ATK",     ratio: 2.9, }
},
"Meteor Spiral Thrust": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: true,
            self_cast: false,
            free_turn: true
        },
        sp: 3,
        gold: 350,
        exp: 6000,
        sp_spent: 48,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 100,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, Pierce ] Deals 320% ATK DMG, Increase self Spear DMG by 20% for 3 Turns, 15 Focus",
        stats: {
    "Spear DMG%": 0.2,
    },
        dmg_stats: {...defaultDmgStats,    dmg_element: "Pierce",     element: "Pierce",     pen_element: "Pierce",     stat: "ATK",     ratio: 3.2, }
},
"Wisdom King Strike": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: true,
            self_cast: false,
            free_turn: true
        },
        sp: 3,
        gold: 350,
        exp: 6000,
        sp_spent: 48,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 100,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, Slash ] Deals 320% ATK DMG, Increase self Sword DMG by 20% for 3 Turns, 15 Focus",
        stats: {
    "Sword DMG%": 0.2,
    },
        dmg_stats: {...defaultDmgStats,    dmg_element: "Slash",     element: "Slash",     pen_element: "Slash",     stat: "ATK",     ratio: 3.2, }
},
"Twilight Strikes": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: true,
            self_cast: false,
            free_turn: true
        },
        sp: 3,
        gold: 350,
        exp: 6000,
        sp_spent: 48,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 100,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, Slash ] Deals 290% ATK DMG, +10% Crit Damage, Increase self Dagger Crit DMG by 20% for 3 Turns, 15 Focus",
        stats: {
    "Dagger Crit DMG%": 0.2,
    },
        dmg_stats: {...defaultDmgStats,    dmg_element: "Slash",     element: "Slash",     pen_element: "Slash",     stat: "ATK",     ratio: 2.9, }
},
"Damnation Blow": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: true,
            self_cast: false,
            free_turn: true
        },
        sp: 3,
        gold: 350,
        exp: 6000,
        sp_spent: 48,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 100,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, Blunt ] Deals 320% ATK DMG, Increase self Hammer DMG by 20% for 3 Turns, 15 Focus",
        stats: {
    "Hammer DMG%": 0.2,
    },
        dmg_stats: {...defaultDmgStats,    dmg_element: "Blunt",     element: "Blunt",     pen_element: "Blunt",     stat: "ATK",     ratio: 3.2, }
},
"Calm Focus Stance": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        sp: 3,
        gold: 350,
        exp: 6000,
        sp_spent: 48,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 100,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ 1 Charge ] Gain +33% Crit Chance, lower self ATK by 10%. Lasts entire battle.",
        stats: {
    "Crit Chance%": 0.33,
    },
        conversions: [
    { source: "ATK", ratio: -0.1, resulting_stat: "ATK" },
    ],
        
},
"Bloodfury Stance": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        sp: 3,
        gold: 350,
        exp: 6000,
        sp_spent: 48,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 100,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ 1 Charge ] Increase self ATK by 15%, lower Max HP by 15%. Lasts entire battle",
        conversions: [
    { source: "ATK", ratio: 0.15, resulting_stat: "ATK" },
    { source: "HP", ratio: -0.15, resulting_stat: "HP" },
    ],
        
},
"Life Cycle Stance": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        sp: 3,
        gold: 350,
        exp: 6000,
        sp_spent: 48,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 100,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ 1 Charge ] Increase self DEF by 15% ATK, lowers self Crit Damage by 5%. Lasts entire battle.",
        conversions: [
    { source: "ATK", ratio: 0.15, resulting_stat: "DEF" },
    { source: "Crit DMG%", ratio: -0.05, resulting_stat: "Crit DMG%" },
    ],
        
},
"MA Mana Strength": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        sp: 3,
        gold: 350,
        exp: 6000,
        sp_spent: 48,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 100,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "Convert 25% of MATK into ATK. Lasts 24 turns. 10/-1 Focus",
        conversions: [
    { source: "MATK", ratio: 0.25, resulting_stat: "ATK" },
    ],
        
},
"MA Spirit Strength": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        sp: 3,
        gold: 350,
        exp: 6000,
        sp_spent: 48,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 100,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "Convert 25% of Healpower into ATK. Lasts 24 turns. 10/-1 Focus",
        conversions: [
    { source: "HEAL", ratio: 0.25, resulting_stat: "ATK" },
    ],
        
},
"Soul Companion": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        PreReq: ["Arrow Archon"],
        sp: 3,
        gold: 350,
        exp: 6000,
        sp_spent: 48,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 100,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖ ] Increase self Penvoid by 10% and Void Damage inflicts 2% Damage Done as DOT with -80% MATK penalty for 12 Turns.",
        stats: {
    "Void DOT%": 0.02,
    },
        conversions: [
    { source: "Void Pen%", ratio: 0.1, resulting_stat: "Void Pen%" },
    { source: "MATK", ratio: -0.8, resulting_stat: "MATK" },
    ],
        
},
"Soul Quiver": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        PreReq: ["Arrow Archon"],
        sp: 3,
        gold: 350,
        exp: 6000,
        sp_spent: 48,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 100,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖ ] Gain Focus Regen equal to 2% of Focus Cap and increase self Void Pen by 15% for 6 turns. Costs 3% Max HP.",
        conversions: [
    { source: "Focus", ratio: 0.02, resulting_stat: "Focus Regen" },
    { source: "Void Pen%", ratio: 0.15, resulting_stat: "Void Pen%" },
    ],
        
},
"Whirlwind Dance": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: true,
            self_cast: false,
            free_turn: true
        },
        PreReq: ["Sword Archon"],
        sp: 3,
        gold: 350,
        exp: 6000,
        sp_spent: 48,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 100,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, Slash ] Deals 1400% ATK DMG AOE, Cap 290% per Target. Increase self Sword DMG by 15% for 3 Turns. 30/-5 Focus",
        stats: {
    "Sword DMG%": 0.15,
    },
        dmg_stats: {...defaultDmgStats,    dmg_element: "Slash",     element: "Slash",     pen_element: "Slash",     stat: "ATK",     ratio: 2.9, }
},
"Guarding Flourish": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        PreReq: ["Spear Archon"],
        sp: 3,
        gold: 350,
        exp: 6000,
        sp_spent: 48,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 100,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖ ] Reduce damage taken by 50% and increase self Pierce Penetration by 15% for 1 turn, 10/-1 Focus, 5 Turn Cooldown.",
        stats: {
    "DMG Res%": 0.5,
    },
        conversions: [
    { source: "Pierce Pen%", ratio: 0.15, resulting_stat: "Pierce Pen%" },
    ],
        
},
"Thousand Lances": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: true,
            self_cast: false,
            free_turn: true
        },
        PreReq: ["Spear Archon"],
        sp: 3,
        gold: 350,
        exp: 6000,
        sp_spent: 48,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 100,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, Pierce ] Deals 320% ATK DMG. Increase self Pierce Pen by 10% for 2 Turns, stacking to 35%. 20/-4 Focus",
        stack_conversions: [
    { source: "Pierce Pen%", ratio: 0.1, resulting_stat: "Pierce Pen%" },
    ],
        dmg_stats: {...defaultDmgStats,    dmg_element: "Pierce",     element: "Pierce",     pen_element: "Pierce",     stat: "ATK",     ratio: 3.2, }
},
"Leaping Rampage": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        PreReq: ["Hammer Archon"],
        sp: 3,
        gold: 350,
        exp: 6000,
        sp_spent: 48,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 100,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖ ] Increase self Blunt Pen by 20%, and penalty of -10% DEF for 5 Turns. 9 Turn Cooldown.",
        conversions: [
    { source: "Blunt Pen%", ratio: 0.2, resulting_stat: "Blunt Pen%" },
    { source: "DEF", ratio: -0.1, resulting_stat: "DEF" },
    ],
        
},
"Iron Demon Stance": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        PreReq: ["Martial Archon"],
        sp: 3,
        gold: 350,
        exp: 6000,
        sp_spent: 48,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 100,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖ ] Blunt Damage ignores 100% Armor for next hit. 16/-2 Focus",
        stats: {
    "Blunt Armor Ignore%": 1,
    },
        
},
"Harmony Fist Stance": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: true,
            self_cast: false,
            free_turn: true
        },
        PreReq: ["Martial Archon"],
        sp: 3,
        gold: 350,
        exp: 6000,
        sp_spent: 48,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 100,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, Blunt ] Deals 300% ATK DMG, +10% Crit Damage. Raises self ATK by 40% for 1 Turn. 25/-4 Focus",
        conversions: [
    { source: "ATK", ratio: 0.4, resulting_stat: "ATK" },
    ],
        dmg_stats: {...defaultDmgStats,    dmg_element: "Blunt",     element: "Blunt",     pen_element: "Blunt",     stat: "ATK",     ratio: 3, }
},
"Razored Edges": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        PreReq: ["Dagger Archon"],
        sp: 3,
        gold: 350,
        exp: 6000,
        sp_spent: 48,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 100,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, 3 Charges ] Slash Damage inflicts 4% Damage Done as DOT and increase Slash Damage by 10% for 4 Turns.",
        stats: {
    "Slash DOT%": 0.04,
    },
        conversions: [
    { source: "Slash%", ratio: 0.1, resulting_stat: "Slash%" },
    ],
        
},
"Ring of Blades": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        PreReq: ["Dagger Archon"],
        sp: 3,
        gold: 350,
        exp: 6000,
        sp_spent: 48,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 100,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, 3 Charges ] Raise self DEF by 20% ATK and Crit DMG by 33% for 8 turns.",
        conversions: [
    { source: "ATK", ratio: 0.2, resulting_stat: "DEF" },
    { source: "Crit DMG%", ratio: 0.33, resulting_stat: "Crit DMG%" },
    ],
        
},
"Warrior's Haki": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 3,
        gold: 600,
        exp: 8000,
        sp_spent: 70,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 150,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖ ] Debuff enemy Damage by 365% of ATK Multiiplier. Cannot be stacked. Increase self ATK and DEF by 5% ATK. 5 Focus",
        conversions: [
    { source: "ATK", ratio: 0.05, resulting_stat: "DEF" },
    { source: "ATK", ratio: 0.05, resulting_stat: "ATK" },
    ],
        
},
"Martial Tether": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 3,
        gold: 600,
        exp: 8000,
        sp_spent: 70,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 150,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖ ] Give target ally 3 MP Regen for rest of battle. 5/-15 Focus",
        stats: {
    "MP Regen": 3,
    },
        
},
"Champion's Vigor": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 3,
        gold: 600,
        exp: 8000,
        sp_spent: 70,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 150,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, 3 Charges ] Give target ally Crit DMG equal to 25% of self Crit DMG for 9 Turns.",
        conversions: [
    { source: "Crit DMG%", ratio: 0.25, resulting_stat: "Crit DMG%" },
    ],
        
},
"Soul Berserk": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 3,
        gold: 600,
        exp: 8000,
        sp_spent: 70,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 150,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, 1 Charge ] Increase self ATK by 100% ATK for 1 Turn.",
        conversions: [
    { source: "ATK", ratio: 1, resulting_stat: "ATK" },
    ],
        
},
"Wrathful Hero": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        Tag: "HeroSoul",
        BlockedTag: "HeroSoul",
        sp: 3,
        gold: 600,
        exp: 8000,
        sp_spent: 70,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 150,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ 1 Charge ] Increase self ATK by 10% for the rest of the battle.",
        conversions: [
    { source: "ATK", ratio: 0.1, resulting_stat: "ATK" },
    ],
        
},
"Void Crosser": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: true,
            self_cast: false,
            free_turn: true
        },
        PreReq: ["Arrows of Houyi"],
        sp: 3,
        gold: 750,
        exp: 10000,
        sp_spent: 75,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 160,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, Void ] Deals 600% ATK DMG, scales via Pierce, +30% Crit DMG, increase self Crit DMG by 25% for 5 Turns. 25/-8 Focus",
        conversions: [
    { source: "Crit DMG%", ratio: 0.25, resulting_stat: "Crit DMG%" },
    ],
        dmg_stats: {...defaultDmgStats,    dmg_element: "Void",     element: "Pierce",     pen_element: "Void",     stat: "ATK",     ratio: 6, }
},
"Piercer of Heaven": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: true,
            self_cast: false,
            free_turn: false
        },
        PreReq: ["Valkyrie's Fury"],
        sp: 3,
        gold: 750,
        exp: 10000,
        sp_spent: 75,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 160,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ Pierce ] Deals 505% ATK DMG, +50% Penetration, raise self Crit DMG by 25% for 2 Turns, ignores 35% Enemy Resist. 45/-15 Focus",
        conversions: [
    { source: "Crit DMG%", ratio: 0.25, resulting_stat: "Crit DMG%" },
    ],
        dmg_stats: {...defaultDmgStats,    dmg_element: "Pierce",     element: "Pierce",     pen_element: "Pierce",     stat: "ATK",     ratio: 5.05, }
},
"Enchant Weapon": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: true,
            free_turn: false
        },
        sp: 1,
        gold: 100,
        exp: 100,
        sp_spent: 2,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 10,
            healer_levels: 0
        },
        description: "[ 1 Charge ] Increase ally ATK by 25% MATK for 6 Turns, 5 MP",
        conversions: [
    { source: "MATK", ratio: 0.25, resulting_stat: "ATK" },
    ],
        
},
"Pierce Barrier": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: true,
            free_turn: false
        },
        sp: 1,
        gold: 100,
        exp: 100,
        sp_spent: 2,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 10,
            healer_levels: 0
        },
        description: "Increase ally Pierce Resist by 30% for 1 Turn, 3 MP",
        stats: {
    "Pierce Res%": 0.3,
    },
        
},
"Lesser Luck": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: true,
            free_turn: false
        },
        sp: 1,
        gold: 100,
        exp: 100,
        sp_spent: 2,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 10,
            healer_levels: 0
        },
        description: "Increase ally Crit Chance by 15% for 5 Turns, 5 MP",
        stats: {
    "Crit Chance%": 0.3,
    },
        
},
"Mana Shield": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        sp: 1,
        gold: 100,
        exp: 100,
        sp_spent: 2,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 10,
            healer_levels: 0
        },
        description: "[ 1 Charge ] Increase self DEF by 60% MATK for 1 Turn, 12 MP",
        conversions: [
    { source: "MATK", ratio: 0.6, resulting_stat: "DEF" },
    ],
        
},
"Whirlwind": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: true,
            self_cast: false,
            free_turn: false
        },
        sp: 1,
        gold: 150,
        exp: 1800,
        sp_spent: 6,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 20,
            healer_levels: 0
        },
        description: "[ Wind ] Deals 350% MATK AOE DMG, cap 200% per Target, 15% Penetration, ignores 10% Enemy Resist. Increase self Elewind by 5% stacking for 2 turns. 8 MP",
        stack_conversions: [
    { source: "Wind%", ratio: 0.05, resulting_stat: "Wind%" },
    ],
        dmg_stats: {...defaultDmgStats,    dmg_element: "Wind",     element: "Wind",     pen_element: "Wind",     stat: "MATK",     ratio: 2, }
},
"Mana Barrier": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        sp: 1,
        gold: 150,
        exp: 1800,
        sp_spent: 6,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 20,
            healer_levels: 0
        },
        description: "[ 1 Charge ] Raise team DEF by 30% MATK for 1 Turns, 18 MP",
        conversions: [
    { source: "MATK", ratio: 0.3, resulting_stat: "DEF" },
    ],
        
},
"Arcane Heal": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        sp: 1,
        gold: 150,
        exp: 1800,
        sp_spent: 6,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 20,
            healer_levels: 0
        },
        description: "[ 5 Charges ] Recover Target Life by 20% MATK, Cannot Crit, 3 MP",
        
},
"Body Surge": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: true,
            free_turn: false
        },
        sp: 1,
        gold: 150,
        exp: 1800,
        sp_spent: 6,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 20,
            healer_levels: 0
        },
        description: "[ 1 Charge ] Increase ally Crit DMG by 40% for 4 Turns, 5 MP",
        stats: {
    "Crit DMG%": 0.4,
    },
        
},
"Maximize Magic": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 1,
        gold: 150,
        exp: 1800,
        sp_spent: 6,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 20,
            healer_levels: 0
        },
        description: "[ ⧖ ] Raise self Crit Chance by 100% and reduce self ATK by 90% for 2 Turns. Costs 1% Current MP, minimum 6 MP.",
        stats: {
    "Crit Chance%": 1,
    },
        conversions: [
    { source: "ATK", ratio: -0.9, resulting_stat: "ATK" },
    ],
        
},
"Freedom": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        PreReq: ["The Reality"],
        sp: 2,
        gold: 150,
        exp: 1800,
        sp_spent: 8,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 30,
            healer_levels: 0
        },
        description: "[ 1 Charge ] Raise self MATK by 20% and MP Regen by 1% of Max MP for 25 Turns,.",
        conversions: [
    { source: "MATK", ratio: 0.2, resulting_stat: "MATK" },
    { source: "MP Regen", ratio: 0.01, resulting_stat: "MP" },
    ],
        
},
"Essence Protect": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: true,
            free_turn: false
        },
        PreReq: ["The Essence"],
        sp: 2,
        gold: 150,
        exp: 1800,
        sp_spent: 8,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 30,
            healer_levels: 0
        },
        description: "[ 1 Charge ] Raise ally DEF by 25% MATK and suffer a 5% penalty to MATK for the rest of the battle",
        conversions: [
    { source: "MATK", ratio: 0.25, resulting_stat: "DEF" },
    { source: "MATK", ratio: -0.05, resulting_stat: "MATK" },
    ],
        
},
"Spirit Fissure": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        PreReq: ["The Soul"],
        sp: 2,
        gold: 150,
        exp: 1800,
        sp_spent: 8,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 30,
            healer_levels: 0
        },
        description: "Increase self Crit DMG by 1.5x for 5 turns, lose 25% of current HP.",
        conversions: [
    { source: "Crit DMG%", ratio: 0.5, resulting_stat: "Crit DMG%" },
    ],
        
},
"Arcane Shield": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        Tag: "30Guard",
        BlockedTag: "30Guard",
        sp: 2,
        gold: 150,
        exp: 1800,
        sp_spent: 8,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 30,
            healer_levels: 0
        },
        description: "[ Passive ] Increase self DEF by 15% MATK. Reduce self MATK by 4%.",
        conversions: [
    { source: "MATK", ratio: 0.15, resulting_stat: "DEF" },
    { source: "MATK", ratio: -0.04, resulting_stat: "MATK" },
    ],
        
},
"Piercing Gale": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: true,
            self_cast: false,
            free_turn: false
        },
        sp: 2,
        gold: 200,
        exp: 2500,
        sp_spent: 14,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 40,
            healer_levels: 0
        },
        description: "[ Wind ] Deals 320% MATK DMG, 16% Penetration, ignores 10% Enemy Resist. Increase self Elewind by 5% stacking for 2 turns. 12 MP",
        stack_conversions: [
    { source: "Wind%", ratio: 0.05, resulting_stat: "Wind%" },
    ],
        dmg_stats: {...defaultDmgStats,    dmg_element: "Wind",     element: "Wind",     pen_element: "Wind",     stat: "MATK",     ratio: 3.2, }
},
"Hurricane": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: true,
            self_cast: false,
            free_turn: false
        },
        sp: 2,
        gold: 200,
        exp: 2500,
        sp_spent: 14,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 40,
            healer_levels: 0
        },
        description: "[ Wind ] Deals 475% MATK AOE DMG, cap 340% MATK per Target, 12% Penetration, ignores 10% Enemy Resist. Increase self Elewind by 5% stacking for 2 turns. 15 MP",
        stack_conversions: [
    { source: "Wind%", ratio: 0.05, resulting_stat: "Wind%" },
    ],
        dmg_stats: {...defaultDmgStats,    dmg_element: "Wind",     element: "Wind",     pen_element: "Wind",     stat: "MATK",     ratio: 3.4, }
},
"Mana Armor": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: true,
            free_turn: false
        },
        sp: 2,
        gold: 200,
        exp: 2500,
        sp_spent: 14,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 40,
            healer_levels: 0
        },
        description: "Raise target DEF by 8% MATK for 10 Turns, 9 MP",
        conversions: [
    { source: "MATK", ratio: 0.08, resulting_stat: "DEF" },
    ],
        
},
"Metamagic Charge": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 2,
        gold: 200,
        exp: 2500,
        sp_spent: 14,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 40,
            healer_levels: 0
        },
        description: "[ ⧖ ] Raise self Elemental Damage by 30% for 2 turns. Costs 1% Current MP, minimum 8 MP.",
        stats: {
    "Elemental xDmg%": 0.3,
    },
        
},
"Study of Power": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        PreReq: ["Elemental Sage"],
        sp: 2,
        gold: 225,
        exp: 3200,
        sp_spent: 16,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 50,
            healer_levels: 0
        },
        description: "[ 1 Charge ] Raise self MATK by 10% for the rest of the battle. Gain MP equal to 10% of Current MP.",
        conversions: [
    { source: "MATK", ratio: 0.1, resulting_stat: "MATK" },
    { source: "MP", ratio: 0.1, resulting_stat: "MP" },
    ],
        
},
"Study of Spirit": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        PreReq: ["Spirit Sage"],
        sp: 2,
        gold: 225,
        exp: 3200,
        sp_spent: 16,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 50,
            healer_levels: 0
        },
        description: "[ 1 Charge ] Multiply self Crit DMG by 12% and lower self max health by 5% for the rest of the battle.",
        conversions: [
    { source: "Crit DMG%", ratio: 0.12, resulting_stat: "Crit DMG%" },
    { source: "HP", ratio: -0.05, resulting_stat: "HP" },
    ],
        
},
"Study of Life": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        PreReq: ["Life Sage"],
        sp: 2,
        gold: 225,
        exp: 3200,
        sp_spent: 16,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 50,
            healer_levels: 0
        },
        description: "[ 1 Charge ] Raise self Healpower by 30% MATK for the rest of the battle",
        conversions: [
    { source: "MATK", ratio: 0.3, resulting_stat: "HEAL" },
    ],
        
},
"Metamagic Boost": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 3,
        gold: 250,
        exp: 4000,
        sp_spent: 22,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 70,
            healer_levels: 0
        },
        description: "[ ⧖ ] Raise self Crit Damage by 10% of MATK Multiplier for 2 turns. Costs 1% Current MP, minimum 8 MP.",
        conversions: [
    { source: "MATK%", ratio: 0.1, resulting_stat: "Crit DMG%" },
    ],
        
},
"Metamagic Pierce": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 3,
        gold: 250,
        exp: 4000,
        sp_spent: 22,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 70,
            healer_levels: 0
        },
        description: "[ ⧖ ] Raise self Elemental Penetration by +50 for 2 Turns. Costs 1% Current MP. Minimum 10 MP.",
        stats: {
    "Elemental Pen%": 0.5,
    },
        
},
"Highfather's Power": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        PreReq: ["Blessing of Olympus"],
        sp: 3,
        gold: 300,
        exp: 5000,
        sp_spent: 26,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 85,
            healer_levels: 0
        },
        description: "[ 1 Charge ] Gain Temporary MP equal to MATK Multiplier and increase MATK by 20% for 7 turns.",
        conversions: [
    { source: "MATK", ratio: 0.2, resulting_stat: "MATK" },
    { source: "MATK%", ratio: 1, resulting_stat: "MP" },
    ],
        
},
"Underworld Catalyst": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        PreReq: ["Blessing of Hades"],
        sp: 3,
        gold: 300,
        exp: 5000,
        sp_spent: 26,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 85,
            healer_levels: 0
        },
        description: "[ 1 Charge ] Gain MP equal to 15% of Negative Damage. Increase Negative damage by 25% for 13 Turns.",
        conversions: [
    { source: "Neg%", ratio: 1, resulting_stat: "MP" },
    { source: "Neg%", ratio: 0.25, resulting_stat: "Neg%" },
    ],
        
},
"Primordial Origin": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        PreReq: ["Blessing of the Titans"],
        sp: 3,
        gold: 300,
        exp: 5000,
        sp_spent: 26,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 85,
            healer_levels: 0
        },
        description: "Gain 15 MP. Increase Crit DMG by 20% of MATK Multiplier for 2 Turns.",
        stats: {
    "MP": 15,
    },
        conversions: [
    { source: "MATK%", ratio: 0.2, resulting_stat: "Crit DMG%" },
    ],
        
},
"Mach Cannon": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: true,
            self_cast: false,
            free_turn: false
        },
        sp: 3,
        gold: 350,
        exp: 6000,
        sp_spent: 48,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 100,
            healer_levels: 0
        },
        description: "[ Wind ] Deals 450% MATK DMG, 16% Penetration, ignores 15% Enemy Resist. Increase self Elewind by 5% stacking for 2 turns. 16 MP",
        stack_conversions: [
    { source: "Wind%", ratio: 0.05, resulting_stat: "Wind%" },
    ],
        dmg_stats: {...defaultDmgStats,    dmg_element: "Wind",     element: "Wind",     pen_element: "Wind",     stat: "MATK",     ratio: 4.5, }
},
"Mach Hurricane": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: true,
            self_cast: false,
            free_turn: false
        },
        sp: 3,
        gold: 350,
        exp: 6000,
        sp_spent: 48,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 100,
            healer_levels: 0
        },
        description: "[ Wind ] Deals 775% MATK AOE DMG, cap 400% MATK per Target, 12% Penetration, ignores 15% Enemy Resist. Increase self Elewind by 5% stacking for 2 turns. 20 MP",
        stack_conversions: [
    { source: "Wind%", ratio: 0.05, resulting_stat: "Wind%" },
    ],
        dmg_stats: {...defaultDmgStats,    dmg_element: "Wind",     element: "Wind",     pen_element: "Wind",     stat: "MATK",     ratio: 7.75, }
},
"Metamagic Penetrate": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 3,
        gold: 350,
        exp: 6000,
        sp_spent: 48,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 100,
            healer_levels: 0
        },
        description: "[ ⧖ ] Raise self Elemental Penetration by 35% for 2 Turns. Costs 1% Current MP. Minimum 8 MP.",
        stats: {
    "Elemental xPen%": 0.35,
    },
        
},
"Metamagic Multi Pierce": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 3,
        gold: 350,
        exp: 6000,
        sp_spent: 48,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 100,
            healer_levels: 0
        },
        description: "[ ⧖ ] Raise self Elemental Penetration by +50 for 3 Turns. Costs 2% Current MP. Minimum 20 MP.",
        stats: {
    "Elemental Pen%": 0.5,
    },
        
},
"Maximize Magic Chain": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        sp: 3,
        gold: 350,
        exp: 6000,
        sp_spent: 48,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 100,
            healer_levels: 0
        },
        description: "[ 1 Charge ] Increase self Crit Chance by 75% and reduce Self ATK by 90% for rest of battle. Costs 50% of current Mana.",
        stats: {
    "Crit Chance%": 0.75,
    },
        conversions: [
    { source: "ATK", ratio: -0.9, resulting_stat: "ATK" },
    ],
        
},
"Draconic Power": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: true,
            free_turn: false
        },
        sp: 3,
        gold: 350,
        exp: 6000,
        sp_spent: 48,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 100,
            healer_levels: 0
        },
        description: "[ 1 Charge ] Raise target Crit DMG by 10% of self Crit DMG for 10 Turns. 16 MP",
        conversions: [
    { source: "Crit DMG%", ratio: 0.1, resulting_stat: "Crit DMG%" },
    ],
        
},
"Illusionary Shroud": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: true,
            free_turn: false
        },
        sp: 3,
        gold: 350,
        exp: 6000,
        sp_spent: 48,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 100,
            healer_levels: 0
        },
        description: "Reduce ally threat generated by 90% for 12 Turns, 15 MP",
        stats: {
    "Threat%": -0.9,
    },
        
},
"Realm Barrier": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: true,
            free_turn: true
        },
        sp: 3,
        gold: 600,
        exp: 8000,
        sp_spent: 70,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 150,
            healer_levels: 0
        },
        description: "[ ⧖ , 2 Charges ] Give target ally Temporary HP equal to 100% MATK for 1 Turn. 12 MP",
        conversions: [
    { source: "MATK", ratio: 1, resulting_stat: "Temp HP" },
    ],
        
},
"World Illusion": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        sp: 3,
        gold: 600,
        exp: 8000,
        sp_spent: 70,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 150,
            healer_levels: 0
        },
        description: "[ 1 Charge ] Give party Temporary HP equal to 100% MATK for 3 turns. 45 MP.",
        conversions: [
    { source: "MATK", ratio: 1, resulting_stat: "Temp HP" },
    ],
        
},
"Entropy Void": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 3,
        gold: 600,
        exp: 8000,
        sp_spent: 70,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 150,
            healer_levels: 0
        },
        description: "[ ⧖ ] Debuff enemy Physical Resist by 20%, 12 MP",
        stats: {
    "Phys Pen%": 0.2,
    },
        
},
"Metamagic Soul": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 3,
        gold: 600,
        exp: 8000,
        sp_spent: 70,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 150,
            healer_levels: 0
        },
        description: "[ ⧖ ] Raise self MATK by 40% for 2 Turns. Costs 1% Current MP. Minimum 10 MP.",
        conversions: [
    { source: "MATK", ratio: 0.4, resulting_stat: "MATK" },
    ],
        
},
"Arcane Hero": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        Tag: "HeroSoul",
        BlockedTag: "HeroSoul",
        sp: 3,
        gold: 600,
        exp: 8000,
        sp_spent: 70,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 150,
            healer_levels: 0
        },
        description: "[ 1 Charge ] Increase self MATK by 10% for the rest of the battle.",
        conversions: [
    { source: "MATK", ratio: 0.1, resulting_stat: "MATK" },
    ],
        
},
"Vayu's Blades": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: true,
            self_cast: false,
            free_turn: false
        },
        PreReq: ["Mach Cannon"],
        sp: 3,
        gold: 750,
        exp: 10000,
        sp_spent: 75,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 160,
            healer_levels: 0
        },
        description: "[ Wind ] Deals 700% MATK DMG, 20% Penetration, ignores 15% Enemy Resist. Increase self Elewind by 5% stacking for 2 turns. 38 MP",
        stack_conversions: [
    { source: "Wind%", ratio: 0.05, resulting_stat: "Wind%" },
    ],
        dmg_stats: {...defaultDmgStats,    dmg_element: "Wind",     element: "Wind",     pen_element: "Wind",     stat: "MATK",     ratio: 7, }
},
"Bhi'mola's Wings": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: true,
            self_cast: false,
            free_turn: false
        },
        PreReq: ["Mach Hurricane"],
        sp: 3,
        gold: 750,
        exp: 10000,
        sp_spent: 75,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 160,
            healer_levels: 0
        },
        description: "[ Wind ] Deals 1500% MATK AOE DMG, cap 650% MATK per Target, 15% Penetration, ignores 15% Enemy Resist. Increase self Elewind by 5% stacking for 2 turns. 45 MP",
        stack_conversions: [
    { source: "Wind%", ratio: 0.05, resulting_stat: "Wind%" },
    ],
        dmg_stats: {...defaultDmgStats,    dmg_element: "Wind",     element: "Wind",     pen_element: "Wind",     stat: "MATK",     ratio: 6.5, }
},
"Metamagic Multi Penetrate": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        PreReq: ["Metamagic Penetrate"],
        sp: 3,
        gold: 750,
        exp: 10000,
        sp_spent: 75,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 160,
            healer_levels: 0
        },
        description: "[ ⧖ ] Raise self Elemental Penetration by 30% for 3 Turns. Costs 3% Current MP. Minimum 24 MP.",
        stats: {
    "Elemental xPen%": 0.3,
    },
        
},
"Metamagic Destruction": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 3,
        gold: 750,
        exp: 10000,
        sp_spent: 75,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 160,
            healer_levels: 0
        },
        description: "[ ⧖ ] Raise self Magic Elemental DMG by 75% for 2 Turns. Costs 4% Current MP. Minimum 36 MP.",
        conversions: [
    { source: "Crit DMG%", ratio: 0.75, resulting_stat: "Elemental Crit DMG%" },
    ],
        
},
"Heal 1": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        sp: 1,
        gold: 25,
        exp: 25,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 1
        },
        description: "Recover Target Life by 50+5% Healpower, 1 MP",
        
},
"Lesser Strength": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: true,
            free_turn: false
        },
        sp: 1,
        gold: 25,
        exp: 25,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 1
        },
        description: "[ 1 Charge ] Boost Target ATK by 15% Heal for 6 Turns, 1 MP",
        conversions: [
    { source: "HEAL", ratio: 0.15, resulting_stat: "ATK" },
    ],
        
},
"Burst Heal 1": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        sp: 1,
        gold: 25,
        exp: 25,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 1
        },
        description: "[ 3 Charges ] Recover Target Life by 50% Healpower, 3 MP. Cannot Crit Heal.",
        
},
"Heal 2": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        sp: 1,
        gold: 100,
        exp: 100,
        sp_spent: 2,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 10
        },
        description: "Recover Target Life by 500+7% Healpower, 3 MP",
        
},
"Strength": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: true,
            free_turn: false
        },
        sp: 1,
        gold: 100,
        exp: 100,
        sp_spent: 2,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 10
        },
        description: "[ 1 Charge ] Boost Target ATK by 40% Heal for 6 turns, 5 MP",
        conversions: [
    { source: "HEAL", ratio: 0.4, resulting_stat: "ATK" },
    ],
        
},
"Burst Heal 2": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        sp: 1,
        gold: 100,
        exp: 100,
        sp_spent: 2,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 10
        },
        description: "[ 2 Charges ] Recover Target Life by 75% Healpower, 6 MP. Cannot Crit Heal.",
        
},
"Divine Power": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        sp: 1,
        gold: 100,
        exp: 100,
        sp_spent: 2,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 10
        },
        description: "Increase self MATK by 50% Heal for 5 Turns, 10 MP",
        conversions: [
    { source: "HEAL", ratio: 0.5, resulting_stat: "MATK" },
    ],
        
},
"Lesser Hardening": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: true,
            free_turn: false
        },
        sp: 1,
        gold: 100,
        exp: 100,
        sp_spent: 2,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 10
        },
        description: "[ 2 Charges ] Increase ally DEF by 25% Heal for 18 Turns, 3 MP",
        conversions: [
    { source: "HEAL", ratio: 0.25, resulting_stat: "DEF" },
    ],
        
},
"Resist Negative": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: true,
            free_turn: false
        },
        sp: 1,
        gold: 100,
        exp: 100,
        sp_spent: 2,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 10
        },
        description: "Increase ally Negative Resist by 20% for 5 Turns, 5 MP",
        stats: {
    "Neg Res%": 0.2,
    },
        
},
"Resist Holy": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: true,
            free_turn: false
        },
        sp: 1,
        gold: 100,
        exp: 100,
        sp_spent: 2,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 10
        },
        description: "Increase ally Holy Resist by 20% for 5 Turns, 5 MP",
        stats: {
    "Holy Res%": 0.2,
    },
        
},
"Resist Toxic": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: true,
            free_turn: false
        },
        sp: 1,
        gold: 100,
        exp: 100,
        sp_spent: 2,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 10
        },
        description: "Increase ally Toxic Resist by 20% for 5 Turns, 5 MP",
        stats: {
    "Toxic Res%": 0.2,
    },
        
},
"Group Restore 1": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        sp: 1,
        gold: 100,
        exp: 100,
        sp_spent: 2,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 10
        },
        description: "Recover Party HP by 3,000+6% Healpower, 6 MP",
        
},
"Greater Heal 1": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        sp: 1,
        gold: 150,
        exp: 1800,
        sp_spent: 6,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 20
        },
        description: "Recover Target Life by 5,000+9% Healpower, 6 MP",
        
},
"Life Surge": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: true,
            free_turn: false
        },
        sp: 1,
        gold: 150,
        exp: 1800,
        sp_spent: 6,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 20
        },
        description: "Give ally temporary HP equal to 25% Heal for 3 Turns, 4 MP",
        conversions: [
    { source: "HEAL", ratio: 0.25, resulting_stat: "Temp HP" },
    ],
        
},
"Reinforce Armor": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: true,
            free_turn: false
        },
        sp: 1,
        gold: 150,
        exp: 1800,
        sp_spent: 6,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 20
        },
        description: "[ 3 Charges ] Increase ally DEF equal to 18% Heal for the rest of the battle, Costs 6% of Max MP",
        conversions: [
    { source: "HEAL", ratio: 0.18, resulting_stat: "DEF" },
    ],
        
},
"Hardening": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: true,
            free_turn: false
        },
        sp: 1,
        gold: 150,
        exp: 1800,
        sp_spent: 6,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 20
        },
        description: "[ 2 Charges ] Increase ally DEF by 40% Heal for 12 Turns, 6 MP",
        conversions: [
    { source: "HEAL", ratio: 0.4, resulting_stat: "DEF" },
    ],
        
},
"Group Restore 2": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        sp: 1,
        gold: 150,
        exp: 1800,
        sp_spent: 6,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 20
        },
        description: "Recover Party HP by 7,000+9% Healpower, 15 MP",
        
},
"Boost Vigor": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: true,
            free_turn: false
        },
        sp: 1,
        gold: 150,
        exp: 1800,
        sp_spent: 6,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 20
        },
        description: "[ 1 Charge ] Increase Target ATK by 30% Heal for 8 Turns, 8 MP",
        conversions: [
    { source: "HEAL", ratio: 0.3, resulting_stat: "ATK" },
    ],
        
},
"Augment Body": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: true,
            free_turn: false
        },
        sp: 1,
        gold: 150,
        exp: 1800,
        sp_spent: 6,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 20
        },
        description: "[ 1 Charge ] Increase Target Max HP by 10% Heal for 10 Turns, 5 MP",
        conversions: [
    { source: "HEAL", ratio: 0.1, resulting_stat: "HP" },
    ],
        
},
"Mana Transfer 1": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        sp: 1,
        gold: 150,
        exp: 1800,
        sp_spent: 6,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 20
        },
        description: "[ 1 Charge ] Give target ally 12 MP, costs 25 MP",
        
},
"Rejuvenation": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: true,
            free_turn: false
        },
        PreReq: ["Life Weaver"],
        sp: 2,
        gold: 150,
        exp: 1800,
        sp_spent: 8,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 30
        },
        description: "[ 1 Charge ] Give ally overheal by 100% Heal, 6 MP",
        conversions: [
    { source: "HEAL", ratio: 1, resulting_stat: "Temp HP" },
    ],
        
},
"Bend Fate": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: true,
            free_turn: false
        },
        PreReq: ["Fate Weaver"],
        sp: 2,
        gold: 150,
        exp: 1800,
        sp_spent: 8,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 30
        },
        description: "[ 2 Charges ] Give target ally 20% of your Critical Damage for 5 Turns, 3 MP",
        conversions: [
    { source: "Crit DMG%", ratio: 0.2, resulting_stat: "Crit DMG%" },
    ],
        
},
"Bend the Veil": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        PreReq: ["Death Weaver"],
        sp: 2,
        gold: 150,
        exp: 1800,
        sp_spent: 8,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 30
        },
        description: "[ 1 Charge ] Give self 50% MATK of Heal and gain 25% Heal for 9 Turns, 3 MP",
        conversions: [
    { source: "HEAL", ratio: 0.5, resulting_stat: "MATK" },
    { source: "HEAL", ratio: 0.25, resulting_stat: "HEAL" },
    ],
        
},
"Divine Shield": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        Tag: "30Guard",
        BlockedTag: "30Guard",
        sp: 2,
        gold: 150,
        exp: 1800,
        sp_spent: 8,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 30
        },
        description: "[ Passive ] Increase self DEF by 15% Healpower. Reduce self Healpower by 4%.",
        conversions: [
    { source: "HEAL", ratio: 0.15, resulting_stat: "DEF" },
    { source: "HEAL", ratio: -0.04, resulting_stat: "HEAL" },
    ],
        
},
"Greater Heal 2": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        sp: 2,
        gold: 200,
        exp: 2500,
        sp_spent: 14,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 40
        },
        description: "Recover Target Life by 10,000+13% Healpower, 9 MP",
        
},
"Greater Restore 1": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        sp: 2,
        gold: 200,
        exp: 2500,
        sp_spent: 14,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 40
        },
        description: "Recover Party HP by 12,000+12% Healpower, 24 MP",
        
},
"Lesser Regeneration": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: true,
            free_turn: false
        },
        sp: 2,
        gold: 200,
        exp: 2500,
        sp_spent: 14,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 40
        },
        description: "[ 1 Charge ] Give target ally HP Regen equal to 6% Heal for 10 Turns, 8 MP",
        conversions: [
    { source: "HEAL", ratio: 0.6, resulting_stat: "HP Regen" },
    ],
        
},
"Lifeflow Surge": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        sp: 2,
        gold: 200,
        exp: 2500,
        sp_spent: 14,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 40
        },
        description: "[ 1 Charge ] Recover Target Life by 100% Heal, reduces self global healing by 75% for 6 Turns, 3 MP",
        
},
"Lifeburst Surge": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        sp: 2,
        gold: 200,
        exp: 2500,
        sp_spent: 14,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 40
        },
        description: "[ 1 Charge ] Heal Party HP by 40% Heal, reduces self global healing by 75% for 6 Turns, 6 MP",
        
},
"Group Resist Fire": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        sp: 2,
        gold: 200,
        exp: 2500,
        sp_spent: 14,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 40
        },
        description: "[ 2 Charge ] Increase group Fire Resist by 50% for 4 Turns, 12 MP",
        stats: {
    "Fire Res%": 0.5,
    },
        
},
"Group Resist Wind": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        sp: 2,
        gold: 200,
        exp: 2500,
        sp_spent: 14,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 40
        },
        description: "[ 2 Charge ] Increase group Wind Resist by 50% for 4 Turns, 12 MP",
        stats: {
    "Water Res%": 0.5,
    },
        
},
"Group Resist Water": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        sp: 2,
        gold: 200,
        exp: 2500,
        sp_spent: 14,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 40
        },
        description: "[ 2 Charge ] Increase group Water Resist by 50% for 4 Turns, 12 MP",
        stats: {
    "Earth Res%": 0.5,
    },
        
},
"Group Resist Lightning": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        sp: 2,
        gold: 200,
        exp: 2500,
        sp_spent: 14,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 40
        },
        description: "[ 2 Charge ] Increase group Lightning Resist by 50% for 4 Turns, 12 MP",
        stats: {
    "Lightning Res%": 0.5,
    },
        
},
"Group Resist Earth": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        sp: 2,
        gold: 200,
        exp: 2500,
        sp_spent: 14,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 40
        },
        description: "[ 2 Charge ] Increase group Earth Resist by 50% for 4 Turns, 12 MP",
        stats: {
    "Wind Res%": 0.5,
    },
        
},
"Mana Transfer 2": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        sp: 2,
        gold: 200,
        exp: 2500,
        sp_spent: 14,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 40
        },
        description: "[ 1 Charge ] Give target ally 16 MP, costs 30 MP",
        
},
"Blessed Aim": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: true,
            free_turn: false
        },
        sp: 2,
        gold: 200,
        exp: 2500,
        sp_spent: 14,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 40
        },
        description: "[ 1 Charge ] Increased target ally Crit Chance by 5% for rest of battle, 8 MP",
        stats: {
    "Crit Chance%": 0.05,
    },
        
},
"Conviction": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        sp: 2,
        gold: 200,
        exp: 2500,
        sp_spent: 14,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 40
        },
        description: "[ 1 Charge ] Increases self MATK by 75% Heal for 5 Turns, 16 MP",
        conversions: [
    { source: "HEAL", ratio: 0.75, resulting_stat: "MATK" },
    ],
        
},
"Sanctuary": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        sp: 2,
        gold: 200,
        exp: 2500,
        sp_spent: 14,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 40
        },
        description: "[ 2 Charges ] Increase group DEF by 20% Heal but reduce self Heal by 20% for 12 Turns, 15 MP",
        conversions: [
    { source: "HEAL", ratio: 0.2, resulting_stat: "DEF" },
    { source: "HEAL", ratio: -0.2, resulting_stat: "HEAL" },
    ],
        
},
"Message of Vita": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: true,
            free_turn: false
        },
        PreReq: ["Emissary of Life"],
        sp: 2,
        gold: 225,
        exp: 3200,
        sp_spent: 16,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 50
        },
        description: "[ 1 Charge ] Reduce target ally threat generated by 15% for the rest of the battle, 12 MP",
        stats: {
    "Threat%": -0.15,
    },
        
},
"Message of Eris": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: true,
            free_turn: false
        },
        PreReq: ["Emissary of Fortune"],
        sp: 2,
        gold: 225,
        exp: 3200,
        sp_spent: 16,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 50
        },
        description: "[ 1 Charge ] Raise target ally Crit Chance by 15% for the rest of the battle, 12 MP",
        stats: {
    "Crit Chance%": 0.15,
    },
        
},
"Message of Ares": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: true,
            free_turn: false
        },
        PreReq: ["Emissary of War"],
        sp: 2,
        gold: 225,
        exp: 3200,
        sp_spent: 16,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 50
        },
        description: "[ 1 Charge ] Raise target ally MATK equal to 10% Heal for the rest of the battle, 12 MP",
        conversions: [
    { source: "HEAL", ratio: 0.1, resulting_stat: "MATK" },
    ],
        
},
"Blessed Heal 1": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        sp: 3,
        gold: 250,
        exp: 4000,
        sp_spent: 22,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 70
        },
        description: "Recover Target Life by 30,000+25% Healpower, 12 MP",
        
},
"Greater Restore 2": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        sp: 3,
        gold: 250,
        exp: 4000,
        sp_spent: 22,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 70
        },
        description: "Recover Party HP by 30,000+16% Healpower, 35 MP",
        
},
"Regeneration": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: true,
            free_turn: false
        },
        sp: 3,
        gold: 250,
        exp: 4000,
        sp_spent: 22,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 70
        },
        description: "[ 1 Charge ] Give target ally HP Regen equal to 8% Heal for 10 Turns, 13 MP",
        conversions: [
    { source: "HEAL", ratio: 0.08, resulting_stat: "HP Regen" },
    ],
        
},
"Metamagic Silent": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 3,
        gold: 250,
        exp: 4000,
        sp_spent: 22,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 70
        },
        description: "[ ⧖ ] Reduce self generated threat by 95% for 1 Turn, 4 MP",
        stats: {
    "Threat%": -0.95,
    },
        
},
"Group Flame Ward": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        sp: 3,
        gold: 250,
        exp: 4000,
        sp_spent: 22,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 70
        },
        description: "[ 1 Charge ] Increase group Fire Resist by 50% for 4 Turns, 16 MP",
        stats: {
    "Fire Res%": 0.5,
    },
        
},
"Group Gale Ward": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        sp: 3,
        gold: 250,
        exp: 4000,
        sp_spent: 22,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 70
        },
        description: "[ 1 Charge ] Increase group Wind Resist by 50% for 4 Turns, 16 MP",
        stats: {
    "Water Res%": 0.5,
    },
        
},
"Group Aqua Ward": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        sp: 3,
        gold: 250,
        exp: 4000,
        sp_spent: 22,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 70
        },
        description: "[ 1 Charge ] Increase group Water Resist by 50% for 4 Turns, 16 MP",
        stats: {
    "Earth Res%": 0.5,
    },
        
},
"Group Storm Guard": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        sp: 3,
        gold: 250,
        exp: 4000,
        sp_spent: 22,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 70
        },
        description: "[ 1 Charge ] Increase group Lightning Resist by 50% for 4 Turns, 16 MP",
        stats: {
    "Lightning Res%": 0.5,
    },
        
},
"Group Terra Guard": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        sp: 3,
        gold: 250,
        exp: 4000,
        sp_spent: 22,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 70
        },
        description: "[ 1 Charge ] Increase group Earth Resist by 50% for 4 Turns, 16 MP",
        stats: {
    "Wind Res%": 0.5,
    },
        
},
"Mana Transfer 3": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        sp: 3,
        gold: 250,
        exp: 4000,
        sp_spent: 22,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 70
        },
        description: "[ 1 Charge ] Give target ally 24 MP, costs 36 MP",
        
},
"Divine Infusion": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: true,
            free_turn: false
        },
        sp: 3,
        gold: 250,
        exp: 4000,
        sp_spent: 22,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 70
        },
        description: "[ 1 Charge ] Increased target ally MATK by 15% Heal for 5 Turns, 16 MP",
        conversions: [
    { source: "HEAL", ratio: 0.15, resulting_stat: "MATK" },
    ],
        
},
"Metamagic Bless": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 3,
        gold: 250,
        exp: 4000,
        sp_spent: 22,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 70
        },
        description: "[ ⧖ ] Increase self Heal by 50% for 1 Turn. Costs 1% Current MP, minimum 10 MP",
        conversions: [
    { source: "HEAL", ratio: 0.5, resulting_stat: "HEAL" },
    ],
        
},
"Favor of the Gods": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        sp: 3,
        gold: 250,
        exp: 4000,
        sp_spent: 22,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 70
        },
        description: "[ 1 Charge ] Increase group Crit Chance by 15% for 5 Turns, 18 MP",
        stats: {
    "Crit Chance%": 0.15,
    },
        
},
"Melody of Apollo": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        PreReq: ["Mark of Apollo"],
        sp: 3,
        gold: 300,
        exp: 5000,
        sp_spent: 26,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 85
        },
        description: "[ ⧖ ] Give party Crit Damage equal to 60% of self Holy Damage for 10 Turns. Costs 4% Current MP. Minimum 10 MP.",
        conversions: [
    { source: "Holy%", ratio: 0.6, resulting_stat: "Crit DMG%" },
    ],
        
},
"Melancholy of Hades": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        PreReq: ["Mark of Hades"],
        sp: 3,
        gold: 300,
        exp: 5000,
        sp_spent: 26,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 85
        },
        description: "[ 1 Charge ] Give party Crit Damage equal to 45% of self Negative Damage for rest of battle.",
        conversions: [
    { source: "Neg%", ratio: 0.45, resulting_stat: "Crit DMG%" },
    ],
        
},
"Aria of Demeter": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        PreReq: ["Mark of Demeter"],
        sp: 3,
        gold: 300,
        exp: 5000,
        sp_spent: 26,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 85
        },
        description: "Give party HP Regen equal to 30% of self Healpower for 4 turns. 15 Turn Cooldown.",
        conversions: [
    { source: "HEAL", ratio: 0.3, resulting_stat: "HP Regen" },
    ],
        
},
"Blessed Heal 2": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        sp: 3,
        gold: 350,
        exp: 6000,
        sp_spent: 48,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 100
        },
        description: "Recover Target Life by 100,000+50% Healpower, 16 MP",
        
},
"Divine Restoration 1": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        sp: 3,
        gold: 350,
        exp: 6000,
        sp_spent: 48,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 100
        },
        description: "Recover Party HP by 100k+40% Healpower, 45 MP",
        
},
"Greater Regeneration": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: true,
            free_turn: false
        },
        sp: 3,
        gold: 350,
        exp: 6000,
        sp_spent: 48,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 100
        },
        description: "[ 1 Charge ] Give target ally HP Regen equal to 9% Heal for 10 Turns, 20 MP",
        conversions: [
    { source: "HEAL", ratio: 0.09, resulting_stat: "HP Regen" },
    ],
        
},
"Divine Strength": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: true,
            free_turn: false
        },
        sp: 3,
        gold: 350,
        exp: 6000,
        sp_spent: 48,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 100
        },
        description: "[ 1 Charge ] Boost Target ATK by 45% Heal for 5 turns, 15 MP",
        conversions: [
    { source: "HEAL", ratio: 0.45, resulting_stat: "ATK" },
    ],
        
},
"Mana Infusion 1": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        sp: 3,
        gold: 350,
        exp: 6000,
        sp_spent: 48,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 100
        },
        description: "[ 1 Charge ] Give target ally 40 MP, costs 55 MP",
        
},
"Bless Magic Chain": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        sp: 3,
        gold: 350,
        exp: 6000,
        sp_spent: 48,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 100
        },
        description: "[ 1 Charge ] Increase self Heal by 50% for rest of battle. Consumes 50% mana.",
        conversions: [
    { source: "HEAL", ratio: 0.5, resulting_stat: "HEAL" },
    ],
        
},
"Divine Barrier": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: true,
            free_turn: true
        },
        sp: 3,
        gold: 350,
        exp: 6000,
        sp_spent: 48,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 100
        },
        description: "[ ⧖ ] Give target ally DEF equal to 100% Heal for 1 Turn, costs 6% of Max MP",
        conversions: [
    { source: "HEAL", ratio: 1, resulting_stat: "DEF" },
    ],
        
},
"Divine Fortress": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 3,
        gold: 350,
        exp: 6000,
        sp_spent: 48,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 100
        },
        description: "[ ⧖ ] Give party DEF equal to 65% Heal for 1 Turn, costs 9% of Max MP",
        conversions: [
    { source: "HEAL", ratio: 0.65, resulting_stat: "DEF" },
    ],
        
},
"Fortune Aura": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        sp: 3,
        gold: 350,
        exp: 6000,
        sp_spent: 48,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 100
        },
        description: "[ 1 Charge ] Increase party Crit Chance by 10% for rest of battle. 10% of Max MP.",
        stats: {
    "Crit Chance%": 0.1,
    },
        
},
"Flash Restoration": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 3,
        gold: 600,
        exp: 8000,
        sp_spent: 70,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 150
        },
        description: "[ ⧖, 5 Charges ] Recover Target Life by 100,000+30% Healpower, 20 MP",
        
},
"Time Mend": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 3,
        gold: 600,
        exp: 8000,
        sp_spent: 70,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 150
        },
        description: "[ ⧖, 1 Charge ] Recover Party HP by 100,000+35% Healpower, 80 MP",
        
},
"Nature Dominion": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 3,
        gold: 600,
        exp: 8000,
        sp_spent: 70,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 150
        },
        description: "[ ⧖ ] Debuff enemy Elemental Resist by 20%, 12 MP",
        stats: {
    "Elemental Pen%": 0.2,
    },
        
},
"Divine Hero": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        Tag: "HeroSoul",
        BlockedTag: "HeroSoul",
        sp: 3,
        gold: 600,
        exp: 8000,
        sp_spent: 70,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 150
        },
        description: "[ 1 Charge ] Increase self Healpower by 15% for the rest of the battle.",
        conversions: [
    { source: "HEAL", ratio: 0.15, resulting_stat: "HEAL" },
    ],
        
},
"Divine Restoration 2": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        PreReq: ["Divine Restoration 1"],
        sp: 3,
        gold: 750,
        exp: 10000,
        sp_spent: 75,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 160
        },
        description: "Recover Party HP by 115k+45% Healpower, 60 MP",
        
},
"Mana Infusion 2": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        PreReq: ["Mana Infusion 1"],
        sp: 3,
        gold: 750,
        exp: 10000,
        sp_spent: 75,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 160
        },
        description: "[ 1 Charge ] Give target ally 75 MP, costs 100 MP",
        
},
"Soul Infusion": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: true,
            free_turn: false
        },
        PreReq: ["Divine Infusion"],
        sp: 3,
        gold: 750,
        exp: 10000,
        sp_spent: 75,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 160
        },
        description: "[ 1 Charge ] Boost Target Power by 55% Heal for 5 turns, 30 MP",
        conversions: [
    { source: "HEAL", ratio: 0.55, resulting_stat: "POWER" },
    ],
        
},
"Metamagic Multi Bless": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        PreReq: ["Metamagic Bless"],
        sp: 3,
        gold: 750,
        exp: 10000,
        sp_spent: 75,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 160
        },
        description: "[ ⧖ ] Increase self Heal by 50% for 2 Turns. Costs 2% Current MP, minimum 20 MP",
        conversions: [
    { source: "HEAL", ratio: 0.5, resulting_stat: "HEAL" },
    ],
        
},
"True Soul Blessing": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: true,
            self_cast: false,
            free_turn: false
        },
        PreReq: ["Soul Exorcism"],
        sp: 3,
        gold: 750,
        exp: 10000,
        sp_spent: 75,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 160
        },
        description: "[ Holy ] Deals 900% Heal DMG. Ignores 20% Resist. Decrease self Healpower by 90% for 3 Turns. 32 MP",
        conversions: [
    { source: "HEAL", ratio: -0.9, resulting_stat: "HEAL" },
    ],
        dmg_stats: {...defaultDmgStats,    dmg_element: "Holy",     element: "Holy",     pen_element: "Holy",     stat: "HEAL",     ratio: 9, }
},
"True Soul Blight": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: true,
            self_cast: false,
            free_turn: false
        },
        PreReq: ["Soul Curse"],
        sp: 3,
        gold: 750,
        exp: 10000,
        sp_spent: 75,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 160
        },
        description: "[ Neg ] Deal 900% Heal DMG, Deals +10% Crit DMG. Decrease self Healpower by 90% for 3 Turns. 32 MP",
        conversions: [
    { source: "HEAL", ratio: -0.9, resulting_stat: "HEAL" },
    ],
        dmg_stats: {...defaultDmgStats,    dmg_element: "Neg",     element: "Neg",     pen_element: "Neg",     stat: "HEAL",     ratio: 9, }
},
"Nirvana Wind": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: true,
            self_cast: false,
            free_turn: false
        },
        PreReq: ["Samsara Light"],
        sp: 3,
        gold: 750,
        exp: 10000,
        sp_spent: 75,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 160
        },
        description: "[ Holy ] Deal 2000% Heal AOE DMG, cap 775% per Target. Ignores 20% Resist. Decrease self Healpower by 90% for 3 Turns. 38 MP",
        conversions: [
    { source: "HEAL", ratio: -0.9, resulting_stat: "HEAL" },
    ],
        dmg_stats: {...defaultDmgStats,    dmg_element: "Holy",     element: "Holy",     pen_element: "Holy",     stat: "HEAL",     ratio: 7.75, }
},
"Soul Devour": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: true,
            self_cast: false,
            free_turn: false
        },
        PreReq: ["Spirit Harvest"],
        sp: 3,
        gold: 750,
        exp: 10000,
        sp_spent: 75,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 160
        },
        description: "[ Neg ] Deal 2000% Heal AOE DMG, cap 775% per Target. Deals +10% Crit DMG. Decrease self Healpower by 90% for 3 Turns. 38 MP",
        conversions: [
    { source: "HEAL", ratio: -0.9, resulting_stat: "HEAL" },
    ],
        dmg_stats: {...defaultDmgStats,    dmg_element: "Neg",     element: "Neg",     pen_element: "Neg",     stat: "HEAL",     ratio: 7.75, }
},
"Shadow Orb": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: true,
            self_cast: false,
            free_turn: false
        },
        PreReq: ["Pandamonium"],
        sp: 3,
        gold: 750,
        exp: 10000,
        sp_spent: 75,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 160
        },
        description: "[ Void ] Deals 1100% Heal Damage, Decrease self Healpower by 90% for 3 Turns. 32 MP",
        conversions: [
    { source: "HEAL", ratio: -0.9, resulting_stat: "HEAL" },
    ],
        dmg_stats: {...defaultDmgStats,    dmg_element: "Void",     element: "Void",     pen_element: "Void",     stat: "HEAL",     ratio: 1100, }
},
"Shadow Horizon": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: true,
            self_cast: false,
            free_turn: false
        },
        PreReq: ["Armageddon"],
        sp: 3,
        gold: 750,
        exp: 10000,
        sp_spent: 75,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 160
        },
        description: "[ Void ] Deals 2400% Heal AOE Damage, cap 825% per Target, Decrease self Healpower by 90% for 3 Turns. 38 MP",
        conversions: [
    { source: "HEAL", ratio: -0.9, resulting_stat: "HEAL" },
    ],
        dmg_stats: {...defaultDmgStats,    dmg_element: "Void",     element: "Void",     pen_element: "Void",     stat: "HEAL",     ratio: 8.25, }
},
"Abyssal Curse": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: true,
            self_cast: false,
            free_turn: false
        },
        PreReq: ["Vita Collapse"],
        sp: 3,
        gold: 750,
        exp: 10000,
        sp_spent: 75,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 160
        },
        description: "[ Toxic ] Deals 850% Heal DMG, 5% Damage Done applied as DOT, Decrease self Healpower by 90% for 3 Turns. 35 MP",
        conversions: [
    { source: "HEAL", ratio: -0.9, resulting_stat: "HEAL" },
    ],
        dmg_stats: {...defaultDmgStats,    dmg_element: "Toxic",     element: "Toxic",     pen_element: "Toxic",     stat: "HEAL",     ratio: 8.5, }
},
"Realm of the Damned": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: true,
            self_cast: false,
            free_turn: false
        },
        PreReq: ["Blood Annihilation"],
        sp: 3,
        gold: 750,
        exp: 10000,
        sp_spent: 75,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 160
        },
        description: "[ Toxic ] Deal 2000% Heal AOE DMG, cap 725% per Target, 4% Damage Done applied as DOT, Decrease self Healpower by 90% for 3 Turns. 40 MP",
        conversions: [
    { source: "HEAL", ratio: -0.9, resulting_stat: "HEAL" },
    ],
        dmg_stats: {...defaultDmgStats,    dmg_element: "Toxic",     element: "Toxic",     pen_element: "Toxic",     stat: "HEAL",     ratio: 7.25, }
},
"Shadow Guard": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        PreReq: ["World Guardian"],
        sp: 3,
        gold: 200,
        exp: 4000,
        sp_spent: 20,
        class_levels: {
            tank_levels: 60,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, 3 Charges ] Raise party DEF by 444% Self DEF for 2 Turns",
        conversions: [
    { source: "DEF", ratio: 4.44, resulting_stat: "DEF" },
    ],
        
},
"Shadow's Edge": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        PreReq: ["World Slayer"],
        Tag: "WS Skill",
        BlockedTag: "WS Skill",
        sp: 3,
        gold: 200,
        exp: 4000,
        sp_spent: 20,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 60,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖ ] Raise self Slash Penetration by 66% of bonus Void DMG and gain +6% ATK for 1 Turn. Costs 2% of Max HP.",
        conversions: [
    { source: "Void%", ratio: 0.66, resulting_stat: "Slash Pen%" },
    { source: "ATK", ratio: 0.06, resulting_stat: "ATK" },
    ],
        
},
"Shadow's Point": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        PreReq: ["World Slayer"],
        Tag: "WS Skill",
        BlockedTag: "WS Skill",
        sp: 3,
        gold: 200,
        exp: 4000,
        sp_spent: 20,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 60,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖ ] Raise self Pierce Penetration by 66% of bonus Void DMG and +6% ATK for 1 Turn. Costs 2% of Max HP.",
        conversions: [
    { source: "Void%", ratio: 0.66, resulting_stat: "Pierce Pen%" },
    { source: "ATK", ratio: 0.06, resulting_stat: "ATK" },
    ],
        
},
"Shadow's Orbit": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        PreReq: ["World Slayer"],
        Tag: "WS Skill",
        BlockedTag: "WS Skill",
        sp: 3,
        gold: 200,
        exp: 4000,
        sp_spent: 20,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 60,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖ ] Raise self Blunt Penetration by 66% of bonus Void DMG and +6% ATK for 1 Turn. Costs 2% of Max HP.",
        conversions: [
    { source: "Void%", ratio: 0.66, resulting_stat: "Blunt Pen%" },
    { source: "ATK", ratio: 0.06, resulting_stat: "ATK" },
    ],
        
},
"Shadow Reversal": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: true,
            free_turn: false
        },
        PreReq: ["World Mender"],
        sp: 3,
        gold: 200,
        exp: 4000,
        sp_spent: 20,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 60
        },
        description: "[ 2 Charges ] Give Target Life Regen equal to 30% Healpower for 6 Turns.",
        conversions: [
    { source: "HEAL", ratio: 0.3, resulting_stat: "HP Regen" },
    ],
        
},
"Shadow Break Crush": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: true,
            self_cast: false,
            free_turn: true
        },
        PreReq: ["World Champion"],
        sp: 3,
        gold: 200,
        exp: 4000,
        sp_spent: 20,
        class_levels: {
            tank_levels: 30,
            warrior_levels: 30,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, Void ] Deals 160%/350% ATK/DEF Damage, scales with Highest Phys DMG, -10% Damage Taken for 1 Turn, 3 Turn Cooldown, Costs 10% of Max HP",
        stats: {
    "DMG Res%": 0.1,
    },
        dmg_stats: {...defaultDmgStats,    dmg_element: "Void",     element: "Highest Phys",     pen_element: "Void", }
},
"Shadow Energy": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        PreReq: ["World Liberator"],
        sp: 3,
        gold: 200,
        exp: 4000,
        sp_spent: 20,
        class_levels: {
            tank_levels: 30,
            warrior_levels: 0,
            caster_levels: 30,
            healer_levels: 0
        },
        description: "[ 1 Charge ] Restore 4 MP for each point of Void Resist, raise self MATK by 30% for 18 Turns",
        conversions: [
    { source: "Void Res%", ratio: 4, resulting_stat: "MP" },
    { source: "MATK", ratio: 0.3, resulting_stat: "MATK" },
    ],
        
},
"Shadow Restoration": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        PreReq: ["World Preserver"],
        sp: 3,
        gold: 200,
        exp: 4000,
        sp_spent: 20,
        class_levels: {
            tank_levels: 30,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 30
        },
        description: "[ 3 Charges ] Heal Party HP by 50K+50% Heal, +25% Threat Generated. Give party HP regen equal to 5% of Heal for 10 turns. 20 MP",
        conversions: [
    { source: "HEAL", ratio: 0.05, resulting_stat: "HP Regen" },
    ],
        
},
"Shadow Fusion Order": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        PreReq: ["World Conqueror"],
        sp: 2,
        gold: 200,
        exp: 4000,
        sp_spent: 20,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 30,
            caster_levels: 30,
            healer_levels: 0
        },
        description: "[ ⧖ ] Raise self ATK by 150% MATK for 9 Turns. 20 MP",
        conversions: [
    { source: "MATK", ratio: 1.5, resulting_stat: "ATK" },
    ],
        
},
"Shadow Fusion Chaos": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        PreReq: ["World Conqueror"],
        sp: 2,
        gold: 200,
        exp: 4000,
        sp_spent: 20,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 30,
            caster_levels: 30,
            healer_levels: 0
        },
        description: "[ ⧖ ] Raise self MATK by 150% ATK for 9 Turns. 20 MP",
        conversions: [
    { source: "ATK", ratio: 1.5, resulting_stat: "MATK" },
    ],
        
},
"Shadow World": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        PreReq: ["World Overseer"],
        sp: 3,
        gold: 200,
        exp: 4000,
        sp_spent: 20,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 30,
            caster_levels: 0,
            healer_levels: 30
        },
        description: "[ 1 Charge ] Raise Party DEF by 10% Heal and Raise self ATK by 65% Healpower for rest of battle. 12 MP",
        conversions: [
    { source: "HEAL", ratio: 0.1, resulting_stat: "DEF" },
    { source: "HEAL", ratio: 0.65, resulting_stat: "ATK" },
    ],
        
},
"Shadow Speech": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: true,
            self_cast: false,
            free_turn: true
        },
        PreReq: ["World Emissary"],
        sp: 3,
        gold: 200,
        exp: 4000,
        sp_spent: 20,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 30,
            healer_levels: 30
        },
        description: "[ ⧖ ] Break target armor by 80%. Lose 100% of Self Crit Chance for 8 turns. 12 Turn Cooldown.",
        conversions: [
    { source: "Crit Chance%", ratio: -1, resulting_stat: "Crit Chance%" },
    ],
        dmg_stats: {...defaultDmgStats,}
},
"Shadow Cloak": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: true,
            free_turn: false
        },
        PreReq: ["Void Guardian"],
        sp: 3,
        gold: 200,
        exp: 4000,
        sp_spent: 20,
        class_levels: {
            tank_levels: 60,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ 1 Charge ] Reduce target ally threat generated by 70%. Lasts for entire battle.",
        stats: {
    "Threat%": 0.7,
    },
        
},
"Shadow Slayer's Form": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        PreReq: ["Void Slayer"],
        sp: 3,
        gold: 200,
        exp: 4000,
        sp_spent: 20,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 60,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ 1 Charge ] Give self DMG Multiplier equal to 40% of ATK Multiplier and reduce DMG Taken by 20% for rest of the battle. However can no longer land Critical Hits.",
        stats: {
    "DMG Res%": 0.2,
    "Crit Chance%": -99.99,
    },
        conversions: [
    { source: "ATK%", ratio: 0.4, resulting_stat: "Dmg%" },
    ],
        
},
"Shadow Realm": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        PreReq: ["Void Disaster"],
        sp: 2,
        gold: 200,
        exp: 4000,
        sp_spent: 20,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 60,
            healer_levels: 0
        },
        description: "[ 1 Charge ] Raise party MATK by 25% Self MATK and raise self DEF/MATK by 10% MATK for rest of battle.",
        conversions: [
    { source: "MATK", ratio: 0.35, resulting_stat: "MATK" },
    { source: "MATK", ratio: 0.1, resulting_stat: "DEF" },
    ],
        
},
"Shadow's Embrace": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: true,
            free_turn: false
        },
        PreReq: ["Void Mender"],
        sp: 3,
        gold: 200,
        exp: 4000,
        sp_spent: 20,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 60
        },
        description: "[ 3 Charges ] Give target ally HP Regen equal to 6% Heal and Power by 25% Heal for rest of battle. Lose 10% Healpower stacking. 20 MP.",
        conversions: [
    { source: "HEAL", ratio: 0.06, resulting_stat: "HP Regen" },
    { source: "HEAL", ratio: 0.25, resulting_stat: "POWER" },
    ],
        stack_conversions: [
    { source: "HEAL", ratio: -0.1, resulting_stat: "HEAL" },
    ],
        
},
"Shadow God's Form": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        PreReq: ["Void Champion"],
        sp: 3,
        gold: 200,
        exp: 4000,
        sp_spent: 20,
        class_levels: {
            tank_levels: 30,
            warrior_levels: 30,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ 1 Charge ] Raise self Crit Chance and Crit Damage by 20%/100% Void Damage respectively for rest of battle. Gain HP Barrier equal to 250% Max HP. Starts on 7 Turn Cooldown.",
        conversions: [
    { source: "Void%", ratio: 0.2, resulting_stat: "Crit Chance%" },
    { source: "Void%", ratio: 1, resulting_stat: "Crit DMG%" },
    { source: "HP", ratio: 2.5, resulting_stat: "Temp HP" },
    ],
        
},
"Shadow Overload": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        PreReq: ["Void Liberator"],
        sp: 3,
        gold: 200,
        exp: 4000,
        sp_spent: 20,
        class_levels: {
            tank_levels: 30,
            warrior_levels: 0,
            caster_levels: 30,
            healer_levels: 0
        },
        description: "[ ⧖ ] Gain MP/MP Degen equal to 25%/5% of Max MP. MP Degen stacks for rest of battle. Increase self MATK by 25% for 5 Turns.",
        conversions: [
    { source: "MP", ratio: 0.25, resulting_stat: "MP" },
    { source: "MP", ratio: -0.05, resulting_stat: "MP Regen" },
    { source: "MATK", ratio: 0.25, resulting_stat: "MATK" },
    ],
        
},
"Shadow Presence": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: true,
            free_turn: false
        },
        PreReq: ["Void Preserver"],
        sp: 3,
        gold: 200,
        exp: 4000,
        sp_spent: 20,
        class_levels: {
            tank_levels: 30,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 30
        },
        description: "[ 1 Charge ] Raise target ally threat generated by 30%. Increase self DEF by 30%. Lasts entire battle.",
        stats: {
    "Threat%": 0.3,
    },
        conversions: [
    { source: "DEF", ratio: 0.3, resulting_stat: "DEF" },
    ],
        
},
"Shadow Scales Order": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        PreReq: ["Void Conqueror"],
        sp: 2,
        gold: 200,
        exp: 4000,
        sp_spent: 20,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 30,
            caster_levels: 30,
            healer_levels: 0
        },
        description: "[ 1 Charge ] Raise self ATK by 125% MATK, lose 100% MATK, for rest of battle.",
        conversions: [
    { source: "MATK", ratio: 1.25, resulting_stat: "ATK" },
    { source: "MATK", ratio: -1, resulting_stat: "MATK" },
    ],
        
},
"Shadow Scales Chaos": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        PreReq: ["Void Conqueror"],
        sp: 2,
        gold: 200,
        exp: 4000,
        sp_spent: 20,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 30,
            caster_levels: 30,
            healer_levels: 0
        },
        description: "[ 1 Charge ] Raise self MATK by 125% ATK, lose 100% ATK, for rest of battle.",
        conversions: [
    { source: "ATK", ratio: 1.25, resulting_stat: "MATK" },
    { source: "ATK", ratio: -1, resulting_stat: "ATK" },
    ],
        
},
"Shadow Drain": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: true,
            free_turn: false
        },
        PreReq: ["Void Overseer"],
        sp: 3,
        gold: 200,
        exp: 4000,
        sp_spent: 20,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 30,
            caster_levels: 0,
            healer_levels: 30
        },
        description: "Increase self ATK by 100% Heal for the rest of battle on first use. Ally loses DEF equal to 75% Heal for 8 Turns. Gain 50 MP.",
        conversions: [
    { source: "HEAL", ratio: 1, resulting_stat: "ATK" },
    ],
        stack_conversions: [
    { source: "HEAL", ratio: -0.75, resulting_stat: "DEF" },
    ],
        
},
"Arcane Shadow Mark": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        PreReq: ["Void Emissary"],
        Tag: "VE Skill",
        BlockedTag: "VE Skill",
        sp: 3,
        gold: 200,
        exp: 4000,
        sp_spent: 20,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 30,
            healer_levels: 30
        },
        description: "[ ⧖ ] Apply Shadow Mark to enemy. Max 1 Mark per enemy. Increase self MATK by 7%. Breaks 7% Armor. Stacking for rest of battle. 8 MP.",
        stack_conversions: [
    { source: "MATK", ratio: 0.07, resulting_stat: "MATK" },
    ],
        
},
"Divine Shadow Mark": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        PreReq: ["Void Emissary"],
        Tag: "VE Skill",
        BlockedTag: "VE Skill",
        sp: 3,
        gold: 200,
        exp: 4000,
        sp_spent: 20,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 30,
            healer_levels: 30
        },
        description: "[ ⧖ ] Apply Shadow Mark to enemy. Max 1 Mark per enemy. Increase self Heal by 7%. Breaks 7% Armor. Stacking for rest of battle. 8 MP.",
        stack_conversions: [
    { source: "HEAL", ratio: 0.07, resulting_stat: "HEAL" },
    ],
        
},
"Spirit Guard": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        PreReq: ["Spirit Guardian"],
        sp: 3,
        gold: 200,
        exp: 4000,
        sp_spent: 20,
        class_levels: {
            tank_levels: 60,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ 1 Charge ] Give target ally 50% of self DEF. Lose 50% DEF. Lasts for entire battle.",
        conversions: [
    { source: "DEF", ratio: -0.5, resulting_stat: "DEF" },
    ],
        
},
"Spirit Garment of Light": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        PreReq: ["Spirit Slayer"],
        sp: 2,
        gold: 120,
        exp: 2500,
        sp_spent: 20,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 60,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "Give self Crit Damage of 300% Holy Resist for 16 Turns. 10 MP.",
        conversions: [
    { source: "Holy Res%", ratio: 3, resulting_stat: "Crit DMG%" },
    ],
        
},
"Spirit Garment of Death": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        PreReq: ["Spirit Slayer"],
        sp: 2,
        gold: 120,
        exp: 2500,
        sp_spent: 20,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 60,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "Give self Crit Damage of 300% Negative Resist for 16 Turns. 10 MP.",
        conversions: [
    { source: "Neg Res%", ratio: 3, resulting_stat: "Crit DMG%" },
    ],
        
},
"Spirit Soul Curse": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        PreReq: ["Spirit Disaster"],
        Tag: "SD Skill",
        BlockedTag: "SD Skill",
        sp: 3,
        gold: 200,
        exp: 4000,
        sp_spent: 20,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 60,
            healer_levels: 0
        },
        description: "[ ⧖ ] Apply Spirit Curse to target enemy. Max 1 Curse per enemy. Debuff target Holy Resist by 10% Self Holy Pen. Increases self crit chance by 5%. Stacking for rest of battle. 8 MP.",
        stack_stats: {
    "Crit Chance%": 0.05,
    },
        conversions: [
    { source: "Holy Pen%", ratio: 0.1, resulting_stat: "Holy Pen%" },
    ],
        
},
"Spirit Nether Curse": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        PreReq: ["Spirit Disaster"],
        Tag: "SD Skill",
        BlockedTag: "SD Skill",
        sp: 3,
        gold: 200,
        exp: 4000,
        sp_spent: 20,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 60,
            healer_levels: 0
        },
        description: "[ ⧖ ] Apply Spirit Curse to target enemy. Max 1 Curse per enemy. Debuff target Negative Resist by 12% Self Negative Pen. Increases self crit chance by 3%. Stacking for rest of battle. 8 MP.",
        stack_stats: {
    "Crit Chance%": 0.03,
    },
        conversions: [
    { source: "Holy Pen%", ratio: 0.12, resulting_stat: "Holy Pen%" },
    ],
        
},
"Spirit Thread": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        PreReq: ["Spirit Mender"],
        sp: 3,
        gold: 200,
        exp: 4000,
        sp_spent: 20,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 60
        },
        description: "[ 1 Charge ] Give target ally +5 MP Regen. Lose 5 Self MP a Turn. Lasts for 30 Turns.",
        stats: {
    "MP Regen": -5,
    },
        
},
"Spirit Form": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        PreReq: ["Spirit Champion"],
        sp: 3,
        gold: 200,
        exp: 4000,
        sp_spent: 20,
        class_levels: {
            tank_levels: 30,
            warrior_levels: 30,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ 1 Charge ] Raises self Crit Damage by 400% Void Resist and reduce damage taken by 15% for 12 Turns.",
        stats: {
    "DMG Res%": 0.15,
    },
        conversions: [
    { source: "Void Res%", ratio: 4, resulting_stat: "Crit DMG%" },
    ],
        
},
"Spirit Garb": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        PreReq: ["Spirit Liberator"],
        sp: 3,
        gold: 200,
        exp: 4000,
        sp_spent: 20,
        class_levels: {
            tank_levels: 30,
            warrior_levels: 0,
            caster_levels: 30,
            healer_levels: 0
        },
        description: "[ 3 Charges ] Give target ally DEF equal to 100% MATK for 6 Turns. Lose 5 MP a Turn while someone has this buff. 10 MP.",
        stats: {
    "MP Regen": -5,
    },
        conversions: [
    { source: "MATK", ratio: 1, resulting_stat: "DEF" },
    ],
        
},
"Spirit Memory": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        PreReq: ["Spirit Preserver"],
        sp: 3,
        gold: 200,
        exp: 4000,
        sp_spent: 20,
        class_levels: {
            tank_levels: 30,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 30
        },
        description: "[ 1 Charge ] Give target ally temporary MP equal to self Starting MP for 8 Turns.",
        conversions: [
    { source: "MP", ratio: 1, resulting_stat: "MP" },
    ],
        
},
"Spirit Catalyst": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        PreReq: ["Spirit Conqueror"],
        sp: 3,
        gold: 200,
        exp: 4000,
        sp_spent: 20,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 30,
            caster_levels: 30,
            healer_levels: 0
        },
        description: "[ 1 Charge ] Give self 10 MP Regen, but lose 5% of your max HP per turn for the rest of the battle.",
        stats: {
    "MP Regen": 10,
    },
        conversions: [
    { source: "HP", ratio: -0.05, resulting_stat: "HP Regen" },
    ],
        
},
"Spirit Lash": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: true,
            free_turn: false
        },
        PreReq: ["Spirit Overseer"],
        sp: 3,
        gold: 200,
        exp: 4000,
        sp_spent: 20,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 30,
            caster_levels: 0,
            healer_levels: 30
        },
        description: "Deal damage equal to 40% of self Max HP to target Ally, but raise their Crit Damage by 100% of Heal Multiplier for 4 Turns. 24 MP",
        conversions: [
    { source: "HP", ratio: -0.4, resulting_stat: "Temp HP" },
    { source: "HEAL%", ratio: 1, resulting_stat: "Crit DMG%" },
    ],
        
},
"Spirit Realm Gate": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        PreReq: ["Spirit Emissary"],
        sp: 3,
        gold: 200,
        exp: 4000,
        sp_spent: 20,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 30,
            healer_levels: 30
        },
        description: "[ 1 Charge ] Give party MP Regen equal to 2% of self Starting MP. Raise self MATK by 100% Healpower. Lasts 8 Turns.",
        conversions: [
    { source: "MP", ratio: 0.02, resulting_stat: "MP Regen" },
    { source: "HEAL", ratio: 1, resulting_stat: "MATK" },
    ],
        
},
"Celestial Guard": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: true,
            free_turn: true
        },
        PreReq: ["Celestial's Herald"],
        sp: 5,
        gold: 1000,
        exp: 10000,
        sp_spent: 45,
        class_levels: {
            tank_levels: 100,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, 1 Charge ] Target ally takes 85% less damage for 5 Turns.",
        stats: {
    "DMG Res%": 0.85,
    },
        
},
"Mark of the Devourer": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: true,
            self_cast: false,
            free_turn: true
        },
        PreReq: ["Devourer's Herald"],
        sp: 5,
        gold: 1000,
        exp: 10000,
        sp_spent: 45,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 100,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, 4 Charges, Void ] Deals 350% ATK DMG, scales to Max Phys DMG/Pen, increases self ATK by 50% for 3 hits. Gain HP Regen equal to 25% of Max HP for 1 turn.",
        conversions: [
    { source: "ATK", ratio: 0.5, resulting_stat: "ATK" },
    { source: "HP", ratio: 0.25, resulting_stat: "HP Regen" },
    ],
        dmg_stats: {...defaultDmgStats,    dmg_element: "Void",     element: "Highest Phys",     pen_element: "Highest Phys",     stat: "ATK",     ratio: 3.5, }
},
"Speech of Sin": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        PreReq: ["Sin's Herald"],
        sp: 5,
        gold: 1000,
        exp: 10000,
        sp_spent: 45,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 100,
            healer_levels: 0
        },
        description: "[ ⧖ ] Increases Void Damage by 100% for 4 Turns. Costs 2% Current MP",
        conversions: [
    { source: "Void%", ratio: 1, resulting_stat: "Void%" },
    ],
        
},
"Sephira's Martyr": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        PreReq: ["Sephira's Herald"],
        sp: 5,
        gold: 1000,
        exp: 10000,
        sp_spent: 45,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 100
        },
        description: "[ ⧖, 3 Charges ] Give target ally 45% damage reduction but you gain 100% self DMG Penalty. Lasts 4 Turns.",
        stats: {
    "DMG Res%": 0.45,
    "Dmg%": -1,
    },
        
},
"Blessing of Bahamut": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        PreReq: ["Bahamut's Herald"],
        sp: 5,
        gold: 1000,
        exp: 10000,
        sp_spent: 45,
        class_levels: {
            tank_levels: 50,
            warrior_levels: 50,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "Increases self Penvoid by 20% for 10 Turns. Gives +30% ATK/DEF for rest of battle on first use.",
        conversions: [
    { source: "Void Pen%", ratio: 0.2, resulting_stat: "Void Pen%" },
    { source: "ATK", ratio: 0.3, resulting_stat: "ATK" },
    { source: "DEF", ratio: 0.3, resulting_stat: "DEF" },
    ],
        
},
"Hatred of Tiamat": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        PreReq: ["Tiamat's Herald"],
        sp: 5,
        gold: 1000,
        exp: 10000,
        sp_spent: 45,
        class_levels: {
            tank_levels: 50,
            warrior_levels: 0,
            caster_levels: 50,
            healer_levels: 0
        },
        description: "[ ⧖ ] Increases self MATK by 66% for 5 Turns. Take damage equal to 15% of Max HP.",
        conversions: [
    { source: "MATK", ratio: 0.66, resulting_stat: "MATK" },
    ],
        
},
"Odin's Presence": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        PreReq: ["Odin's Herald"],
        sp: 5,
        gold: 1000,
        exp: 10000,
        sp_spent: 45,
        class_levels: {
            tank_levels: 50,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 50
        },
        description: "[ 1 Charge ] Increases self threat bonus by 100%, increases Heal by 50%. Lasts entire battle.",
        stats: {
    "Threat%": 1,
    },
        conversions: [
    { source: "HEAL", ratio: 0.5, resulting_stat: "HEAL" },
    ],
        
},
"Soul Reap": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: true,
            self_cast: false,
            free_turn: true
        },
        PreReq: ["Reaper's Herald"],
        sp: 5,
        gold: 1000,
        exp: 10000,
        sp_spent: 45,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 50,
            caster_levels: 50,
            healer_levels: 0
        },
        description: "[ ⧖, Void ] Deals 400% ATK + 400% MATK Damage. +33% Damage Multiplier for 3 Turns. 36 MP.",
        stats: {
    "Dmg%": 0.33,
    },
        dmg_stats: {...defaultDmgStats,    dmg_element: "Void",     element: "Void",     pen_element: "Void",     stat: "ATK",     ratio: 400,     stat2: "MATK",     ratio2: 400, }
},
"Gaia's Embrace": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        PreReq: ["Gaia's Herald"],
        sp: 5,
        gold: 1000,
        exp: 10000,
        sp_spent: 45,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 50,
            caster_levels: 0,
            healer_levels: 50
        },
        description: "[ 3 Charges ] Give party HP Regen equal to 25% of your Max HP for 5 Turns.",
        conversions: [
    { source: "HP", ratio: 0.25, resulting_stat: "HP Regen" },
    ],
        
},
"Goddess's Love": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        PreReq: ["Goddess's Herald"],
        sp: 3,
        gold: 500,
        exp: 6000,
        sp_spent: 45,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 50,
            healer_levels: 50
        },
        description: "[ ⧖ ] Give self Heal equal to 200% MATK. Lower MATK by 100%. Lasts for 4 hits.",
        conversions: [
    { source: "MATK", ratio: 2, resulting_stat: "HEAL" },
    { source: "MATK", ratio: -1, resulting_stat: "MATK" },
    ],
        
},
"Goddess's Wrath": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        PreReq: ["Goddess's Herald"],
        sp: 3,
        gold: 500,
        exp: 6000,
        sp_spent: 45,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 50,
            healer_levels: 50
        },
        description: "[ ⧖ ] Give self MATK equal to 200% Heal. Lower Heal by 100%. Lasts for 4 hits..",
        conversions: [
    { source: "HEAL", ratio: 2, resulting_stat: "MATK" },
    { source: "HEAL", ratio: -1, resulting_stat: "HEAL" },
    ],
        
},
"Rage against Heaven": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        PreReq: ["Celestial's Anathema"],
        sp: 5,
        gold: 1000,
        exp: 10000,
        sp_spent: 45,
        class_levels: {
            tank_levels: 100,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ 1 Charge ] Give self Crit Damage equal to 0.25% of DEF for rest of battle.",
        conversions: [
    { source: "DEF", ratio: 0.0025, resulting_stat: "Crit DMG%" },
    ],
        
},
"Become Vengeance": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        PreReq: ["Devourer's Anathema"],
        sp: 5,
        gold: 1000,
        exp: 10000,
        sp_spent: 45,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 100,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ 1 Charge ] Give self Crit Damage equal to current MP. Lasts entire battle.",
        conversions: [
    { source: "MP", ratio: 1, resulting_stat: "Crit DMG%" },
    ],
        
},
"Weight of Sin": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: true,
            free_turn: false
        },
        PreReq: ["Sin's Anathema"],
        sp: 5,
        gold: 1000,
        exp: 10000,
        sp_spent: 45,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 100,
            healer_levels: 0
        },
        description: "[ 1 Charge ] Target Ally and Self takes HP Degen equal to 6% self Max HP. Gain 66% MATK. Lasts entire battle.",
        conversions: [
    { source: "MATK", ratio: 0.66, resulting_stat: "MATK" },
    { source: "HP", ratio: -0.06, resulting_stat: "HP Regen" },
    ],
        
},
"Angel of Repentance": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        PreReq: ["Sephira's Anathema"],
        Tag: "SA Skill",
        BlockedTag: "SA Skill",
        sp: 5,
        gold: 1000,
        exp: 10000,
        sp_spent: 45,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 100
        },
        description: "Give self Holy Penetration equal to 10% of Holy Damage for rest of battle. Holy DMG inflicts 5% as DOT for 6 Turns, stacking up to 25%. 4 Turn Cooldown.",
        stats: {
    "Holy DOT%": 0.05,
    },
        conversions: [
    { source: "Holy%", ratio: 0.1, resulting_stat: "Holy Pen%" },
    ],
        
},
"Angel of Death": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        PreReq: ["Sephira's Anathema"],
        Tag: "SA Skill",
        BlockedTag: "SA Skill",
        sp: 5,
        gold: 1000,
        exp: 10000,
        sp_spent: 45,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 100
        },
        description: "[ 1 Charge ] Give self Negative Penetration equal to 8% of Negative Damage for rest of battle.",
        conversions: [
    { source: "Neg%", ratio: 0.08, resulting_stat: "Neg Pen%" },
    ],
        
},
"Wrath of Bahamut": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        PreReq: ["Bahamut's Anathema"],
        sp: 5,
        gold: 1000,
        exp: 10000,
        sp_spent: 45,
        class_levels: {
            tank_levels: 50,
            warrior_levels: 50,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ 1 Charge ] Give self Crit Damage equal to 200% Void Damage and +15% DEF for rest of battle.",
        conversions: [
    { source: "Void%", ratio: 2, resulting_stat: "Crit DMG%" },
    { source: "DEF", ratio: 0.15, resulting_stat: "DEF" },
    ],
        
},
"Chromatic Fury": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        PreReq: ["Tiamat's Anathema"],
        Tag: "TA Skill",
        BlockedTag: "TA Skill",
        sp: 5,
        gold: 1000,
        exp: 10000,
        sp_spent: 45,
        class_levels: {
            tank_levels: 50,
            warrior_levels: 0,
            caster_levels: 50,
            healer_levels: 0
        },
        description: "[ ⧖ ] Debuff enemy Elemental Resist by 5% MATK Multiplier & gain +4% MATK stacking for entire battle. Costs 1% Current MP.",
        conversions: [
    { source: "MATK%", ratio: 0.05, resulting_stat: "Elemental Pen%" },
    ],
        stack_conversions: [
    { source: "MATK", ratio: 0.04, resulting_stat: "MATK" },
    ],
        
},
"Chromatic Judgement": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        PreReq: ["Tiamat's Anathema"],
        Tag: "TA Skill",
        BlockedTag: "TA Skill",
        sp: 5,
        gold: 1000,
        exp: 10000,
        sp_spent: 45,
        class_levels: {
            tank_levels: 50,
            warrior_levels: 0,
            caster_levels: 50,
            healer_levels: 0
        },
        description: "[ ⧖ ] Debuff enemy Divine Resist by 5% MATK Multiplier & gain +4% MATK stacking for entire battle. Costs 1% Current MP.",
        conversions: [
    { source: "MATK%", ratio: 0.05, resulting_stat: "Divine Pen%" },
    ],
        stack_conversions: [
    { source: "MATK", ratio: 0.04, resulting_stat: "MATK" },
    ],
        
},
"Vision of Ragnarok": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        PreReq: ["Odin's Anathema"],
        sp: 5,
        gold: 1000,
        exp: 10000,
        sp_spent: 45,
        class_levels: {
            tank_levels: 50,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 50
        },
        description: "[ 1 Charge ] Gain +20% Buff Multiplier. Suffer HP Degen equal to 9% Max HP. Lasts entire battle.",
        stats: {
    "Buff%": 0.2,
    },
        conversions: [
    { source: "HP", ratio: -0.09, resulting_stat: "HP Regen" },
    ],
        
},
"Reaper's Dice": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        PreReq: ["Reaper's Anathema"],
        sp: 5,
        gold: 1000,
        exp: 10000,
        sp_spent: 45,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 50,
            caster_levels: 50,
            healer_levels: 0
        },
        description: "[ 1 Charge ] Raise self Crit DMG by 7x your Crit Chance. Set self Crit Chance to 50%. Lasts entire battle.",
        conversions: [
    { source: "Crit Chance%", ratio: 7, resulting_stat: "Crit DMG%" },
    { source: "Post Crit Chance%", ratio: -0.5, resulting_stat: "Crit Chance%" },
    ],
        
},
"Titan Form": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        PreReq: ["Gaia's Anathema"],
        sp: 5,
        gold: 1000,
        exp: 10000,
        sp_spent: 45,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 50,
            caster_levels: 0,
            healer_levels: 50
        },
        description: "[ ⧖ ] Gives self DEF equal to 75% average of Heal and ATK. Raise self ATK by 75% and by 100% Heal. Lasts 9 Turns. 35 MP.",
        conversions: [
    { source: "Post ATK", ratio: 0.375, resulting_stat: "DEF" },
    { source: "Post HEAL", ratio: 0.375, resulting_stat: "DEF" },
    { source: "ATK", ratio: 0.75, resulting_stat: "ATK" },
    ],
        
},
"Embrace of the Goddess": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        PreReq: ["Goddess's Anathema"],
        Tag: "GA Skill",
        BlockedTag: "GA Skill",
        sp: 5,
        gold: 1000,
        exp: 10000,
        sp_spent: 45,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 50,
            healer_levels: 50
        },
        description: "[ 1 Charge ] Give party Temp HP equal to 250% Healpower for 5 Turns and HP Regen equal to 4% Heal but lose 15% Healpower for rest of the battle.",
        conversions: [
    { source: "HEAL", ratio: 2.5, resulting_stat: "Temp HP" },
    { source: "HEAL", ratio: 0.04, resulting_stat: "HP Regen" },
    { source: "HEAL", ratio: -0.15, resulting_stat: "HEAL" },
    ],
        
},
"Curse of the Goddess": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        PreReq: ["Goddess's Anathema"],
        Tag: "GA Skill",
        BlockedTag: "GA Skill",
        sp: 5,
        gold: 1000,
        exp: 10000,
        sp_spent: 45,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 50,
            healer_levels: 50
        },
        description: "[ ⧖ ] Apply Reality Curse to enemy. Max 1 Curse per enemy. Curse reduces enemy allres (except Void) by 4% Heal Multiplier. Costs 4% Current MP.",
        conversions: [
    { source: "HEAL%", ratio: 0.04, resulting_stat: "NonVoid Pen%" },
    ],
        
},
"Wrath of the Goddess": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        PreReq: ["Goddess's Anathema"],
        Tag: "GA Skill",
        BlockedTag: "GA Skill",
        sp: 5,
        gold: 1000,
        exp: 10000,
        sp_spent: 45,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 50,
            healer_levels: 50
        },
        description: "[ ⧖ ] Increase self Elemental and Holy Crit DMG by 75%. Gain 10% DEF. Lasts 2 Turns. Costs 4% Current MP. Minimum 40 MP.",
        conversions: [
    { source: "DEF", ratio: 0.1, resulting_stat: "DEF" },
    { source: "Crit DMG%", ratio: 0.75, resulting_stat: "Elemental Crit DMG%" },
    { source: "Crit DMG%", ratio: 0.75, resulting_stat: "Holy Crit DMG%" },
    ],
        
},
"Bone Armor": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 1,
        gold: 50,
        exp: 100,
        description: "[ ⧖ , 3 Charges ] Gain Temp HP equal to 100% DEF for 1 Turn",
        conversions: [
    { source: "DEF", ratio: 1, resulting_stat: "Temp HP" },
    ],
        
},
"The Hunger": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 1,
        gold: 50,
        exp: 100,
        description: "[ ⧖ , 4 Charges ] Gain ATK equal to 50% Max HP and HP Degen equal to 7% Max HP for 3 Turns",
        conversions: [
    { source: "HP", ratio: 0.5, resulting_stat: "ATK" },
    { source: "HP", ratio: -0.07, resulting_stat: "HP Regen" },
    ],
        
},
"Hawk Eyes": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 1,
        gold: 50,
        exp: 100,
        description: "[ ⧖ ] Gain Flat +40% Crit Chance and Flat +20% Physical/Void Armor Pen for 5 Turns",
        stats: {
    "Crit Chance%": 0.4,
    "Phys Armor Ignore%": 0.2,
    "Void Armor Ignore%": 0.2
    },
        
},
"Rune Spark": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: true,
            free_turn: false
        },
        sp: 1,
        gold: 50,
        exp: 100,
        description: "Raise target ally DEF by 15% of Self DEF and Self DEF by 10% for 30 Turns.",
        conversions: [
    { source: "DEF", ratio: 0.25, resulting_stat: "DEF" },
    ],
        
},
"Blood Rage": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 1,
        gold: 50,
        exp: 100,
        description: "[ ⧖ ] Raise self ATK and DEF by 20% for 4 Turns, costs 10% Max HP",
        conversions: [
    { source: "DEF", ratio: 0.2, resulting_stat: "DEF" },
    { source: "ATK", ratio: 0.2, resulting_stat: "ATK" },
    ],
        
},
"Shadow Meld": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 1,
        gold: 50,
        exp: 100,
        description: "[ ⧖ ] Reduce self Threat value by 50%. Gain flat +15% Crit Chance for 8 Turns.",
        stats: {
    "Crit Chance%": 0.15,
    },
        
},
"Cold Blood": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 1,
        gold: 50,
        exp: 100,
        description: "[ ⧖ ] Raise Crit Damage by 50% Elewater and 100% Reswater for 12 Turns, costs 10% Max HP",
        conversions: [
    { source: "Water%", ratio: 0.5, resulting_stat: "Crit DMG%" },
    { source: "Water Res%", ratio: 1, resulting_stat: "Crit DMG%" },
    ],
        
},
"Earth Flesh": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        sp: 1,
        gold: 50,
        exp: 100,
        description: "Raise self Max HP by 20% DEF and ATK by 10% DEF for rest of battle",
        conversions: [
    { source: "DEF", ratio: 0.2, resulting_stat: "HP" },
    { source: "DEF", ratio: 0.1, resulting_stat: "ATK" },
    ],
        
},
"Dragon Blood": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 1,
        gold: 50,
        exp: 100,
        description: "[ ⧖ , 3 Charges ] Raise Crit Damage by 100% MP for 3 Turns, and MP Degen equal to 2% Max MP for 5 Turns",
        conversions: [
    { source: "MP", ratio: 1, resulting_stat: "Crit DMG%" },
    { source: "MP", ratio: -0.02, resulting_stat: "MP Regen" },
    ],
        
},
"Shadow Eyes": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 1,
        gold: 50,
        exp: 100,
        description: "[ ⧖ ] Gain Flat +15% Magic Armor Pen and Flat +100% Crit Damage for 4 Turns",
        stats: {
    "Magic Armor Ignore%": 0.15,
    "Crit DMG%": 1,
    },
        
},
"Hell Ichor": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 1,
        gold: 50,
        exp: 100,
        description: "[ ⧖ ] Gain Flat +150% Crit DMG for 8 Turns and increase Self Crit DMG by 10% for 3 Turns, costs 10% Max HP. 8 Turn Cooldown.",
        stats: {
    "Crit DMG%": 1.5,
    },
        conversions: [
    { source: "Crit DMG%", ratio: 0.1, resulting_stat: "Crit DMG%" },
    ],
        
},
"Light Barrier": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 1,
        gold: 50,
        exp: 100,
        description: "[ ⧖ , 4 Charges ] Raise All Resist by 100% of Holy Resist for 1 Turn",
        conversions: [
    { source: "Holy Res%", ratio: 1, resulting_stat: "All Res%" },
    ],
        
},
"Blood Thirst": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 1,
        gold: 50,
        exp: 100,
        description: "[ ⧖ ] Raise ATK by 20% and HP Regen equal to 10% Max HP for 2 Turns.",
        conversions: [
    { source: "ATK", ratio: 0.2, resulting_stat: "ATK" },
    { source: "HP", ratio: 0.1, resulting_stat: "HP Regen" },
    ],
        
},
"Vermin Claw": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 1,
        gold: 50,
        exp: 100,
        description: "[ ⧖ ] Gain Physical/Toxic Damage equal to 40% Crit Damage for the next 2 hits.",
        conversions: [
    { source: "Crit DMG%", ratio: 0.4, resulting_stat: "Phys%" },
    { source: "Crit DMG%", ratio: 0.4, resulting_stat: "Toxic%" },
    ],
        
},
"Brute Onslaught": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 1,
        gold: 50,
        exp: 100,
        description: "[ ⧖ ] Gain Temp HP equal to 55% Max HP for 3 turns and Raise Self ATK by 33% for the next hit. 5 turn cooldown.",
        conversions: [
    { source: "HP", ratio: 0.55, resulting_stat: "Temp HP" },
    { source: "ATK", ratio: 0.33, resulting_stat: "ATK" },
    ],
        
},
"Hyper Regeneration": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 1,
        gold: 50,
        exp: 100,
        description: "[ ⧖ ] Raise HP Regen by 100% plus 6% of max HP for 3 Turns. 6 Turn Cooldown.",
        conversions: [
    { source: "HP Regen", ratio: 1, resulting_stat: "HP Regen" },
    { source: "HP", ratio: 0.06, resulting_stat: "HP Regen" },
    ],
        
},
"Steel Bristle": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 1,
        gold: 50,
        exp: 100,
        description: "[ ⧖ ] Raise physical damage by 15% of ATK Multiplier for 3 Turns, and gain Flat +50% Physical Resist for 1 Turn.",
        stats: {
    "Phys Res%": 0.5,
    },
        conversions: [
    { source: "ATK%", ratio: 0.15, resulting_stat: "Phys%" },
    ],
        
},
"Gore Charge": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 1,
        gold: 50,
        exp: 100,
        description: "[ ⧖ ] Raise self threat bonus by 100% for 5 turns and ATK by 25% for 1 Turn",
        stats: {
    "Threat%": 1,
    },
        conversions: [
    { source: "ATK", ratio: 0.25, resulting_stat: "ATK" },
    ],
        
},
"Flesh Voracity": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 1,
        gold: 50,
        exp: 100,
        description: "[ ⧖ , 3 Charges ] Raise self Crit Damage by 33% for 2 Turns and decrease DEF by 50% for 4 Turns.",
        conversions: [
    { source: "Crit DMG%", ratio: 0.33, resulting_stat: "Crit DMG%" },
    { source: "DEF", ratio: -0.5, resulting_stat: "DEF" },
    ],
        
},
"Berserker Fury": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        sp: 1,
        gold: 50,
        exp: 100,
        description: "Gain Temp HP equal to 50% Max HP for 10 Turns and Raise Self ATK by 15% for 8 Turns.",
        conversions: [
    { source: "HP", ratio: 0.5, resulting_stat: "Temp HP" },
    { source: "ATK", ratio: 0.15, resulting_stat: "ATK" },
    ],
        
},
"Ichor Surge": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 1,
        gold: 50,
        exp: 100,
        description: "[ ⧖ ] Raise self MATK by 25% for 3 turns, cost 15% of Max HP",
        conversions: [
    { source: "MATK", ratio: 0.25, resulting_stat: "MATK" },
    ],
        
},
"Last Prayer": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 1,
        gold: 50,
        exp: 100,
        description: "[ ⧖ , 3 Charges ] Give target ally Temp HP equal to 150% Healpower and HP Degen equal to 30% Healpower for 4 Turns. Raise self Healpower by 10% for 10 Turns.",
        conversions: [
    { source: "HEAL", ratio: 1.5, resulting_stat: "Temp HP" },
    { source: "HEAL", ratio: -0.3, resulting_stat: "HP Regen" },
    { source: "HEAL", ratio: 0.1, resulting_stat: "HEAL" },
    ],
        
},
"Warrior Spirit": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 1,
        gold: 50,
        exp: 100,
        description: "[ ⧖ ] Gain Flat +30% Physical Penetration for 3 Turns",
        stats: {
    "Phys Pen%": 0.3,
    },
        
},
"Hardpoint": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 1,
        gold: 50,
        exp: 100,
        description: "[ ⧖ , 12 Charges ] Raise self DEF by 50% and ATK by 50% DEF for 1 Turn",
        conversions: [
    { source: "DEF", ratio: 0.5, resulting_stat: "DEF" },
    { source: "DEF", ratio: 0.5, resulting_stat: "ATK" },
    ],
        
},
"Shaman Legacy": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        sp: 1,
        gold: 50,
        exp: 100,
        description: "Raise self MATK by 55% Healpower and vice-versa for 10 Turns.",
        conversions: [
    { source: "HEAL", ratio: 0.55, resulting_stat: "MATK" },
    { source: "MATK", ratio: 0.55, resulting_stat: "HEAL" },
    ],
        
},
"Primal Outburst": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 1,
        gold: 50,
        exp: 100,
        description: "[ ⧖ ] Raise Elemental DMG by 25% of Max MP, lose MP equal to 2% max MP for 5 Turns",
        conversions: [
    { source: "MP", ratio: 0.25, resulting_stat: "Elemental%" },
    ],
        
},
"Divine Beast": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        sp: 1,
        gold: 50,
        exp: 100,
        description: "Raise Magic DMG by 500% Crit Chance, and gain Flat +10% Crit Chance for 12 Turns",
        stats: {
    "Crit Chance%": 0.1,
    },
        conversions: [
    { source: "Crit Chance%", ratio: 5, resulting_stat: "Magic%" },
    ],
        
},
"Sky Fury": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 1,
        gold: 50,
        exp: 100,
        description: "[ ⧖ ] Raise Physical Damage by 325% Crit Chance and gain Flat +50% Crit Chance for 1 Turn, costs 25% Max HP",
        stats: {
    "Crit Chance%": 0.5,
    },
        conversions: [
    { source: "Crit Chance%", ratio: 3.25, resulting_stat: "Phys%" },
    ],
        
},
"Absorption": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        sp: 1,
        gold: 50,
        exp: 100,
        description: "[ 3 Charges ] Gain Flat +100% Physical Resist for 1 Turn and HP Regen equal to 10% Max HP for 10 Turns",
        stats: {
    "Phys Res%": 1,
    },
        conversions: [
    { source: "HP", ratio: 0.1, resulting_stat: "HP Regen" },
    ],
        
},
"Nature's Bounty": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        sp: 1,
        gold: 50,
        exp: 100,
        description: "Decrease Max HP by 50% and Raise HP Regen by 10% of Max HP for rest of the battle.",
        conversions: [
    { source: "HP", ratio: -0.5, resulting_stat: "HP" },
    { source: "HP", ratio: 0.1, resulting_stat: "HP Regen" },
    ],
        
},
"Omnisight": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 1,
        gold: 50,
        exp: 100,
        description: "[ ⧖ ] Gain Flat +30% Crit Chance, and +10% Crit Damage for 2 Turns",
        stats: {
    "Crit Chance%": 0.3,
    "Crit DMG%": 0.1,
    },
        
},
"Ethereal Shift": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 1,
        gold: 50,
        exp: 100,
        description: "[ ⧖ ] Gain Flat +60% Physical Resist and lose Flat -30% Elemental Resist for 3 Turns",
        stats: {
    "Phys Res%": 0.6,
    "Elemental Res%": -0.3,
    },
        
},
"True Sight": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        sp: 2,
        gold: 500,
        exp: 10000,
        description: "Gain Flat +10% Crit Chance and +20% Physical/Void Armor Pen for rest of battle.",
        stats: {
    "Crit Chance%": 0.1,
    "Phys Armor Ignore%": 0.2,
    "Void Armor Ignore%": 0.2
    },
        
},
"Rune Shift": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: true,
            free_turn: false
        },
        sp: 2,
        gold: 500,
        exp: 10000,
        description: "Increase target ally Power by 20% DEF, and self DEF by 5% stacking for rest of battle.",
        conversions: [
    { source: "DEF", ratio: 0.2, resulting_stat: "POWER" },
    ],
        stack_conversions: [
    { source: "DEF", ratio: 0.05, resulting_stat: "DEF" },
    ],
        
},
"Twilight Eyes": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        sp: 2,
        gold: 500,
        exp: 10000,
        description: "Gain Flat +15% Magic Armor Pen and Flat +100% Crit Damage for rest of battle.",
        stats: {
    "Magic Armor Ignore%": 0.15,
    "Crit DMG%": 1,
    },
        
},
"Divine Heritage": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        sp: 1,
        gold: 250,
        exp: 5000,
        description: "[ 1 Charge ] Gain Temp MP equal to 15% of Max MP and HP Degen equal to 6% of Max HP for 5 Turns.",
        conversions: [
    { source: "MP", ratio: 0.15, resulting_stat: "MP" },
    { source: "HP", ratio: -0.06, resulting_stat: "HP Regen" },
    ],
        
},
"Divine Awakening": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        sp: 1,
        gold: 250,
        exp: 5000,
        description: "Increase self MATK by 16% and reduce MP Regen by 1.5% of Max MP for rest of battle. Requires Divine Heritage active.",
        conversions: [
    { source: "MATK", ratio: 0.16, resulting_stat: "MATK" },
    { source: "MP", ratio: -0.015, resulting_stat: "MP Regen" },
    ],
        
},
"Unrelenting Hero": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        sp: 2,
        gold: 500,
        exp: 10000,
        description: "[ 1 Charge ] Gain Temp HP equal to 150% of Max HP and increase Max HP and Healpower by 10%/15% for rest of battle.",
        conversions: [
    { source: "HP", ratio: 1.5, resulting_stat: "Temp HP" },
    { source: "HP", ratio: 0.1, resulting_stat: "HP" },
    { source: "HEAL", ratio: 0.15, resulting_stat: "HEAL" },
    ],
        
},
"Avatar of War": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        sp: 2,
        gold: 500,
        exp: 10000,
        description: "[ 1 Charge ] Gain 5% Physical Penetration Multiplier for rest of battle.",
        stats: {
    "Phys xPen%": 0.05,
    },
        
},
"Omen of Death": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 2,
        gold: 500,
        exp: 10000,
        description: "[ ⧖ ] Apply Death Omen to Enemy. Reduce target physical resist by 100% self Negative Resist, Increase self DEF by 12% stacking for rest of battle",
        conversions: [
    { source: "Neg Res%", ratio: 1, resulting_stat: "Phys Pen%" },
    ],
        stack_conversions: [
    { source: "DEF", ratio: 0.12, resulting_stat: "DEF" },
    ],
        
},
"Lore of Death": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        sp: 2,
        gold: 500,
        exp: 10000,
        description: "Raise self Magic Damage by 444% of Negative Resist and self HP Regen by 33% of self Max HP for the rest of battle.",
        conversions: [
    { source: "Neg Res%", ratio: 4.44, resulting_stat: "Magic%" },
    { source: "HP", ratio: 0.33, resulting_stat: "HP Regen" },
    ],
        
},
"Rule of Death": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        sp: 2,
        gold: 500,
        exp: 10000,
        description: "Increase party Power and DEF by 20% of Max HP for rest of battle.",
        conversions: [
    { source: "HP", ratio: 0.2, resulting_stat: "POWER" },
    { source: "HP", ratio: 0.2, resulting_stat: "DEF" },
    ],
        
},
"Bloodrage Seal": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        sp: 2,
        gold: 500,
        exp: 10000,
        description: "Raise self ATK and DEF by 20% of ATK stacking for rest of battle. Costs 20/10% Max HP and MP.",
        conversions: [
    { source: "ATK", ratio: 0.2, resulting_stat: "ATK" },
    { source: "ATK", ratio: 0.2, resulting_stat: "DEF" },
    ],
        
},
"Shadow Merge": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 2,
        gold: 500,
        exp: 10000,
        description: "[ ⧖ , 2 Charges ] Reset self threat to 0, and Raise self Crit Damage by 100% for 1 Turn. Increase self Crit Damage by 50% for 13 Turns",
        conversions: [
    { source: "Crit DMG%", ratio: 0.5, resulting_stat: "Crit DMG%" },
    ],
        
},
"Frost Ichor": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        sp: 2,
        gold: 500,
        exp: 10000,
        description: "Raise self Penwater/Elewater by 50%/100% Reswater respectively for 10 Turns. Requires Cold Blood active.",
        conversions: [
    { source: "Water Res%", ratio: 0.5, resulting_stat: "Water Pen%" },
    { source: "Water Res%", ratio: 1, resulting_stat: "Water%" },
    ],
        
},
"Ice Flesh": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        sp: 2,
        gold: 500,
        exp: 10000,
        description: "Raise self Physical Damage by 200% Elewater/Reswater and self Max HP by 10% DEF for rest of battle.",
        conversions: [
    { source: "Water%", ratio: 2, resulting_stat: "Phys%" },
    { source: "Water Res%", ratio: 2, resulting_stat: "Phys%" },
    { source: "DEF", ratio: 0.1, resulting_stat: "HP" },
    ],
        
},
"Storm Flesh": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        sp: 2,
        gold: 500,
        exp: 10000,
        description: "Raise self Physical Damage by 350% Reswind and self Max HP by 10% DEF for rest of battle.",
        conversions: [
    { source: "Wind Res%", ratio: 3.5, resulting_stat: "Phys%" },
    { source: "DEF", ratio: 0.1, resulting_stat: "HP" },
    ],
        
},
"Titan Flesh": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        sp: 2,
        gold: 500,
        exp: 10000,
        description: "Increase self ATK by 100% of DEF and reduce self ATK by 100% for the rest of the battle.",
        conversions: [
    { source: "DEF", ratio: 1, resulting_stat: "ATK" },
    { source: "ATK", ratio: -1, resulting_stat: "ATK" },
    ],
        
},
"Aspect of the Devil": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 2,
        gold: 500,
        exp: 10000,
        description: "[ ⧖ ] Gain +30% Physical xPen and Raise self DEF by 100% for 6 Turns. Requires Hell Ichor active.",
        stats: {
    "Phys xPen%": 0.3,
    },
        conversions: [
    { source: "DEF", ratio: 1, resulting_stat: "DEF" },
    ],
        
},
"Flames of Gehenna": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        sp: 2,
        gold: 500,
        exp: 10000,
        description: "[ 1 Charge ] Raise self Elemental Damage by 120% of Elevoid for 36 Turns.",
        conversions: [
    { source: "Void%", ratio: 1.2, resulting_stat: "Elemental%" },
    ],
        
},
"Blaze of Uriel": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 2,
        gold: 500,
        exp: 10000,
        description: "[ ⧖ , 7 Charges ] Raise self Physical and Divine Pen by 150/75% Holy Pen for 5 Turns.",
        conversions: [
    { source: "Holy Pen%", ratio: 1.5, resulting_stat: "Phys Pen%" },
    { source: "Holy Pen%", ratio: 0.75, resulting_stat: "Divine Pen%" },
    ],
        
},
"Chalice of Raphael": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 2,
        gold: 500,
        exp: 10000,
        description: "[ ⧖ , 9 Charges ] Raise self Global Healing by 100% and Eleholy of MATK/Heal Multipliers by 100% for 2 Turns.",
        stats: {
    "Heal Effect%": 1,
    },
        conversions: [
    { source: "MATK%", ratio: 1, resulting_stat: "Holy%" },
    { source: "HEAL%", ratio: 1, resulting_stat: "Holy%" },
    ],
        
},
"Wings of Darkness": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 2,
        gold: 500,
        exp: 10000,
        description: "[ ⧖ , 3 Charges ] Raise All Resist by 100% self Negative Res for 2 Turns, and 666% All Element Damage by Negative Res the rest of the battle.",
        conversions: [
    { source: "Neg Res%", ratio: 1, resulting_stat: "All Res%" },
    { source: "Neg Res%", ratio: 6.66, resulting_stat: "All%" },
    ],
        
},
"Blood Lord Form": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        sp: 1,
        gold: 250,
        exp: 5000,
        description: "Raise self Max HP by 25% and MATK/ATK by 20% for the rest of the battle",
        conversions: [
    { source: "HP", ratio: 0.25, resulting_stat: "HP" },
    { source: "MATK", ratio: 0.2, resulting_stat: "MATK" },
    { source: "ATK", ratio: 0.2, resulting_stat: "ATK" },
    ],
        
},
"Blood Soul Release": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 1,
        gold: 250,
        exp: 5000,
        description: "[ ⧖ , 5 Charges ] Heal self by 100% Max HP. Raise self ATK/MATK by 80% for 3 Turns, decrease self Max HP by 15% for rest of battle stacking. Requires Blood Lord Form active",
        conversions: [
    { source: "ATK", ratio: 0.8, resulting_stat: "ATK" },
    { source: "MATK", ratio: 0.8, resulting_stat: "MATK" },
    ],
        stack_conversions: [
    { source: "HP", ratio: -0.15, resulting_stat: "HP" },
    ],
        
},
"Vermin Rage": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 2,
        gold: 500,
        exp: 10000,
        description: "[ ⧖ , 5 Charges ] Reduce self Physical Damage by 100% for 1 Turn, but Raise self Physical Damage by 100% Crit Damage for the next 2 hits.",
        conversions: [
    { source: "Phys%", ratio: -1, resulting_stat: "Phys%" },
    { source: "Crit DMG%", ratio: 1, resulting_stat: "Phys%" },
    ],
        
},
"Vermin Tide": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 2,
        gold: 500,
        exp: 10000,
        description: "[ ⧖ , 5 Charges ] Reduce self Toxic Damage by 100% for 1 Turn, but increase self Toxic Damage by 100% Crit Damage for the next 2 hits.",
        conversions: [
    { source: "Toxic%", ratio: -1, resulting_stat: "Toxic%" },
    { source: "Crit DMG%", ratio: 1, resulting_stat: "Toxic%" },
    ],
        
},
"Unending Rage": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 2,
        gold: 500,
        exp: 10000,
        description: "[ ⧖ ] Give self Temp HP equal to 35% Max HP for 3 Turns, and Raise self Physical DMG by 0.5% of Max HP for the next 2 hits. 12 Turn Cooldown",
        conversions: [
    { source: "HP", ratio: 0.35, resulting_stat: "Temp HP" },
    { source: "HP", ratio: 0.005, resulting_stat: "Phys%" },
    ],
        
},
"Immortal Blood": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        sp: 2,
        gold: 500,
        exp: 10000,
        description: "Raise self Max HP and self DEF by 100% for 20 Turns, and HP Regen by 500% for 3 Turns.",
        conversions: [
    { source: "HP", ratio: 1, resulting_stat: "HP" },
    { source: "DEF", ratio: 1, resulting_stat: "DEF" },
    { source: "HP Regen", ratio: 5, resulting_stat: "HP Regen" },
    ],
        
},
"Prismatic Bristle": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 2,
        gold: 500,
        exp: 10000,
        description: "[ ⧖ , 2 Charges ] Gain Flat +100% All Res for 1 Turn, and Raise self Physical Damage by 15% of ATK Multi for 2 Turns.",
        stats: {
    "All Res%": 1,
    },
        conversions: [
    { source: "ATK%", ratio: 0.15, resulting_stat: "Phys%" },
    ],
        
},
"Primal Fury": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 2,
        gold: 500,
        exp: 10000,
        description: "[ ⧖ ] Raise self Threat Bonus by 50% stacking for 10 turns, and ATK/DEF by 25% for 5 Turns.",
        stack_stats: {
    "Threat%": 0.5,
    },
        conversions: [
    { source: "ATK", ratio: 0.25, resulting_stat: "ATK" },
    { source: "DEF", ratio: 0.25, resulting_stat: "DEF" },
    ],
        
},
"Devouring Voracity": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 2,
        gold: 500,
        exp: 10000,
        description: "[ ⧖ ] Apply Devour Mark to enemy. Raise self Crit Damage by 50% for 3 Turns, but decrease DEF by 15% stacking for rest of battle.",
        conversions: [
    { source: "Crit DMG%", ratio: 0.5, resulting_stat: "Crit DMG%" },
    ],
        stack_conversions: [
    { source: "DEF", ratio: -0.15, resulting_stat: "DEF" },
    ],
        
},
"Bloodzerker State": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        sp: 2,
        gold: 500,
        exp: 10000,
        description: "Heal self for 40% Max HP. Decrease self HP Regen by 5% Max HP for 8 Turns. Raise self ATK by 10% stacking for rest of battle.",
        conversions: [
    { source: "HP", ratio: -0.05, resulting_stat: "HP Regen" },
    ],
        stack_conversions: [
    { source: "ATK", ratio: 0.1, resulting_stat: "ATK" },
    ],
        
},
"Nanocore Release": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 2,
        gold: 500,
        exp: 10000,
        description: "[ ⧖ ] Raise self Main Stats by 50% DEF for 12 Turns, but decrease self Power by 40% DEF for 6 turns after.",
        conversions: [
    { source: "DEF", ratio: 0.5, resulting_stat: "POWER" },
    { source: "DEF", ratio: 0.5, resulting_stat: "DEF" },
    ],
        
},
"Shamanic Spirit": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 2,
        gold: 500,
        exp: 10000,
        description: "[ ⧖ , 5 Charges ] Raise self MATK by 125% Healpower and vice-versa for 5 Turns",
        conversions: [
    { source: "MATK%", ratio: 1.25, resulting_stat: "HEAL" },
    { source: "HEAL", ratio: 1.25, resulting_stat: "MATK" },
    ],
        
},
"Spirit Lord Dominion": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 2,
        gold: 500,
        exp: 10000,
        description: "[ ⧖ ] Raise self Elemental Pen by 5% of Max MP, but gain MP Degen equal to 0.6% of Max MP for 10 Turns.",
        conversions: [
    { source: "MP", ratio: 0.05, resulting_stat: "Elemental Pen%" },
    { source: "MP", ratio: -0.006, resulting_stat: "MP Regen" },
    ],
        
},
"Kami Awakening": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 2,
        gold: 500,
        exp: 10000,
        description: "[ ⧖ ] Gain Flat 40% Crit Chance, and Raise Elemental DMG by 300% Void DMG for 1 Turn. Costs 4%/1% Max HP/MP. Requires Divine Beast active.",
        stats: {
    "Crit Chance%": 0.4,
    },
        conversions: [
    { source: "Void%", ratio: 3, resulting_stat: "Elemental%" },
    ],
        
},
"Rage of the Yokai": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 2,
        gold: 500,
        exp: 10000,
        description: "[ ⧖ ] Gain Flat 750% Crit Chance/Damage for 4 Turns, but -250% Crit Chance for 4 Turns after.",
        stats: {
    "Crit Chance%": 7.5,
    "Crit DMG%": 7.5,
    },
        
},
"Nightmare Form": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 2,
        gold: 500,
        exp: 10000,
        description: "[ ⧖ , 3 Charges ] Raise self Negative Pen by 100% for 1 Turn and lose flat -100% All Res for 2 Turns. Requires Ethereal Shift active.",
        stats: {
    "All Res%": -1,
    },
        conversions: [
    { source: "Neg Pen%", ratio: 1, resulting_stat: "Neg Pen%" },
    ],
        
},
"True Predator": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 2,
        gold: 500,
        exp: 10000,
        description: "[ ⧖ ] Raise self Pierce DMG by 150% Crit Damage for 1 Turn and reduce Self Threat Generation by 75% for 8 Turns",
        stats: {
    "Threat%": -0.75,
    },
        conversions: [
    { source: "Crit DMG%", ratio: 1.5, resulting_stat: "Pierce%" },
    ],
        
},
"Solidify Form": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 2,
        gold: 500,
        exp: 10000,
        description: "[ ⧖ ] Raise self ATK by 40% of Max HP for 5 Turns, but decrease HP Regen by 4% of Max HP for 10 Turns. Requires Absorbption active.",
        conversions: [
    { source: "HP", ratio: 0.4, resulting_stat: "ATK" },
    { source: "HP", ratio: -0.04, resulting_stat: "HP Regen" },
    ],
        
},
"Rapid Digestion": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 2,
        gold: 500,
        exp: 10000,
        description: "[ ⧖ ] Increase self Max HP by 15% stacking for rest of battle, but decrease HP regen by 4% Max HP for 10 Turns. Requires Absorption active.",
        conversions: [
    { source: "HP", ratio: -0.04, resulting_stat: "HP Regen" },
    ],
        stack_conversions: [
    { source: "HP", ratio: 0.15, resulting_stat: "HP" },
    ],
        
},
"Acid Reflux": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 2,
        gold: 500,
        exp: 10000,
        description: "[ ⧖ ] Raise self Toxic DMG by 55% for 3 Turns, but decrease HP Regen by 6% Max HP for 6 Turns. Requires Absorption active.",
        conversions: [
    { source: "Toxic%", ratio: 0.55, resulting_stat: "Toxic%" },
    { source: "HP", ratio: -0.06, resulting_stat: "HP Regen" },
    ],
        
},
"Gaia's Vision": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        sp: 2,
        gold: 500,
        exp: 10000,
        description: "Gain flat +25% Buff Effectiveness, but gain Flat -50% Crit Chance penalty for rest of battle.",
        stats: {
    "Buff%": 0.25,
    "Crit Chance%": -0.5,
    },
        
},
"Gaia's Fury": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 2,
        gold: 500,
        exp: 10000,
        description: "[ ⧖ ] Raise Blunt Penetration by 100% Earth Res for 2 Turns, and self Max HP by 10% for rest of battle.",
        conversions: [
    { source: "Earth Res%", ratio: 1, resulting_stat: "Blunt Pen%" },
    { source: "HP", ratio: 0.1, resulting_stat: "HP" },
    ],
        
},
"Dragon Blood Surge": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        sp: 1,
        gold: 250,
        exp: 5000,
        description: "[ 1 Charge ] Raise self DEF by 66% for 2 Turns. Costs 12% Max HP",
        conversions: [
    { source: "DEF", ratio: 0.66, resulting_stat: "DEF" },
    ],
        
},
"Dragon Lord Form": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        sp: 1,
        gold: 250,
        exp: 5000,
        description: "Raise self ATK and DEF by 10% for rest of battle. Requires Dragon Blood Surge active.",
        conversions: [
    { source: "ATK", ratio: 0.1, resulting_stat: "ATK" },
    { source: "DEF", ratio: 0.1, resulting_stat: "DEF" },
    ],
        
},
"Dragon Strength": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        gold: 50,
        exp: 2000,
        description: "[ ⧖ ] Raise self ATK by 20% for 6 Turns and ATK by 5% Stacking for 7 Turns, costs 10% Max HP. Requires Dragon Lord Form active",
        conversions: [
    { source: "ATK", ratio: 0.2, resulting_stat: "ATK" },
    ],
        stack_conversions: [
    { source: "ATK", ratio: 0.05, resulting_stat: "ATK" },
    ],
        
},
"Dragon Haki": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        gold: 50,
        exp: 2000,
        description: "Gain flat +75% All Resist for 1 Turn, and raise Self Crit Damage by 15% for 12 Turns. Requires Dragon Lord Form active",
        stats: {
    "All Res%": 0.75,
    },
        conversions: [
    { source: "Crit DMG%", ratio: 0.15, resulting_stat: "Crit DMG%" },
    ],
        
},
"Dragon Mana Surge": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        sp: 1,
        gold: 250,
        exp: 5000,
        description: "[ 1 Charge ] Raise self DEF by 66% for 2 Turns. Costs 12% Max HP",
        conversions: [
    { source: "DEF", ratio: 0.66, resulting_stat: "DEF" },
    ],
        
},
"Sovereign Form": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        sp: 1,
        gold: 250,
        exp: 5000,
        description: "Raise self MATK and DEF by 10% for rest of battle. Requires Dragon Mana Surge active.",
        conversions: [
    { source: "MATK", ratio: 0.1, resulting_stat: "MATK" },
    { source: "DEF", ratio: 0.1, resulting_stat: "DEF" },
    ],
        
},
"Soul Barrier": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        gold: 50,
        exp: 2000,
        description: "[ ⧖, 1 Charge ] Raise target ally DEF by 12% MATK for rest of battle. Costs 10%/2.5% of Max HP/MP",
        conversions: [
    { source: "MATK", ratio: 0.12, resulting_stat: "DEF" },
    ],
        
},
"Soul Scales": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: true,
            free_turn: true
        },
        gold: 50,
        exp: 2000,
        description: "[ ⧖, 1 Charge ] Raise self DEF by 18% MATK for rest of battle. Costs 10%/2.5% of Max HP/MP",
        conversions: [
    { source: "MATK", ratio: 0.18, resulting_stat: "DEF" },
    ],
        
},
"Soul Burst": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        gold: 50,
        exp: 2000,
        description: "[ ⧖ ] Raise self MATK by 20% for 1 Turn, and 10% MATK Stacking for 7 Turns. 6 Turn Cooldown. Costs 1% of Current and Max MP.",
        conversions: [
    { source: "MATK", ratio: 0.2, resulting_stat: "MATK" },
    ],
        stack_conversions: [
    { source: "MATK", ratio: 0.1, resulting_stat: "MATK" },
    ],
        
},
"Fox Mirage": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 1,
        gold: 50,
        exp: 100,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖ , 12 Turn CD ] Gain 90% Damage Reduction, decreasing by 30% each turn until it ends at 0%.",
        stats: {
    "DMG Res%": 0.9,
    },
        stack_stats: {
    "DMG Res%": -0.3,
    },
        
},
"Nine Tails Inferno": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        sp: 2,
        gold: 500,
        exp: 10000,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖ ] Apply Foxfire Mark to target enemy. Max 1 Foxfire Mark per enemy. Debuff target AllRes by 20% of average Penslash and Penfire. Breaks 25% armor. Costs 5% Max MP, minimum 28 MP.",
        conversions: [
    { source: "Post Slash Pen%", ratio: 0.1, resulting_stat: "All Pen%" },
    { source: "Post Fire Pen%", ratio: 0.1, resulting_stat: "All Pen%" },
    ],
        
},
"Succubus Entrancement": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: true,
            free_turn: true
        },
        sp: 1,
        gold: 50,
        exp: 100,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖ ] Give target ally Temporary HP equal to 50% Max HP for 2 Turns. 6 turn cooldown. 12 MP",
        conversions: [
    { source: "HP", ratio: 0.5, resulting_stat: "Temp HP" },
    ],
        
},
"Succubus Skill Boost": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: true,
            free_turn: false
        },
        sp: 2,
        gold: 500,
        exp: 10000,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "Deal damage equal to 40% Max HP to target Ally, but raise their Crit Damage by 1% of self Max HP for 4 Turns. Costs 5%/2% Max HP/MP, minimum 12 MP.",
        conversions: [
    { source: "HP", ratio: 0.01, resulting_stat: "Crit DMG%" },
    ],     
}};

const statSet = new Set<string>()
const convSet = new Set<string>()

for (const entry of Object.values(skill_data)) {
    Object.keys(entry.stats).forEach(stat => statSet.add(stat))
    entry.conversions.forEach(conv => {
        convSet.add(conv.source)
        convSet.add(conv.resulting_stat)
    })
}

// inject precomputed widths
const __columnWidths = computeColumnWidths(skill_data)
const __allStatNames = Array.from(statSet).sort()
const __allConversionNames = Array.from(convSet).sort()

// export both
export { skill_data, __columnWidths, __allStatNames, __allConversionNames }
