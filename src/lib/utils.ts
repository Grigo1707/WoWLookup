import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { CharacterEquipment, EquippedItem } from "./blizzard";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getItemQualityColor(quality: string): string {
  const colors: Record<string, string> = {
    Poor: "#9d9d9d",
    Common: "#ffffff",
    Uncommon: "#1eff00",
    Rare: "#0070dd",
    Epic: "#a335ee",
    Legendary: "#ff8000",
    Artifact: "#e6cc80",
    Heirloom: "#00ccff",
  };
  return colors[quality] || "#ffffff";
}

export function getParseColor(parse: number): string {
  if (parse >= 100) return "#e268a8"; // Artifact
  if (parse >= 99) return "#ff8000"; // Legendary
  if (parse >= 95) return "#a335ee"; // Epic
  if (parse >= 75) return "#0070dd"; // Rare
  if (parse >= 50) return "#1eff00"; // Uncommon
  if (parse >= 25) return "#ffffff"; // Common
  return "#9d9d9d"; // Poor
}

// Enchantable slots per realm type
const ENCHANTABLE_RETAIL = new Set(["MAIN_HAND", "OFF_HAND", "BACK", "CHEST", "WRIST", "HANDS", "LEGS", "FEET", "NECK", "FINGER_1", "FINGER_2"]);
const ENCHANTABLE_CLASSIC = new Set(["MAIN_HAND", "OFF_HAND", "BACK", "CHEST", "WRIST", "HANDS", "LEGS", "FEET", "HEAD", "SHOULDER"]);

export function getEnchantableSlots(realmType?: string): Set<string> {
  return realmType?.startsWith("classic") ? ENCHANTABLE_CLASSIC : ENCHANTABLE_RETAIL;
}

/** @deprecated use getEnchantableSlots() */
export const ENCHANTABLE_SLOTS = ENCHANTABLE_RETAIL;

export interface GearscoreResult {
  score: number;
  avgIlvl: number;
  missingEnchants: string[];
  missingGems: string[];
  enchantPenalty: number;
  gemPenalty: number;
}

export function calculateGearscore(equipment: CharacterEquipment, realmType?: string): GearscoreResult {
  const enchantableSlots = getEnchantableSlots(realmType);
  const items = equipment.equipped_items || [];
  const relevantItems = items.filter((i) => i.level?.value && i.slot?.type !== "SHIRT" && i.slot?.type !== "TABARD");

  const avgIlvl = relevantItems.length > 0
    ? relevantItems.reduce((s, i) => s + i.level.value, 0) / relevantItems.length
    : 0;

  const missingEnchants: string[] = [];
  const missingGems: string[] = [];

  // For classic armory data, items have no level.value — still check enchants/gems on all items
  const itemsForWarnings = avgIlvl === 0 ? items.filter((i) => i.slot?.type !== "SHIRT" && i.slot?.type !== "TABARD") : relevantItems;

  for (const item of itemsForWarnings) {
    const slotType = item.slot?.type;

    // Check enchants only for enchantable slots
    if (enchantableSlots.has(slotType)) {
      const hasEnchant = item.enchantments && item.enchantments.length > 0;
      if (!hasEnchant) {
        missingEnchants.push(slotType);
      }
    }

    // Check gems for items with sockets
    if (item.sockets && item.sockets.length > 0) {
      const emptyGemSlots = item.sockets.filter((s: { item?: unknown }) => !s.item).length;
      if (emptyGemSlots > 0) {
        missingGems.push(slotType);
      }
    }
  }

  const enchantPenalty = missingEnchants.length * 2;
  const gemPenalty = missingGems.length * 1;
  const score = Math.max(0, Math.round(avgIlvl) - enchantPenalty - gemPenalty);

  return { score, avgIlvl: Math.round(avgIlvl), missingEnchants, missingGems, enchantPenalty, gemPenalty };
}

export function getParseLabel(parse: number): string {
  if (parse >= 99) return "Legendary";
  if (parse >= 95) return "Epic";
  if (parse >= 75) return "Rare";
  if (parse >= 50) return "Uncommon";
  if (parse >= 25) return "Common";
  return "Poor";
}
