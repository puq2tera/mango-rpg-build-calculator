import { StatNames } from "../data/stat_data"

export type Tarot = {
    tier: string
    is_active: boolean
    skill_name: string
    description: string
    stat: StatNames
    stat_base: number
    stat_scaling: number
    stack_conversions: Array<{
        source: StatNames
        ratio: number
        resulting_stat: StatNames
    }>
}

const tarotCards = [
    {
      selected: false,
      level: 0,
      card_name: "The Eclipse",
      skill_name: "Goal of all Life is Death",
      rarity: 5,
      stat_summary: "5% Pennegative",
      hp: null,
      "atk%": null,
      "def%": null,
      "matk%": null
    },
    {
      selected: false,
      level: 0,
      card_name: "Valkyrie of Vengeance",
      skill_name: "Purifying Javelin",
      rarity: 5,
      stat_summary: "5% Penholy",
      hp: null,
      "atk%": null,
      "def%": null,
      "matk%": null
    },
    {
      selected: false,
      level: 0,
      card_name: "Lord of the Blazing Inferno",
      skill_name: "Roaring Hellfire Curse",
      rarity: 5,
      stat_summary: "5% Penfire",
      hp: null,
      "atk%": null,
      "def%": null,
      "matk%": null
    }
];

export default tarotCards;