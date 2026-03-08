"use client";

import { CharacterEquipment, EquippedItem } from "@/lib/blizzard";
import { getItemQualityColor } from "@/lib/utils";

const SLOT_ORDER = [
  "HEAD", "NECK", "SHOULDER", "BACK", "CHEST", "SHIRT", "TABARD",
  "WRIST", "HANDS", "WAIST", "LEGS", "FEET",
  "FINGER_1", "FINGER_2", "TRINKET_1", "TRINKET_2",
  "MAIN_HAND", "OFF_HAND", "RANGED",
];

const SLOT_LABELS: Record<string, string> = {
  HEAD: "Kopf",
  NECK: "Hals",
  SHOULDER: "Schultern",
  BACK: "Rücken",
  CHEST: "Brust",
  SHIRT: "Hemd",
  TABARD: "Wappenrock",
  WRIST: "Handgelenk",
  HANDS: "Hände",
  WAIST: "Taille",
  LEGS: "Beine",
  FEET: "Füße",
  FINGER_1: "Ring 1",
  FINGER_2: "Ring 2",
  TRINKET_1: "Schmuckstein 1",
  TRINKET_2: "Schmuckstein 2",
  MAIN_HAND: "Haupthand",
  OFF_HAND: "Nebenhand",
  RANGED: "Fernkampf",
};

function ItemRow({ item, slotType }: { item: EquippedItem | undefined; slotType: string }) {
  const color = item ? getItemQualityColor(item.quality?.type || "Common") : "#374151";

  return (
    <div className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-gray-800/50 transition-colors group">
      <div
        className="w-10 h-10 rounded-lg border flex items-center justify-center text-xs font-bold flex-shrink-0"
        style={{
          borderColor: color,
          backgroundColor: item ? `${color}15` : "#1f293715",
          color: item ? color : "#374151",
        }}
        title={item?.name}
      >
        {item ? "⚔" : "–"}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs text-gray-500 uppercase tracking-wider">{SLOT_LABELS[slotType] || slotType}</div>
        {item ? (
          <>
            <div className="text-sm font-medium truncate" style={{ color }}>
              {item.name}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-gray-400">iLvl {item.level?.value}</span>
              {item.enchantments && item.enchantments.length > 0 && (
                <span className="text-xs text-teal-400">✦ Verzaubert</span>
              )}
              {item.gems && item.gems.length > 0 && (
                <span className="text-xs text-purple-400">◆ {item.gems.length} Juwel</span>
              )}
            </div>
          </>
        ) : (
          <div className="text-sm text-gray-600 italic">Leer</div>
        )}
      </div>
      {item && (
        <a
          href={`https://www.wowhead.com/item=${item.item?.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-amber-400 hover:text-amber-300 flex-shrink-0"
        >
          ↗
        </a>
      )}
    </div>
  );
}

interface Props {
  equipment: CharacterEquipment;
}

export default function EquipmentPanel({ equipment }: Props) {
  const itemsBySlot = new Map<string, EquippedItem>();
  for (const item of equipment.equipped_items || []) {
    itemsBySlot.set(item.slot?.type, item);
  }

  const totalIlvl = equipment.equipped_items
    ?.filter((i) => i.level?.value)
    .reduce((sum, i) => sum + i.level.value, 0) || 0;
  const avgIlvl =
    equipment.equipped_items?.length > 0
      ? Math.round(totalIlvl / equipment.equipped_items.length)
      : 0;

  return (
    <div className="bg-gray-900/80 backdrop-blur border border-amber-500/20 rounded-2xl p-5 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-amber-400 font-bold text-base uppercase tracking-wider">Ausrüstung</h2>
        {avgIlvl > 0 && (
          <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded-full">
            ⌀ {avgIlvl} iLvl
          </span>
        )}
      </div>
      <div className="space-y-0.5">
        {SLOT_ORDER.map((slot) => (
          <ItemRow key={slot} slotType={slot} item={itemsBySlot.get(slot)} />
        ))}
      </div>
    </div>
  );
}
