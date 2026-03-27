import { StatNames } from "./stat_data";

export type ScriptWord = {
    description: string;
    recipe: string[];
    min_stats: Partial<Record<StatNames, number>>;
    max_stats: Partial<Record<StatNames, number>>;
};

export type Runeword = {
    description: string;
    component_words: string[];
    min_stats: Partial<Record<StatNames, number>>;
    max_stats: Partial<Record<StatNames, number>>;
};

export type ScriptData = {
    scripts: Record<string, ScriptWord>;
    runewords: Record<string, Runeword>;
};

export const script_recipes: Record<string, ScriptWord> = {
    "Pya": {
        "description": "[ 3 to 5 ] to Elefire",
        "recipe": ["Forge", "Flame", "Breath"],
        "min_stats": {
            "Fire%": 3,
        },
        "max_stats": {
            "Fire%": 5,
        },
    },
    "Ror": {
        "description": "[ 5 to 7 ] to Elefire",
        "recipe": ["Forge", "Blood", "Scorch"],
        "min_stats": {
            "Fire%": 5,
        },
        "max_stats": {
            "Fire%": 7,
        },
    },
    "Kor": {
        "description": "[ 6 to 8 ] to Elefire",
        "recipe": ["Craft", "Scorch", "Flame", "Hearth"],
        "min_stats": {
            "Fire%": 6,
        },
        "max_stats": {
            "Fire%": 8,
        },
    },
    "Ele": {
        "description": "[ 3 to 5 ] to Elelightning",
        "recipe": ["Forge", "Bolt", "Current"],
        "min_stats": {
            "Lightning%": 3,
        },
        "max_stats": {
            "Lightning%": 5,
        },
    },
    "Tor": {
        "description": "[ 5 to 7 ] to Elelightning",
        "recipe": ["Forge", "Shock", "Pierce"],
        "min_stats": {
            "Lightning%": 5,
        },
        "max_stats": {
            "Lightning%": 7,
        },
    },
    "Cor": {
        "description": "[ 6 to 8 ] to Elelightning",
        "recipe": ["Craft", "Bolt", "Shock", "Storm"],
        "min_stats": {
            "Lightning%": 6,
        },
        "max_stats": {
            "Lightning%": 8,
        },
    },
    "Hya": {
        "description": "[ 3 to 5 ] to Elewater",
        "recipe": ["Forge", "River", "Blood"],
        "min_stats": {
            "Water%": 3,
        },
        "max_stats": {
            "Water%": 5,
        },
    },
    "Dro": {
        "description": "[ 5 to 7 ] to Elewater",
        "recipe": ["Forge", "Caring", "Current"],
        "min_stats": {
            "Water%": 5,
        },
        "max_stats": {
            "Water%": 7,
        },
    },
    "Nor": {
        "description": "[ 6 to 8 ] to Elewater",
        "recipe": ["Craft", "River", "Sharpness", "Lake"],
        "min_stats": {
            "Water%": 6,
        },
        "max_stats": {
            "Water%": 8,
        },
    },
    "Den": {
        "description": "[ 3 to 5 ] to Eleearth",
        "recipe": ["Forge", "Stone", "Crush"],
        "min_stats": {
            "Earth%": 3,
        },
        "max_stats": {
            "Earth%": 5,
        },
    },
    "Ero": {
        "description": "[ 5 to 7 ] to Eleearth",
        "recipe": ["Forge", "Flame", "Grass"],
        "min_stats": {
            "Earth%": 5,
        },
        "max_stats": {
            "Earth%": 7,
        },
    },
    "Dror": {
        "description": "[ 6 to 8 ] to Eleearth",
        "recipe": ["Craft", "Stone", "Grass", "Metal"],
        "min_stats": {
            "Earth%": 6,
        },
        "max_stats": {
            "Earth%": 8,
        },
    },
    "Ama": {
        "description": "[ 3 to 5 ] to Elewind",
        "recipe": ["Forge", "Breath", "Pierce"],
        "min_stats": {
            "Wind%": 3,
        },
        "max_stats": {
            "Wind%": 5,
        },
    },
    "Nen": {
        "description": "[ 5 to 7 ] to Elewind",
        "recipe": ["Forge", "Gust", "Cut"],
        "min_stats": {
            "Wind%": 5,
        },
        "max_stats": {
            "Wind%": 7,
        },
    },
    "Mo": {
        "description": "[ 6 to 8 ] to Elewind",
        "recipe": ["Craft", "Sharpness", "Gust", "Wind"],
        "min_stats": {
            "Wind%": 6,
        },
        "max_stats": {
            "Wind%": 8,
        },
    },
    "Dol": {
        "description": "[ 3 to 5 ] to Eletoxic",
        "recipe": ["Forge", "Poison", "Blood"],
        "min_stats": {
            "Toxic%": 3,
        },
        "max_stats": {
            "Toxic%": 5,
        },
    },
    "Vel": {
        "description": "[ 5 to 7 ] to Eletoxic",
        "recipe": ["Forge", "Crush", "River"],
        "min_stats": {
            "Toxic%": 5,
        },
        "max_stats": {
            "Toxic%": 7,
        },
    },
    "Nom": {
        "description": "[ 6 to 8 ] to Eletoxic",
        "recipe": ["Craft", "Poison", "Current", "Disease"],
        "min_stats": {
            "Toxic%": 6,
        },
        "max_stats": {
            "Toxic%": 8,
        },
    },
    "Anu": {
        "description": "[ 2 to 3 ] to Elevoid",
        "recipe": ["Forge", "Breath", "Gust"],
        "min_stats": {
            "Void%": 2,
        },
        "max_stats": {
            "Void%": 3,
        },
    },
    "Bah": {
        "description": "[ 3 to 4 ] to Elevoid",
        "recipe": ["Forge", "Caring", "Thought"],
        "min_stats": {
            "Void%": 3,
        },
        "max_stats": {
            "Void%": 4,
        },
    },
    "Sath": {
        "description": "[ 4 to 5 ] to Elevoid",
        "recipe": ["Craft", "Experience", "Crush", "Energy"],
        "min_stats": {
            "Void%": 4,
        },
        "max_stats": {
            "Void%": 5,
        },
    },
    "Da": {
        "description": "[ 2 to 4 ] to Elenegative",
        "recipe": ["Forge", "Cut", "Caring"],
        "min_stats": {
            "Neg%": 2,
        },
        "max_stats": {
            "Neg%": 4,
        },
    },
    "Uh": {
        "description": "[ 3 to 5 ] to Elenegative",
        "recipe": ["Forge", "Pierce", "Experience"],
        "min_stats": {
            "Neg%": 3,
        },
        "max_stats": {
            "Neg%": 5,
        },
    },
    "No": {
        "description": "[ 4 to 6 ] to Elenegative",
        "recipe": ["Craft", "Poison", "Blood", "Death"],
        "min_stats": {
            "Neg%": 4,
        },
        "max_stats": {
            "Neg%": 6,
        },
    },
    "Meg": {
        "description": "[ 2 to 4 ] to Eleholy",
        "recipe": ["Forge", "Scorch", "Caring"],
        "min_stats": {
            "Holy%": 2,
        },
        "max_stats": {
            "Holy%": 4,
        },
    },
    "Ig": {
        "description": "[ 3 to 5 ] to Eleholy",
        "recipe": ["Forge", "Thought", "Experience"],
        "min_stats": {
            "Holy%": 3,
        },
        "max_stats": {
            "Holy%": 5,
        },
    },
    "Do": {
        "description": "[ 4 to 6 ] to Eleholy",
        "recipe": ["Craft", "Flame", "Thought", "Blessing"],
        "min_stats": {
            "Holy%": 4,
        },
        "max_stats": {
            "Holy%": 6,
        },
    },
    "Gru": {
        "description": "[ 2 to 4 ] to Eleblunt",
        "recipe": ["Forge", "Toughness", "Breath"],
        "min_stats": {
            "Blunt%": 2,
        },
        "max_stats": {
            "Blunt%": 4,
        },
    },
    "Nak": {
        "description": "[ 3 to 5 ] to Eleblunt",
        "recipe": ["Forge", "Crush", "Stone"],
        "min_stats": {
            "Blunt%": 3,
        },
        "max_stats": {
            "Blunt%": 5,
        },
    },
    "Tah": {
        "description": "[ 4 to 6 ] to Eleblunt",
        "recipe": ["Craft", "Experience", "Toughness", "War"],
        "min_stats": {
            "Blunt%": 4,
        },
        "max_stats": {
            "Blunt%": 6,
        },
    },
    "Est": {
        "description": "[ 2 to 4 ] to Elepierce",
        "recipe": ["Forge", "Shock", "Sharpness"],
        "min_stats": {
            "Pierce%": 2,
        },
        "max_stats": {
            "Pierce%": 4,
        },
    },
    "Ne": {
        "description": "[ 3 to 5 ] to Elepierce",
        "recipe": ["Forge", "Bolt", "Stone"],
        "min_stats": {
            "Pierce%": 3,
        },
        "max_stats": {
            "Pierce%": 5,
        },
    },
    "Vah": {
        "description": "[ 4 to 6 ] to Elepierce",
        "recipe": ["Craft", "Pierce", "Toughness", "Pain"],
        "min_stats": {
            "Pierce%": 4,
        },
        "max_stats": {
            "Pierce%": 6,
        },
    },
    "Wol": {
        "description": "[ 2 to 4 ] to Eleslash",
        "recipe": ["Forge", "Cut", "Grass"],
        "min_stats": {
            "Slash%": 2,
        },
        "max_stats": {
            "Slash%": 4,
        },
    },
    "Arr": {
        "description": "[ 3 to 5 ] to Eleslash",
        "recipe": ["Forge", "Scorch", "Sharpness"],
        "min_stats": {
            "Slash%": 3,
        },
        "max_stats": {
            "Slash%": 5,
        },
    },
    "Shah": {
        "description": "[ 4 to 6 ] to Eleslash",
        "recipe": ["Craft", "Toughness", "Cut", "Flesh"],
        "min_stats": {
            "Slash%": 4,
        },
        "max_stats": {
            "Slash%": 6,
        },
    },
    "Ca": {
        "description": "[ 2 to 4 ] to Atkmulti",
        "recipe": ["Forge", "Cut", "Grass"],
        "min_stats": {
            "ATK%": 2,
        },
        "max_stats": {
            "ATK%": 4,
        },
    },
    "Nin": {
        "description": "[ 3 to 5 ] to Atkmulti",
        "recipe": ["Forge", "Crush", "Bolt"],
        "min_stats": {
            "ATK%": 3,
        },
        "max_stats": {
            "ATK%": 5,
        },
    },
    "Ein": {
        "description": "[ 4 to 6 ] to Atkmulti",
        "recipe": ["Craft", "Pierce", "Blood", "War"],
        "min_stats": {
            "ATK%": 4,
        },
        "max_stats": {
            "ATK%": 6,
        },
    },
    "Tur": {
        "description": "[ 2 to 4 ] to Defmulti",
        "recipe": ["Forge", "Stone", "Breath"],
        "min_stats": {
            "DEF%": 2,
        },
        "max_stats": {
            "DEF%": 4,
        },
    },
    "Toro": {
        "description": "[ 3 to 5 ] to Defmulti",
        "recipe": ["Forge", "Toughness", "Thought"],
        "min_stats": {
            "DEF%": 3,
        },
        "max_stats": {
            "DEF%": 5,
        },
    },
    "La": {
        "description": "[ 4 to 6 ] to Defmulti",
        "recipe": ["Craft", "Blood", "Shock", "Protection"],
        "min_stats": {
            "DEF%": 4,
        },
        "max_stats": {
            "DEF%": 6,
        },
    },
    "Ra": {
        "description": "[ 2 to 4 ] to Matkmulti",
        "recipe": ["Forge", "Current", "Poison"],
        "min_stats": {
            "MATK%": 2,
        },
        "max_stats": {
            "MATK%": 4,
        },
    },
    "Ven": {
        "description": "[ 3 to 5 ] to Matkmulti",
        "recipe": ["Forge", "Gust", "Bolt"],
        "min_stats": {
            "MATK%": 3,
        },
        "max_stats": {
            "MATK%": 5,
        },
    },
    "Nah": {
        "description": "[ 4 to 6 ] to Matkmulti",
        "recipe": ["Craft", "Poison", "River", "Knowledge"],
        "min_stats": {
            "MATK%": 4,
        },
        "max_stats": {
            "MATK%": 6,
        },
    },
    "Lu": {
        "description": "[ 2 to 4 ] to Healmulti",
        "recipe": ["Forge", "Caring", "Thought"],
        "min_stats": {
            "HEAL%": 2,
        },
        "max_stats": {
            "HEAL%": 4,
        },
    },
    "Ge": {
        "description": "[ 3 to 5 ] to Healmulti",
        "recipe": ["Forge", "Experience", "Shock"],
        "min_stats": {
            "HEAL%": 3,
        },
        "max_stats": {
            "HEAL%": 5,
        },
    },
    "Ah": {
        "description": "[ 4 to 6 ] to Healmulti",
        "recipe": ["Craft", "Current", "Flame", "Love"],
        "min_stats": {
            "HEAL%": 4,
        },
        "max_stats": {
            "HEAL%": 6,
        },
    },
    "Pan": {
        "description": "[ 1 to 2 ] to CritChance",
        "recipe": ["Forge", "Thought", "Blessing"],
        "min_stats": {
            "Crit Chance%": 1,
        },
        "max_stats": {
            "Crit Chance%": 2,
        },
    },
    "Dor": {
        "description": "[ 1 to 3 ] to CritChance",
        "recipe": ["Forge", "Sharpness", "Learning"],
        "min_stats": {
            "Crit Chance%": 1,
        },
        "max_stats": {
            "Crit Chance%": 3,
        },
    },
    "Ahr": {
        "description": "[ 1 to 3 ] to CritChance",
        "recipe": ["Craft", "Gust", "Luck", "Eternity"],
        "min_stats": {
            "Crit Chance%": 1,
        },
        "max_stats": {
            "Crit Chance%": 3,
        },
    },
    "For": {
        "description": "[ 2 to 5 ] to CritDamage",
        "recipe": ["Forge", "Scorch", "Luck"],
        "min_stats": {
            "Crit DMG%": 2,
        },
        "max_stats": {
            "Crit DMG%": 5,
        },
    },
    "Tun": {
        "description": "[ 2 to 7 ] to CritDamage",
        "recipe": ["Forge", "Experience", "Forest"],
        "min_stats": {
            "Crit DMG%": 2,
        },
        "max_stats": {
            "Crit DMG%": 7,
        },
    },
    "Na": {
        "description": "[ 3 to 9 ] to CritDamage",
        "recipe": ["Craft", "Toughness", "Protection", "Fortune"],
        "min_stats": {
            "Crit DMG%": 3,
        },
        "max_stats": {
            "Crit DMG%": 9,
        },
    },
    "Igni": {
        "description": "[ 1 to 9 ] to Elefire",
        "recipe": ["Craft", "Flame", "Energy"],
        "min_stats": {
            "Fire%": 1,
        },
        "max_stats": {
            "Fire%": 9,
        },
    },
    "Neut": {
        "description": "[ 1 to 9 ] to Elelightning",
        "recipe": ["Craft", "Bolt", "Storm"],
        "min_stats": {
            "Lightning%": 1,
        },
        "max_stats": {
            "Lightning%": 9,
        },
    },
    "Oxi": {
        "description": "[ 1 to 9 ] to Elewater",
        "recipe": ["Craft", "Current", "Lake"],
        "min_stats": {
            "Water%": 1,
        },
        "max_stats": {
            "Water%": 9,
        },
    },
    "Ter": {
        "description": "[ 1 to 9 ] to Eleearth",
        "recipe": ["Craft", "Stone", "Forest"],
        "min_stats": {
            "Earth%": 1,
        },
        "max_stats": {
            "Earth%": 9,
        },
    },
    "Njor": {
        "description": "[ 1 to 9 ] to Elewind",
        "recipe": ["Craft", "Breath", "Wind"],
        "min_stats": {
            "Wind%": 1,
        },
        "max_stats": {
            "Wind%": 9,
        },
    },
    "Eti": {
        "description": "[ 1 to 9 ] to Eletoxic",
        "recipe": ["Craft", "Poison", "Disease"],
        "min_stats": {
            "Toxic%": 1,
        },
        "max_stats": {
            "Toxic%": 9,
        },
    },
    "Ygg": {
        "description": "[ 1 to 9 ] to Elevoid",
        "recipe": ["Craft", "River", "Pain"],
        "min_stats": {
            "Void%": 1,
        },
        "max_stats": {
            "Void%": 9,
        },
    },
    "Hel": {
        "description": "[ 1 to 9 ] to Elenegative",
        "recipe": ["Craft", "Grass", "Death"],
        "min_stats": {
            "Neg%": 1,
        },
        "max_stats": {
            "Neg%": 9,
        },
    },
    "Val": {
        "description": "[ 1 to 9 ] to Eleholy",
        "recipe": ["Craft", "Caring", "Love"],
        "min_stats": {
            "Holy%": 1,
        },
        "max_stats": {
            "Holy%": 9,
        },
    },
    "Jah": {
        "description": "[ 1 to 9 ] to Eleblunt",
        "recipe": ["Craft", "Crush", "Flesh"],
        "min_stats": {
            "Blunt%": 1,
        },
        "max_stats": {
            "Blunt%": 9,
        },
    },
    "Ith": {
        "description": "[ 1 to 9 ] to Elepierce",
        "recipe": ["Craft", "Pierce", "Sharpness"],
        "min_stats": {
            "Pierce%": 1,
        },
        "max_stats": {
            "Pierce%": 9,
        },
    },
    "Ber": {
        "description": "[ 1 to 9 ] to Eleslash",
        "recipe": ["Craft", "Cut", "Metal"],
        "min_stats": {
            "Slash%": 1,
        },
        "max_stats": {
            "Slash%": 9,
        },
    },
    "Leo": {
        "description": "[ 1 to 2 ] to ExpScale",
        "recipe": ["Craft", "Knowledge", "Learning"],
        "min_stats": {
            "EXP Bonus": 1,
        },
        "max_stats": {
            "EXP Bonus": 2,
        },
    },
    "Arn": {
        "description": "[ 1 to 3 ] to ExpScale",
        "recipe": ["Creation", "River", "Hearth"],
        "min_stats": {
            "EXP Bonus": 1,
        },
        "max_stats": {
            "EXP Bonus": 3,
        },
    },
    "Ink": {
        "description": "[ 1 to 5 ] to ExpScale",
        "recipe": ["Old Sage's Saga", "Gust", "Grass", "Scorch", "Shock"],
        "min_stats": {
            "EXP Bonus": 1,
        },
        "max_stats": {
            "EXP Bonus": 5,
        },
    },
    "Khor": {
        "description": "[ 1 to 10 ] to Atkmulti",
        "recipe": ["Craft", "Death", "Destroyer"],
        "min_stats": {
            "ATK%": 1,
        },
        "max_stats": {
            "ATK%": 10,
        },
    },
    "Nurg": {
        "description": "[ 1 to 10 ] to Defmulti",
        "recipe": ["Craft", "Disease", "Plague"],
        "min_stats": {
            "DEF%": 1,
        },
        "max_stats": {
            "DEF%": 10,
        },
    },
    "Tzen": {
        "description": "[ 1 to 10 ] to Matkmulti",
        "recipe": ["Craft", "Knowledge", "Mana"],
        "min_stats": {
            "MATK%": 1,
        },
        "max_stats": {
            "MATK%": 10,
        },
    },
    "Slah": {
        "description": "[ 1 to 10 ] to Healmulti",
        "recipe": ["Craft", "Love", "Hell"],
        "min_stats": {
            "HEAL%": 1,
        },
        "max_stats": {
            "HEAL%": 10,
        },
    },
    "Onen": {
        "description": "[ 1 to 10 ] to Atkmulti",
        "recipe": ["Craft", "Metal", "Destroyer"],
        "min_stats": {
            "ATK%": 1,
        },
        "max_stats": {
            "ATK%": 10,
        },
    },
    "Gol": {
        "description": "[ 1 to 10 ] to Defmulti",
        "recipe": ["Craft", "Flesh", "Rust"],
        "min_stats": {
            "DEF%": 1,
        },
        "max_stats": {
            "DEF%": 10,
        },
    },
    "Inc": {
        "description": "[ 1 to 10 ] to Matkmulti",
        "recipe": ["Craft", "Learning", "Reaper"],
        "min_stats": {
            "MATK%": 1,
        },
        "max_stats": {
            "MATK%": 10,
        },
    },
    "Nesh": {
        "description": "[ 1 to 10 ] to Healmulti",
        "recipe": ["Craft", "Pain", "Impaler"],
        "min_stats": {
            "HEAL%": 1,
        },
        "max_stats": {
            "HEAL%": 10,
        },
    },
    "Sol": {
        "description": "[ 1 to 9 ] to Elefire",
        "recipe": ["Craft", "Energy", "Destruction"],
        "min_stats": {
            "Fire%": 1,
        },
        "max_stats": {
            "Fire%": 9,
        },
    },
    "Ort": {
        "description": "[ 1 to 9 ] to Elelightning",
        "recipe": ["Craft", "Storm", "Heavens"],
        "min_stats": {
            "Lightning%": 1,
        },
        "max_stats": {
            "Lightning%": 9,
        },
    },
    "Tir": {
        "description": "[ 1 to 9 ] to Elewater",
        "recipe": ["Craft", "Lake", "Tsunami"],
        "min_stats": {
            "Water%": 1,
        },
        "max_stats": {
            "Water%": 9,
        },
    },
    "Tal": {
        "description": "[ 1 to 9 ] to Eleearth",
        "recipe": ["Craft", "Forest", "Earthquake"],
        "min_stats": {
            "Earth%": 1,
        },
        "max_stats": {
            "Earth%": 9,
        },
    },
    "Eth": {
        "description": "[ 1 to 9 ] to Elewind",
        "recipe": ["Craft", "Wind", "Hurricane"],
        "min_stats": {
            "Wind%": 1,
        },
        "max_stats": {
            "Wind%": 9,
        },
    },
    "Ral": {
        "description": "[ 1 to 9 ] to Eletoxic",
        "recipe": ["Craft", "War", "Rust"],
        "min_stats": {
            "Toxic%": 1,
        },
        "max_stats": {
            "Toxic%": 9,
        },
    },
    "Zod": {
        "description": "[ 1 to 9 ] to Elevoid",
        "recipe": ["Craft", "Luck", "Void"],
        "min_stats": {
            "Void%": 1,
        },
        "max_stats": {
            "Void%": 9,
        },
    },
    "Vex": {
        "description": "[ 1 to 9 ] to Elenegative",
        "recipe": ["Craft", "Death", "Reaper"],
        "min_stats": {
            "Neg%": 1,
        },
        "max_stats": {
            "Neg%": 9,
        },
    },
    "Lo": {
        "description": "[ 1 to 9 ] to Eleholy",
        "recipe": ["Craft", "Blessing", "Heavens"],
        "min_stats": {
            "Holy%": 1,
        },
        "max_stats": {
            "Holy%": 9,
        },
    },
    "Mal": {
        "description": "[ 1 to 9 ] to Eleblunt",
        "recipe": ["Craft", "Flesh", "Destruction"],
        "min_stats": {
            "Blunt%": 1,
        },
        "max_stats": {
            "Blunt%": 9,
        },
    },
    "Ist": {
        "description": "[ 1 to 9 ] to Elepierce",
        "recipe": ["Craft", "Luck", "Impaler"],
        "min_stats": {
            "Pierce%": 1,
        },
        "max_stats": {
            "Pierce%": 9,
        },
    },
    "Gul": {
        "description": "[ 1 to 9 ] to Eleslash",
        "recipe": ["Craft", "Metal", "Void"],
        "min_stats": {
            "Slash%": 1,
        },
        "max_stats": {
            "Slash%": 9,
        },
    },
    "Arh": {
        "description": "[ -2 to 2 ] to CritChance",
        "recipe": ["Forge", "Luck", "Pain"],
        "min_stats": {
            "Crit Chance%": -2,
        },
        "max_stats": {
            "Crit Chance%": 2,
        },
    },
    "En": {
        "description": "[ -2 to 2 ] to CritChance",
        "recipe": ["Forge", "Blessing", "Protection"],
        "min_stats": {
            "Crit Chance%": -2,
        },
        "max_stats": {
            "Crit Chance%": 2,
        },
    },
    "Gee": {
        "description": "[ -2 to 2 ] to CritChance",
        "recipe": ["Craft", "Hearth", "Knowledge"],
        "min_stats": {
            "Crit Chance%": -2,
        },
        "max_stats": {
            "Crit Chance%": 2,
        },
    },
    "Sus": {
        "description": "[ -2 to 2 ] to CritChance",
        "recipe": ["Creation", "Energy", "Learning"],
        "min_stats": {
            "Crit Chance%": -2,
        },
        "max_stats": {
            "Crit Chance%": 2,
        },
    },
    "Gen": {
        "description": "[ 3 to 6 ] to MP",
        "recipe": ["Creation", "Blessing", "Hearth"],
        "min_stats": {
            "MP": 3,
        },
        "max_stats": {
            "MP": 6,
        },
    },
    "Eith": {
        "description": "[ 4 to 8 ] to MP",
        "recipe": ["Creation", "Love", "Protection"],
        "min_stats": {
            "MP": 4,
        },
        "max_stats": {
            "MP": 8,
        },
    },
    "Sis": {
        "description": "[ 5 to 10 ] to MP",
        "recipe": ["Primal Genesis", "Fortune", "Mastery"],
        "min_stats": {
            "MP": 5,
        },
        "max_stats": {
            "MP": 10,
        },
    },
    "Stren": {
        "description": "[ 3 to 4 ] to Atkmulti",
        "recipe": ["Forge", "War", "Disease"],
        "min_stats": {
            "ATK%": 3,
        },
        "max_stats": {
            "ATK%": 4,
        },
    },
    "End": {
        "description": "[ 3 to 4 ] to Defmulti",
        "recipe": ["Forge", "Forest", "Protection"],
        "min_stats": {
            "DEF%": 3,
        },
        "max_stats": {
            "DEF%": 4,
        },
    },
    "Pao": {
        "description": "[ 3 to 4 ] to Matkmulti",
        "recipe": ["Forge", "Storm", "Wind"],
        "min_stats": {
            "MATK%": 3,
        },
        "max_stats": {
            "MATK%": 4,
        },
    },
    "Anar": {
        "description": "[ 3 to 4 ] to Healmulti",
        "recipe": ["Forge", "Lake", "Energy"],
        "min_stats": {
            "HEAL%": 3,
        },
        "max_stats": {
            "HEAL%": 4,
        },
    },
    "Gith": {
        "description": "[ 3 to 4 ] to Atkmulti",
        "recipe": ["Forge", "Storm", "War"],
        "min_stats": {
            "ATK%": 3,
        },
        "max_stats": {
            "ATK%": 4,
        },
    },
    "Yur": {
        "description": "[ 3 to 4 ] to Defmulti",
        "recipe": ["Forge", "Flesh", "Pain"],
        "min_stats": {
            "DEF%": 3,
        },
        "max_stats": {
            "DEF%": 4,
        },
    },
    "Wer": {
        "description": "[ 3 to 4 ] to Matkmulti",
        "recipe": ["Forge", "Wind", "Knowledge"],
        "min_stats": {
            "MATK%": 3,
        },
        "max_stats": {
            "MATK%": 4,
        },
    },
    "Gie": {
        "description": "[ 3 to 4 ] to Healmulti",
        "recipe": ["Forge", "Hearth", "Learning"],
        "min_stats": {
            "HEAL%": 3,
        },
        "max_stats": {
            "HEAL%": 4,
        },
    },
    "Har": {
        "description": "[ 10 to 20 ] to Atkmulti",
        "recipe": ["Creation", "Earthquake", "Plague"],
        "min_stats": {
            "ATK%": 10,
        },
        "max_stats": {
            "ATK%": 20,
        },
    },
    "Yen": {
        "description": "[ 10 to 20 ] to Defmulti",
        "recipe": ["Creation", "Mastery", "Eternity"],
        "min_stats": {
            "DEF%": 10,
        },
        "max_stats": {
            "DEF%": 20,
        },
    },
    "Fal": {
        "description": "[ 10 to 20 ] to Matkmulti",
        "recipe": ["Creation", "Mana", "Destruction"],
        "min_stats": {
            "MATK%": 10,
        },
        "max_stats": {
            "MATK%": 20,
        },
    },
    "Ko": {
        "description": "[ 10 to 20 ] to Healmulti",
        "recipe": ["Creation", "Tsunami", "Hell"],
        "min_stats": {
            "HEAL%": 10,
        },
        "max_stats": {
            "HEAL%": 20,
        },
    },
    "Pul": {
        "description": "[ 10 to 20 ] to Atkmulti",
        "recipe": ["Creation", "Hurricane", "Destroyer", "World Eater"],
        "min_stats": {
            "ATK%": 10,
        },
        "max_stats": {
            "ATK%": 20,
        },
    },
    "Um": {
        "description": "[ 10 to 20 ] to Defmulti",
        "recipe": ["Creation", "Rust", "Fortune", "Mantle of the Champion"],
        "min_stats": {
            "DEF%": 10,
        },
        "max_stats": {
            "DEF%": 20,
        },
    },
    "Amn": {
        "description": "[ 10 to 20 ] to Matkmulti",
        "recipe": ["Creation", "Mana", "Mastery", "Jester's Journey"],
        "min_stats": {
            "MATK%": 10,
        },
        "max_stats": {
            "MATK%": 20,
        },
    },
    "Lem": {
        "description": "[ 10 to 20 ] to Healmulti",
        "recipe": ["Creation", "Heavens", "Hell", "Sea Guardian's Embrace"],
        "min_stats": {
            "HEAL%": 10,
        },
        "max_stats": {
            "HEAL%": 20,
        },
    },
    "Sur": {
        "description": "[ 10 to 20 ] to Elefire",
        "recipe": ["Creation", "Hell", "Destroyer", "Flames of Surtr"],
        "min_stats": {
            "Fire%": 10,
        },
        "max_stats": {
            "Fire%": 20,
        },
    },
    "Ifin": {
        "description": "[ 10 to 20 ] to Elelightning",
        "recipe": ["Creation", "Heavens", "Reaper", "Call of Thor"],
        "min_stats": {
            "Lightning%": 10,
        },
        "max_stats": {
            "Lightning%": 20,
        },
    },
    "Wae": {
        "description": "[ 10 to 20 ] to Elewater",
        "recipe": ["Creation", "Tsunami", "Earthquake", "Wrath of Aegir"],
        "min_stats": {
            "Water%": 10,
        },
        "max_stats": {
            "Water%": 20,
        },
    },
    "Tar": {
        "description": "[ 10 to 20 ] to Eleearth",
        "recipe": ["Creation", "Earthquake", "Plague", "Hand of Joro"],
        "min_stats": {
            "Earth%": 10,
        },
        "max_stats": {
            "Earth%": 20,
        },
    },
    "Ano": {
        "description": "[ 10 to 20 ] to Elewind",
        "recipe": ["Creation", "Hurricane", "Impaler", "Breath of Njord"],
        "min_stats": {
            "Wind%": 10,
        },
        "max_stats": {
            "Wind%": 20,
        },
    },
    "Jor": {
        "description": "[ 10 to 20 ] to Eletoxic",
        "recipe": ["Creation", "Plague", "Reaper", "Blood of Eitr"],
        "min_stats": {
            "Toxic%": 10,
        },
        "max_stats": {
            "Toxic%": 20,
        },
    },
    "Cham": {
        "description": "[ 5 to 15 ] to Elevoid",
        "recipe": ["Creation", "Void", "Destruction", "Prophecy of Disaster"],
        "min_stats": {
            "Void%": 5,
        },
        "max_stats": {
            "Void%": 15,
        },
    },
    "Dal": {
        "description": "[ 10 to 20 ] to Elenegative",
        "recipe": ["Creation", "Void", "Eternity", "Purpose of Life"],
        "min_stats": {
            "Neg%": 10,
        },
        "max_stats": {
            "Neg%": 20,
        },
    },
    "Yah": {
        "description": "[ 10 to 20 ] to Eleholy",
        "recipe": ["Creation", "Mana", "Heavens", "Light of Odin"],
        "min_stats": {
            "Holy%": 10,
        },
        "max_stats": {
            "Holy%": 20,
        },
    },
    "Tsu": {
        "description": "[ 10 to 20 ] to Eleblunt",
        "recipe": ["Creation", "Tsunami", "Mastery", "Memories of Honor"],
        "min_stats": {
            "Blunt%": 10,
        },
        "max_stats": {
            "Blunt%": 20,
        },
    },
    "Amer": {
        "description": "[ 10 to 20 ] to Elepierce",
        "recipe": ["Creation", "Impaler", "Rust", "Gladiator's Glory"],
        "min_stats": {
            "Pierce%": 10,
        },
        "max_stats": {
            "Pierce%": 20,
        },
    },
    "Sano": {
        "description": "[ 10 to 20 ] to Eleslash",
        "recipe": ["Creation", "Fortune", "Hurricane", "Mark of Loki"],
        "min_stats": {
            "Slash%": 10,
        },
        "max_stats": {
            "Slash%": 20,
        },
    },
    "Lig": {
        "description": "[ 6 to 9 ] to CritChance",
        "recipe": ["Creation", "Blood", "Disease"],
        "min_stats": {
            "Crit Chance%": 6,
        },
        "max_stats": {
            "Crit Chance%": 9,
        },
    },
    "Mah": {
        "description": "[ 13 to 26 ] to CritDamage",
        "recipe": ["Creation", "Thought", "Death"],
        "min_stats": {
            "Crit DMG%": 13,
        },
        "max_stats": {
            "Crit DMG%": 26,
        },
    },
    "Bors": {
        "description": "[ 1 to 4 ] to CritChance and [ 8 to 16 ] to CritDamage",
        "recipe": ["Creation", "Caring", "Love"],
        "min_stats": {
            "Crit Chance%": 1,
            "Crit DMG%": 8,
        },
        "max_stats": {
            "Crit Chance%": 4,
            "Crit DMG%": 16,
        },
    },
    "Whir": {
        "description": "[ 5 to 12 ] to Atkmulti and [ 10 to 20 ] to Defmulti",
        "recipe": ["Craft", "Metal", "Forge", "War"],
        "min_stats": {
            "ATK%": 5,
            "DEF%": 10,
        },
        "max_stats": {
            "ATK%": 12,
            "DEF%": 20,
        },
    },
    "Thir": {
        "description": "[ 5 to 12 ] to Defmulti and [ 50 to 100 ] to Def",
        "recipe": ["Craft", "Blessing", "Forge", "Protection"],
        "min_stats": {
            "DEF%": 5,
            "DEF": 50,
        },
        "max_stats": {
            "DEF%": 12,
            "DEF": 100,
        },
    },
    "Mhir": {
        "description": "[ 5 to 12 ] to Matkmulti and [ 10 to 20 ] to Defmulti",
        "recipe": ["Craft", "Lake", "Forge", "Energy"],
        "min_stats": {
            "MATK%": 5,
            "DEF%": 10,
        },
        "max_stats": {
            "MATK%": 12,
            "DEF%": 20,
        },
    },
    "Hir": {
        "description": "[ 5 to 12 ] to Healmulti and [ 10 to 20 ] to Defmulti",
        "recipe": ["Craft", "Forest", "Forge", "Love"],
        "min_stats": {
            "HEAL%": 5,
            "DEF%": 10,
        },
        "max_stats": {
            "HEAL%": 12,
            "DEF%": 20,
        },
    },
    "Ulum": {
        "description": "[ 10 to 20 ] to MP",
        "recipe": ["Creation", "Eternity"],
        "min_stats": {
            "MP": 10,
        },
        "max_stats": {
            "MP": 20,
        },
    },
    "Moda": {
        "description": "[ 4 to 7 ] to Resfire",
        "recipe": ["Forge", "Flame", "Scorch"],
        "min_stats": {
            "Fire Res%": 4,
        },
        "max_stats": {
            "Fire Res%": 7,
        },
    },
    "Rub": {
        "description": "[ 4 to 7 ] to Reslightning",
        "recipe": ["Forge", "Bolt", "Shock"],
        "min_stats": {
            "Lightning Res%": 4,
        },
        "max_stats": {
            "Lightning Res%": 7,
        },
    },
    "Spo": {
        "description": "[ 4 to 7 ] to Reswater",
        "recipe": ["Forge", "Current", "River"],
        "min_stats": {
            "Water Res%": 4,
        },
        "max_stats": {
            "Water Res%": 7,
        },
    },
    "Wor": {
        "description": "[ 4 to 7 ] to Researth",
        "recipe": ["Forge", "Grass", "Stone"],
        "min_stats": {
            "Earth Res%": 4,
        },
        "max_stats": {
            "Earth Res%": 7,
        },
    },
    "Jak": {
        "description": "[ 4 to 7 ] to Reswind",
        "recipe": ["Forge", "Breath", "Gust"],
        "min_stats": {
            "Wind Res%": 4,
        },
        "max_stats": {
            "Wind Res%": 7,
        },
    },
    "Adi": {
        "description": "[ 4 to 7 ] to Restoxic",
        "recipe": ["Forge", "Poison", "Toughness"],
        "min_stats": {
            "Toxic Res%": 4,
        },
        "max_stats": {
            "Toxic Res%": 7,
        },
    },
    "Bel": {
        "description": "[ 2 to 4 ] to Resvoid",
        "recipe": ["Forge", "Experience", "Thought"],
        "min_stats": {
            "Void Res%": 2,
        },
        "max_stats": {
            "Void Res%": 4,
        },
    },
    "Wat": {
        "description": "[ 4 to 7 ] to Resnegative",
        "recipe": ["Forge", "Blood", "Breath"],
        "min_stats": {
            "Neg Res%": 4,
        },
        "max_stats": {
            "Neg Res%": 7,
        },
    },
    "Fer": {
        "description": "[ 3 to 6 ] to Resholy",
        "recipe": ["Forge", "Current", "Caring"],
        "min_stats": {
            "Holy Res%": 3,
        },
        "max_stats": {
            "Holy Res%": 6,
        },
    },
    "Pad": {
        "description": "[ 4 to 7 ] to Resblunt",
        "recipe": ["Forge", "Crush", "Stone"],
        "min_stats": {
            "Blunt Res%": 4,
        },
        "max_stats": {
            "Blunt Res%": 7,
        },
    },
    "Kev": {
        "description": "[ 4 to 7 ] to Respierce",
        "recipe": ["Forge", "Pierce", "Bolt"],
        "min_stats": {
            "Pierce Res%": 4,
        },
        "max_stats": {
            "Pierce Res%": 7,
        },
    },
    "Aro": {
        "description": "[ 4 to 7 ] to Resslash",
        "recipe": ["Forge", "Cut", "Sharpness"],
        "min_stats": {
            "Slash Res%": 4,
        },
        "max_stats": {
            "Slash Res%": 7,
        },
    },
    "Bar": {
        "description": "[ 5 to 15 ] to Defmulti and [ 10 to 20 ] to Def",
        "recipe": ["Craft", "Toughness", "Flesh"],
        "min_stats": {
            "DEF%": 5,
            "DEF": 10,
        },
        "max_stats": {
            "DEF%": 15,
            "DEF": 20,
        },
    },
    "Shier": {
        "description": "[ 20 to 30 ] to Elevoid and [ -8 to -6 ] to Dmgmultiadd",
        "recipe": ["Craft", "Death", "Experience"],
        "min_stats": {
            "Void%": 20,
            "Dmg%": -8,
        },
        "max_stats": {
            "Void%": 30,
            "Dmg%": -6,
        },
    },
    "Nat": {
        "description": "[ 5 to 10 ] to Elementaldmg",
        "recipe": ["Craft", "Knowledge", "Luck"],
        "min_stats": {
            "Elemental%": 5,
        },
        "max_stats": {
            "Elemental%": 10,
        },
    },
    "Jevo": {
        "description": "[ 5 to 10 ] to Divinedmg",
        "recipe": ["Craft", "Hearth", "Pain"],
        "min_stats": {
            "Divine%": 5,
        },
        "max_stats": {
            "Divine%": 10,
        },
    },
    "Mar": {
        "description": "[ 5 to 10 ] to Physicaldmg",
        "recipe": ["Craft", "Metal", "Learning"],
        "min_stats": {
            "Phys%": 5,
        },
        "max_stats": {
            "Phys%": 10,
        },
    },
    "Span": {
        "description": "[ 4 to 8 ] to Elevoid",
        "recipe": ["Craft", "Storm", "Wind"],
        "min_stats": {
            "Void%": 4,
        },
        "max_stats": {
            "Void%": 8,
        },
    },
    "Pha": {
        "description": "[ 2 to 4 ] to Penvoid and [ -5 to -3 ] to Dmgmultiadd and [ 5 to 10 ] to Defmulti",
        "recipe": ["Creation", "Void", "Sharpness", "Lake"],
        "min_stats": {
            "Void Pen%": 2,
            "Dmg%": -5,
            "DEF%": 5,
        },
        "max_stats": {
            "Void Pen%": 4,
            "Dmg%": -3,
            "DEF%": 10,
        },
    },
    "Ther": {
        "description": "[ 5 to 10 ] to Elevoid and [ -5 to -3 ] to Dmgmultiadd and [ 1 to 3 ] to Allres",
        "recipe": ["Creation", "Eternity", "Gust", "Forest"],
        "min_stats": {
            "Void%": 5,
            "Dmg%": -5,
            "All Res%": 1,
        },
        "max_stats": {
            "Void%": 10,
            "Dmg%": -3,
            "All Res%": 3,
        },
    },
    "Ma": {
        "description": "[ 2 to 3 ] to Xphysicalpen",
        "recipe": ["Celestial Core", "Creation", "Impaler", "Rust", "Cut", "Crush"],
        "min_stats": {
            "Phys xPen%": 2,
        },
        "max_stats": {
            "Phys xPen%": 3,
        },
    },
    "Megi": {
        "description": "[ 2 to 3 ] to Xdivinepen",
        "recipe": ["Celestial Core", "Creation", "Hell", "Fortune", "Shock", "Scorch"],
        "min_stats": {
            "Divine xPen%": 2,
        },
        "max_stats": {
            "Divine xPen%": 3,
        },
    },
    "Kyar": {
        "description": "[ 2 to 3 ] to Xelementalpen",
        "recipe": ["Celestial Core", "Creation", "Destruction", "Mana", "Flame", "River"],
        "min_stats": {
            "Elemental xPen%": 2,
        },
        "max_stats": {
            "Elemental xPen%": 3,
        },
    },
    "Kah": {
        "description": "[ 1 to 2 ] to Xvoidpen",
        "recipe": ["Celestial Core", "Creation", "Destroyer", "Reaper", "Poison", "Pierce"],
        "min_stats": {
            "Void xPen%": 1,
        },
        "max_stats": {
            "Void xPen%": 2,
        },
    },
    "Ulti": {
        "description": "[ 1 to 1 ] to Dmgmultiadd",
        "recipe": ["Celestial Core", "Tsunami", "Forge", "Craft", "Primal Terra"],
        "min_stats": {
            "Dmg%": 1,
        },
        "max_stats": {
            "Dmg%": 1,
        },
    },
    "Nue": {
        "description": "[ 1 to 1 ] to Dmgmultiadd",
        "recipe": ["Celestial Core", "Hurricane", "Forge", "Craft", "Primal Tempest"],
        "min_stats": {
            "Dmg%": 1,
        },
        "max_stats": {
            "Dmg%": 1,
        },
    },
    "Dola": {
        "description": "[ 1 to 1 ] to Dmgmultiadd",
        "recipe": ["Celestial Core", "Earthquake", "Forge", "Craft", "Primal Fire"],
        "min_stats": {
            "Dmg%": 1,
        },
        "max_stats": {
            "Dmg%": 1,
        },
    },
    "Than": {
        "description": "[ 1 to 1 ] to Dmgmultiadd",
        "recipe": ["Celestial Core", "Plague", "Forge", "Craft", "Primal Genesis"],
        "min_stats": {
            "Dmg%": 1,
        },
        "max_stats": {
            "Dmg%": 1,
        },
    },
    "Eb": {
        "description": "[ 4 to 8 ] to CritChance",
        "recipe": ["Celestial Core", "Primal Aqua", "Forge", "Craft", "Mastery"],
        "min_stats": {
            "Crit Chance%": 4,
        },
        "max_stats": {
            "Crit Chance%": 8,
        },
    },
    "An": {
        "description": "[ 12 to 24 ] to CritDamage",
        "recipe": ["Celestial Core", "Primal Aqua", "Forge", "Craft", "Mastery"],
        "min_stats": {
            "Crit DMG%": 12,
        },
        "max_stats": {
            "Crit DMG%": 24,
        },
    },
    "Flo": {
        "description": "[ 4 to 8 ] to Allres",
        "recipe": ["Celestial Core", "Primal Aqua", "Forge", "Craft", "Mastery"],
        "min_stats": {
            "All Res%": 4,
        },
        "max_stats": {
            "All Res%": 8,
        },
    },
};

