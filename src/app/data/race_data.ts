// --- START OF FILE race_data.ts ---
export type Race = {
    tag: string;
    description: string;
    stats: Record<string, number>; // Base racial stats/resists
    heroPointStats: Record<string, { cost: number; gain: number }>; // Stats gained per hero point spent
}

function computeRaceColumnWidths(data: Record<string, Race>): string[] {
    console.log("Computing race_data column widths")
    // Headers relevant for displaying race base info
    const headers = [
        "Name", "Tag", "Description"
        // Add more headers here if you want to display hero point info directly in the main table
    ]
    const longest = headers.map(h => h.length)

    for (const [name, r] of Object.entries(data)) {
        const values = [
            name,
            r.tag,
            r.description
            // Add corresponding values here if headers are added above
        ]
        values.forEach((v, i) => {
            // Ensure value is treated as a string for length calculation
            longest[i] = Math.max(longest[i], String(v).length)
        })
    }

    // Using the same formula as talent_data for consistency
    return longest.map(chLen => `${Math.ceil(chLen * 8 + 32)}px`)
}

// --- Define Stat Names and Costs from the table ---
// Order matters here, must match the table columns exactly
const heroPointStatOrder = [
    "ATK%", "DEF%", "MATK%", "HEAL%", // Main Stats Multipliers
    "Fire%", "Lightning%", "Water%", "Earth%", "Wind%", "Toxic%", "Void%", "Neg%", "Holy%", // Elemental Damage
    "Blunt%", "Pierce%", "Slash%", // Physical Damage
    "Fire Res%", "Lightning Res%", "Water Res%", "Earth Res%", "Wind Res%", "Toxic Res%", "Void Res%", "Neg Res%", "Holy Res%", "Blunt Res%", "Pierce Res%", "Slash Res%", // Resists
    "Void Pen%" // Penetration
];

const heroPointStatCosts = [
    1, 1, 1, 1, // Main Stats
    1, 1, 1, 1, 1, 1, 2, 1, 1, // Elemental Damage
    1, 1, 1, // Physical Damage
    2, 2, 2, 2, 2, 2, 3, 2, 2, 2, 2, 2, // Resists
    2 // Penetration
];

// Helper function to build the heroPointStats object for a race
function buildHeroPointStats(gains: number[]): Record<string, { cost: number; gain: number }> {
    const stats: Record<string, { cost: number; gain: number }> = {};
    if (gains.length !== heroPointStatOrder.length || gains.length !== heroPointStatCosts.length) {
        console.error(`Mismatch in hero point data length! Expected ${heroPointStatOrder.length}, Got ${gains.length}`);
        return {}; // Return empty object on error
    }
    heroPointStatOrder.forEach((statName, index) => {
        stats[statName] = {
            cost: heroPointStatCosts[index],
            gain: gains[index] // Store the raw gain value (e.g., 5 for +5%)
        };
    });
    return stats;
}


