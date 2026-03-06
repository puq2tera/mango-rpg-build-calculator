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

export function isDungeonUnlockTag(value: string): value is DungeonUnlockTag {
  return dungeonUnlockTags.includes(value as DungeonUnlockTag)
}
