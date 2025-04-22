export type Talent = {
  category: string
  PreReq: string
  gold: number
  exp: number
  tp_spent: number
  total_level: number
  class_levels: {
    tank_levels: number
    warrior_levels: number
    caster_levels: number
    healer_levels: number
  }
  description: string
  stats: Record<string, number>
  conversions?: Record<string, {
    ratio: number
    resulting_stat: string
  }>
}

const talent_data: Record<string, Talent> = {
  "Slash Training 1": {
    "category": "warrior",
    "PreReq": "",
    "gold": 25,
    "exp": 25,
    "tp_spent": 0,
    "total_level": 0,
    "class_levels": {
      "tank_levels":    0,
      "warrior_levels": 0,
      "caster_levels":  0,
      "healer_levels":  0
    },
    "description": "+5% Increased Slash Damage",
    "stats": { "eleSlash%": 0.05 }
  },
  "Slash Training 2": {
    "category": "warrior",
    "PreReq": "Slash Training 1",
    "gold": 25,
    "exp": 25,
    "tp_spent": 0,
    "total_level": 0,
    "class_levels": {
      "tank_levels":    0,
      "warrior_levels": 0,
      "caster_levels":  0,
      "healer_levels":  0
    },
    "description": "+5% Increased Slash Damage",
    "stats": { "eleSlash%": 0.05 }
  },
  "Slash Mastery": {
    "category": "warrior",
    "PreReq": "Slash Training 2",
    "gold": 25,
    "exp": 25,
    "tp_spent": 0,
    "total_level": 0,
    "class_levels": {
      "tank_levels":    0,
      "warrior_levels": 0,
      "caster_levels":  0,
      "healer_levels":  0
    },
    "description": "+10% Increased Slash Damage",
    "stats": { "eleSlash%": 0.1 }
  },
  "Warlord’s Heart of the Flame": {
    "category": "primalFire",
    "PreReq": "Slash Training 2",
    "gold": 1250,
    "exp": 20000,
    "tp_spent": 62,
    "total_level": 125,
    "class_levels": {
      "tank_levels":    0,
      "warrior_levels": 125,
      "caster_levels":  0,
      "healer_levels":  0
    },
    "description": "+50% ATK, Conversion 8% DEF Multiplier to Crit Damage",
    "stats": { "atk%": 0.5 },
    "conversions": {
      "def%": {
        "ratio": 0.08,
        "resulting_stat": "crit_dmg"
      }
    }
  }
};

export default talent_data;
  