const race_data: Record<string, Race> = {
    "Skeleton": {
        tag: "Skeleton",
        description: "+50% Negative Resist, +25% Slash/Pierce/Water Resist, -25% Blunt/Fire, -50% Holy Resist",
        stats: {
            "Neg Res%": 0.50,
            "Slash Res%": 0.25,
            "Pierce Res%": 0.25,
            "Water Res%": 0.25,
            "Blunt Res%": -0.25,
            "Fire Res%": -0.25,
            "Holy Res%": -0.50
        },
        heroPointStats: buildHeroPointStats([5, 5, 5, 5, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 1, 3, 3, 2, 2, 3, 1, 3, 1, 1, 3, 3, 0])
    },
    "Zombie": {
        tag: "Zombie",
        description: "+50% Negative Resist, 25% Water Resist, -25% Fire Resist, -50% Holy",
        stats: {
            "Neg Res%": 0.50,
            "Water Res%": 0.25,
            "Fire Res%": -0.25,
            "Holy Res%": -0.50
        },
        heroPointStats: buildHeroPointStats([5, 5, 5, 5, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 1, 3, 3, 2, 2, 3, 1, 3, 1, 2, 2, 2, 0])
    },
    "Wood Elf": {
        tag: "WoodElf",
        description: "+5% Crit Chance, -10% DEF",
        stats: {
            "Crit Chance%": 0.05,
            "DEF%": -0.10
        },
        heroPointStats: buildHeroPointStats([4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 2, 2, 1, 6, 4, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 1])
    },
    "Dwarf": {
        tag: "Dwarf",
        description: "+5% ATK, +5% DEF, -5% Crit Chance",
        stats: {
            "ATK%": 0.05,
            "DEF%": 0.05,
            "Crit Chance%": -0.05
        },
        heroPointStats: buildHeroPointStats([4, 4, 4, 4, 4, 4, 2, 4, 2, 4, 3, 2, 2, 6, 1, 6, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 1])
    },
    "Orc": {
        tag: "Orc",
        description: "+5% ATK, +5% DEF, -5% MATK, -5% Heal",
        stats: {
            "ATK%": 0.05,
            "DEF%": 0.05,
            "MATK%": -0.05,
            "HEAL%": -0.05
        },
        heroPointStats: buildHeroPointStats([5, 5, 5, 5, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 0])
    },
    "Goblin": {
        tag: "Goblin",
        description: "+5% Crit Chance, -5% ATK, -5% DEF",
        stats: {
            "Crit Chance%": 0.05,
            "ATK%": -0.05,
            "DEF%": -0.05
        },
        heroPointStats: buildHeroPointStats([4, 4, 5, 5, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 0])
    },
    "Lizardman": {
        tag: "Lizardman",
        description: "+25% Water Resist, -25% Lightning Resist",
        stats: {
            "Water Res%": 0.25,
            "Lightning Res%": -0.25
        },
        heroPointStats: buildHeroPointStats([5, 5, 5, 5, 2, 1, 3, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 3, 2, 2, 2, 1, 2, 2, 2, 2, 2, 0])
    },
    "Giant": {
        tag: "Giant",
        description: "+10% ATK, +10% DEF, -10% Crit Chance",
        stats: {
            "ATK%": 0.10,
            "DEF%": 0.10,
            "Crit Chance%": -0.10
        },
        heroPointStats: buildHeroPointStats([5, 5, 5, 5, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 0])
    },
    "Dragonspawn": {
        tag: "Dragonspawn",
        description: "+15% DEF, +15% ATK, -15% MATK, -15% Wind/Water/Lightning Resist",
        stats: {
            "DEF%": 0.15,
            "ATK%": 0.15,
            "MATK%": -0.15,
            "Wind Res%": -0.15,
            "Water Res%": -0.15,
            "Lightning Res%": -0.15
        },
        heroPointStats: buildHeroPointStats([5, 5, 5, 5, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 2, 1, 2, 1, 2, 2, 2, 2, 2, 0])
    },
    "Dark Elf": {
        tag: "DarkElf",
        description: "+5% Crit Chance, +5% MATK, -5% ATK, -10% DEF",
        stats: {
            "Crit Chance%": 0.05,
            "MATK%": 0.05,
            "ATK%": -0.05,
            "DEF%": -0.10
        },
        heroPointStats: buildHeroPointStats([4, 4, 4, 4, 2, 2, 2, 2, 2, 2, 3, 4, 4, 1, 6, 4, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 1])
    },
    "Demon": {
        tag: "Demon",
        description: "+50% Fire Resist, -50% Holy",
        stats: {
            "Fire Res%": 0.50,
            "Holy Res%": -0.50
        },
        heroPointStats: buildHeroPointStats([6, 6, 6, 4, 3, 2, 2, 2, 2, 2, 3, 2, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 1, 2, 2, 2, 0])
    },
    "Angel": {
        tag: "Angel",
        description: "+50% Holy Resist, -50% Negative Resist",
        stats: {
            "Holy Res%": 0.50,
            "Neg Res%": -0.50
        },
        heroPointStats: buildHeroPointStats([6, 4, 6, 6, 2, 2, 2, 2, 2, 2, 2, 0, 3, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 3, 2, 2, 2, 0])
    },
    "Vampire": {
        tag: "Vampire",
        description: "+50% Negative Resist, +5% ATK, +5% DEF, -25% Fire Resist, -50% Holy Resist",
        stats: {
            "Neg Res%": 0.50,
            "ATK%": 0.05,
            "DEF%": 0.05,
            "Fire Res%": -0.25,
            "Holy Res%": -0.50
        },
        heroPointStats: buildHeroPointStats([6, 6, 5, 5, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 3, 3, 2, 2, 2, 1, 3, 1, 2, 2, 2, 0])
    },
    "Insectoid": {
        tag: "Insectoid",
        description: "+5% ATK, +5% DEF, +10% Toxic Resist, -10% Fire Resist",
        stats: {
            "ATK%": 0.05,
            "DEF%": 0.05,
            "Toxic Res%": 0.10,
            "Fire Res%": -0.10
        },
        heroPointStats: buildHeroPointStats([6, 6, 5, 5, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 3, 1, 2, 2, 2, 2, 2, 0])
    },
    "Ogre": {
        tag: "Ogre",
        description: "+10% ATK, +5% DEF, -5% MATK, -5% Heal, +25 HP, -5% Crit Chance",
        stats: {
            "ATK%": 0.10,
            "DEF%": 0.05,
            "MATK%": -0.05,
            "HEAL%": -0.05,
            "HP": 25,
            "Crit Chance%": -0.05
        },
        heroPointStats: buildHeroPointStats([6, 6, 4, 4, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 0])
    },
    "Troll": {
        tag: "Troll",
        description: "+10% ATK, +10% DEF, -5% MATK, -5% Heal, -25% Fire/Toxic Resist",
        stats: {
            "ATK%": 0.10,
            "DEF%": 0.10,
            "MATK%": -0.05,
            "HEAL%": -0.05,
            "Fire Res%": -0.25,
            "Toxic Res%": -0.25
        },
        heroPointStats: buildHeroPointStats([6, 6, 4, 4, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 2, 0])
    },
    "Quogga": {
        tag: "Quogga",
        description: "+10% ATK, +5% Physical Resist, -20% DEF, -25% Lightning Resist",
        stats: {
            "ATK%": 0.10,
            "Slash Res%": 0.05,
            "Pierce Res%": 0.05,
            "Blunt Res%": 0.05,
            "DEF%": -0.20,
            "Lightning Res%": -0.25
        },
        heroPointStats: buildHeroPointStats([5, 5, 5, 5, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 1, 2, 2, 3, 3, 3, 0])
    },
    "Minotaur": {
        tag: "Minotaur",
        description: "+5% ATK, +5% DEF, -5% MATK, -5% Heal",
        stats: {
            "ATK%": 0.05,
            "DEF%": 0.05,
            "MATK%": -0.05,
            "HEAL%": -0.05
        },
        heroPointStats: buildHeroPointStats([5, 6, 5, 5, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 0])
    },
    "Tigerman": {
        tag: "Tigerman",
        description: "+10% ATK, -10% DEF",
        stats: {
            "ATK%": 0.10,
            "DEF%": -0.10
        },
        heroPointStats: buildHeroPointStats([5, 5, 5, 5, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 0])
    },
    "Goatman": {
        tag: "Goatman",
        description: "+5% ATK, -5% DEF",
        stats: {
            "ATK%": 0.05,
            "DEF%": -0.05
        },
        heroPointStats: buildHeroPointStats([5, 5, 5, 5, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 0])
    },
    "Rainbow Human": {
        tag: "RainbowMan",
        description: "+5% MATK, -5% DEF, +3 EXP Bonus",
        stats: {
            "MATK%": 0.05,
            "DEF%": -0.05,
            "EXP Bonus": 3
        },
        heroPointStats: buildHeroPointStats([4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 3, 5, 5, 1, 1, 1, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 1])
    },
    "Northern Human": {
        tag: "NorthMan",
        description: "+4 EXP Bonus",
        stats: {
            "EXP Bonus": 4
        },
        heroPointStats: buildHeroPointStats([4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 3, 4, 4, 4, 4, 4, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 1]) // Corrected length
    },
    "Southern Human": {
        tag: "SouthMan",
        description: "+5% ATK, -5% DEF, +3 EXP Bonus",
        stats: {
            "ATK%": 0.05,
            "DEF%": -0.05,
            "EXP Bonus": 3
        },
        heroPointStats: buildHeroPointStats([4, 4, 4, 4, 1, 1, 1, 1, 1, 1, 3, 1, 1, 5, 5, 5, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 1])
    },
    "Half-Golem": {
        tag: "HalfGolem",
        description: "+50% Holy/Toxic/Negative Resist, +10% DEF, -20% Crit Chance",
        stats: {
            "Holy Res%": 0.50,
            "Toxic Res%": 0.50,
            "Neg Res%": 0.50,
            "DEF%": 0.10,
            "Crit Chance%": -0.20
        },
        heroPointStats: buildHeroPointStats([4, 6, 4, 4, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 0])
    },
    "Frogman": {
        tag: "Frogman",
        description: "+25% Water Resist, -35% Lightning Resist, +5% MATK",
        stats: {
            "Water Res%": 0.25,
            "Lightning Res%": -0.35,
            "MATK%": 0.05
        },
        heroPointStats: buildHeroPointStats([4, 4, 6, 6, 2, 1, 3, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 3, 2, 2, 2, 1, 2, 2, 2, 2, 2, 0])
    },
    "Elemental": {
        tag: "Elemental",
        description: "+5% MATK, -5% ATK",
        stats: {
            "MATK%": 0.05,
            "ATK%": -0.05
        },
        heroPointStats: buildHeroPointStats([4, 4, 6, 6, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1, 1, 1, 2, 1, 2, 2, 2, 2, 2, 0])
    },
    "Tengu": {
        tag: "Tengu",
        description: "+10% MATK, -10% DEF",
        stats: {
            "MATK%": 0.10,
            "DEF%": -0.10
        },
        heroPointStats: buildHeroPointStats([4, 4, 6, 6, 2, 2, 2, 2, 2, 2, 3, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 0])
    },
    "Birdman": {
        tag: "Birdman",
        description: "+5% Crit Chance, +5% ATK, -15% DEF, -25% Lightning Resist",
        stats: {
            "Crit Chance%": 0.05,
            "ATK%": 0.05,
            "DEF%": -0.15,
            "Lightning Res%": -0.25
        },
        heroPointStats: buildHeroPointStats([6, 6, 4, 4, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 0])
    },
    "Slime": {
        tag: "Slime",
        description: "+10% Slash/Pierce/Water/Toxic Resist, -10% DEF, -40% Lightning Resist",
        stats: {
            "Slash Res%": 0.10,
            "Pierce Res%": 0.10,
            "Water Res%": 0.10,
            "Toxic Res%": 0.10,
            "DEF%": -0.10,
            "Lightning Res%": -0.40
        },
        heroPointStats: buildHeroPointStats([4, 6, 5, 5, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 0])
    },
    "Tree Spirit": {
        tag: "TreeSpirit",
        description: "+5% Heal, +5% Def, +25% Earth Resist, -25% Fire Resist",
        stats: {
            "HEAL%": 0.05,
            "DEF%": 0.05,
            "Earth Res%": 0.25,
            "Fire Res%": -0.25
        },
        heroPointStats: buildHeroPointStats([5, 6, 5, 6, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 3, 2, 2, 1, 2, 2, 2, 2, 2, 0])
    },
    "Arachnoid": {
        tag: "Arachnoid",
        description: "+10% ATK, -10% DEF, +10% Toxic Resist, -15% Fire Resist",
        stats: {
            "ATK%": 0.10,
            "DEF%": -0.10,
            "Toxic Res%": 0.10,
            "Fire Res%": -0.15
        },
        heroPointStats: buildHeroPointStats([5, 5, 5, 5, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 3, 1, 2, 2, 2, 2, 2, 0])
    },
    "Ghost": {
        tag: "Ghost",
        description: "+5% MATK, -5% ATK, +50% Negative Resist, -50% Holy Resist",
        stats: {
            "MATK%": 0.05,
            "ATK%": -0.05,
            "Neg Res%": 0.50,
            "Holy Res%": -0.50
        },
        heroPointStats: buildHeroPointStats([4, 4, 6, 6, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 3, 1, 3, 3, 3, 0])
    },
    "Kitsune": {
        tag: "Kitsune",
        description: "+25% Fire Resist, -25% Holy Resist, +5% ATK/MATK",
        stats: {
            "Fire Res%": 0.25,
            "Holy Res%": -0.25,
            "ATK%": 0.05,
            "MATK%": 0.05
        },
        heroPointStats: buildHeroPointStats([6, 4, 6, 5, 3, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 2, 2, 2, 2, 2, 1, 2, 1, 2, 2, 2, 0])
    },
    "Succubus": {
        tag: "Succubus",
        description: "+10% Physical Resist, +5% Void Resist, -10% Holy Resist, -5% Crit Chance",
        stats: {
            "Slash Res%": 0.10,
            "Pierce Res%": 0.10,
            "Blunt Res%": 0.10,
            "Void Res%": 0.05,
            "Holy Res%": -0.10,
            "Crit Chance%": -0.05
        },
        heroPointStats: buildHeroPointStats([6, 6, 6, 4, 2, 2, 3, 2, 2, 2, 3, 2, 0, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 1, 2, 2, 2, 0])
    },
};

const statSet = new Set<string>()

for (const entry of Object.values(race_data)) {
    Object.keys(entry.stats).forEach(stat => statSet.add(stat))
    // Also add stats from heroPointStats if needed for a complete list
    Object.keys(entry.heroPointStats).forEach(stat => statSet.add(stat))
}

// inject precomputed widths
const __raceColumnWidths = computeRaceColumnWidths(race_data)
const __allRaceStatNames = Array.from(statSet).sort()
// No conversions in this race data format
const __allRaceConversionNames: string[] = []

// export both
export { race_data, heroPointStatOrder, __raceColumnWidths, __allRaceStatNames, __allRaceConversionNames }