export const runeword_data: Record<string, Runeword> = {
    "Fire": {
        "description": "[ 3 to 6 ] to Penfire and [ 5 to 10 ] to Elefire",
        "component_words": ["Pya", "Ror", "Kor"],
        "min_stats": {
            "Fire Pen%": 3,
            "Fire%": 5,
        },
        "max_stats": {
            "Fire Pen%": 6,
            "Fire%": 10,
        },
    },
    "Lightning": {
        "description": "[ 3 to 6 ] to Penlightning and [ 5 to 10 ] to Elelightning",
        "component_words": ["Ele", "Tor", "Cor"],
        "min_stats": {
            "Lightning Pen%": 3,
            "Lightning%": 5,
        },
        "max_stats": {
            "Lightning Pen%": 6,
            "Lightning%": 10,
        },
    },
    "Water": {
        "description": "[ 3 to 6 ] to Penwater and [ 5 to 10 ] to Elewater",
        "component_words": ["Hya", "Dro", "Nor"],
        "min_stats": {
            "Water Pen%": 3,
            "Water%": 5,
        },
        "max_stats": {
            "Water Pen%": 6,
            "Water%": 10,
        },
    },
    "Earth": {
        "description": "[ 3 to 6 ] to Penearth and [ 5 to 10 ] to Eleearth",
        "component_words": ["Den", "Ero", "Dror"],
        "min_stats": {
            "Earth Pen%": 3,
            "Earth%": 5,
        },
        "max_stats": {
            "Earth Pen%": 6,
            "Earth%": 10,
        },
    },
    "Wind": {
        "description": "[ 3 to 6 ] to Penwind and [ 5 to 10 ] to Elewind",
        "component_words": ["Ama", "Nen", "Mo"],
        "min_stats": {
            "Wind Pen%": 3,
            "Wind%": 5,
        },
        "max_stats": {
            "Wind Pen%": 6,
            "Wind%": 10,
        },
    },
    "Toxic": {
        "description": "[ 3 to 6 ] to Pentoxic and [ 5 to 10 ] to Eletoxic",
        "component_words": ["Dol", "Vel", "Nom"],
        "min_stats": {
            "Toxic Pen%": 3,
            "Toxic%": 5,
        },
        "max_stats": {
            "Toxic Pen%": 6,
            "Toxic%": 10,
        },
    },
    "Void": {
        "description": "[ 1 to 2 ] to Penvoid and [ 4 to 8 ] to Elevoid",
        "component_words": ["Anu", "Bah", "Sath"],
        "min_stats": {
            "Void Pen%": 1,
            "Void%": 4,
        },
        "max_stats": {
            "Void Pen%": 2,
            "Void%": 8,
        },
    },
    "Negative": {
        "description": "[ 3 to 6 ] to Pennegative and [ 5 to 10 ] to Elenegative",
        "component_words": ["Da", "Uh", "No"],
        "min_stats": {
            "Neg Pen%": 3,
            "Neg%": 5,
        },
        "max_stats": {
            "Neg Pen%": 6,
            "Neg%": 10,
        },
    },
    "Holy": {
        "description": "[ 2 to 4 ] to Penholy and [ 5 to 10 ] to Eleholy",
        "component_words": ["Meg", "Ig", "Do"],
        "min_stats": {
            "Holy Pen%": 2,
            "Holy%": 5,
        },
        "max_stats": {
            "Holy Pen%": 4,
            "Holy%": 10,
        },
    },
    "Blunt": {
        "description": "[ 3 to 6 ] to Penblunt and [ 5 to 10 ] to Eleblunt",
        "component_words": ["Gru", "Nak", "Tah"],
        "min_stats": {
            "Blunt Pen%": 3,
            "Blunt%": 5,
        },
        "max_stats": {
            "Blunt Pen%": 6,
            "Blunt%": 10,
        },
    },
    "Pierce": {
        "description": "[ 3 to 6 ] to Penpierce and [ 5 to 10 ] to Elepierce",
        "component_words": ["Est", "Ne", "Vah"],
        "min_stats": {
            "Pierce Pen%": 3,
            "Pierce%": 5,
        },
        "max_stats": {
            "Pierce Pen%": 6,
            "Pierce%": 10,
        },
    },
    "Slash": {
        "description": "[ 3 to 6 ] to Penslash and [ 5 to 10 ] to Eleslash",
        "component_words": ["Wol", "Arr", "Shah"],
        "min_stats": {
            "Slash Pen%": 3,
            "Slash%": 5,
        },
        "max_stats": {
            "Slash Pen%": 6,
            "Slash%": 10,
        },
    },
    "Warrior": {
        "description": "[ 5 to 10 ] to Atkmulti",
        "component_words": ["Ca", "Nin", "Ein"],
        "min_stats": {
            "ATK%": 5,
        },
        "max_stats": {
            "ATK%": 10,
        },
    },
    "Defender": {
        "description": "[ 5 to 10 ] to Defmulti",
        "component_words": ["Tur", "Toro", "La"],
        "min_stats": {
            "DEF%": 5,
        },
        "max_stats": {
            "DEF%": 10,
        },
    },
    "Arcane": {
        "description": "[ 5 to 10 ] to Matkmulti",
        "component_words": ["Ra", "Ven", "Nah"],
        "min_stats": {
            "MATK%": 5,
        },
        "max_stats": {
            "MATK%": 10,
        },
    },
    "Divine": {
        "description": "[ 5 to 10 ] to Healmulti",
        "component_words": ["Lu", "Ge", "Ah"],
        "min_stats": {
            "HEAL%": 5,
        },
        "max_stats": {
            "HEAL%": 10,
        },
    },
    "Luck": {
        "description": "[ 2 to 4 ] to CritChance",
        "component_words": ["Pan", "Dor", "Ahr"],
        "min_stats": {
            "Crit Chance%": 2,
        },
        "max_stats": {
            "Crit Chance%": 4,
        },
    },
    "Fortune": {
        "description": "[ 5 to 10 ] to CritDamage",
        "component_words": ["For", "Tun", "Na"],
        "min_stats": {
            "Crit DMG%": 5,
        },
        "max_stats": {
            "Crit DMG%": 10,
        },
    },
    "Mana Burn": {
        "description": "[ 5 to 15 ] to Elefire and [ 2 to 4 ] to Penfire",
        "component_words": ["Ra", "Lu", "Igni"],
        "min_stats": {
            "Fire%": 5,
            "Fire Pen%": 2,
        },
        "max_stats": {
            "Fire%": 15,
            "Fire Pen%": 4,
        },
    },
    "Mana Shock": {
        "description": "[ 5 to 15 ] to Elelightning and [ 2 to 4 ] to Penlightning",
        "component_words": ["Ra", "Lu", "Neut"],
        "min_stats": {
            "Lightning%": 5,
            "Lightning Pen%": 2,
        },
        "max_stats": {
            "Lightning%": 15,
            "Lightning Pen%": 4,
        },
    },
    "Mana Drown": {
        "description": "[ 5 to 15 ] to Elewater and [ 2 to 4 ] to Penwater",
        "component_words": ["Ra", "Lu", "Oxi"],
        "min_stats": {
            "Water%": 5,
            "Water Pen%": 2,
        },
        "max_stats": {
            "Water%": 15,
            "Water Pen%": 4,
        },
    },
    "Mana Bury": {
        "description": "[ 5 to 15 ] to Eleearth and [ 2 to 4 ] to Penearth",
        "component_words": ["Ra", "Lu", "Ter"],
        "min_stats": {
            "Earth%": 5,
            "Earth Pen%": 2,
        },
        "max_stats": {
            "Earth%": 15,
            "Earth Pen%": 4,
        },
    },
    "Mana Gale": {
        "description": "[ 5 to 15 ] to Elewind and [ 2 to 4 ] to Penwind",
        "component_words": ["Ra", "Lu", "Njor"],
        "min_stats": {
            "Wind%": 5,
            "Wind Pen%": 2,
        },
        "max_stats": {
            "Wind%": 15,
            "Wind Pen%": 4,
        },
    },
    "Mana Poison": {
        "description": "[ 5 to 15 ] to Eletoxic and [ 2 to 4 ] to Pentoxic",
        "component_words": ["Ra", "Lu", "Eti"],
        "min_stats": {
            "Toxic%": 5,
            "Toxic Pen%": 2,
        },
        "max_stats": {
            "Toxic%": 15,
            "Toxic Pen%": 4,
        },
    },
    "Mana Erase": {
        "description": "[ 3 to 12 ] to Elevoid and [ 1 to 2 ] to Penvoid",
        "component_words": ["Ra", "Lu", "Ygg"],
        "min_stats": {
            "Void%": 3,
            "Void Pen%": 1,
        },
        "max_stats": {
            "Void%": 12,
            "Void Pen%": 2,
        },
    },
    "Mana Kill": {
        "description": "[ 5 to 15 ] to Elenegative and [ 2 to 4 ] to Pennegative",
        "component_words": ["Ra", "Lu", "Hel"],
        "min_stats": {
            "Neg%": 5,
            "Neg Pen%": 2,
        },
        "max_stats": {
            "Neg%": 15,
            "Neg Pen%": 4,
        },
    },
    "Mana Bless": {
        "description": "[ 5 to 15 ] to Eleholy and [ 2 to 3 ] to Penholy",
        "component_words": ["Ra", "Lu", "Val"],
        "min_stats": {
            "Holy%": 5,
            "Holy Pen%": 2,
        },
        "max_stats": {
            "Holy%": 15,
            "Holy Pen%": 3,
        },
    },
    "Focus Crush": {
        "description": "[ 5 to 15 ] to Eleblunt and [ 2 to 4 ] to Penblunt",
        "component_words": ["Toro", "Ca", "Jah"],
        "min_stats": {
            "Blunt%": 5,
            "Blunt Pen%": 2,
        },
        "max_stats": {
            "Blunt%": 15,
            "Blunt Pen%": 4,
        },
    },
    "Focus Thrust": {
        "description": "[ 5 to 15 ] to Elepierce and [ 2 to 4 ] to Penpierce",
        "component_words": ["Toro", "Ca", "Ith"],
        "min_stats": {
            "Pierce%": 5,
            "Pierce Pen%": 2,
        },
        "max_stats": {
            "Pierce%": 15,
            "Pierce Pen%": 4,
        },
    },
    "Focus Cut": {
        "description": "[ 5 to 15 ] to Eleslash and [ 2 to 4 ] to Penslash",
        "component_words": ["Toro", "Ca", "Ber"],
        "min_stats": {
            "Slash%": 5,
            "Slash Pen%": 2,
        },
        "max_stats": {
            "Slash%": 15,
            "Slash Pen%": 4,
        },
    },
    "Enigma": {
        "description": "[ 15 to 30 ] to Elevoid and [ 10 to 20 ] to Physicaldmg",
        "component_words": ["Jah", "Ith", "Ber"],
        "min_stats": {
            "Void%": 15,
            "Phys%": 10,
        },
        "max_stats": {
            "Void%": 30,
            "Phys%": 20,
        },
    },
    "Rage": {
        "description": "[ 5 to 15 ] to Atkmulti",
        "component_words": ["Khor", "Onen"],
        "min_stats": {
            "ATK%": 5,
        },
        "max_stats": {
            "ATK%": 15,
        },
    },
    "Endure": {
        "description": "[ 5 to 15 ] to Defmulti",
        "component_words": ["Nurg", "Gol"],
        "min_stats": {
            "DEF%": 5,
        },
        "max_stats": {
            "DEF%": 15,
        },
    },
    "Deceit": {
        "description": "[ 5 to 15 ] to Matkmulti",
        "component_words": ["Tzen", "Inc"],
        "min_stats": {
            "MATK%": 5,
        },
        "max_stats": {
            "MATK%": 15,
        },
    },
    "Sin": {
        "description": "[ 5 to 15 ] to Healmulti",
        "component_words": ["Slah", "Nesh"],
        "min_stats": {
            "HEAL%": 5,
        },
        "max_stats": {
            "HEAL%": 15,
        },
    },
    "Chaos": {
        "description": "[ 40 to 60 ] to CritDamage",
        "component_words": ["Khor", "Onen", "Nurg", "Tzen", "Slah"],
        "min_stats": {
            "Crit DMG%": 40,
        },
        "max_stats": {
            "Crit DMG%": 60,
        },
    },
    "Elemental": {
        "description": "[ 35 to 50 ] to Elementaldmg",
        "component_words": ["Kor", "Cor", "Nor", "Dror", "Mo", "Nom"],
        "min_stats": {
            "Elemental%": 35,
        },
        "max_stats": {
            "Elemental%": 50,
        },
    },
    "Knowledge": {
        "description": "[ 2 to 8 ] to ExpScale",
        "component_words": ["Leo", "Arn", "Ink"],
        "min_stats": {
            "EXP Bonus": 2,
        },
        "max_stats": {
            "EXP Bonus": 8,
        },
    },
    "Solar": {
        "description": "[ 3 to 7 ] to Elefire and [ 2 to 6 ] to Eleslash",
        "component_words": ["Sol", "Gul"],
        "min_stats": {
            "Fire%": 3,
            "Slash%": 2,
        },
        "max_stats": {
            "Fire%": 7,
            "Slash%": 6,
        },
    },
    "Orthus": {
        "description": "[ 3 to 7 ] to Elelightning and [ 2 to 6 ] to Eleslash",
        "component_words": ["Ort", "Gul"],
        "min_stats": {
            "Lightning%": 3,
            "Slash%": 2,
        },
        "max_stats": {
            "Lightning%": 7,
            "Slash%": 6,
        },
    },
    "Trieme": {
        "description": "[ 3 to 7 ] to Elewater and [ 2 to 6 ] to Eleslash",
        "component_words": ["Tir", "Gul"],
        "min_stats": {
            "Water%": 3,
            "Slash%": 2,
        },
        "max_stats": {
            "Water%": 7,
            "Slash%": 6,
        },
    },
    "Mountain": {
        "description": "[ 3 to 7 ] to Eleearth and [ 2 to 6 ] to Eleblunt",
        "component_words": ["Tal", "Mal"],
        "min_stats": {
            "Earth%": 3,
            "Blunt%": 2,
        },
        "max_stats": {
            "Earth%": 7,
            "Blunt%": 6,
        },
    },
    "Echo": {
        "description": "[ 3 to 7 ] to Elewind and [ 2 to 6 ] to Elepierce",
        "component_words": ["Eth", "Ist"],
        "min_stats": {
            "Wind%": 3,
            "Pierce%": 2,
        },
        "max_stats": {
            "Wind%": 7,
            "Pierce%": 6,
        },
    },
    "Regicide": {
        "description": "[ 3 to 7 ] to Eletoxic and [ 2 to 6 ] to Elepierce",
        "component_words": ["Ral", "Ist"],
        "min_stats": {
            "Toxic%": 3,
            "Pierce%": 2,
        },
        "max_stats": {
            "Toxic%": 7,
            "Pierce%": 6,
        },
    },
    "Space": {
        "description": "[ 2 to 5 ] to Elevoid and [ 2 to 6 ] to Eleblunt",
        "component_words": ["Zod", "Mal"],
        "min_stats": {
            "Void%": 2,
            "Blunt%": 2,
        },
        "max_stats": {
            "Void%": 5,
            "Blunt%": 6,
        },
    },
    "Death": {
        "description": "[ 3 to 7 ] to Elenegative and [ 2 to 6 ] to Elepierce",
        "component_words": ["Vex", "Ist"],
        "min_stats": {
            "Neg%": 3,
            "Pierce%": 2,
        },
        "max_stats": {
            "Neg%": 7,
            "Pierce%": 6,
        },
    },
    "Life": {
        "description": "[ 3 to 7 ] to Eleholy and [ 2 to 6 ] to Eleblunt",
        "component_words": ["Lo", "Mal"],
        "min_stats": {
            "Holy%": 3,
            "Blunt%": 2,
        },
        "max_stats": {
            "Holy%": 7,
            "Blunt%": 6,
        },
    },
    "Ignite": {
        "description": "[ 1 to 4 ] to Elefire",
        "component_words": ["Igni", "Pya", "Ror", "Kor"],
        "min_stats": {
            "Fire%": 1,
        },
        "max_stats": {
            "Fire%": 4,
        },
    },
    "Neutron": {
        "description": "[ 1 to 4 ] to Elelightning",
        "component_words": ["Neut", "Ele", "Tor", "Cor"],
        "min_stats": {
            "Lightning%": 1,
        },
        "max_stats": {
            "Lightning%": 4,
        },
    },
    "Oxygen": {
        "description": "[ 1 to 4 ] to Elewater",
        "component_words": ["Oxi", "Hya", "Dro", "Nor"],
        "min_stats": {
            "Water%": 1,
        },
        "max_stats": {
            "Water%": 4,
        },
    },
    "Terra": {
        "description": "[ 1 to 4 ] to Eleearth",
        "component_words": ["Ter", "Den", "Ero", "Dror"],
        "min_stats": {
            "Earth%": 1,
        },
        "max_stats": {
            "Earth%": 4,
        },
    },
    "Njord": {
        "description": "[ 1 to 4 ] to Elewind",
        "component_words": ["Njor", "Ama", "Nen", "Mo"],
        "min_stats": {
            "Wind%": 1,
        },
        "max_stats": {
            "Wind%": 4,
        },
    },
    "Eitr": {
        "description": "[ 1 to 4 ] to Eletoxic",
        "component_words": ["Eti", "Dol", "Vel", "Nom"],
        "min_stats": {
            "Toxic%": 1,
        },
        "max_stats": {
            "Toxic%": 4,
        },
    },
    "Yggdrasil": {
        "description": "[ 1 to 2 ] to Elevoid",
        "component_words": ["Ygg", "Anu", "Bah", "Sath"],
        "min_stats": {
            "Void%": 1,
        },
        "max_stats": {
            "Void%": 2,
        },
    },
    "Helheim": {
        "description": "[ 1 to 4 ] to Elenegative",
        "component_words": ["Hel", "Da", "Uh", "No"],
        "min_stats": {
            "Neg%": 1,
        },
        "max_stats": {
            "Neg%": 4,
        },
    },
    "Valhalla": {
        "description": "[ 1 to 4 ] to Eleholy",
        "component_words": ["Val", "Meg", "Ig", "Do"],
        "min_stats": {
            "Holy%": 1,
        },
        "max_stats": {
            "Holy%": 4,
        },
    },
    "Journey": {
        "description": "[ 1 to 4 ] to Eleblunt",
        "component_words": ["Jah", "Gru", "Nak", "Tah"],
        "min_stats": {
            "Blunt%": 1,
        },
        "max_stats": {
            "Blunt%": 4,
        },
    },
    "Eternal": {
        "description": "[ 1 to 4 ] to Elepierce",
        "component_words": ["Ith", "Est", "Ne", "Vah"],
        "min_stats": {
            "Pierce%": 1,
        },
        "max_stats": {
            "Pierce%": 4,
        },
    },
    "Bravery": {
        "description": "[ 1 to 4 ] to Eleslash",
        "component_words": ["Ber", "Wol", "Arr", "Shah"],
        "min_stats": {
            "Slash%": 1,
        },
        "max_stats": {
            "Slash%": 4,
        },
    },
    "Casino": {
        "description": "[ 1 to 80 ] to CritDamage and [ 1 to 5 ] to CritChance",
        "component_words": ["Arh", "En", "Gee", "Sus"],
        "min_stats": {
            "Crit DMG%": 1,
            "Crit Chance%": 1,
        },
        "max_stats": {
            "Crit DMG%": 80,
            "Crit Chance%": 5,
        },
    },
    "Wild Fire": {
        "description": "[ -10 to 20 ] to Elefire",
        "component_words": ["Arh", "En", "Gee", "Sus", "Igni"],
        "min_stats": {
            "Fire%": -10,
        },
        "max_stats": {
            "Fire%": 20,
        },
    },
    "Wild Storm": {
        "description": "[ -10 to 20 ] to Elelightning",
        "component_words": ["Arh", "En", "Gee", "Sus", "Neut"],
        "min_stats": {
            "Lightning%": -10,
        },
        "max_stats": {
            "Lightning%": 20,
        },
    },
    "Wild Sea": {
        "description": "[ -10 to 20 ] to Elewater",
        "component_words": ["Arh", "En", "Gee", "Sus", "Oxi"],
        "min_stats": {
            "Water%": -10,
        },
        "max_stats": {
            "Water%": 20,
        },
    },
    "Wild Earth": {
        "description": "[ -10 to 20 ] to Eleearth",
        "component_words": ["Arh", "En", "Gee", "Sus", "Ter"],
        "min_stats": {
            "Earth%": -10,
        },
        "max_stats": {
            "Earth%": 20,
        },
    },
    "Wild Wind": {
        "description": "[ -10 to 20 ] to Elewind",
        "component_words": ["Arh", "En", "Gee", "Sus", "Njor"],
        "min_stats": {
            "Wind%": -10,
        },
        "max_stats": {
            "Wind%": 20,
        },
    },
    "Wild Poison": {
        "description": "[ -10 to 20 ] to Eletoxic",
        "component_words": ["Arh", "En", "Gee", "Sus", "Eti"],
        "min_stats": {
            "Toxic%": -10,
        },
        "max_stats": {
            "Toxic%": 20,
        },
    },
    "Wild Void": {
        "description": "[ -10 to 20 ] to Elevoid",
        "component_words": ["Arh", "En", "Gee", "Sus", "Ygg"],
        "min_stats": {
            "Void%": -10,
        },
        "max_stats": {
            "Void%": 20,
        },
    },
    "Wild Death": {
        "description": "[ -10 to 20 ] to Elenegative",
        "component_words": ["Arh", "En", "Gee", "Sus", "Hel"],
        "min_stats": {
            "Neg%": -10,
        },
        "max_stats": {
            "Neg%": 20,
        },
    },
    "Wild Life": {
        "description": "[ -10 to 20 ] to Eleholy",
        "component_words": ["Arh", "En", "Gee", "Sus", "Val"],
        "min_stats": {
            "Holy%": -10,
        },
        "max_stats": {
            "Holy%": 20,
        },
    },
    "Wild Smash": {
        "description": "[ -10 to 20 ] to Eleblunt",
        "component_words": ["Arh", "En", "Gee", "Sus", "Jah"],
        "min_stats": {
            "Blunt%": -10,
        },
        "max_stats": {
            "Blunt%": 20,
        },
    },
    "Wild Pierce": {
        "description": "[ -10 to 20 ] to Elepierce",
        "component_words": ["Arh", "En", "Gee", "Sus", "Ith"],
        "min_stats": {
            "Pierce%": -10,
        },
        "max_stats": {
            "Pierce%": 20,
        },
    },
    "Wild Strike": {
        "description": "[ -10 to 20 ] to Eleslash",
        "component_words": ["Arh", "En", "Gee", "Sus", "Ber"],
        "min_stats": {
            "Slash%": -10,
        },
        "max_stats": {
            "Slash%": 20,
        },
    },
    "True Strength": {
        "description": "[ 10 to 30 ] to Atkmulti and [ 12 to 24 ] to CritDamage",
        "component_words": ["Gen", "Eith", "Sis", "Stren", "Gith"],
        "min_stats": {
            "ATK%": 10,
            "Crit DMG%": 12,
        },
        "max_stats": {
            "ATK%": 30,
            "Crit DMG%": 24,
        },
    },
    "True Endurance": {
        "description": "[ 10 to 30 ] to Defmulti and [ 12 to 24 ] to CritDamage",
        "component_words": ["Gen", "Eith", "Sis", "End", "Yur"],
        "min_stats": {
            "DEF%": 10,
            "Crit DMG%": 12,
        },
        "max_stats": {
            "DEF%": 30,
            "Crit DMG%": 24,
        },
    },
    "True Power": {
        "description": "[ 10 to 30 ] to Matkmulti and [ 12 to 24 ] to CritDamage",
        "component_words": ["Gen", "Eith", "Sis", "Pao", "Wer"],
        "min_stats": {
            "MATK%": 10,
            "Crit DMG%": 12,
        },
        "max_stats": {
            "MATK%": 30,
            "Crit DMG%": 24,
        },
    },
    "True Energy": {
        "description": "[ 10 to 30 ] to Healmulti and [ 12 to 24 ] to CritDamage",
        "component_words": ["Gen", "Eith", "Sis", "Anar", "Gie"],
        "min_stats": {
            "HEAL%": 10,
            "Crit DMG%": 12,
        },
        "max_stats": {
            "HEAL%": 30,
            "Crit DMG%": 24,
        },
    },
    "Primal Fire": {
        "description": "[ 5 to 10 ] to Penfire and [ 15 to 25 ] to Elefire",
        "component_words": ["Gen", "Eith", "Sis", "Pya", "Ror", "Kor"],
        "min_stats": {
            "Fire Pen%": 5,
            "Fire%": 15,
        },
        "max_stats": {
            "Fire Pen%": 10,
            "Fire%": 25,
        },
    },
    "Primal Storm": {
        "description": "[ 5 to 10 ] to Penlightning and [ 15 to 25 ] to Elelightning",
        "component_words": ["Gen", "Eith", "Sis", "Ele", "Tor", "Cor"],
        "min_stats": {
            "Lightning Pen%": 5,
            "Lightning%": 15,
        },
        "max_stats": {
            "Lightning Pen%": 10,
            "Lightning%": 25,
        },
    },
    "Primal Water": {
        "description": "[ 5 to 10 ] to Penwater and [ 15 to 25 ] to Elewater",
        "component_words": ["Gen", "Eith", "Sis", "Hya", "Dro", "Nor"],
        "min_stats": {
            "Water Pen%": 5,
            "Water%": 15,
        },
        "max_stats": {
            "Water Pen%": 10,
            "Water%": 25,
        },
    },
    "Primal Earth": {
        "description": "[ 5 to 10 ] to Penearth and [ 15 to 25 ] to Eleearth",
        "component_words": ["Gen", "Eith", "Sis", "Den", "Ero", "Dror"],
        "min_stats": {
            "Earth Pen%": 5,
            "Earth%": 15,
        },
        "max_stats": {
            "Earth Pen%": 10,
            "Earth%": 25,
        },
    },
    "Primal Wind": {
        "description": "[ 5 to 10 ] to Penwind and [ 15 to 25 ] to Elewind",
        "component_words": ["Gen", "Eith", "Sis", "Ama", "Nen", "Mo"],
        "min_stats": {
            "Wind Pen%": 5,
            "Wind%": 15,
        },
        "max_stats": {
            "Wind Pen%": 10,
            "Wind%": 25,
        },
    },
    "Primal Toxin": {
        "description": "[ 5 to 10 ] to Pentoxic and [ 15 to 25 ] to Eletoxic",
        "component_words": ["Gen", "Eith", "Sis", "Dol", "Vel", "Nom"],
        "min_stats": {
            "Toxic Pen%": 5,
            "Toxic%": 15,
        },
        "max_stats": {
            "Toxic Pen%": 10,
            "Toxic%": 25,
        },
    },
    "Primal Void": {
        "description": "[ 2 to 4 ] to Penvoid and [ 10 to 20 ] to Elevoid",
        "component_words": ["Gen", "Eith", "Sis", "Anu", "Bah", "Sath"],
        "min_stats": {
            "Void Pen%": 2,
            "Void%": 10,
        },
        "max_stats": {
            "Void Pen%": 4,
            "Void%": 20,
        },
    },
    "Primal Death": {
        "description": "[ 5 to 10 ] to Pennegative and [ 15 to 25 ] to Elenegative",
        "component_words": ["Gen", "Eith", "Sis", "Da", "Uh", "No"],
        "min_stats": {
            "Neg Pen%": 5,
            "Neg%": 15,
        },
        "max_stats": {
            "Neg Pen%": 10,
            "Neg%": 25,
        },
    },
    "Primal Light": {
        "description": "[ 4 to 8 ] to Penholy and [ 15 to 25 ] to Eleholy",
        "component_words": ["Gen", "Eith", "Sis", "Meg", "Ig", "Do"],
        "min_stats": {
            "Holy Pen%": 4,
            "Holy%": 15,
        },
        "max_stats": {
            "Holy Pen%": 8,
            "Holy%": 25,
        },
    },
    "Primal Weight": {
        "description": "[ 5 to 10 ] to Penblunt and [ 15 to 25 ] to Eleblunt",
        "component_words": ["Gen", "Eith", "Sis", "Gru", "Nak", "Tah"],
        "min_stats": {
            "Blunt Pen%": 5,
            "Blunt%": 15,
        },
        "max_stats": {
            "Blunt Pen%": 10,
            "Blunt%": 25,
        },
    },
    "Primal Horn": {
        "description": "[ 5 to 10 ] to Penpierce and [ 15 to 25 ] to Elepierce",
        "component_words": ["Gen", "Eith", "Sis", "Est", "Ne", "Vah"],
        "min_stats": {
            "Pierce Pen%": 5,
            "Pierce%": 15,
        },
        "max_stats": {
            "Pierce Pen%": 10,
            "Pierce%": 25,
        },
    },
    "Primal Claw": {
        "description": "[ 5 to 10 ] to Penslash and [ 15 to 25 ] to Eleslash",
        "component_words": ["Gen", "Eith", "Sis", "Wol", "Arr", "Shah"],
        "min_stats": {
            "Slash Pen%": 5,
            "Slash%": 15,
        },
        "max_stats": {
            "Slash Pen%": 10,
            "Slash%": 25,
        },
    },
    "God of War": {
        "description": "[ 12 to 24 ] to Atkmulti and [ 2 to 5 ] to CritChance",
        "component_words": ["Gen", "Eith", "Sis", "Khor", "Onen"],
        "min_stats": {
            "ATK%": 12,
            "Crit Chance%": 2,
        },
        "max_stats": {
            "ATK%": 24,
            "Crit Chance%": 5,
        },
    },
    "God of Life": {
        "description": "[ 12 to 24 ] to Defmulti and [ 2 to 5 ] to CritChance",
        "component_words": ["Gen", "Eith", "Sis", "Nurg", "Gol"],
        "min_stats": {
            "DEF%": 12,
            "Crit Chance%": 2,
        },
        "max_stats": {
            "DEF%": 24,
            "Crit Chance%": 5,
        },
    },
    "God of Magic": {
        "description": "[ 12 to 24 ] to Matkmulti and [ 2 to 5 ] to CritChance",
        "component_words": ["Gen", "Eith", "Sis", "Tzen", "Inc"],
        "min_stats": {
            "MATK%": 12,
            "Crit Chance%": 2,
        },
        "max_stats": {
            "MATK%": 24,
            "Crit Chance%": 5,
        },
    },
    "God of Desire": {
        "description": "[ 12 to 24 ] to Healmulti and [ 2 to 5 ] to CritChance",
        "component_words": ["Gen", "Eith", "Sis", "Slah", "Nesh"],
        "min_stats": {
            "HEAL%": 12,
            "Crit Chance%": 2,
        },
        "max_stats": {
            "HEAL%": 24,
            "Crit Chance%": 5,
        },
    },
    "Flame Fury": {
        "description": "[ 3 to 5 ] to Penfire",
        "component_words": ["Ulum", "Igni", "Pya", "Ror", "Kor"],
        "min_stats": {
            "Fire Pen%": 3,
        },
        "max_stats": {
            "Fire Pen%": 5,
        },
    },
    "Storm Fury": {
        "description": "[ 3 to 5 ] to Penlightning",
        "component_words": ["Ulum", "Neut", "Ele", "Tor", "Cor"],
        "min_stats": {
            "Lightning Pen%": 3,
        },
        "max_stats": {
            "Lightning Pen%": 5,
        },
    },
    "Ocean Fury": {
        "description": "[ 3 to 5 ] to Penwater",
        "component_words": ["Ulum", "Oxi", "Hya", "Dro", "Nor"],
        "min_stats": {
            "Water Pen%": 3,
        },
        "max_stats": {
            "Water Pen%": 5,
        },
    },
    "Iron Fury": {
        "description": "[ 3 to 5 ] to Penearth",
        "component_words": ["Ulum", "Ter", "Den", "Ero", "Dror"],
        "min_stats": {
            "Earth Pen%": 3,
        },
        "max_stats": {
            "Earth Pen%": 5,
        },
    },
    "Gale Fury": {
        "description": "[ 3 to 5 ] to Penwind",
        "component_words": ["Ulum", "Njor", "Ama", "Nen", "Mo"],
        "min_stats": {
            "Wind Pen%": 3,
        },
        "max_stats": {
            "Wind Pen%": 5,
        },
    },
    "Toxic Fury": {
        "description": "[ 3 to 5 ] to Pentoxic",
        "component_words": ["Ulum", "Eti", "Dol", "Vel", "Nom"],
        "min_stats": {
            "Toxic Pen%": 3,
        },
        "max_stats": {
            "Toxic Pen%": 5,
        },
    },
    "Void Fury": {
        "description": "[ 1 to 2 ] to Penvoid",
        "component_words": ["Ulum", "Ygg", "Anu", "Bah", "Sath"],
        "min_stats": {
            "Void Pen%": 1,
        },
        "max_stats": {
            "Void Pen%": 2,
        },
    },
    "Death Fury": {
        "description": "[ 3 to 5 ] to Pennegative",
        "component_words": ["Ulum", "Hel", "Da", "Uh", "No"],
        "min_stats": {
            "Neg Pen%": 3,
        },
        "max_stats": {
            "Neg Pen%": 5,
        },
    },
    "Light Fury": {
        "description": "[ 3 to 5 ] to Penholy",
        "component_words": ["Ulum", "Val", "Meg", "Ig", "Do"],
        "min_stats": {
            "Holy Pen%": 3,
        },
        "max_stats": {
            "Holy Pen%": 5,
        },
    },
    "Skull Fury": {
        "description": "[ 3 to 5 ] to Penblunt",
        "component_words": ["Ulum", "Jah", "Gru", "Nak", "Tah"],
        "min_stats": {
            "Blunt Pen%": 3,
        },
        "max_stats": {
            "Blunt Pen%": 5,
        },
    },
    "Fang Fury": {
        "description": "[ 3 to 5 ] to Penpierce",
        "component_words": ["Ulum", "Ith", "Est", "Ne", "Vah"],
        "min_stats": {
            "Pierce Pen%": 3,
        },
        "max_stats": {
            "Pierce Pen%": 5,
        },
    },
    "Claw Fury": {
        "description": "[ 3 to 5 ] to Penslash",
        "component_words": ["Ulum", "Ber", "Wol", "Arr", "Shah"],
        "min_stats": {
            "Slash Pen%": 3,
        },
        "max_stats": {
            "Slash Pen%": 5,
        },
    },
    "Fusion Flame": {
        "description": "[ 4 to 10 ] to Elefire and [ 5 to 10 ] to CritDamage",
        "component_words": ["Igni", "Sol"],
        "min_stats": {
            "Fire%": 4,
            "Crit DMG%": 5,
        },
        "max_stats": {
            "Fire%": 10,
            "Crit DMG%": 10,
        },
    },
    "Fusion Storm": {
        "description": "[ 4 to 10 ] to Elelightning and [ 5 to 10 ] to CritDamage",
        "component_words": ["Neut", "Ort"],
        "min_stats": {
            "Lightning%": 4,
            "Crit DMG%": 5,
        },
        "max_stats": {
            "Lightning%": 10,
            "Crit DMG%": 10,
        },
    },
    "Fusion Ocean": {
        "description": "[ 4 to 10 ] to Elewater and [ 5 to 10 ] to CritDamage",
        "component_words": ["Oxi", "Tir"],
        "min_stats": {
            "Water%": 4,
            "Crit DMG%": 5,
        },
        "max_stats": {
            "Water%": 10,
            "Crit DMG%": 10,
        },
    },
    "Fusion Steel": {
        "description": "[ 4 to 10 ] to Eleearth and [ 5 to 10 ] to CritDamage",
        "component_words": ["Ter", "Tal"],
        "min_stats": {
            "Earth%": 4,
            "Crit DMG%": 5,
        },
        "max_stats": {
            "Earth%": 10,
            "Crit DMG%": 10,
        },
    },
    "Fusion Wind": {
        "description": "[ 4 to 10 ] to Elewind and [ 5 to 10 ] to CritDamage",
        "component_words": ["Njor", "Eth"],
        "min_stats": {
            "Wind%": 4,
            "Crit DMG%": 5,
        },
        "max_stats": {
            "Wind%": 10,
            "Crit DMG%": 10,
        },
    },
    "Fusion Venom": {
        "description": "[ 4 to 10 ] to Eletoxic and [ 5 to 10 ] to CritDamage",
        "component_words": ["Eti", "Ral"],
        "min_stats": {
            "Toxic%": 4,
            "Crit DMG%": 5,
        },
        "max_stats": {
            "Toxic%": 10,
            "Crit DMG%": 10,
        },
    },
    "Fusion Void": {
        "description": "[ 4 to 10 ] to Elevoid and [ 5 to 10 ] to CritDamage",
        "component_words": ["Ygg", "Zod"],
        "min_stats": {
            "Void%": 4,
            "Crit DMG%": 5,
        },
        "max_stats": {
            "Void%": 10,
            "Crit DMG%": 10,
        },
    },
    "Fusion Dark": {
        "description": "[ 4 to 10 ] to Elenegative and [ 5 to 10 ] to CritDamage",
        "component_words": ["Hel", "Vex"],
        "min_stats": {
            "Neg%": 4,
            "Crit DMG%": 5,
        },
        "max_stats": {
            "Neg%": 10,
            "Crit DMG%": 10,
        },
    },
    "Fusion Light": {
        "description": "[ 4 to 10 ] to Eleholy and [ 5 to 10 ] to CritDamage",
        "component_words": ["Val", "Lo"],
        "min_stats": {
            "Holy%": 4,
            "Crit DMG%": 5,
        },
        "max_stats": {
            "Holy%": 10,
            "Crit DMG%": 10,
        },
    },
    "Fusion Weight": {
        "description": "[ 4 to 10 ] to Eleblunt and [ 5 to 10 ] to CritDamage",
        "component_words": ["Jah", "Mal"],
        "min_stats": {
            "Blunt%": 4,
            "Crit DMG%": 5,
        },
        "max_stats": {
            "Blunt%": 10,
            "Crit DMG%": 10,
        },
    },
    "Fusion Drill": {
        "description": "[ 4 to 10 ] to Elepierce and [ 5 to 10 ] to CritDamage",
        "component_words": ["Ith", "Ist"],
        "min_stats": {
            "Pierce%": 4,
            "Crit DMG%": 5,
        },
        "max_stats": {
            "Pierce%": 10,
            "Crit DMG%": 10,
        },
    },
    "Fusion Cut": {
        "description": "[ 4 to 10 ] to Eleslash and [ 5 to 10 ] to CritDamage",
        "component_words": ["Ber", "Gul"],
        "min_stats": {
            "Slash%": 4,
            "Crit DMG%": 5,
        },
        "max_stats": {
            "Slash%": 10,
            "Crit DMG%": 10,
        },
    },
    "Crown of Enigma": {
        "description": "[ 15 to 30 ] to Elevoid and [ -25 to -20 ] to Penvoid",
        "component_words": ["Ulum", "Ygg", "Jah", "Ith", "Ber"],
        "min_stats": {
            "Void%": 15,
            "Void Pen%": -25,
        },
        "max_stats": {
            "Void%": 30,
            "Void Pen%": -20,
        },
    },
    "Smoke": {
        "description": "[ 20 to 40 ] to Def and [ 10 to 20 ] to Defmulti",
        "component_words": ["Tur", "Toro", "La", "Njor"],
        "min_stats": {
            "DEF": 20,
            "DEF%": 10,
        },
        "max_stats": {
            "DEF": 40,
            "DEF%": 20,
        },
    },
    "Mist": {
        "description": "[ 20 to 40 ] to Def and [ 10 to 20 ] to Defmulti",
        "component_words": ["Tur", "Toro", "La", "Eth"],
        "min_stats": {
            "DEF": 20,
            "DEF%": 10,
        },
        "max_stats": {
            "DEF": 40,
            "DEF%": 20,
        },
    },
    "Crown": {
        "description": "[ 10 to 20 ] to Physicaldmg and [ 5 to 10 ] to Defmulti",
        "component_words": ["Ulum", "Ygg"],
        "min_stats": {
            "Phys%": 10,
            "DEF%": 5,
        },
        "max_stats": {
            "Phys%": 20,
            "DEF%": 10,
        },
    },
    "Perversion": {
        "description": "[ 1 to 3 ] to CritChance",
        "component_words": ["Lig", "Mah", "Bors"],
        "min_stats": {
            "Crit Chance%": 1,
        },
        "max_stats": {
            "Crit Chance%": 3,
        },
    },
    "Fury": {
        "description": "[ 2 to 4 ] to Elementaldmg",
        "component_words": ["Ulum"],
        "min_stats": {
            "Elemental%": 2,
        },
        "max_stats": {
            "Elemental%": 4,
        },
    },
    "True Prim'in": {
        "description": "[ 0 to 1 ] to Dmgmultiadd and [ 2 to 5 ] to MP",
        "component_words": ["Gen", "Eith", "Sis"],
        "min_stats": {
            "Dmg%": 0,
            "MP": 2,
        },
        "max_stats": {
            "Dmg%": 1,
            "MP": 5,
        },
    },
    "Strength": {
        "description": "[ 2 to 4 ] to Atkmulti",
        "component_words": ["Stren", "Gith"],
        "min_stats": {
            "ATK%": 2,
        },
        "max_stats": {
            "ATK%": 4,
        },
    },
    "Endurance": {
        "description": "[ 2 to 4 ] to Defmulti",
        "component_words": ["End", "Yur"],
        "min_stats": {
            "DEF%": 2,
        },
        "max_stats": {
            "DEF%": 4,
        },
    },
    "Power": {
        "description": "[ 2 to 4 ] to Matkmulti",
        "component_words": ["Pao", "Wer"],
        "min_stats": {
            "MATK%": 2,
        },
        "max_stats": {
            "MATK%": 4,
        },
    },
    "Energy": {
        "description": "[ 2 to 4 ] to Healmulti",
        "component_words": ["Anar", "Gie"],
        "min_stats": {
            "HEAL%": 2,
        },
        "max_stats": {
            "HEAL%": 4,
        },
    },
    "Har'in": {
        "description": "[ 2 to 4 ] to Atkmulti and [ 1 to 2 ] to CritChance",
        "component_words": ["Gen", "Eith", "Sis", "Har"],
        "min_stats": {
            "ATK%": 2,
            "Crit Chance%": 1,
        },
        "max_stats": {
            "ATK%": 4,
            "Crit Chance%": 2,
        },
    },
    "Yen'in": {
        "description": "[ 2 to 4 ] to Defmulti and [ 1 to 2 ] to CritChance",
        "component_words": ["Gen", "Eith", "Sis", "Yen"],
        "min_stats": {
            "DEF%": 2,
            "Crit Chance%": 1,
        },
        "max_stats": {
            "DEF%": 4,
            "Crit Chance%": 2,
        },
    },
    "Fal'in": {
        "description": "[ 2 to 4 ] to Matkmulti and [ 1 to 2 ] to CritChance",
        "component_words": ["Gen", "Eith", "Sis", "Fal"],
        "min_stats": {
            "MATK%": 2,
            "Crit Chance%": 1,
        },
        "max_stats": {
            "MATK%": 4,
            "Crit Chance%": 2,
        },
    },
    "Ko'in": {
        "description": "[ 2 to 4 ] to Healmulti and [ 1 to 2 ] to CritChance",
        "component_words": ["Gen", "Eith", "Sis", "Ko"],
        "min_stats": {
            "HEAL%": 2,
            "Crit Chance%": 1,
        },
        "max_stats": {
            "HEAL%": 4,
            "Crit Chance%": 2,
        },
    },
    "Pul'in": {
        "description": "[ 2 to 4 ] to Atkmulti and [ 1 to 2 ] to CritChance",
        "component_words": ["Gen", "Eith", "Sis", "Pul"],
        "min_stats": {
            "ATK%": 2,
            "Crit Chance%": 1,
        },
        "max_stats": {
            "ATK%": 4,
            "Crit Chance%": 2,
        },
    },
    "Um'in": {
        "description": "[ 2 to 4 ] to Defmulti and [ 1 to 2 ] to CritChance",
        "component_words": ["Gen", "Eith", "Sis", "Um"],
        "min_stats": {
            "DEF%": 2,
            "Crit Chance%": 1,
        },
        "max_stats": {
            "DEF%": 4,
            "Crit Chance%": 2,
        },
    },
    "Amn'in": {
        "description": "[ 2 to 4 ] to Matkmulti and [ 1 to 2 ] to CritChance",
        "component_words": ["Gen", "Eith", "Sis", "Amn"],
        "min_stats": {
            "MATK%": 2,
            "Crit Chance%": 1,
        },
        "max_stats": {
            "MATK%": 4,
            "Crit Chance%": 2,
        },
    },
    "Lem'in": {
        "description": "[ 2 to 4 ] to Healmulti and [ 1 to 2 ] to CritChance",
        "component_words": ["Gen", "Eith", "Sis", "Lem"],
        "min_stats": {
            "HEAL%": 2,
            "Crit Chance%": 1,
        },
        "max_stats": {
            "HEAL%": 4,
            "Crit Chance%": 2,
        },
    },
    "Sur'in": {
        "description": "[ 3 to 6 ] to Penfire and [ 1 to 2 ] to CritChance",
        "component_words": ["Gen", "Eith", "Sis", "Sur"],
        "min_stats": {
            "Fire Pen%": 3,
            "Crit Chance%": 1,
        },
        "max_stats": {
            "Fire Pen%": 6,
            "Crit Chance%": 2,
        },
    },
    "Ifin'in": {
        "description": "[ 3 to 6 ] to Penlightning and [ 1 to 2 ] to CritChance",
        "component_words": ["Gen", "Eith", "Sis", "Ifin"],
        "min_stats": {
            "Lightning Pen%": 3,
            "Crit Chance%": 1,
        },
        "max_stats": {
            "Lightning Pen%": 6,
            "Crit Chance%": 2,
        },
    },
    "Wae'in": {
        "description": "[ 3 to 6 ] to Penwater and [ 1 to 2 ] to CritChance",
        "component_words": ["Gen", "Eith", "Sis", "Wae"],
        "min_stats": {
            "Water Pen%": 3,
            "Crit Chance%": 1,
        },
        "max_stats": {
            "Water Pen%": 6,
            "Crit Chance%": 2,
        },
    },
    "Tar'in": {
        "description": "[ 3 to 6 ] to Penearth and [ 1 to 2 ] to CritChance",
        "component_words": ["Gen", "Eith", "Sis", "Tar"],
        "min_stats": {
            "Earth Pen%": 3,
            "Crit Chance%": 1,
        },
        "max_stats": {
            "Earth Pen%": 6,
            "Crit Chance%": 2,
        },
    },
    "Ano'in": {
        "description": "[ 3 to 6 ] to Penwind and [ 1 to 2 ] to CritChance",
        "component_words": ["Gen", "Eith", "Sis", "Ano"],
        "min_stats": {
            "Wind Pen%": 3,
            "Crit Chance%": 1,
        },
        "max_stats": {
            "Wind Pen%": 6,
            "Crit Chance%": 2,
        },
    },
    "Jor'in": {
        "description": "[ 3 to 6 ] to Pentoxic and [ 1 to 2 ] to CritChance",
        "component_words": ["Gen", "Eith", "Sis", "Jor"],
        "min_stats": {
            "Toxic Pen%": 3,
            "Crit Chance%": 1,
        },
        "max_stats": {
            "Toxic Pen%": 6,
            "Crit Chance%": 2,
        },
    },
    "Cham'in": {
        "description": "[ 3 to 6 ] to Penvoid and [ 1 to 2 ] to CritChance",
        "component_words": ["Gen", "Eith", "Sis", "Cham"],
        "min_stats": {
            "Void Pen%": 3,
            "Crit Chance%": 1,
        },
        "max_stats": {
            "Void Pen%": 6,
            "Crit Chance%": 2,
        },
    },
    "Dal'in": {
        "description": "[ 3 to 6 ] to Pennegative and [ 1 to 2 ] to CritChance",
        "component_words": ["Gen", "Eith", "Sis", "Dal"],
        "min_stats": {
            "Neg Pen%": 3,
            "Crit Chance%": 1,
        },
        "max_stats": {
            "Neg Pen%": 6,
            "Crit Chance%": 2,
        },
    },
    "Yah'in": {
        "description": "[ 3 to 6 ] to Penholy and [ 1 to 2 ] to CritChance",
        "component_words": ["Gen", "Eith", "Sis", "Yah"],
        "min_stats": {
            "Holy Pen%": 3,
            "Crit Chance%": 1,
        },
        "max_stats": {
            "Holy Pen%": 6,
            "Crit Chance%": 2,
        },
    },
    "Tsu'in": {
        "description": "[ 3 to 6 ] to Penblunt and [ 1 to 2 ] to CritChance",
        "component_words": ["Gen", "Eith", "Sis", "Tsu"],
        "min_stats": {
            "Blunt Pen%": 3,
            "Crit Chance%": 1,
        },
        "max_stats": {
            "Blunt Pen%": 6,
            "Crit Chance%": 2,
        },
    },
    "Amer'in": {
        "description": "[ 3 to 6 ] to Penpierce and [ 1 to 2 ] to CritChance",
        "component_words": ["Gen", "Eith", "Sis", "Amer"],
        "min_stats": {
            "Pierce Pen%": 3,
            "Crit Chance%": 1,
        },
        "max_stats": {
            "Pierce Pen%": 6,
            "Crit Chance%": 2,
        },
    },
    "Sano'in": {
        "description": "[ 3 to 6 ] to Penslash and [ 1 to 2 ] to CritChance",
        "component_words": ["Gen", "Eith", "Sis", "Sano"],
        "min_stats": {
            "Slash Pen%": 3,
            "Crit Chance%": 1,
        },
        "max_stats": {
            "Slash Pen%": 6,
            "Crit Chance%": 2,
        },
    },
    "Harmful": {
        "description": "[ 5 to 10 ] to CritDamage",
        "component_words": ["Har", "Pul"],
        "min_stats": {
            "Crit DMG%": 5,
        },
        "max_stats": {
            "Crit DMG%": 10,
        },
    },
    "Unyielding": {
        "description": "[ 5 to 10 ] to CritDamage",
        "component_words": ["Yen", "Um"],
        "min_stats": {
            "Crit DMG%": 5,
        },
        "max_stats": {
            "Crit DMG%": 10,
        },
    },
    "Fallen": {
        "description": "[ 5 to 10 ] to CritDamage",
        "component_words": ["Fal", "Amn"],
        "min_stats": {
            "Crit DMG%": 5,
        },
        "max_stats": {
            "Crit DMG%": 10,
        },
    },
    "Calming": {
        "description": "[ 5 to 10 ] to CritDamage",
        "component_words": ["Ko", "Lem"],
        "min_stats": {
            "Crit DMG%": 5,
        },
        "max_stats": {
            "Crit DMG%": 10,
        },
    },
    "Ulum": {
        "description": "[ 10 to 20 ] to MP",
        "component_words": ["Ulum"],
        "min_stats": {
            "MP": 10,
        },
        "max_stats": {
            "MP": 20,
        },
    },
    "Zen": {
        "description": "[ 15 to 25 ] to Divinedmg and [ 10 to 15 ] to Elevoid",
        "component_words": ["Dol", "No", "Sath"],
        "min_stats": {
            "Divine%": 15,
            "Void%": 10,
        },
        "max_stats": {
            "Divine%": 25,
            "Void%": 15,
        },
    },
    "Pyro Hide": {
        "description": "[ 2 to 4 ] to Resfire and [ 10 to 20 ] to Elefire",
        "component_words": ["Moda", "Igni", "Sol"],
        "min_stats": {
            "Fire Res%": 2,
            "Fire%": 10,
        },
        "max_stats": {
            "Fire Res%": 4,
            "Fire%": 20,
        },
    },
    "Storm Hide": {
        "description": "[ 2 to 4 ] to Reslightning and [ 10 to 20 ] to Elelightning",
        "component_words": ["Rub", "Neut", "Ort"],
        "min_stats": {
            "Lightning Res%": 2,
            "Lightning%": 10,
        },
        "max_stats": {
            "Lightning Res%": 4,
            "Lightning%": 20,
        },
    },
    "Hydro Hide": {
        "description": "[ 2 to 4 ] to Reswater and [ 10 to 20 ] to Elewater",
        "component_words": ["Spo", "Oxi", "Tir"],
        "min_stats": {
            "Water Res%": 2,
            "Water%": 10,
        },
        "max_stats": {
            "Water Res%": 4,
            "Water%": 20,
        },
    },
    "Steel Skin": {
        "description": "[ 2 to 4 ] to Researth and [ 10 to 20 ] to Eleearth",
        "component_words": ["Wor", "Ter", "Tal"],
        "min_stats": {
            "Earth Res%": 2,
            "Earth%": 10,
        },
        "max_stats": {
            "Earth Res%": 4,
            "Earth%": 20,
        },
    },
    "Gale Skin": {
        "description": "[ 2 to 4 ] to Reswind and [ 10 to 20 ] to Elewind",
        "component_words": ["Jak", "Njor", "Eth"],
        "min_stats": {
            "Wind Res%": 2,
            "Wind%": 10,
        },
        "max_stats": {
            "Wind Res%": 4,
            "Wind%": 20,
        },
    },
    "Venom Skin": {
        "description": "[ 2 to 4 ] to Restoxic and [ 10 to 20 ] to Eletoxic",
        "component_words": ["Adi", "Eti", "Ral"],
        "min_stats": {
            "Toxic Res%": 2,
            "Toxic%": 10,
        },
        "max_stats": {
            "Toxic Res%": 4,
            "Toxic%": 20,
        },
    },
    "Void Shield": {
        "description": "[ 2 to 4 ] to Resvoid and [ 8 to 16 ] to Elevoid",
        "component_words": ["Bel", "Ygg", "Zod"],
        "min_stats": {
            "Void Res%": 2,
            "Void%": 8,
        },
        "max_stats": {
            "Void Res%": 4,
            "Void%": 16,
        },
    },
    "Death Shield": {
        "description": "[ 2 to 4 ] to Resnegative and [ 10 to 20 ] to Elenegative",
        "component_words": ["Wat", "Hel", "Vex"],
        "min_stats": {
            "Neg Res%": 2,
            "Neg%": 10,
        },
        "max_stats": {
            "Neg Res%": 4,
            "Neg%": 20,
        },
    },
    "Light Shield": {
        "description": "[ 2 to 4 ] to Resholy and [ 10 to 20 ] to Eleholy",
        "component_words": ["Fer", "Val", "Lo"],
        "min_stats": {
            "Holy Res%": 2,
            "Holy%": 10,
        },
        "max_stats": {
            "Holy Res%": 4,
            "Holy%": 20,
        },
    },
    "Absorb": {
        "description": "[ 2 to 4 ] to Resblunt and [ 10 to 20 ] to Eleblunt",
        "component_words": ["Pad", "Jah", "Mal"],
        "min_stats": {
            "Blunt Res%": 2,
            "Blunt%": 10,
        },
        "max_stats": {
            "Blunt Res%": 4,
            "Blunt%": 20,
        },
    },
    "Defuse": {
        "description": "[ 2 to 4 ] to Respierce and [ 10 to 20 ] to Elepierce",
        "component_words": ["Kev", "Ith", "Ist"],
        "min_stats": {
            "Pierce Res%": 2,
            "Pierce%": 10,
        },
        "max_stats": {
            "Pierce Res%": 4,
            "Pierce%": 20,
        },
    },
    "Impervious": {
        "description": "[ 2 to 4 ] to Resslash and [ 10 to 20 ] to Eleslash",
        "component_words": ["Aro", "Ber", "Gul"],
        "min_stats": {
            "Slash Res%": 2,
            "Slash%": 10,
        },
        "max_stats": {
            "Slash Res%": 4,
            "Slash%": 20,
        },
    },
    "Juggernaut": {
        "description": "[ 10 to 20 ] to Defmulti and [ 10 to 20 ] to Elevoid",
        "component_words": ["Bar", "Shier"],
        "min_stats": {
            "DEF%": 10,
            "Void%": 10,
        },
        "max_stats": {
            "DEF%": 20,
            "Void%": 20,
        },
    },
    "Immortal": {
        "description": "[ 0 to 1 ] to HpRegenRate and [ 10 to 20 ] to Defmulti",
        "component_words": ["Bar", "Shier", "Tur", "Toro", "La"],
        "min_stats": {
            "HP Regen%": 0,
            "DEF%": 10,
        },
        "max_stats": {
            "HP Regen%": 1,
            "DEF%": 20,
        },
    },
    "Eternal Vortex": {
        "description": "[ 15 to 30 ] to Elementaldmg and [ 15 to 25 ] to CritDamage",
        "component_words": ["Nat", "Tzen", "Inc"],
        "min_stats": {
            "Elemental%": 15,
            "Crit DMG%": 15,
        },
        "max_stats": {
            "Elemental%": 30,
            "Crit DMG%": 25,
        },
    },
    "Skull Throne": {
        "description": "[ 15 to 30 ] to Physicaldmg and [ 15 to 25 ] to CritDamage",
        "component_words": ["Mar", "Khor", "Onen"],
        "min_stats": {
            "Phys%": 15,
            "Crit DMG%": 15,
        },
        "max_stats": {
            "Phys%": 30,
            "Crit DMG%": 25,
        },
    },
    "Plague Garden": {
        "description": "[ 15 to 30 ] to Divinedmg and [ 25 to 35 ] to CritDamage",
        "component_words": ["Jevo", "Nurg", "Gol"],
        "min_stats": {
            "Divine%": 15,
            "Crit DMG%": 25,
        },
        "max_stats": {
            "Divine%": 30,
            "Crit DMG%": 35,
        },
    },
    "Sin Palace": {
        "description": "[ 10 to 20 ] to Elevoid and [ 20 to 30 ] to CritDamage",
        "component_words": ["Span", "Slah", "Nesh"],
        "min_stats": {
            "Void%": 10,
            "Crit DMG%": 20,
        },
        "max_stats": {
            "Void%": 20,
            "Crit DMG%": 30,
        },
    },
    "Focus Fire": {
        "description": "[ 5 to 10 ] to Elefire and [ 2 to 4 ] to Penfire",
        "component_words": ["Nat", "Sol"],
        "min_stats": {
            "Fire%": 5,
            "Fire Pen%": 2,
        },
        "max_stats": {
            "Fire%": 10,
            "Fire Pen%": 4,
        },
    },
    "Focus Bolt": {
        "description": "[ 5 to 10 ] to Elelightning and [ 2 to 4 ] to Penlightning",
        "component_words": ["Nat", "Ort"],
        "min_stats": {
            "Lightning%": 5,
            "Lightning Pen%": 2,
        },
        "max_stats": {
            "Lightning%": 10,
            "Lightning Pen%": 4,
        },
    },
    "Focus Aqua": {
        "description": "[ 5 to 10 ] to Elewater and [ 2 to 4 ] to Penwater",
        "component_words": ["Nat", "Tir"],
        "min_stats": {
            "Water%": 5,
            "Water Pen%": 2,
        },
        "max_stats": {
            "Water%": 10,
            "Water Pen%": 4,
        },
    },
    "Focus Earth": {
        "description": "[ 5 to 10 ] to Eleearth and [ 2 to 4 ] to Penearth",
        "component_words": ["Nat", "Tal"],
        "min_stats": {
            "Earth%": 5,
            "Earth Pen%": 2,
        },
        "max_stats": {
            "Earth%": 10,
            "Earth Pen%": 4,
        },
    },
    "Focus Wind": {
        "description": "[ 5 to 10 ] to Elewind and [ 2 to 4 ] to Penwind",
        "component_words": ["Nat", "Eth"],
        "min_stats": {
            "Wind%": 5,
            "Wind Pen%": 2,
        },
        "max_stats": {
            "Wind%": 10,
            "Wind Pen%": 4,
        },
    },
    "Focus Venom": {
        "description": "[ 5 to 10 ] to Eletoxic and [ 2 to 4 ] to Pentoxic",
        "component_words": ["Nat", "Ral"],
        "min_stats": {
            "Toxic%": 5,
            "Toxic Pen%": 2,
        },
        "max_stats": {
            "Toxic%": 10,
            "Toxic Pen%": 4,
        },
    },
    "Focus Void": {
        "description": "[ 4 to 8 ] to Elevoid and [ 1 to 1 ] to Penvoid",
        "component_words": ["Span", "Zod"],
        "min_stats": {
            "Void%": 4,
            "Void Pen%": 1,
        },
        "max_stats": {
            "Void%": 8,
            "Void Pen%": 1,
        },
    },
    "Focus Death": {
        "description": "[ 5 to 10 ] to Elenegative and [ 2 to 4 ] to Pennegative",
        "component_words": ["Jevo", "Vex"],
        "min_stats": {
            "Neg%": 5,
            "Neg Pen%": 2,
        },
        "max_stats": {
            "Neg%": 10,
            "Neg Pen%": 4,
        },
    },
    "Focus Light": {
        "description": "[ 5 to 10 ] to Eleholy and [ 1 to 3 ] to Penholy",
        "component_words": ["Jevo", "Lo"],
        "min_stats": {
            "Holy%": 5,
            "Holy Pen%": 1,
        },
        "max_stats": {
            "Holy%": 10,
            "Holy Pen%": 3,
        },
    },
    "Focus Force": {
        "description": "[ 5 to 10 ] to Eleblunt and [ 2 to 4 ] to Penblunt",
        "component_words": ["Mar", "Mal"],
        "min_stats": {
            "Blunt%": 5,
            "Blunt Pen%": 2,
        },
        "max_stats": {
            "Blunt%": 10,
            "Blunt Pen%": 4,
        },
    },
    "Focus Point": {
        "description": "[ 5 to 10 ] to Elepierce and [ 2 to 4 ] to Penpierce",
        "component_words": ["Mar", "Ist"],
        "min_stats": {
            "Pierce%": 5,
            "Pierce Pen%": 2,
        },
        "max_stats": {
            "Pierce%": 10,
            "Pierce Pen%": 4,
        },
    },
    "Focus Edge": {
        "description": "[ 5 to 10 ] to Eleslash and [ 2 to 4 ] to Penslash",
        "component_words": ["Mar", "Gul"],
        "min_stats": {
            "Slash%": 5,
            "Slash Pen%": 2,
        },
        "max_stats": {
            "Slash%": 10,
            "Slash Pen%": 4,
        },
    },
    "Chaos Fury": {
        "description": "[ 1 to 2 ] to Dmgmulti and [ 5 to 10 ] to CritDamage",
        "component_words": ["Khor", "Onen", "Nurg", "Tzen", "Slah", "Ulum"],
        "min_stats": {
            "Dmg%": 1,
            "Crit DMG%": 5,
        },
        "max_stats": {
            "Dmg%": 2,
            "Crit DMG%": 10,
        },
    },
    "Ethereal": {
        "description": "[ 10 to 20 ] to Defmulti and [ 4 to 6 ] to Allres",
        "component_words": ["Njor", "Tur", "Toro", "La", "Ther"],
        "min_stats": {
            "DEF%": 10,
            "All Res%": 4,
        },
        "max_stats": {
            "DEF%": 20,
            "All Res%": 6,
        },
    },
    "Killing Intent": {
        "description": "[ 2 to 4 ] to Penvoid and [ 10 to 20 ] to Elevoid",
        "component_words": ["Tur", "Toro", "La", "Eth", "Pha"],
        "min_stats": {
            "Void Pen%": 2,
            "Void%": 10,
        },
        "max_stats": {
            "Void Pen%": 4,
            "Void%": 20,
        },
    },
    "Warrior's Haki": {
        "description": "[ 2 to 4 ] to Penvoid and [ 30 to 50 ] to Defmulti",
        "component_words": ["Pha", "Ther"],
        "min_stats": {
            "Void Pen%": 2,
            "DEF%": 30,
        },
        "max_stats": {
            "Void Pen%": 4,
            "DEF%": 50,
        },
    },
    "Star Knight": {
        "description": "[ 3 to 5 ] to Xphysicaldmg",
        "component_words": ["Ulti", "Ma"],
        "min_stats": {
            "Phys xDmg%": 3,
        },
        "max_stats": {
            "Phys xDmg%": 5,
        },
    },
    "Astral Prophet": {
        "description": "[ 3 to 5 ] to Xdivinedmg",
        "component_words": ["Megi", "Dola"],
        "min_stats": {
            "Divine xDmg%": 3,
        },
        "max_stats": {
            "Divine xDmg%": 5,
        },
    },
    "Aeon Sage": {
        "description": "[ 3 to 5 ] to Xelementaldmg",
        "component_words": ["Nue", "Kyar"],
        "min_stats": {
            "Elemental xDmg%": 3,
        },
        "max_stats": {
            "Elemental xDmg%": 5,
        },
    },
    "Warp Horror": {
        "description": "[ 3 to 5 ] to Xvoiddmg",
        "component_words": ["Kah", "Than"],
        "min_stats": {
            "Void xDmg%": 3,
        },
        "max_stats": {
            "Void xDmg%": 5,
        },
    },
    "Enlightenment": {
        "description": "[ 2 to 4 ] to Dmgmultiadd",
        "component_words": ["Eb", "An", "Flo"],
        "min_stats": {
            "Dmg%": 2,
        },
        "max_stats": {
            "Dmg%": 4,
        },
    },
    "Star Light": {
        "description": "[ 4 to 6 ] to Xphysicaldmg",
        "component_words": ["Gen", "Eith", "Sis", "Ulti", "Ma"],
        "min_stats": {
            "Phys xDmg%": 4,
        },
        "max_stats": {
            "Phys xDmg%": 6,
        },
    },
    "Astral Light": {
        "description": "[ 4 to 6 ] to Xdivinedmg",
        "component_words": ["Gen", "Eith", "Sis", "Megi", "Dola"],
        "min_stats": {
            "Divine xDmg%": 4,
        },
        "max_stats": {
            "Divine xDmg%": 6,
        },
    },
    "Aeon Shadow": {
        "description": "[ 4 to 6 ] to Xelementaldmg",
        "component_words": ["Gen", "Eith", "Sis", "Nue", "Kyar"],
        "min_stats": {
            "Elemental xDmg%": 4,
        },
        "max_stats": {
            "Elemental xDmg%": 6,
        },
    },
    "Warp Shadow": {
        "description": "[ 4 to 6 ] to Xvoiddmg",
        "component_words": ["Gen", "Eith", "Sis", "Kah", "Than"],
        "min_stats": {
            "Void xDmg%": 4,
        },
        "max_stats": {
            "Void xDmg%": 6,
        },
    },
};

const script_data: ScriptData = {
    scripts: script_recipes,
    runewords: runeword_data,
};

export default script_data;
