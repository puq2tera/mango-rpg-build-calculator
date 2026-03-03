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
    "Valkyrie of Vengeance": {
        tier: 5,
        is_active: true,
        skill_name: "Purifying Javelin",
        description: "[ ⧖, Holy ] Deals MATK DMG with % equal to 88% Max MP. Increases self Eleholy by 88% for 3 hits. Costs 40 Focus and 4% of Max MP.",
        stat_bonus: "Holy Pen%",
        stat_base: 5,
        stat_scale: 1
    },
    "Lord of the Blazing Inferno": {
        tier: 5,
        is_active: true,
        skill_name: "Roaring Hellfire Curse",
        description: "[ ⧖ ] Debuff enemy Fire Resist by 35% of Fire Pen, Increase self Fire Pen by 50% and Elefire by 15% for 7 Turns. Costs 3% of Max MP",
        stat_bonus: "Fire Pen%",
        stat_base: 5,
        stat_scale: 1
    },
    "Arrogant Queen of Storms": {
        tier: 5,
        is_active: true,
        skill_name: "Surging Storm Omen",
        description: "[ ⧖, Lightning ] Deals MATK DMG with % equal to 30% Elelightning. Increases self Elelightning by 80% for 1 Hit. 3 Turn Cooldown. Costs 3% of Max MP.",
        stat_bonus: "Lightning Pen%",
        stat_base: 5,
        stat_scale: 1
    },
    "Disciple of Nature": {
        tier: 5,
        is_active: true,
        skill_name: "Rolling Earth Rage",
        description: "[ ⧖, Earth ] Deals MATK DMG with % equal to 25% Eleearth. Increases self Eleearth by 35% stacking up to 4x for 5 Turns. 3 Turn Cooldown. Costs 3% of Max MP.",
        stat_bonus: "Earth Pen%",
        stat_base: 5,
        stat_scale: 1
    },
    "Appointed Ruler of Sky": {
        tier: 5,
        is_active: true,
        skill_name: "Great Demon Winds",
        description: "[ 1 Charge ] Debuff all enemy Wind Resist by 40% of Wind Pen, and increase self Elewind by 50% for the rest of the battle after 10 Turns.",
        stat_bonus: "Wind Pen%",
        stat_base: 5,
        stat_scale: 1
    },
    "Frozen God of War": {
        tier: 5,
        is_active: true,
        skill_name: "Creeping Frost Blight",
        description: "[ Water ] Deals AOE MATK DMG equal to 50% Elewater, Capping 20% Elewater per target. Increase self Elewater and Crit DMG by 35% of Elewater for 8 Turns. Costs 3% of Max MP.",
        stat_bonus: "Water Pen%",
        stat_base: 5,
        stat_scale: 1
    },
    "Ancient Shadow Slime": {
        tier: 5,
        is_active: true,
        skill_name: "Eternal Venom Plague",
        description: "[ Poison ] Deals MATK DMG with % equal to 15% Eletoxic, apply 50% Damage as DOT. Gain +8% Toxic DOT and +50% Eletoxic for 12 Turns. 8 Turn Cooldown. Costs 3% of Max MP.",
        stat_bonus: "Toxic Pen%",
        stat_base: 5,
        stat_scale: 1
    },
    "Great Demon of Disaster": {
        tier: 5,
        is_active: true,
        skill_name: "Dark Roaring Arcana",
        description: "Increase self Void Pen by 20% stacking 2x times, and Elevoid by 30% for 10 Turns. 5 Turn Cooldown. Costs 3% of Max MP.",
        stat_bonus: "Void Pen%",
        stat_base: 2,
        stat_scale: 1
    },
    "First Strike Kill Samurai": {
        tier: 5,
        is_active: true,
        skill_name: "Bright King Council",
        description: "[ ⧖ ] Increase self Elesword by 75% for 2 hits, by 100% for the next 2, and 150% for the last 1.",
        stat_bonus: "Slash Pen%",
        stat_base: 5,
        stat_scale: 1
    },
    "Winged King of Annihilation": {
        tier: 5,
        is_active: true,
        skill_name: "Golden Archer Companion",
        description: "[ ⧖ ] Increases self Elebow and Bow Crit DMG by 66% for 3 Hits. Costs 33% of Max HP.",
        stat_bonus: "Void Pen%",
        stat_base: 2,
        stat_scale: 1
    },
    "Golden Hammer Smith": {
        tier: 5,
        is_active: true,
        skill_name: "Prismatic Judgement",
        description: "[ ⧖ ] Increases self Elehammer and Penblunt by 33% for 2 Hits. Decrease Eleblunt by 100% for 1 Turn.",
        stat_bonus: "Blunt Pen%",
        stat_base: 5,
        stat_scale: 1
    },
    "Blades of Sun and Moon": {
        tier: 5,
        is_active: true,
        skill_name: "Twin Astral Executioners",
        description: "[ ⧖ ] Increases self Eledagger by 20% and Dagger Crit Damage by 60% for your next 2 Hits.",
        stat_bonus: "Slash Pen%",
        stat_base: 5,
        stat_scale: 1
    },
    "Lady of the Einherjar": {
        tier: 5,
        is_active: true,
        skill_name: "Einherjar's Shadow",
        description: "[ ⧖ ] Increases self Elespear by 125% and ignore +100% Armor with Pierce Hits for your next Hit. Decease Elepierce by 100% for 1 Turn.",
        stat_bonus: "Pierce Pen%",
        stat_base: 5,
        stat_scale: 1
    },
    "Iron Butler Sensei": {
        tier: 5,
        is_active: true,
        skill_name: "Martial Fist Zen",
        description: "[ ⧖, 12 Charges ] Increases self Elefist by 50% and ignore +50% Armor with Blunt Attacks for your next attack.",
        stat_bonus: "Blunt Pen%",
        stat_base: 5,
        stat_scale: 1
    },
    "Master of Dark Wisdom": {
        tier: 5,
        is_active: true,
        skill_name: "Elemental Convention",
        description: "[ ⧖ ] Increase random Elementat Pen stat by the average of your Elemental Pen for your next Hit. Costs 2% of your Max MP.",
        stat_bonus: "MATK%",
        stat_base: 12,
        stat_scale: 3
    },
    "Great Fists Teacher": {
        tier: 5,
        is_active: true,
        skill_name: "Oracle Foresight",
        description: "[ ⧖, 1 Charge ] Increase self Healpower by 100% for your next 5 Hits, and self DEF by 10% Healpower for the next 24 Turns.",
        stat_bonus: "HEAL%",
        stat_base: 12,
        stat_scale: 3
    },
    "The Angel of Sacrifice": {
        tier: 5,
        is_active: true,
        skill_name: "Prayer of Martyrdom",
        description: "[ 1 Charge ] Increase party DEF by 8% Healpower, self Void DMG by 75%, and reduce self MATK by 90% for rest of the battle. Costs 75% of Max HP.",
        stat_bonus: "Void Pen%",
        stat_base: 2,
        stat_scale: 1
    },
    "Undying White Devil": {
        tier: 5,
        is_active: true,
        skill_name: "Empress Majesty",
        description: "[ ⧖ ] Raise self threat bonus by 100% for the next 3 Hits. Reduce self Damage Taken by 33% and give party DEF equal to 50% Self DEF for 1 Turn. 4 Turn Cooldown.",
        stat_bonus: "Void Pen%",
        stat_base: 2,
        stat_scale: 1
    },
    "Naturebound Zhuge Liang": {
        tier: 5,
        is_active: true,
        skill_name: "Battle Sage Orders",
        description: "[ ⧖ ] Raise party Power by 33% Healpower for their next Hit. Costs 5% of Max MP.",
        stat_bonus: "HEAL%",
        stat_base: 12,
        stat_scale: 3
    },
    "The World's Justice": {
        tier: 5,
        is_active: true,
        skill_name: "Scales of Justice",
        description: "[ ⧖ ] Raise self DEF by 25% ATK and self ATK by 45% for your next Hit.",
        stat_bonus: "ATK%",
        stat_base: 12,
        stat_scale: 3
    },
    "Unsinkable Slime Shield": {
        tier: 5,
        is_active: true,
        skill_name: "Immortal Guard",
        description: "[ ⧖, 3 Charges ] Reduce DMG Taken by 100% for 1 Turn. Global DMG Penalty of 100% for the next 3 hits. Heal self by 100% of Max HP.",
        stat_bonus: "DEF%",
        stat_base: 12,
        stat_scale: 3
    },
    "The Emerald Tablet": {
        tier: 5,
        is_active: true,
        skill_name: "Alchemical Fury",
        description: "[ 3 Charges ] Raise party Power by 15% MATK for 3 Hits. Raise self MATK by an additional 60% for the next 6 Hits.",
        stat_bonus: "MATK%",
        stat_base: 12,
        stat_scale: 3
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
    "Corruptor of Light": {
        tier: 5,
        skill_name: "Rise of the Cursed Sun",
        description: "Increase DEF, Penholy and Eleholy by 33% for 4 Turns. Activate (Devoid of Light) after. Decrease self Eleholy by 50% for 4 Turns. Loop.",
        stat_bonus: "Holy Pen%",
        stat_base: 5,
        stat_scale: 1
    },
    "Infernal Sin Emperor": {
        tier: 5,
        skill_name: "Searing Star Pulse",
        description: "Increase self Elefire by 50% and 15% of Fire DMG inflicted as DOT for 1 Turn. Activate (Searing Star Cloak) after. Increase self Penfire by 100% for 1 Turn. Loop.",
        stat_bonus: "Fire Pen%",
        stat_base: 5,
        stat_scale: 1
    },
    "Stormfury Maid": {
        tier: 5,
        skill_name: "Charging Thunder Aura",
        description: "Decrease self Elelightning by 30% for next 2 hits. Activate (Charged Thunder Aura) after. Increase self Elelightning by 100% for 1 hit. Loop.",
        stat_bonus: "Lightning Pen%",
        stat_base: 5,
        stat_scale: 1
    },
    "Highborn Druid Queen": {
        tier: 5,
        skill_name: "Terra Integration",
        description: "Increase MATK by 80% DEF and non-Earth DMG uneffective for rest of battle. Increase Eleearth by 25% for next 4 hits. Activates (Terra Integrated) after. Increase Eleearth by 80% for rest of battle.",
        stat_bonus: "Earth Pen%",
        stat_base: 5,
        stat_scale: 1
    },
    "Mischievous Lady of Wind": {
        tier: 5,
        skill_name: "Windward Gale",
        description: "Increase Elewind by 90% for 3 turns. Activates (Tackled Gust) after. Decrease Elewind by 20% for 3 turns. Loop.",
        stat_bonus: "Wind Pen%",
        stat_base: 5,
        stat_scale: 1
    },
    "Ocean Shrine Goddess": {
        tier: 5,
        skill_name: "Hightide Monsoon Stance",
        description: "Increase Elewater by 60% and gain +25% Crit Chance for 1 hit. Activate (Lowtide Guardian Stance) after. Increase DEF by 75% MATK and Elewater by 30% for 1 hit. Loop.",
        stat_bonus: "Water Pen%",
        stat_base: 5,
        stat_scale: 1
    },
    "Raging Vermin Queen": {
        tier: 5,
        skill_name: "Seeping Poison Pool",
        description: "Increase Eletoxic by 25% for 6 Turns. Activates (Venomous Curse) after. Increase Eletoxic by 55% and gain +20% Toxic DOT for next hit. Loop.",
        stat_bonus: "Toxic Pen%",
        stat_base: 5,
        stat_scale: 1
    },
    "Mad Void Queen": {
        tier: 5,
        skill_name: "Void Madness",
        description: "Increase Penvoid by 15% for rest of battle. Increase Elevoid by 10% for next 2 hits. Activates (Void Whispers) after. Increases Elevoid by 10% for rest of battle, increases by 10% every attack up to 55%.",
        stat_bonus: "Void Pen%",
        stat_base: 2,
        stat_scale: 1
    },
    "Winter Sword Saint": {
        tier: 5,
        skill_name: "Frozen Guardian Stance",
        description: "Increase DEF by 50% ATK and reduce ATK by 50% for 2 Turns. Activate (Freezing Iaido Strike) after. Increase Elesword by 120% for next hit. Loop.",
        stat_bonus: "Slash Pen%",
        stat_base: 5,
        stat_scale: 1
    },
    "Goddess of the Hunt": {
        tier: 5,
        skill_name: "Tailwind Guardian",
        description: "Increase Elebow by 50% for rest of battle. Increase Bow Crit DMG by 13% for 3 Turns. Activates (Tailwind Blessing) after. Increase Bow Crit DMG by 133% for 1 Hit. Loop.",
        stat_bonus: "Void Pen%",
        stat_base: 2,
        stat_scale: 1
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
    "Android Assassin": {
        tier: 5,
        skill_name: "Flowing Flurry Dagger",
        description: "Increase Eledagger by 50% for your next 6 hits. Activate (Omnistrike Assassin) after. Increase Eledagger and Dagger Crit DMG by 60% for 1 hit. Loop.",
        stat_bonus: "Slash Pen%",
        stat_base: 5,
        stat_scale: 1
    },
    "Crimson Worldfall": {
        tier: 5,
        skill_name: "Blood Reaping Fury",
        description: "Increase Elespear by 35% and gain +10% Pierce DOT for 5 hits. Activate (Bloodlust Rampage) after. Increase Elespear and Penpierce by 40% for rest of battle.",
        stat_bonus: "Pierce Pen%",
        stat_base: 5,
        stat_scale: 1
    },
    "Dragon King of Fists": {
        tier: 5,
        skill_name: "Draconic Battlelust",
        description: "Increase Elefist by 6% for rest of battle, increases by 6% every attack up to a cap of 60%.",
        stat_bonus: "Blunt Pen%",
        stat_base: 5,
        stat_scale: 1
    },
    "Lord of the Arcane Abyss": {
        tier: 5,
        skill_name: "Eternal Cycle of Magic",
        description: "Increase random Elementat Pen stat by 90% of your average Elemental Pen for 1 Turn. Loop.",
        stat_bonus: "MATK%",
        stat_base: 12,
        stat_scale: 3
    },
    "Bloody Guardian Angel": {
        tier: 5,
        skill_name: "Bloodflowing Barrier",
        description: "Give party DEF equal to 25% of self DEF for 12 Turns. Activate (Bloodbinding Barrier) after. Increase Max HP by 15% of their Max HP and HP Regen by 2% of their Max HP for rest of battle.",
        stat_bonus: "DEF%",
        stat_base: 12,
        stat_scale: 3
    },
    "Dark God Mastermind": {
        tier: 5,
        skill_name: "Knowledge of War",
        description: "Give party DEF equal to 15% of self Healpower for 1 hit. Activate looping (Battlefield Analysis) after. Increase their Crit DMG by 2% per turn up to a cap of 100%.",
        stat_bonus: "HEAL%",
        stat_base: 12,
        stat_scale: 3
    },
    "The Ill Mannered Spirit": {
        tier: 5,
        skill_name: "Arcane Assault Stance",
        description: "Increase self Power by 115% of your AVG MATK+ATK and gain +15 PHYS+ELE xPen for 2 Hits. Activate (Martial Ward Stance) after. Increase self All Res by 2% of your AVG ATK+MATK Multipliers and decrease self power by 25% of your AVG MATK+ATK for 2 hits. Loop.",
        stat_bonus: "Crit DMG%",
        stat_base: 10,
        stat_scale: 2
    },
    "Imaginary Nemesis": {
        tier: 5,
        skill_name: "Chuunibyou's Power",
        description: "Increase self Void Pen by 42%, and gain +69% Armor Pen with Void DMG.",
        stat_bonus: "Void Pen%",
        stat_base: 2,
        stat_scale: 1
    },
    "Life and Death": {
        tier: 4,
        skill_name: "Certain Death",
        description: "Lose Flat 33% Crit Chance, but increase self Negative Pen by 10%.",
        stat_bonus: "Neg%",
        stat_base: 5,
        stat_scale: 1
    },
    "Death Apprentice": {
        tier: 4,
        skill_name: "Embrace Darkness",
        description: "Increase Void Pen by 80% of Negative Pen, but reduce self Void Damage by 80%.",
        stat_bonus: "Neg%",
        stat_base: 5,
        stat_scale: 1
    },
    "Alternate Life": {
        tier: 4,
        skill_name: "Holy Sacrifice",
        description: "Increase party Elements Damage by 15% of Self Holy Damage for the first 5 Hits. Decrease self Holy Damage by 50% for the first hit.",
        stat_bonus: "Holy%",
        stat_base: 5,
        stat_scale: 1
    },
    "Solar Genocide": {
        tier: 4,
        skill_name: "Burning Inquisition",
        description: "Gain 5% Holy DMG as DOT for the first 3 Hits, then increase self Holy DMG by 12% for the next 3 Hits.",
        stat_bonus: "Holy%",
        stat_base: 5,
        stat_scale: 1
    },
    "Evil Lord of Flame": {
        tier: 4,
        skill_name: "Searing Disaster",
        description: "Gain 4% Fire DMG as DOT. Increase self Fire DMG by 25% for the first 9 Hits.",
        stat_bonus: "Fire%",
        stat_base: 5,
        stat_scale: 1
    },
    "The Gazing Fire": {
        tier: 4,
        skill_name: "Fleeting Inferno",
        description: "Increase self Fire DMG by 40% for the first 3 Hits, then decrease it by 15% for the next 3 Hits. Loop.",
        stat_bonus: "Fire%",
        stat_base: 5,
        stat_scale: 1
    },
    "Red Lightning": {
        tier: 4,
        skill_name: "Chaining Fury",
        description: "25% of Lightning Single Target DMG applied as AOE DMG. Increase self Lightning DMG by 15%.",
        stat_bonus: "Lightning%",
        stat_base: 5,
        stat_scale: 1
    },
    "Bringer of Light": {
        tier: 4,
        skill_name: "Flash of Light",
        description: "Increase self Lightning DMG by 40% for the first Hit, by 15% for the 2nd Hit, 5% for the 3rd Hit. Loop.",
        stat_bonus: "Lightning%",
        stat_base: 5,
        stat_scale: 1
    },
    "Evil Druid King": {
        tier: 4,
        skill_name: "Behemoth Rage",
        description: "Increase self Earth DMG by 10% for the first 2 Hits, by 15% for the next 3 Hits, and by 30% for the rest of the battle.",
        stat_bonus: "Earth%",
        stat_base: 5,
        stat_scale: 1
    },
    "Black Capsule Lord": {
        tier: 4,
        skill_name: "Swarming Guard",
        description: "Increase party DEF by 2000% Earth DMG until their first hit. Increase self Earth DMG by 18% for the rest of battle.",
        stat_bonus: "Earth%",
        stat_base: 5,
        stat_scale: 1
    },
    "Tri Arts Sage": {
        tier: 4,
        skill_name: "Winds of Magic",
        description: "Gain Temp MP equal to EleWind and Increase Wind DMG by 15% for the first 5 Hits. Activate (Magic Hurricane) after. Increase Wind Pen by 25% for the rest of the battle.",
        stat_bonus: "Wind%",
        stat_base: 5,
        stat_scale: 1
    },
    "Nature's Queen": {
        tier: 4,
        skill_name: "Fleeting Gale",
        description: "Increase self Wind Pen by 40% for 1 hit. Activate (Calm Wind) after. Decrease Wind DMG by 20% for 2 turns. Loop.",
        stat_bonus: "Wind%",
        stat_base: 5,
        stat_scale: 1
    },
    "Hero of Ice": {
        tier: 4,
        skill_name: "Deep Frostbite",
        description: "Gain Flat +100% Water Crit Chance, but decrease Crit DMG by 15%.",
        stat_bonus: "Water%",
        stat_base: 5,
        stat_scale: 1
    },
    "Biding Dragon Lord": {
        tier: 4,
        skill_name: "Flood Gates",
        description: "Gain MP Regen equal to 1% of Max MP until your first hit. Increase EleWater by 50% Max MP for 1st Hit. Decrease All Elements DMG except Water by -2500%.",
        stat_bonus: "Water%",
        stat_base: 5,
        stat_scale: 1
    },
    "Venomous Rose": {
        tier: 4,
        skill_name: "Vile Toxins",
        description: "Gain +4% Toxic DMG done as DOT. After 12 hits, increase Toxic DMG by 33%.",
        stat_bonus: "Toxic%",
        stat_base: 5,
        stat_scale: 1
    },
    "Insectoid Mistress": {
        tier: 4,
        skill_name: "Venom Predation",
        description: "Increase self Toxic Pen by 125% for the first hit.",
        stat_bonus: "Toxic%",
        stat_base: 5,
        stat_scale: 1
    },
    "Infinite Magic": {
        tier: 4,
        skill_name: "Void Bubble",
        description: "Give party Temp HP equal to 30,000% Void DMG and decrease self Void DMG by 80% for the first 5 Turns.",
        stat_bonus: "Void%",
        stat_base: 5,
        stat_scale: 1
    },
    "Lady Landfall": {
        tier: 4,
        skill_name: "Curse of Disaster",
        description: "Start with 15% less MP, but increase self Void DMG by 15%.",
        stat_bonus: "Void%",
        stat_base: 5,
        stat_scale: 1
    },
    "Champion of the Kingdom": {
        tier: 4,
        skill_name: "Sword Commander",
        description: "Increase party All Elements DMG by 6% of self Slash DMG. Increase self Sword DMG by 8%.",
        stat_bonus: "Slash%",
        stat_base: 5,
        stat_scale: 1
    },
    "Azure Blademaster": {
        tier: 4,
        skill_name: "Whistling Wind",
        description: "Gain +200% Crit Chance and increase self Crit DMG by 33% for the first hit, then +20% Crit Chance permanently.",
        stat_bonus: "Slash%",
        stat_base: 5,
        stat_scale: 1
    },
    "Prophetic Archer": {
        tier: 4,
        skill_name: "Fervant Arrows",
        description: "Increase self Bow DMG by 100% of Holy DMG. Increase self ATK by 100% Healpower.",
        stat_bonus: "Pierce%",
        stat_base: 5,
        stat_scale: 1,
        conversions: [
            { source: "Holy%", ratio: 1, resulting_stat: "Bow DMG%"},
            { source: "HEAL", ratio: 1, resulting_stat: "ATK"},
        ]
    },
    "Farsight Elf": {
        tier: 4,
        skill_name: "Sharp Sniper",
        description: "Gain +33% Bow Crit Chance. Increase Bow DMG by 12%.",
        stat_bonus: "Pierce%",
        stat_base: 5,
        stat_scale: 1
    },
    "Muscle Mystery Warrior": {
        tier: 4,
        skill_name: "Fell Hammer",
        description: "Gain +200% Hammer Crit Chance for the first 3 Hits, then +10% Hammer Crit DMG afterwards.",
        stat_bonus: "Blunt%",
        stat_base: 5,
        stat_scale: 1
    },
    "Mountain Tribunal": {
        tier: 4,
        skill_name: "King's Tribunal",
        description: "Increase self Hammer DMG by 20% DEF Multiplier.",
        stat_bonus: "Blunt%",
        stat_base: 5,
        stat_scale: 1,
        conversions: [
            { source: "DEF%", ratio: 0.20, resulting_stat: "Hammer DMG%"}
        ]
    },
    "Tenjho Tenge": {
        tier: 4,
        skill_name: "Assassin's Mark",
        description: "Increase self Dagger DMG by 100% for the first hit.",
        stat_bonus: "Slash%",
        stat_base: 5,
        stat_scale: 1
    },
    "Ijayniya": {
        tier: 4,
        skill_name: "Ninja's Assault",
        description: "10% Slash DMG applied as DOT for the first hit. Dagger DMG increase by 15% for the first 3 hits. Sword DMG reduced by 50%.",
        stat_bonus: "Slash%",
        stat_base: 5,
        stat_scale: 1
    },
    "Demigod Champion": {
        tier: 4,
        skill_name: "Spear of Fanaticism",
        description: "Decrease Spear DMG by 10% on the first hit, increase by 5% on the second, and increase by 15% permanently on the third.",
        stat_bonus: "Pierce%",
        stat_base: 5,
        stat_scale: 1
    },
    "Elderly Lancer": {
        tier: 4,
        skill_name: "Furious Spears",
        description: "Increase Spear DMG by 20% for the first 8 hits, then reduced by 10% permanently.",
        stat_bonus: "Pierce%",
        stat_base: 5,
        stat_scale: 1
    },
    "Underworld Enforcer": {
        tier: 4,
        skill_name: "Shamanic Fists",
        description: "Increase Fist DMG by 16% for the 5th to 8th hits, then 10% permanently.",
        stat_bonus: "Blunt%",
        stat_base: 5,
        stat_scale: 1
    },
    "The Great Khan": {
        tier: 4,
        skill_name: "Metallic Skin",
        description: "Increase DEF by 1750% Blunt DMG. Increase Fist DMG by 10% DEF Multiplier.",
        stat_bonus: "Blunt%",
        stat_base: 5,
        stat_scale: 1
    },
    "Four Spirits Sage": {
        tier: 4,
        skill_name: "Arcane Wisdom",
        description: "Increase Elemental Pen by 40% of the highest Elemental PEN (highest gains a 10% increase instead)",
        stat_bonus: "MATK%",
        stat_base: 10,
        stat_scale: 2
    },
    "Myriad Barriers": {
        tier: 4,
        skill_name: "Dual Guard",
        description: "Increase self DEF by 25%, but reduce Power by 25% DEF.",
        stat_bonus: "DEF%",
        stat_base: 10,
        stat_scale: 2
    },
    "Watchman of Hades": {
        tier: 4,
        skill_name: "Guardian Bulwark",
        description: "Increase party DEF by 10% self DEF, but reduce self DEF by 15%.",
        stat_bonus: "DEF%",
        stat_base: 10,
        stat_scale: 2
    },
    "Foolish Samurai": {
        tier: 4,
        skill_name: "Selfish Fury",
        description: "Decrease party DEF by 50% self DEF, but increase self ATK by 20%.",
        stat_bonus: "ATK%",
        stat_base: 10,
        stat_scale: 2
    },
    "The Last King": {
        tier: 4,
        skill_name: "Warrior King",
        description: "Increase party Power by 10% self ATK, decrease self ATK by 10%.",
        stat_bonus: "ATK%",
        stat_base: 10,
        stat_scale: 2
    },
    "Cursed Destiny Caster": {
        tier: 4,
        skill_name: "Seer Eyes",
        description: "Increase party DEF by 5% self MATK, and party gains +10% Crit Chance.",
        stat_bonus: "MATK%",
        stat_base: 10,
        stat_scale: 2
    },
    "Vampiric Sage": {
        tier: 4,
        skill_name: "Mana Vitality",
        description: "Start with extra HP equal to 33% MATK",
        stat_bonus: "MATK%",
        stat_base: 10,
        stat_scale: 2
    },
    "Dark Priest of Wisdom": {
        tier: 4,
        skill_name: "Omen of Principality",
        description: "Increase self DEF by 50% Healpower until the first hit.",
        stat_bonus: "HEAL%",
        stat_base: 10,
        stat_scale: 2
    },
    "Reckless Templar": {
        tier: 4,
        skill_name: "Crusader Vengeance",
        description: "Increase party All Elements DMG by 10% of Heal Multiplier, but decrease party DEF by 50% Self DEF.",
        stat_bonus: "HEAL%",
        stat_base: 10,
        stat_scale: 2
    },
    "High-Firepower Star Magician": {
        tier: 4,
        is_active: true,
        skill_name: "Spark Calamity / Shadow Catastrophe",
        description: "[ Void ] Deals 1600% MATK DMG, 45% of Max MP",
        stat_bonus: "Void Pen%",
        stat_base: 1,
        stat_scale: 0.5
    },
    "Time Lord of Ruination": {
        tier: 4,
        is_active: true,
        skill_name: "Temporal Senescence",
        description: "[ Void ] Deals MATK DMG with % equal to 16% Elevoid, 6% Damage Done applied as DOT. 2% of Void DMG inflicted as DOT for 2 Turns. Costs 4% of Max MP.",
        stat_bonus: "Void%",
        stat_base: 5,
        stat_scale: 1
    },
    "Conscript Army": {
        tier: 3,
        skill_name: "Force through Numbers",
        description: "All Physical Single Target Attacks now applies 20% DMG done as AOE. Reduce self Physical xDMG by 10%.",
        stat_bonus: "ATK%",
        stat_base: 8,
        stat_scale: 1
    },
    "Six Arms Rogue": {
        tier: 3,
        skill_name: "Disposable Assassin",
        description: "Increase self ATK by 10%, reduce self DEF by 40% DEF.",
        stat_bonus: "ATK%",
        stat_base: 8,
        stat_scale: 1
    },
    "Knight Rider": {
        tier: 3,
        skill_name: "Knight Rider",
        description: "Start with extra HP equal to 10% ATK",
        stat_bonus: "ATK%",
        stat_base: 8,
        stat_scale: 1
    },
    "Elder Lich": {
        tier: 3,
        skill_name: "Spectral Mana",
        description: "Start with extra 15% MP, but reduce self MATK by 10%.",
        stat_bonus: "MATK%",
        stat_base: 8,
        stat_scale: 1
    },
    "Sunlight Guard": {
        tier: 3,
        skill_name: "Essence Guard",
        description: "Raise self DEF by 15% MATK and suffer a 5% penalty to MATK for the rest of the battle. Cannot stack with Essence Protect.",
        stat_bonus: "MATK%",
        stat_base: 8,
        stat_scale: 1
    },
    "Four Gods Devotee": {
        tier: 3,
        skill_name: "Blind Faith",
        description: "Raise self DEF by 20% Healpower, but decrease self Max HP by 20%.",
        stat_bonus: "HEAL%",
        stat_base: 8,
        stat_scale: 1
    },
    "Mercenary Cleric": {
        tier: 3,
        skill_name: "Hired Healing",
        description: "Increase self Healpower by 20% for the first 10 hits, then decrease by 10% for the rest of the battle.",
        stat_bonus: "HEAL%",
        stat_base: 8,
        stat_scale: 1
    },
    "Perverted Healer": {
        tier: 3,
        skill_name: "Questionable Love",
        description: "Gain +20% Crit Chance and increase self Healpower by 5%. Penalty of 33% Global DMG.",
        stat_bonus: "HEAL%",
        stat_base: 8,
        stat_scale: 1
    },
    "Quagoa Warrior": {
        tier: 3,
        skill_name: "Flesh as Steel",
        description: "Reduce self DEF by 10%, but increase self Max HP by 10%.",
        stat_bonus: "DEF%",
        stat_base: 8,
        stat_scale: 1
    },
    "Undead Mind": {
        tier: 3,
        skill_name: "Hate of the Living",
        description: "Gain +100% Threat Multiplier. Increase DEF by 10%.",
        stat_bonus: "DEF%",
        stat_base: 8,
        stat_scale: 1,
        stats: {
            "Threat%": 100
        },
        conversions: [
            { source: "DEF", ratio: 0.10, resulting_stat: "DEF"}
        ]
    },
    "Unrelenting Horde": {
        tier: 3,
        skill_name: "Pain Nullification",
        description: "Increase self Max HP and DEF by 5%. Reduce self Power by 10% DEF.",
        stat_bonus: "DEF%",
        stat_base: 8,
        stat_scale: 1,
        conversions: [
            { source: "HP", ratio: 0.05, resulting_stat: "HP"},
            { source: "DEF", ratio: 0.05, resulting_stat: "DEF"},
            { source: "DEF", ratio: 0.05, resulting_stat: "POWER"}
        ]
    },
    "Royal Guard": {
        tier: 3,
        skill_name: "Vanguard Strike",
        description: "Ignore 80% of armor with Physical DMG for your first 4 hits.",
        stat_bonus: "ATK%",
        stat_base: 8,
        stat_scale: 1
    },
    "Academy Apprentice": {
        tier: 3,
        skill_name: "Magic Knowledge",
        description: "Ignore 80% of armor with Magic DMG for your first 4 hits.",
        stat_bonus: "MATK%",
        stat_base: 8,
        stat_scale: 1
    },
    "Destroyer of the Kingdom": {
        tier: 3,
        skill_name: "Fat Head",
        description: "Reduce self DEF by 95%. Increase self Max HP by 33%.",
        stat_bonus: "HP%",
        stat_base: 100,
        stat_scale: 50
    },
    "Poorly Named Lich": {
        tier: 3,
        skill_name: "Dark Artifacts",
        description: "Increase self MATK by 5%, reduce self Max HP by 8%.",
        stat_bonus: "MATK%",
        stat_base: 8,
        stat_scale: 1
    },
    "Lizardmen Warriors": {
        tier: 3,
        skill_name: "Tribal Fury",
        description: "Increase self ATK by 6%, reduce self DEF by 4% ATK.",
        stat_bonus: "ATK%",
        stat_base: 8,
        stat_scale: 1
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
    },
    "Doppelganger of Justice": {
        tier: 3,
        skill_name: "World Break / Shadow Break",
        description: "[ ⧖, Void ] Deals 160%/350% ATK/DEF Damage, scales with Total Phys DMG, -10% Damage Taken for 1 Turn, 3 Turn Cooldown, Costs 10% of Max HP",
        stat_bonus: "ATK%",
        stat_base: 8,
        stat_scale: 1
    },
    "Path of Violence": {
        tier: 3,
        skill_name: "MA Limit Break / Limit Break",
        description: "[ ⧖ ] Increase self ATK by 100% ATK for 1 Turn, 45/-5 Focus",
        stat_bonus: "ATK%",
        stat_base: 8,
        stat_scale: 1
    }
}

export default tarot_data;
