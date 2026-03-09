export const DUNGEON_UNLOCKS_STORAGE_KEY = "SelectedDungeonUnlocks"

export const dungeonUnlockTags = [
  "DragonKey",
  "ValkyrieKey",
  "AsuraKey",
  "ElvenKey",
  "DeathKey",
  "PleiadesTrial",
  "DeathGodBlessing",
  "IgnisKey",
  "AquaKey",
  "TempestKey",
  "TerraKey",
  "PrimalKey",
  "PrimalEssence",
  "AncientTrial",
  "SpiritFragment",
  "ReaperShard",
  "DeceiverShard",
  "FlayerShard",
  "StarAtlas",
  "StarEssence",
  "HonorFragment",
  "DesireFragment",
  "PeaceFragment",
] as const

export type DungeonUnlockTag = typeof dungeonUnlockTags[number]

export const dungeonUnlockTooltips: Partial<Record<DungeonUnlockTag, string>> = {
  PleiadesTrial: "Lvl 60 prestige talents",
  DragonKey: "Raid 1 dungeons",
  ValkyrieKey: "Racial final talent",
  AsuraKey: "Racial final talent",
  ElvenKey: "Racial final talent",
  DeathKey: "Raid 1 final dungeon",
  DeathGodBlessing: "Lvl 100 prestige talents, lvl 125 talents, lvl 100 skills, Raid 2",
  IgnisKey: "Conversion talents",
  AquaKey: "Conversion talents",
  TempestKey: "Conversion talents",
  TerraKey: "Conversion talents",
  PrimalKey: "Raid 2 final dungeon",
  PrimalEssence: "Lvl 175 talents, lvl 160 skills, Conversion talents",
  AncientTrial: "Second lvl 60 prestige",
  SpiritFragment: "Second lvl 100 prestige",
  StarAtlas: "Raid 3 final dungeon",
  StarEssence: "Lvl 175 talent capstone",
}

export function isDungeonUnlockTag(value: string): value is DungeonUnlockTag {
  return dungeonUnlockTags.includes(value as DungeonUnlockTag)
}
