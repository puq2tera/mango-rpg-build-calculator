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
    stats: Record<string, number>
    stack_stats: Record<string, number>
    conversions: Array<{
        source: string
        ratio: number
        resulting_stat: string
    }>
    stack_conversions: Array<{
        source: string
        ratio: number
        resulting_stat: string
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
    PreReq: [""],
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
    "Sword Slash": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
            self_cast: false,
            free_turn: false
        },
        gold: 25,
        exp: 25,
        description: "[ Slash ] Deal 80% ATK DMG",
        dmg_stats: {...defaultDmgStats,
            dmg_element: "Slash", 
            element: "Slash", 
            pen_element: "Slash", 
            stat: "ATK", 
            ratio: 0.8, 
        }
},
"Axe Slash": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
            self_cast: false,
            free_turn: false
        },
        gold: 25,
        exp: 25,
        description: "[ Slash ] Deal 80% ATK DMG",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Slash",     element: "Slash",     pen_element: "Slash",     stat: "ATK",     ratio: 0.8, }
},
"Spear Thrust": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
            self_cast: false,
            free_turn: false
        },
        gold: 25,
        exp: 25,
        description: "[ Pierce ] Deal 80% ATK DMG",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Pierce",     element: "Pierce",     pen_element: "Pierce",     stat: "ATK",     ratio: 0.8, }
},
"Arrow Shot": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
            self_cast: false,
            free_turn: false
        },
        gold: 25,
        exp: 25,
        description: "[ Pierce ] Deal 80% ATK DMG",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Pierce",     element: "Pierce",     pen_element: "Pierce",     stat: "ATK",     ratio: 0.8, }
},
"Mace Smash": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
            self_cast: false,
            free_turn: false
        },
        gold: 25,
        exp: 25,
        description: "[ Blunt ] Deal 80% ATK DMG",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Blunt",     element: "Blunt",     pen_element: "Blunt",     stat: "ATK",     ratio: 0.8, }
},
"Staff Smash": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
            self_cast: false,
            free_turn: false
        },
        gold: 25,
        exp: 25,
        description: "[ Blunt ] Deal 80% ATK DMG",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Blunt",     element: "Blunt",     pen_element: "Blunt",     stat: "ATK",     ratio: 0.8, }
},
"Punch": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
            self_cast: false,
            free_turn: true
        },
        PreReq: ["Default Skill"],
        description: "[ ⧖, Blunt ] Punch helplessly for 25% ATK DMG",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Blunt",     element: "Blunt",     pen_element: "Blunt",     stat: "ATK",     ratio: 0.25, }
},
"Wait": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: false,
            self_cast: false,
            free_turn: false
        },
        PreReq: ["Default Skill"],
        description: "Pass your team's turn.",
        
},
"Focus": {...defaultSkill,
        type: {
            is_buff: true,
            is_attack: false,
            self_cast: false,
            free_turn: true
        },
        PreReq: ["Default Skill"],
        description: "[ ⧖ ] Heal self for 5% of Max HP and regain 10% of Max Focus. Increase Focus Regen by 15% of Focus Cap for 1 Turn.",
        
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
        dmg_stats: {...defaultDmgStats,    stat: "DEF",     ratio: 3.6, }
},
"Body Slam": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
            self_cast: false,
            free_turn: false
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
        description: "[ Blunt ] Deal 65% ATK DMG, 150% DEF Threat",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Blunt",     element: "Blunt",     pen_element: "Blunt",     stat: "ATK",     ratio: 0.65, }
},
"Blunt Sunder 1": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
            self_cast: false,
            free_turn: false
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
        description: "[ Blunt ] Deals 70%/50% ATK/DEF DMG, Breaks 5% Armor",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Blunt",     element: "Blunt",     pen_element: "Blunt",     stat: "ATK",     ratio: 0.7,     stat2: "DEF",     ratio2: 0.5, }
},
"Slash Sunder 1": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
            self_cast: false,
            free_turn: false
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
        description: "[ Slash ] Deals 70%/50% ATK/DEF DMG, Breaks 5% Armor",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Slash",     element: "Slash",     pen_element: "Slash",     stat: "ATK",     ratio: 0.7,     stat2: "DEF",     ratio2: 0.5, }
},
"Pierce Sunder 1": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
            self_cast: false,
            free_turn: false
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
        description: "[ Pierce ] Deals 70%/50% ATK/DEF DMG, Breaks 5% Armor",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Pierce",     element: "Pierce",     pen_element: "Pierce",     stat: "ATK",     ratio: 0.7,     stat2: "DEF",     ratio2: 0.5, }
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
"MA Sunder": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
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
        description: "[ Blunt ] Deals 90% ATK DMG, Breaks 7% Armor, 1 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Blunt",     element: "Blunt",     pen_element: "Blunt",     stat: "ATK",     ratio: 0.9, }
},
"Blunt Sunder EX": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
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
        description: "[ Blunt, 2 Charges ] Deals 100% DEF DMG, Breaks 35% Armor",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Blunt",     element: "Blunt",     pen_element: "Blunt",     stat: "DEF",     ratio: 1, }
},
"Slash Sunder EX": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
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
        description: "[ Slash, 2 Charges ] Deals 100% DEF DMG, Breaks 35% Armor",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Slash",     element: "Slash",     pen_element: "Slash",     stat: "DEF",     ratio: 1, }
},
"Pierce Sunder EX": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
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
        description: "[ Pierce, 2 Charges ] Deals 100% DEF DMG, Breaks 35% Armor",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Pierce",     element: "Pierce",     pen_element: "Pierce",     stat: "DEF",     ratio: 1, }
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
        
},
"Blunt Sunder 2": {...defaultSkill,
        type: {
            is_buff: false,
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
        description: "[ Blunt, 4 Charges ] Deals 100% DEF DMG, Breaks 15% Armor",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Blunt",     element: "Blunt",     pen_element: "Blunt",     stat: "DEF",     ratio: 1, }
},
"Slash Sunder 2": {...defaultSkill,
        type: {
            is_buff: false,
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
        description: "[ Slash, 4 Charges ] Deals 100% DEF DMG, Breaks 15% Armor",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Slash",     element: "Slash",     pen_element: "Slash",     stat: "DEF",     ratio: 1, }
},
"Pierce Sunder 2": {...defaultSkill,
        type: {
            is_buff: false,
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
        description: "[ Pierce, 4 Charges ] Deals 100% DEF DMG, Breaks 15% Armor",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Pierce",     element: "Pierce",     pen_element: "Pierce",     stat: "DEF",     ratio: 1, }
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
"MA Titan Swing": {...defaultSkill,
        type: {
            is_buff: false,
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
        description: "[ Blunt ] Inflicts 240% ATK AOE, Cap 80% per Target, +50% Threat Generated, 2 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Blunt",     element: "Blunt",     pen_element: "Blunt",     stat: "ATK",     ratio: 0.8, }
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
        
},
"Sunder Cleave": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
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
        description: "[ Blunt, 3 Charges ] Deals 200% ATK AOE, cap 100% per Target, Breaks 25% Armor",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Blunt",     element: "Blunt",     pen_element: "Blunt",     stat: "ATK",     ratio: 1, }
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
        
},
"MA Fury Strike": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
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
        description: "[ Blunt ] Deal 130% DEF DMG, 3 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Blunt",     element: "Blunt",     pen_element: "Blunt",     stat: "DEF",     ratio: 1.3, }
},
"MA Fury Slash": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
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
        description: "[ Slash ] Deal 130% DEF DMG, 3 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Slash",     element: "Slash",     pen_element: "Slash",     stat: "DEF",     ratio: 1.3, }
},
"MA Fury Thrust": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
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
        description: "[ Pierce ] Deal 130% DEF DMG, 3 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Pierce",     element: "Pierce",     pen_element: "Pierce",     stat: "DEF",     ratio: 1.3, }
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
        
},
"MA Fury Blows": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
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
        description: "[ Blunt ] Deal 130% DEF DMG, Breaks 8% Armor, 4 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Blunt",     element: "Blunt",     pen_element: "Blunt",     stat: "DEF",     ratio: 1.3, }
},
"MA Fury Swipes": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
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
        description: "[ Slash ] Deal 130% DEF DMG, Breaks 8% Armor, 4 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Slash",     element: "Slash",     pen_element: "Slash",     stat: "DEF",     ratio: 1.3, }
},
"MA Fury Jabs": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
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
        description: "[ Pierce ] Deal 130% DEF DMG, Breaks 8% Armor, 4 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Pierce",     element: "Pierce",     pen_element: "Pierce",     stat: "DEF",     ratio: 1.3, }
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
        dmg_stats: {...defaultDmgStats,    stat: "DEF",     ratio: 8, }
},
"MA Eyes of Hatred": {...defaultSkill,
        type: {
            is_buff: false,
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
        description: "Inflicts 880% DEF Threat, 10 MP",
        dmg_stats: {...defaultDmgStats,    stat: "DEF",     ratio: 8, }
},
"MA Hatred Nexus": {...defaultSkill,
        type: {
            is_buff: false,
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
        description: "Inflicts 265% DEF Threat per Enemy, 12 MP",
        dmg_stats: {...defaultDmgStats,    stat: "DEF",     ratio: 2.65, }
},
"Nightmare Crush": {...defaultSkill,
        type: {
            is_buff: false,
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
        description: "[ Void, 4 Charges ] Deals 400% DEF DMG, Breaks 35% Armor",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Void",     element: "Void",     pen_element: "Void",     stat: "DEF",     ratio: 4, }
},
"Horror Whirlwind": {...defaultSkill,
        type: {
            is_buff: false,
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
        description: "[ Void, 2 Charges ] Deals 800% DEF AOE, cap 280% per Target, Breaks 30% Armor",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Void",     element: "Void",     pen_element: "Void",     stat: "DEF",     ratio: 2.8, }
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
        
},
"MA God Fury Blows": {...defaultSkill,
        type: {
            is_buff: false,
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
        description: "[ Blunt ] Deal 300% DEF DMG and 180% ATK DMG, Breaks 4% Armor, +10% Penetration, 9 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Blunt",     element: "Blunt",     pen_element: "Blunt",     stat: "DEF",     ratio: 3,     stat2: "ATK",     ratio2: 1.8, }
},
"MA God Fury Slash": {...defaultSkill,
        type: {
            is_buff: false,
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
        description: "[ Slash ] Deal 300% DEF DMG and 180% ATK DMG, Breaks 4% Armor, +10% Penetration,  9 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Slash",     element: "Slash",     pen_element: "Slash",     stat: "DEF",     ratio: 3,     stat2: "ATK",     ratio2: 1.8, }
},
"MA God Fury Thrust": {...defaultSkill,
        type: {
            is_buff: false,
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
        description: "[ Pierce ] Deal 300% DEF DMG and 180% ATK DMG, Breaks 4% Armor, +10% Penetration,  9 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Pierce",     element: "Pierce",     pen_element: "Pierce",     stat: "DEF",     ratio: 3,     stat2: "ATK",     ratio2: 1.8, }
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
        
},
"MA Heavy Slash": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
            self_cast: false,
            free_turn: false
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
        description: "[ Slash ] Deal 110% ATK DMG, +40% Crit Chance, 6 Focus",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Slash",     element: "Slash",     pen_element: "Slash",     stat: "ATK",     ratio: 1.1, }
},
"MA Heavy Shot": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
            self_cast: false,
            free_turn: false
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
        description: "[ Pierce ] Deal 100% ATK DMG, +40% Crit Chance, +5% Crit Damage, 6 Focus",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Pierce",     element: "Pierce",     pen_element: "Pierce",     stat: "ATK",     ratio: 1, }
},
"MA Heavy Blow": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
            self_cast: false,
            free_turn: false
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
        description: "[ Blunt ] Deal 110% ATK DMG, +40% Crit Chance, 6 Focus",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Blunt",     element: "Blunt",     pen_element: "Blunt",     stat: "ATK",     ratio: 1.1, }
},
"MA Heavy Thrust": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
            self_cast: false,
            free_turn: false
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
        description: "[ Pierce ] Deal 110% ATK DMG, +40% Crit Chance, 6 Focus",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Pierce",     element: "Pierce",     pen_element: "Pierce",     stat: "ATK",     ratio: 1.1, }
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
        
},
"MA Aura Slash": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
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
        description: "[ Slash ] Deals 100% ATK DMG, +15% Penetration, 7 Focus",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Slash",     element: "Slash",     pen_element: "Slash",     stat: "ATK",     ratio: 1, }
},
"MA Aura Pierce": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
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
        description: "[ Pierce ] Deals 100% ATK DMG, +15% Penetration, 7 Focus",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Pierce",     element: "Pierce",     pen_element: "Pierce",     stat: "ATK",     ratio: 1, }
},
"MA Aura Smash": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
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
        description: "[ Blunt ] Deals 100% ATK DMG, +15% Penetration, 7 Focus",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Blunt",     element: "Blunt",     pen_element: "Blunt",     stat: "ATK",     ratio: 1, }
},
"Ethereal Shot": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
            self_cast: false,
            free_turn: true
        },
        PreReq: ["Arrow Saint"],
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
        description: "[ ⧖, Void ] Deals 220% ATK DMG, scales via pierce damage, +10% Crit Damage, 7 Focus",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Void",     element: "Pierce",     pen_element: "Void",     stat: "ATK",     ratio: 2.2, }
},
"6 Fold Slash of Light": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
            self_cast: false,
            free_turn: false
        },
        PreReq: ["Sword Saint"],
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
        description: "[ Slash ] Deals 600% ATK DMG AOE, Cap 235% per Target, 12/-1 Focus",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Slash",     element: "Slash",     pen_element: "Slash",     stat: "ATK",     ratio: 2.35, }
},
"Dragon Fang Thrust": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
            self_cast: false,
            free_turn: false
        },
        PreReq: ["Spear Saint"],
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
        description: "[ Pierce ] Deals 220% ATK DMG, 25% Penetration, ignores 15% Enemy Resist. 12/-1 Focus",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Pierce",     element: "Pierce",     pen_element: "Pierce",     stat: "ATK",     ratio: 2.2, }
},
"Grand Lord Strike": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
            self_cast: false,
            free_turn: false
        },
        PreReq: ["Hammer Saint"],
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
        description: "[ Blunt ] Deals 220% ATK DMG, 25% Penetration, 12/-1 Focus",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Blunt",     element: "Blunt",     pen_element: "Blunt",     stat: "ATK",     ratio: 2.2, }
},
"Roaring Lion Fist": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
            self_cast: false,
            free_turn: false
        },
        PreReq: ["Martial Saint"],
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
        description: "[ Blunt ] Deals, 255% ATK DMG, 12/-1 Focus",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Blunt",     element: "Blunt",     pen_element: "Blunt",     stat: "ATK",     ratio: 2.55, }
},
"Shadow Execution": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
            self_cast: false,
            free_turn: false
        },
        PreReq: ["Dagger Demon"],
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
        description: "[ Slash ] Deals 215% ATK DMG, +30% Crit DMG, 12/-1 Focus",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Slash",     element: "Slash",     pen_element: "Slash",     stat: "ATK",     ratio: 2.15, }
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
        
},
"Arrows of Ullr": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
            self_cast: false,
            free_turn: true
        },
        PreReq: ["Arrow Demigod"],
        sp: 2,
        gold: 225,
        exp: 3200,
        sp_spent: 16,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 50,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ ⧖, Void ] Deals 320% ATK DMG, scales via Pierce, +20% Crit Damage, 10/-1 Focus",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Void",     element: "Pierce",     pen_element: "Void",     stat: "ATK",     ratio: 3.2, }
},
"Hofung's Cleave": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
            self_cast: false,
            free_turn: false
        },
        PreReq: ["Sword Demigod"],
        sp: 2,
        gold: 225,
        exp: 3200,
        sp_spent: 16,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 50,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ Slash ] Deals 900% ATK DMG AOE, Cap 350% per Target, 18/-2 Focus",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Slash",     element: "Slash",     pen_element: "Slash",     stat: "ATK",     ratio: 3.5, }
},
"Touch of Gungnir": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
            self_cast: false,
            free_turn: false
        },
        PreReq: ["Spear Demigod"],
        sp: 2,
        gold: 225,
        exp: 3200,
        sp_spent: 16,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 50,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ Pierce ] Deals 300% ATK DMG, 50% Penetration, ignores 25% Enemy Resist. 18/-2 Focus",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Pierce",     element: "Pierce",     pen_element: "Pierce",     stat: "ATK",     ratio: 3, }
},
"Strike of Mjolnir": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
            self_cast: false,
            free_turn: false
        },
        PreReq: ["Hammer Demigod"],
        sp: 2,
        gold: 225,
        exp: 3200,
        sp_spent: 16,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 50,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ Blunt ] Deals 330% ATK DMG, 25% Penetration, 18/-2 Focus",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Blunt",     element: "Blunt",     pen_element: "Blunt",     stat: "ATK",     ratio: 3.3, }
},
"Dragon Fury's Fist": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
            self_cast: false,
            free_turn: false
        },
        PreReq: ["Martial Demigod"],
        sp: 2,
        gold: 225,
        exp: 3200,
        sp_spent: 16,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 50,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ Blunt ] Deals, 380% ATK DMG, 18/-2 Focus",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Blunt",     element: "Blunt",     pen_element: "Blunt",     stat: "ATK",     ratio: 3.8, }
},
"Gift of Loki": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
            self_cast: false,
            free_turn: false
        },
        PreReq: ["Dagger Demigod"],
        sp: 2,
        gold: 225,
        exp: 3200,
        sp_spent: 16,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 50,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ Slash ] Deals, 275% ATK DMG, +40% Crit Damage, 18/-2 Focus",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Slash",     element: "Slash",     pen_element: "Slash",     stat: "ATK",     ratio: 2.75, }
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
        
},
"MA Aura Stroke": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
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
        description: "[ Slash ] Deals 160% ATK DMG, +25% Penetration, 10 Focus",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Slash",     element: "Slash",     pen_element: "Slash",     stat: "ATK",     ratio: 1.6, }
},
"MA Aura Thrust": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
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
        description: "[ Pierce ] Deals 160% ATK DMG, +25% Penetration, 10 Focus",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Pierce",     element: "Pierce",     pen_element: "Pierce",     stat: "ATK",     ratio: 1.6, }
},
"MA Aura Strike": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
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
        description: "[ Blunt ] Deals 160% ATK DMG, +25% Penetration, 10 Focus",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Blunt",     element: "Blunt",     pen_element: "Blunt",     stat: "ATK",     ratio: 1.6, }
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
        dmg_stats: {...defaultDmgStats,    dmg_element: "Void",     element: "Pierce",     pen_element: "Void",     stat: "ATK",     ratio: 4, }
},
"Storm Flash Stroke": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
            self_cast: false,
            free_turn: false
        },
        PreReq: ["Sword Deity"],
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
        description: "[ Slash ] Deals 1650% ATK DMG AOE, Cap 450% per Target. 25/-3 Focus",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Slash",     element: "Slash",     pen_element: "Slash",     stat: "ATK",     ratio: 4.5, }
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
        dmg_stats: {...defaultDmgStats,    dmg_element: "Pierce",     element: "Pierce",     pen_element: "Pierce",     stat: "ATK",     ratio: 4.2, }
},
"Yamantaka Judgement": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
            self_cast: false,
            free_turn: false
        },
        PreReq: ["Hammer Deity"],
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
        description: "[ Blunt ] Deals 485% ATK DMG, +25% Penetration. 25/-3 Focus",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Blunt",     element: "Blunt",     pen_element: "Blunt",     stat: "ATK",     ratio: 4.85, }
},
"Dragon Axe Kick": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
            self_cast: false,
            free_turn: false
        },
        PreReq: ["Martial Deity"],
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
        description: "[ Blunt ] Deals 530% ATK DMG. Breaks 10% Armor. 25/-3 Focus",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Blunt",     element: "Blunt",     pen_element: "Blunt",     stat: "ATK",     ratio: 5.3, }
},
"Tsukiyomi Flash": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
            self_cast: false,
            free_turn: false
        },
        PreReq: ["Dagger Deity"],
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
        description: "[ Slash ] Deals 400% ATK DMG, +100% Crit Chance, +30% Crit Damage. 25/-3 Focus",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Slash",     element: "Slash",     pen_element: "Slash",     stat: "ATK",     ratio: 4, }
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
        dmg_stats: {...defaultDmgStats,    dmg_element: "Blunt",     element: "Blunt",     pen_element: "Blunt",     stat: "ATK",     ratio: 3.2, }
},
"Cosmic Arrow Storm": {...defaultSkill,
        type: {
            is_buff: false,
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
            warrior_levels: 100,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ Pierce ] Deals 540% ATK DMG AOE, Cap 220% per Target. Pens with Void, +10% Crit Damage, 33/-1 Focus",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Pierce",     element: "Pierce",     pen_element: "Pierce",     stat: "ATK",     ratio: 2.2, }
},
"Lion Whirlwind Kick": {...defaultSkill,
        type: {
            is_buff: false,
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
            warrior_levels: 100,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ Blunt ] Deals 540% ATK DMG AOE, Cap 220% per Target.+10% Crit Damage, 33/-1 Focus",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Blunt",     element: "Blunt",     pen_element: "Blunt",     stat: "ATK",     ratio: 2.2, }
},
"Comet Cyclone": {...defaultSkill,
        type: {
            is_buff: false,
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
            warrior_levels: 100,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ Pierce ] Deals 600% ATK DMG AOE, Cap 245% per Target, 33/-1 Focus",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Pierce",     element: "Pierce",     pen_element: "Pierce",     stat: "ATK",     ratio: 2.45, }
},
"Blade Demon Flash": {...defaultSkill,
        type: {
            is_buff: false,
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
            warrior_levels: 100,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ Slash ] Deals 600% ATK DMG AOE, Cap 245% per Target, 33/-1 Focus",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Slash",     element: "Slash",     pen_element: "Slash",     stat: "ATK",     ratio: 2.45, }
},
"Shadow Blade Dance": {...defaultSkill,
        type: {
            is_buff: false,
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
            warrior_levels: 100,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ Slash ] Deals 540% ATK DMG AOE, Cap 220% per Target. +10% Crit Damage, 33/-1 Focus",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Slash",     element: "Slash",     pen_element: "Slash",     stat: "ATK",     ratio: 2.2, }
},
"Meteor Impact": {...defaultSkill,
        type: {
            is_buff: false,
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
            warrior_levels: 100,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ Blunt ] Deals 600% ATK DMG AOE, Cap 245% per Target, 33/-1 Focus",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Blunt",     element: "Blunt",     pen_element: "Blunt",     stat: "ATK",     ratio: 2.45, }
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
        
},
"MA Spirit Stroke": {...defaultSkill,
        type: {
            is_buff: false,
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
            warrior_levels: 100,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ Slash ] Deals 200% ATK DMG, +30% Penetration, 16 Focus",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Slash",     element: "Slash",     pen_element: "Slash",     stat: "ATK",     ratio: 2, }
},
"MA Spirit Thrust": {...defaultSkill,
        type: {
            is_buff: false,
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
            warrior_levels: 100,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ Pierce ] Deals 200% ATK DMG, +30% Penetration, 16 Focus",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Pierce",     element: "Pierce",     pen_element: "Pierce",     stat: "ATK",     ratio: 2, }
},
"MA Spirit Strike": {...defaultSkill,
        type: {
            is_buff: false,
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
            warrior_levels: 100,
            caster_levels: 0,
            healer_levels: 0
        },
        description: "[ Blunt ] Deals 200% ATK DMG, +30% Penetration, 16 Focus",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Blunt",     element: "Blunt",     pen_element: "Blunt",     stat: "ATK",     ratio: 2, }
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
        dmg_stats: {...defaultDmgStats,    dmg_element: "Slash",     element: "Slash",     pen_element: "Slash",     stat: "ATK",     ratio: 2.9, }
},
"Iaido Blossom": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
            self_cast: false,
            free_turn: false
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
        description: "[ Slash ] Deals 450% ATK DMG. 25/-4 Focus",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Slash",     element: "Slash",     pen_element: "Slash",     stat: "ATK",     ratio: 4.5, }
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
        dmg_stats: {...defaultDmgStats,    dmg_element: "Pierce",     element: "Pierce",     pen_element: "Pierce",     stat: "ATK",     ratio: 3.2, }
},
"Calamity Impact": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
            self_cast: false,
            free_turn: false
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
        description: "[ Blunt ] Deals 1800% ATK DMG AOE, Cap 385% per Target. 40/-10 Focus",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Blunt",     element: "Blunt",     pen_element: "Blunt",     stat: "ATK",     ratio: 3.85, }
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
        dmg_stats: {...defaultDmgStats,    dmg_element: "Void",     element: "Pierce",     pen_element: "Void",     stat: "ATK",     ratio: 6, }
},
"World's Divide": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
            self_cast: false,
            free_turn: false
        },
        PreReq: ["Storm Flash Stroke"],
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
        description: "[ Slash ] Deals 515% ATK DMG to all Enemies, 45/-15 Focus",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Slash",     element: "Slash",     pen_element: "Slash",     stat: "ATK",     ratio: 5.15, }
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
        dmg_stats: {...defaultDmgStats,    dmg_element: "Pierce",     element: "Pierce",     pen_element: "Pierce",     stat: "ATK",     ratio: 5.05, }
},
"Kundali's Retribution": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
            self_cast: false,
            free_turn: false
        },
        PreReq: ["Yamantaka Judgement"],
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
        description: "[ Blunt ] Deals 555% ATK DMG, +150% Penetration. 45/-15 Focus",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Blunt",     element: "Blunt",     pen_element: "Blunt",     stat: "ATK",     ratio: 5.55, }
},
"Infinite Strike": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
            self_cast: false,
            free_turn: false
        },
        PreReq: ["Dragon Axe Kick"],
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
        description: "[ Blunt ] Deals 600% ATK DMG. Ignores 100% Armor. 45/-15 Focus",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Blunt",     element: "Blunt",     pen_element: "Blunt",     stat: "ATK",     ratio: 6, }
},
"Izanagi Severence": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
            self_cast: false,
            free_turn: false
        },
        PreReq: ["Tsukiyomi Flash"],
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
        description: "[ Slash ] Deals 500% ATK DMG, +100% Crit Chance, +40% Crit Damage. 40/-10 Focus",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Slash",     element: "Slash",     pen_element: "Slash",     stat: "ATK",     ratio: 5, }
},
"Magic Missile": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
            self_cast: false,
            free_turn: false
        },
        sp: 1,
        gold: 25,
        exp: 25,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 1,
            healer_levels: 0
        },
        description: "[ Void ] Deal 135% MATK DMG, 1 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Void",     element: "Void",     pen_element: "Void",     stat: "MATK",     ratio: 1.35, }
},
"Scorch Bolt": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
            self_cast: false,
            free_turn: false
        },
        sp: 1,
        gold: 25,
        exp: 25,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 1,
            healer_levels: 0
        },
        description: "[ Fire ] Deal 110% MATK DMG, 1 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Fire",     element: "Fire",     pen_element: "Fire",     stat: "MATK",     ratio: 1.1, }
},
"Air Punch": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
            self_cast: false,
            free_turn: false
        },
        sp: 1,
        gold: 25,
        exp: 25,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 1,
            healer_levels: 0
        },
        description: "[ Wind ] Deal 110% MATK DMG, 1 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Wind",     element: "Wind",     pen_element: "Wind",     stat: "MATK",     ratio: 1.1, }
},
"Dew Blast": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
            self_cast: false,
            free_turn: false
        },
        sp: 1,
        gold: 25,
        exp: 25,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 1,
            healer_levels: 0
        },
        description: "[ Water ] Deal 110% MATK DMG, 1 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Water",     element: "Water",     pen_element: "Water",     stat: "MATK",     ratio: 1.1, }
},
"Spark": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
            self_cast: false,
            free_turn: false
        },
        sp: 1,
        gold: 25,
        exp: 25,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 1,
            healer_levels: 0
        },
        description: "[ Lightning ] Deal 110% MATK DMG, 1 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Lightning",     element: "Lightning",     pen_element: "Lightning",     stat: "MATK",     ratio: 1.1, }
},
"Stone Bullet": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
            self_cast: false,
            free_turn: false
        },
        sp: 1,
        gold: 25,
        exp: 25,
        class_levels: {
            tank_levels: 0,
            warrior_levels: 0,
            caster_levels: 1,
            healer_levels: 0
        },
        description: "[ Earth ] Deals 110% MATK DMG, 1 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Earth",     element: "Earth",     pen_element: "Earth",     stat: "MATK",     ratio: 1.1, }
},
"Force Blast": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
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
        description: "[ Void ] Deals 240% MATK AOE DMG, cap 90% per Target, 3 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Void",     element: "Void",     pen_element: "Void",     stat: "MATK",     ratio: 0.9, }
},
"Fire Lance": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
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
        description: "[ Fire ] Deals 180% MATK DMG, 3 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Fire",     element: "Fire",     pen_element: "Fire",     stat: "MATK",     ratio: 1.8, }
},
"Wind Blade": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
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
        description: "[ Wind ] Deals 180% MATK DMG, 3 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Wind",     element: "Wind",     pen_element: "Wind",     stat: "MATK",     ratio: 1.8, }
},
"Water Bomb": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
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
        description: "[ Water ] Deals 200% MATK AOE DMG, cap 80% per Target, 3 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Water",     element: "Water",     pen_element: "Water",     stat: "MATK",     ratio: 0.8, }
},
"Electrosphere": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
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
        description: "[ Lightning ] Deals 200% MATK AOE DMG, cap 80% per Target, 3 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Lightning",     element: "Lightning",     pen_element: "Lightning",     stat: "MATK",     ratio: 0.8, }
},
"Earth Impaler": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
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
        description: "[ Earth ] Deals 180% MATK DMG, 3 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Earth",     element: "Earth",     pen_element: "Earth",     stat: "MATK",     ratio: 1.8, }
},
"Negative Ray": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
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
        description: "[ Neg ] Deals 180% MATK DMG, 3 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Neg",     element: "Neg",     pen_element: "Neg",     stat: "MATK",     ratio: 1.8, }
},
"Radiance": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
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
        description: "[ Holy ] Deals 180% MATK DMG, 3 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Holy",     element: "Holy",     pen_element: "Holy",     stat: "MATK",     ratio: 1.8, }
},
"Poison Shot": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
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
        description: "[ Toxic ] Deals 180% MATK DMG, 3 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Toxic",     element: "Toxic",     pen_element: "Toxic",     stat: "MATK",     ratio: 1.8, }
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
        
},
"Fireball": {...defaultSkill,
        type: {
            is_buff: false,
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
        description: "[ Fire ] Deals 500% MATK AOE DMG, cap 270% per Target, 9 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Fire",     element: "Fire",     pen_element: "Fire",     stat: "MATK",     ratio: 2.7, }
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
        dmg_stats: {...defaultDmgStats,    dmg_element: "Wind",     element: "Wind",     pen_element: "Wind",     stat: "MATK",     ratio: 2, }
},
"Frozen Lance": {...defaultSkill,
        type: {
            is_buff: false,
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
        description: "[ Water ] Deals 240% MATK DMG, +15% Crit Chance, 7 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Water",     element: "Water",     pen_element: "Water",     stat: "MATK",     ratio: 2.4, }
},
"Lightning": {...defaultSkill,
        type: {
            is_buff: false,
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
        description: "[ Lightning ] Deals 300% MATK DMG, 7 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Lightning",     element: "Lightning",     pen_element: "Lightning",     stat: "MATK",     ratio: 3, }
},
"Earth Surge": {...defaultSkill,
        type: {
            is_buff: false,
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
        description: "[ Earth ] Deals 350% MATK AOE DMG, cap 200% per Target, after breaking 6% Armor, Ignores 45% Armor. 8 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Earth",     element: "Earth",     pen_element: "Earth",     stat: "MATK",     ratio: 2, }
},
"Negative Wave": {...defaultSkill,
        type: {
            is_buff: false,
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
        description: "[ Neg ] Deals 350% MATK AOE DMG, cap 200% per Target, +50% Crit Damage, -10% Crit Chance, 8 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Neg",     element: "Neg",     pen_element: "Neg",     stat: "MATK",     ratio: 2, }
},
"White Veil": {...defaultSkill,
        type: {
            is_buff: false,
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
        description: "[ Holy ] Deals 380% MATK AOE DMG, cap 210% per Target, 6 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Holy",     element: "Holy",     pen_element: "Holy",     stat: "MATK",     ratio: 2.1, }
},
"Acid Javelin": {...defaultSkill,
        type: {
            is_buff: false,
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
        description: "[ Toxic ] Deals 260% MATK DMG, 3% Damage Done applied as DOT, Ignores 10% Armor, 7 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Toxic",     element: "Toxic",     pen_element: "Toxic",     stat: "MATK",     ratio: 2.6, }
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
        
},
"Inferno Blast": {...defaultSkill,
        type: {
            is_buff: false,
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
        description: "[ Fire ] Deals 320% MATK DMG, 12 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Fire",     element: "Fire",     pen_element: "Fire",     stat: "MATK",     ratio: 3.2, }
},
"Fire Wall": {...defaultSkill,
        type: {
            is_buff: false,
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
        description: "[ Fire ] Deals 800% MATK AOE DMG, cap 375% MATK per Target, 18 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Fire",     element: "Fire",     pen_element: "Fire",     stat: "MATK",     ratio: 3.75, }
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
        dmg_stats: {...defaultDmgStats,    dmg_element: "Wind",     element: "Wind",     pen_element: "Wind",     stat: "MATK",     ratio: 3.4, }
},
"Frost Impaler": {...defaultSkill,
        type: {
            is_buff: false,
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
        description: "[ Water ] Deals 320% MATK DMG, +20% Crit Chance, 12 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Water",     element: "Water",     pen_element: "Water",     stat: "MATK",     ratio: 3.2, }
},
"Blizzard": {...defaultSkill,
        type: {
            is_buff: false,
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
        description: "[ Water ] Deals 475% MATK AOE DMG, cap 340% MATK per Target, +15% Crit Chance, 15 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Water",     element: "Water",     pen_element: "Water",     stat: "MATK",     ratio: 3.4, }
},
"Chain Lightning": {...defaultSkill,
        type: {
            is_buff: false,
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
        description: "[ Lightning ] Deals 475% MATK AOE DMG, cap 340% MATK per Target, 15 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Lightning",     element: "Lightning",     pen_element: "Lightning",     stat: "MATK",     ratio: 3.4, }
},
"Dragon Lightning": {...defaultSkill,
        type: {
            is_buff: false,
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
        description: "[ Lightning ] Deals 420% MATK DMG, 14 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Lightning",     element: "Lightning",     pen_element: "Lightning",     stat: "MATK",     ratio: 4.2, }
},
"Terra Wave": {...defaultSkill,
        type: {
            is_buff: false,
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
        description: "[ Earth ] Deals 475% MATK AOE DMG, cap 340% MATK per target after breaking 4% Armor, Ignores 45% Armor. 15 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Earth",     element: "Earth",     pen_element: "Earth",     stat: "MATK",     ratio: 3.4, }
},
"Terra Spiker": {...defaultSkill,
        type: {
            is_buff: false,
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
        description: "[ Earth ] Deals 320% MATK DMG, after breaking 6% Armor, Ignores 45% Armor.12 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Earth",     element: "Earth",     pen_element: "Earth",     stat: "MATK",     ratio: 3.2, }
},
"Negative Burst": {...defaultSkill,
        type: {
            is_buff: false,
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
        description: "[ Neg ] Deals 475% MATK AOE DMG, cap 320% per Target, +25% Crit Damage, -10% Crit Chance, 15 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Neg",     element: "Neg",     pen_element: "Neg",     stat: "MATK",     ratio: 3.2, }
},
"Lesser Death": {...defaultSkill,
        type: {
            is_buff: false,
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
        description: "[ Neg ] Deals 320% MATK DMG, +45% Crit Damage, -10% Crit Chance, 12 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Neg",     element: "Neg",     pen_element: "Neg",     stat: "MATK",     ratio: 3.2, }
},
"Dark Call": {...defaultSkill,
        type: {
            is_buff: false,
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
        description: "[ Void ] Deals 205% MATK DMG, +10% Crit Damage, Scales with Negative Damage, 12 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Void",     element: "Neg",     pen_element: "Void",     stat: "MATK",     ratio: 2.05, }
},
"Radiant Field": {...defaultSkill,
        type: {
            is_buff: false,
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
        description: "[ Holy ] Deals 500% MATK AOE DMG, cap 360% per Target, 10 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Holy",     element: "Holy",     pen_element: "Holy",     stat: "MATK",     ratio: 3.6, }
},
"Greater Radiance": {...defaultSkill,
        type: {
            is_buff: false,
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
        description: "[ Holy ] Deals 340% MATK DMG, 8 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Holy",     element: "Holy",     pen_element: "Holy",     stat: "MATK",     ratio: 3.4, }
},
"Poison Nova": {...defaultSkill,
        type: {
            is_buff: false,
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
        description: "[ Toxic ] Deals 340% MATK DMG, 3% Damage Done applied as DOT, Ignores 10% Armor, 12 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Toxic",     element: "Toxic",     pen_element: "Toxic",     stat: "MATK",     ratio: 3.4, }
},
"Acid Stream": {...defaultSkill,
        type: {
            is_buff: false,
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
        description: "[ Toxic ] Deals 500% MATK AOE DMG, cap 360% MATK per Target. 2% Damage Done applied as DOT, Ignores 10% Armor, 15 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Toxic",     element: "Toxic",     pen_element: "Toxic",     stat: "MATK",     ratio: 3.6, }
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
        
},
"Void Blast": {...defaultSkill,
        type: {
            is_buff: false,
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
        description: "[ Void ] Deals 400% MATK DMG, 11 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Void",     element: "Void",     pen_element: "Void",     stat: "MATK",     ratio: 4, }
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
        
},
"Hellfire Flame": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
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
            caster_levels: 70,
            healer_levels: 0
        },
        description: "[ Fire ] Deals 450% MATK DMG, 16 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Fire",     element: "Fire",     pen_element: "Fire",     stat: "MATK",     ratio: 4.5, }
},
"Explosion": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
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
            caster_levels: 70,
            healer_levels: 0
        },
        description: "[ Fire ] Deals 1200% MATK AOE DMG, cap 500% MATK per Target, 22 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Fire",     element: "Fire",     pen_element: "Fire",     stat: "MATK",     ratio: 5, }
},
"Sonic Crush": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
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
            caster_levels: 70,
            healer_levels: 0
        },
        description: "[ Wind ] Deals 450% MATK DMG, 16% Penetration, ignores 15% Enemy Resist. 16 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Wind",     element: "Wind",     pen_element: "Wind",     stat: "MATK",     ratio: 4.5, }
},
"Shark Cyclone": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
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
            caster_levels: 70,
            healer_levels: 0
        },
        description: "[ Wind ] Deals 775% MATK AOE DMG, cap 400% MATK per Target, 12% Penetration, ignores 15% Enemy Resist. 20 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Wind",     element: "Wind",     pen_element: "Wind",     stat: "MATK",     ratio: 4, }
},
"Spear of Niflheim": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
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
            caster_levels: 70,
            healer_levels: 0
        },
        description: "[ Water ] Deals 450% MATK DMG, +24% Crit Chance, 16 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Water",     element: "Water",     pen_element: "Water",     stat: "MATK",     ratio: 4.5, }
},
"Ice Shard Storm": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
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
            caster_levels: 70,
            healer_levels: 0
        },
        description: "[ Water ] Deals 775% MATK AOE DMG, cap 400% MATK per Target, +18% Crit Chance, 20 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Water",     element: "Water",     pen_element: "Water",     stat: "MATK",     ratio: 4, }
},
"Chain Dragon Lightning": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
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
            caster_levels: 70,
            healer_levels: 0
        },
        description: "[ Lightning ] Deals 775% MATK AOE DMG, cap 400% MATK per Target, 20 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Lightning",     element: "Lightning",     pen_element: "Lightning",     stat: "MATK",     ratio: 4, }
},
"Call Greater Thunder": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
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
            caster_levels: 70,
            healer_levels: 0
        },
        description: "[ Lightning ] Deals 540% MATK DMG, 18 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Lightning",     element: "Lightning",     pen_element: "Lightning",     stat: "MATK",     ratio: 5.4, }
},
"Gaia's Wrath": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
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
            caster_levels: 70,
            healer_levels: 0
        },
        description: "[ Earth ] Deals 775% MATK AOE DMG, cap 400% MATK per target after breaking 7% Armor, Ignores 55% Armor. 20 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Earth",     element: "Earth",     pen_element: "Earth",     stat: "MATK",     ratio: 4, }
},
"Gaia's Spear": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
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
            caster_levels: 70,
            healer_levels: 0
        },
        description: "[ Earth ] Deals 450% MATK DMG, after breaking 9% Armor, Ignores 55% Armor. 16 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Earth",     element: "Earth",     pen_element: "Earth",     stat: "MATK",     ratio: 4.5, }
},
"Death Nova": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
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
            caster_levels: 70,
            healer_levels: 0
        },
        description: "[ Neg ] Deals 775% MATK AOE DMG, cap 400% per Target, +40% Crit Damage, -15% Crit Chance, 20 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Neg",     element: "Neg",     pen_element: "Neg",     stat: "MATK",     ratio: 4, }
},
"Death": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
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
            caster_levels: 70,
            healer_levels: 0
        },
        description: "[ Neg ] Deals 430% MATK DMG, +40% Crit Damage, -15% Crit Chance, 16 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Neg",     element: "Neg",     pen_element: "Neg",     stat: "MATK",     ratio: 4.3, }
},
"Darkness": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
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
            caster_levels: 70,
            healer_levels: 0
        },
        description: "[ Void ] Deals 300% MATK DMG, +15% Crit Damage, Scales by Negative Damage, 16 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Void",     element: "Neg",     pen_element: "Void",     stat: "MATK",     ratio: 3, }
},
"Odin's Gaze": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
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
            caster_levels: 70,
            healer_levels: 0
        },
        description: "[ Holy ] Deals 800% MATK AOE DMG, cap 420% per Target, 15 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Holy",     element: "Holy",     pen_element: "Holy",     stat: "MATK",     ratio: 4.2, }
},
"Light of Valhalla": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
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
            caster_levels: 70,
            healer_levels: 0
        },
        description: "[ Holy ] Deals 475% MATK DMG, 12 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Holy",     element: "Holy",     pen_element: "Holy",     stat: "MATK",     ratio: 4.75, }
},
"Gravity Maelstrom": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
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
            caster_levels: 70,
            healer_levels: 0
        },
        description: "[ Void ] Deals 500% MATK DMG, 16 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Void",     element: "Void",     pen_element: "Void",     stat: "MATK",     ratio: 5, }
},
"Gravity Crush": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
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
            caster_levels: 70,
            healer_levels: 0
        },
        description: "[ Void ] Deals 880% MATK AOE DMG, cap 455% MATK per target, 20 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Void",     element: "Void",     pen_element: "Void",     stat: "MATK",     ratio: 4.55, }
},
"Corrosion Impact": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
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
            caster_levels: 70,
            healer_levels: 0
        },
        description: "[ Toxic ] Deals 475% MATK DMG, 3% Damage Done applied as DOT, Ignores 15% Armor, 16 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Toxic",     element: "Toxic",     pen_element: "Toxic",     stat: "MATK",     ratio: 4.75, }
},
"Venom Shroud": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
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
            caster_levels: 70,
            healer_levels: 0
        },
        description: "[ Toxic ] Deals 800% MATK DMG, cap 420% MATK per Target. 2% Damage Done applied as DOT, Ignores 15% Armor, 20 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Toxic",     element: "Toxic",     pen_element: "Toxic",     stat: "MATK",     ratio: 4.2, }
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
        
},
"Hellfire Lance": {...defaultSkill,
        type: {
            is_buff: false,
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
        description: "[ Fire ] Deals 550% MATK DMG, 24 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Fire",     element: "Fire",     pen_element: "Fire",     stat: "MATK",     ratio: 5.5, }
},
"Nuclear Orb": {...defaultSkill,
        type: {
            is_buff: false,
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
        description: "[ Fire ] Deals 1750% MATK AOE DMG, cap 610% MATK per Target, 30 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Fire",     element: "Fire",     pen_element: "Fire",     stat: "MATK",     ratio: 6.1, }
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
        dmg_stats: {...defaultDmgStats,    dmg_element: "Wind",     element: "Wind",     pen_element: "Wind",     stat: "MATK",     ratio: 7.75, }
},
"Wrath of Hela": {...defaultSkill,
        type: {
            is_buff: false,
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
        description: "[ Water ] Deals 550% MATK DMG, +35% Crit Chance, 24 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Water",     element: "Water",     pen_element: "Water",     stat: "MATK",     ratio: 5.5, }
},
"Niflheim Storm": {...defaultSkill,
        type: {
            is_buff: false,
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
        description: "[ Water ] Deals 1000% MATK AOE DMG, cap 500% MATK per Target, +25% Crit Chance, 28 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Water",     element: "Water",     pen_element: "Water",     stat: "MATK",     ratio: 5, }
},
"Mjolnir's Blast": {...defaultSkill,
        type: {
            is_buff: false,
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
        description: "[ Lightning ] Deals 660% MATK DMG, 26 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Lightning",     element: "Lightning",     pen_element: "Lightning",     stat: "MATK",     ratio: 6.6, }
},
"Dragon Storm Nova": {...defaultSkill,
        type: {
            is_buff: false,
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
        description: "[ Lightning ] Deals 1000% MATK AOE DMG, cap 500% MATK per Target, 28 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Lightning",     element: "Lightning",     pen_element: "Lightning",     stat: "MATK",     ratio: 5, }
},
"Lance of Joro": {...defaultSkill,
        type: {
            is_buff: false,
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
        description: "[ Earth ] Deals 550% MATK DMG, after breaking 9% Armor, Ignores 55% Armor. 24 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Earth",     element: "Earth",     pen_element: "Earth",     stat: "MATK",     ratio: 5.5, }
},
"Joro's Judgement": {...defaultSkill,
        type: {
            is_buff: false,
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
        description: "[ Earth ] Deals 1000% MATK AOE DMG, cap 500% MATK per target after breaking 7% Armor, Ignores 55% Armor. 28 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Earth",     element: "Earth",     pen_element: "Earth",     stat: "MATK",     ratio: 5, }
},
"True Death": {...defaultSkill,
        type: {
            is_buff: false,
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
        description: "[ Neg ] Deals 500% MATK DMG, +50% Crit Damage, -20% Crit Chance, 25 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Neg",     element: "Neg",     pen_element: "Neg",     stat: "MATK",     ratio: 5, }
},
"Cry of the Banshee": {...defaultSkill,
        type: {
            is_buff: false,
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
        description: "[ Neg ] Deals 1000% MATK AOE DMG, cap 465% per Target, +50% Crit Damage, -20% Crit Chance, 30 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Neg",     element: "Neg",     pen_element: "Neg",     stat: "MATK",     ratio: 4.65, }
},
"True Darkness": {...defaultSkill,
        type: {
            is_buff: false,
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
        description: "[ Void ] Deals 420% MATK DMG, +18% Crit Damage, Scales by Negative Damage, 25 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Void",     element: "Neg",     pen_element: "Void",     stat: "MATK",     ratio: 4.2, }
},
"Shadow of Longinus": {...defaultSkill,
        type: {
            is_buff: false,
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
        description: "[ Holy ] Deals 575% MATK DMG, 18 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Holy",     element: "Holy",     pen_element: "Holy",     stat: "MATK",     ratio: 5.75, }
},
"Megido": {...defaultSkill,
        type: {
            is_buff: false,
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
        description: "[ Holy ] Deals 1100% MATK AOE DMG, cap 510% per Target, 22 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Holy",     element: "Holy",     pen_element: "Holy",     stat: "MATK",     ratio: 5.1, }
},
"Reality Slash": {...defaultSkill,
        type: {
            is_buff: false,
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
        description: "[ Void ] Deals 600% MATK DMG, 24 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Void",     element: "Void",     pen_element: "Void",     stat: "MATK",     ratio: 6, }
},
"Black Hole": {...defaultSkill,
        type: {
            is_buff: false,
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
        description: "[ Void ] Deals 1200% MATK AOE DMG, cap 575% MATK per target, 28 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Void",     element: "Void",     pen_element: "Void",     stat: "MATK",     ratio: 5.75, }
},
"Curse of Eitr": {...defaultSkill,
        type: {
            is_buff: false,
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
        description: "[ Toxic ] Deals 575% MATK DMG, 3% Damage Done applied as DOT, Ignores 15% Armor, 24 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Toxic",     element: "Toxic",     pen_element: "Toxic",     stat: "MATK",     ratio: 5.75, }
},
"Acid Tsunami": {...defaultSkill,
        type: {
            is_buff: false,
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
        description: "[ Toxic ] Deals 1100% MATK DMG, cap 510% MATK per Target. 2% Damage Done applied as DOT, Ignores 15% Armor, 28 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Toxic",     element: "Toxic",     pen_element: "Toxic",     stat: "MATK",     ratio: 5.1, }
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
        
},
"Blade of Agni": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
            self_cast: false,
            free_turn: false
        },
        PreReq: ["Hellfire Lance"],
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
        description: "[ Fire ] Deals 725% MATK DMG, 38 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Fire",     element: "Fire",     pen_element: "Fire",     stat: "MATK",     ratio: 7.25, }
},
"Breath of Sora": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
            self_cast: false,
            free_turn: false
        },
        PreReq: ["Nuclear Orb"],
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
        description: "[ Fire ] Deals 725% MATK to all Enemies, 48 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Fire",     element: "Fire",     pen_element: "Fire",     stat: "MATK",     ratio: 7.25, }
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
        dmg_stats: {...defaultDmgStats,    dmg_element: "Wind",     element: "Wind",     pen_element: "Wind",     stat: "MATK",     ratio: 6.5, }
},
"Eye of Varu'kora": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
            self_cast: false,
            free_turn: false
        },
        PreReq: ["Wrath of Hela"],
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
        description: "[ Water ] Deals 715% MATK DMG, +40% Crit Chance, 38 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Water",     element: "Water",     pen_element: "Water",     stat: "MATK",     ratio: 7.15, }
},
"Fury of Okeanos": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
            self_cast: false,
            free_turn: false
        },
        PreReq: ["Niflheim Storm"],
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
        description: "[ Water ] Deals 1500% MATK AOE DMG, cap 650% MATK per Target, +40% Crit Chance, 45 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Water",     element: "Water",     pen_element: "Water",     stat: "MATK",     ratio: 6.5, }
},
"Vayu's Spear": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
            self_cast: false,
            free_turn: false
        },
        PreReq: ["Mjolnir's Blast"],
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
        description: "[ Lightning ] Deals 860% MATK DMG, 42 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Lightning",     element: "Lightning",     pen_element: "Lightning",     stat: "MATK",     ratio: 8.6, }
},
"Talons of Hanu'stora": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
            self_cast: false,
            free_turn: false
        },
        PreReq: ["Dragon Storm Nova"],
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
        description: "[ Lightning ] Deals 1350% MATK AOE DMG, cap 600% MATK per Target, 45 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Lightning",     element: "Lightning",     pen_element: "Lightning",     stat: "MATK",     ratio: 6, }
},
"Fist of Gen'vimata": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
            self_cast: false,
            free_turn: false
        },
        PreReq: ["Lance of Joro"],
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
        description: "[ Earth ] Deals 720% MATK DMG, after breaking 9% Armor, Ignores 70% Armor. 38 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Earth",     element: "Earth",     pen_element: "Earth",     stat: "MATK",     ratio: 7.2, }
},
"Will of Gen'vimata": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
            self_cast: false,
            free_turn: false
        },
        PreReq: ["Joro's Judgement"],
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
        description: "[ Earth ] Deals 1600% MATK AOE DMG, cap 665% MATK per target after breaking 7% Armor, Ignores 70% Armor. 45 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Earth",     element: "Earth",     pen_element: "Earth",     stat: "MATK",     ratio: 6.65, }
},
"Gren'neketer's Grasp": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
            self_cast: false,
            free_turn: false
        },
        PreReq: ["True Death"],
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
        description: "[ Neg ] Deals 570% MATK DMG, +70% Crit Damage, -25% Crit Chance, 40 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Neg",     element: "Neg",     pen_element: "Neg",     stat: "MATK",     ratio: 5.7, }
},
"Winds of Gren'neketer": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
            self_cast: false,
            free_turn: false
        },
        PreReq: ["Cry of the Banshee"],
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
        description: "[ Neg ] Deals 1600% MATK AOE DMG, cap 565% per Target, +70% Crit Damage, -25% Crit Chance, 48 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Neg",     element: "Neg",     pen_element: "Neg",     stat: "MATK",     ratio: 5.65, }
},
"Shadow of As'moraeldan": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
            self_cast: false,
            free_turn: false
        },
        PreReq: ["True Darkness"],
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
        description: "[ Void ] Deals 545% MATK DMG, +20% Crit Damage, Scales by Negative Damage, 40 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Void",     element: "Neg",     pen_element: "Void",     stat: "MATK",     ratio: 5.45, }
},
"Spear of Garabre'alos": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
            self_cast: false,
            free_turn: false
        },
        PreReq: ["Shadow of Longinus"],
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
        description: "[ Holy ] Deals 750% MATK DMG, 30 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Holy",     element: "Holy",     pen_element: "Holy",     stat: "MATK",     ratio: 7.5, }
},
"Downfall of Garabre'alos": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
            self_cast: false,
            free_turn: false
        },
        PreReq: ["Megido"],
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
        description: "[ Holy ] Deals 1800% MATK AOE DMG, cap 675% per Target, 35 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Holy",     element: "Holy",     pen_element: "Holy",     stat: "MATK",     ratio: 6.75, }
},
"Blade of Gen'vimata": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
            self_cast: false,
            free_turn: false
        },
        PreReq: ["Reality Slash"],
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
        description: "[ Void ] Deals 785% MATK DMG, 38 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Void",     element: "Void",     pen_element: "Void",     stat: "MATK",     ratio: 7.85, }
},
"Gate of Gen'vimata": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
            self_cast: false,
            free_turn: false
        },
        PreReq: ["Black Hole"],
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
        description: "[ Void ] Deals 1800% MATK AOE DMG, cap 700% MATK per target, 45 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Void",     element: "Void",     pen_element: "Void",     stat: "MATK",     ratio: 7, }
},
"Mith'sara's Claws": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
            self_cast: false,
            free_turn: false
        },
        PreReq: ["Curse of Eitr"],
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
        description: "[ Toxic ] Deals 750% MATK DMG, 3% Damage Done applied as DOT, Ignores 15% Armor, 38 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Toxic",     element: "Toxic",     pen_element: "Toxic",     stat: "MATK",     ratio: 7.5, }
},
"Mith'sara's Breath": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
            self_cast: false,
            free_turn: false
        },
        PreReq: ["Acid Tsunami"],
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
        description: "[ Toxic ] Deals 2000% MATK DMG, cap 675% MATK per Target. 2% Damage Done applied as DOT, Ignores 15% Armor, 45 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Toxic",     element: "Toxic",     pen_element: "Toxic",     stat: "MATK",     ratio: 6.75, }
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
"Smite 1": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
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
        description: "[ Holy ] Deal 60% Heal DMG, 1 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Holy",     element: "Holy",     pen_element: "Holy",     stat: "HEAL",     ratio: 0.6, }
},
"Lethal 1": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
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
        description: "[ Neg ] Deal 60% Heal DMG, 1 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Neg",     element: "Neg",     pen_element: "Neg",     stat: "HEAL",     ratio: 0.6, }
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
"Smite 2": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
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
        description: "[ Holy ] Deal 110% Heal DMG, 3 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Holy",     element: "Holy",     pen_element: "Holy",     stat: "HEAL",     ratio: 1.1, }
},
"Lethal 2": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
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
        description: "[ Neg ] Deal 110% Heal DMG, 3 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Neg",     element: "Neg",     pen_element: "Neg",     stat: "HEAL",     ratio: 1.1, }
},
"Toxic Touch": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
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
        description: "[ Toxic ] Deal 100% Heal DMG, 5% Damage Done applied as DOT, 3 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Toxic",     element: "Toxic",     pen_element: "Toxic",     stat: "HEAL",     ratio: 1, }
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
"Judgement": {...defaultSkill,
        type: {
            is_buff: false,
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
            caster_levels: 0,
            healer_levels: 20
        },
        description: "[ Holy ] Deal 220% Heal AOE DMG, cap 130% per Target, 6 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Holy",     element: "Holy",     pen_element: "Holy",     stat: "HEAL",     ratio: 2.2, }
},
"Corruption": {...defaultSkill,
        type: {
            is_buff: false,
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
            caster_levels: 0,
            healer_levels: 20
        },
        description: "[ Neg ] Deal 220% Heal AOE DMG, cap 130% per Target, 6 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Neg",     element: "Neg",     pen_element: "Neg",     stat: "HEAL",     ratio: 2.2, }
},
"Sacrilege": {...defaultSkill,
        type: {
            is_buff: false,
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
            caster_levels: 0,
            healer_levels: 20
        },
        description: "[ Toxic ] Deal 200% Heal AOE DMG, cap 120% per Target, 5% Damage Done applied as DOT, 6 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Toxic",     element: "Toxic",     pen_element: "Toxic",     stat: "HEAL",     ratio: 2, }
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
"Poison Blood": {...defaultSkill,
        type: {
            is_buff: false,
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
            caster_levels: 0,
            healer_levels: 20
        },
        description: "[ Toxic ] Deal 100% Heal DMG, -50% Threat, 2 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Toxic",     element: "Toxic",     pen_element: "Toxic",     stat: "HEAL",     ratio: 1, }
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
        
},
"Holy Smite": {...defaultSkill,
        type: {
            is_buff: false,
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
            caster_levels: 0,
            healer_levels: 40
        },
        description: "[ Holy ] Deals 250% Heal DMG, 12 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Holy",     element: "Holy",     pen_element: "Holy",     stat: "HEAL",     ratio: 2.5, }
},
"Greater Lethal": {...defaultSkill,
        type: {
            is_buff: false,
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
            caster_levels: 0,
            healer_levels: 40
        },
        description: "[ Neg ] Deals 250% Heal DMG, 12 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Neg",     element: "Neg",     pen_element: "Neg",     stat: "HEAL",     ratio: 2.5, }
},
"Blood Boil": {...defaultSkill,
        type: {
            is_buff: false,
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
            caster_levels: 0,
            healer_levels: 40
        },
        description: "[ Toxic ] Deals 230% Heal DMG, 5% Damage Done applied as DOT, 12 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Toxic",     element: "Toxic",     pen_element: "Toxic",     stat: "HEAL",     ratio: 2.3, }
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
        
},
"Greater Smite": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
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
        description: "[ Holy ] Deals 320% Heal DMG, 15 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Holy",     element: "Holy",     pen_element: "Holy",     stat: "HEAL",     ratio: 3.2, }
},
"Lethal Infusion": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
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
        description: "[ Neg ] Deals 320% Heal DMG, 15 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Neg",     element: "Neg",     pen_element: "Neg",     stat: "HEAL",     ratio: 3.2, }
},
"Final Judgement": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
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
        description: "[ Holy ] Deal 500% Heal AOE DMG, cap 300% per Target, 18 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Holy",     element: "Holy",     pen_element: "Holy",     stat: "HEAL",     ratio: 3, }
},
"True Corruption": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
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
        description: "[ Neg ] Deal 500% Heal AOE DMG, cap 300% per Target, 18 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Neg",     element: "Neg",     pen_element: "Neg",     stat: "HEAL",     ratio: 3, }
},
"Blood Sear": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
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
        description: "[ Toxic ] Deals 300% Heal DMG, 5% Damage Done applied as DOT, 15 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Toxic",     element: "Toxic",     pen_element: "Toxic",     stat: "HEAL",     ratio: 3, }
},
"Blood Explosion": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
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
        description: "[ Toxic ] Deal 460% Heal AOE DMG, cap 280% per Target, 4% Damage Done applied as DOT, 18 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Toxic",     element: "Toxic",     pen_element: "Toxic",     stat: "HEAL",     ratio: 2.8, }
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
        
},
"Soul Exorcism": {...defaultSkill,
        type: {
            is_buff: false,
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
            caster_levels: 0,
            healer_levels: 100
        },
        description: "[ Holy ] Deals 420% Heal DMG. 22 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Holy",     element: "Holy",     pen_element: "Holy",     stat: "HEAL",     ratio: 4.2, }
},
"Soul Curse": {...defaultSkill,
        type: {
            is_buff: false,
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
            caster_levels: 0,
            healer_levels: 100
        },
        description: "[ Neg ] Deal 420% Heal DMG, 22 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Neg",     element: "Neg",     pen_element: "Neg",     stat: "HEAL",     ratio: 4.2, }
},
"Samsara Light": {...defaultSkill,
        type: {
            is_buff: false,
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
            caster_levels: 0,
            healer_levels: 100
        },
        description: "[ Holy ] Deal 700% Heal AOE DMG, cap 400% per Target. 25 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Holy",     element: "Holy",     pen_element: "Holy",     stat: "HEAL",     ratio: 4, }
},
"Spirit Harvest": {...defaultSkill,
        type: {
            is_buff: false,
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
            caster_levels: 0,
            healer_levels: 100
        },
        description: "[ Neg ] Deal 700% Heal AOE DMG, cap 400% per Target. 25 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Neg",     element: "Neg",     pen_element: "Neg",     stat: "HEAL",     ratio: 4, }
},
"Pandamonium": {...defaultSkill,
        type: {
            is_buff: false,
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
            caster_levels: 0,
            healer_levels: 100
        },
        description: "[ Void ] Deals 500% Heal Damage, 22 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Void",     element: "Void",     pen_element: "Void",     stat: "HEAL",     ratio: 45, }
},
"Armageddon": {...defaultSkill,
        type: {
            is_buff: false,
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
            caster_levels: 0,
            healer_levels: 100
        },
        description: "[ Void ] Deals 800% Heal AOE Damage, cap 480% per Target, 25 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Void",     element: "Void",     pen_element: "Void",     stat: "HEAL",     ratio: 4.8, }
},
"Vita Collapse": {...defaultSkill,
        type: {
            is_buff: false,
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
            caster_levels: 0,
            healer_levels: 100
        },
        description: "[ Toxic ] Deals 480% Heal DMG, 5% Damage Done applied as DOT, 22 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Toxic",     element: "Toxic",     pen_element: "Toxic",     stat: "HEAL",     ratio: 4.8, }
},
"Blood Annihilation": {...defaultSkill,
        type: {
            is_buff: false,
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
            caster_levels: 0,
            healer_levels: 100
        },
        description: "[ Toxic ] Deal 775% Heal AOE DMG, cap 440% per Target, 4% Damage Done applied as DOT, 25 MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Toxic",     element: "Toxic",     pen_element: "Toxic",     stat: "HEAL",     ratio: 4.4, }
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
"Restore Soul": {...defaultSkill,
        type: {
            is_buff: false,
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
            caster_levels: 0,
            healer_levels: 150
        },
        description: "[ 1 Charge ] Resurrect slain party member. Revived ally has 60% Max HP and 15% Penalty to Main Stats. 40 MP",
        
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
        
},
"Shadow Catastrophe": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
            self_cast: false,
            free_turn: false
        },
        PreReq: ["World Disaster"],
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
        description: "[ Void ] Deals 1200% MATK to all Enemies, Generates +100% Threat, 35% of Max MP",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Void",     element: "Void",     pen_element: "Void",     stat: "MATK",     ratio: 12, }
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
        
},
"Dragon Breath": {...defaultSkill,
        type: {
            is_buff: false,
            is_attack: true,
            self_cast: false,
            free_turn: false
        },
        gold: 50,
        exp: 2000,
        description: "[ Fire ] Deal 200% ATK to all enemies. Scales to highest Physical ELE/Pen, costs 5% Max HP. Requires Dragon Lord Form active",
        dmg_stats: {...defaultDmgStats,    dmg_element: "Fire",     element: "Highest Phys",     pen_element: "Highest Phys",     stat: "ATK",     ratio: 2, }
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
        
},
};

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
