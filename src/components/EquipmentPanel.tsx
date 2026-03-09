"use client";

import { useEffect } from "react";
import { CharacterEquipment, EquippedItem } from "@/lib/blizzard";
import { getItemQualityColor } from "@/lib/utils";

declare global {
  interface Window {
    WH?: { Tooltips?: { refreshLinks?: () => void } };
  }
}

const SLOT_ORDER = [
  "HEAD", "NECK", "SHOULDER", "BACK", "CHEST", "SHIRT", "TABARD",
  "WRIST", "HANDS", "WAIST", "LEGS", "FEET",
  "FINGER_1", "FINGER_2", "TRINKET_1", "TRINKET_2",
  "MAIN_HAND", "OFF_HAND", "RANGED",
];

const SLOT_LABELS: Record<string, string> = {
  HEAD: "Kopf", NECK: "Hals", SHOULDER: "Schultern", BACK: "Rücken",
  CHEST: "Brust", SHIRT: "Hemd", TABARD: "Wappenrock", WRIST: "Handgelenk",
  HANDS: "Hände", WAIST: "Taille", LEGS: "Beine", FEET: "Füße",
  FINGER_1: "Ring 1", FINGER_2: "Ring 2", TRINKET_1: "Schmuckstein 1",
  TRINKET_2: "Schmuckstein 2", MAIN_HAND: "Haupthand", OFF_HAND: "Nebenhand",
  RANGED: "Fernkampf",
};

function wowheadAttr(type: "item" | "spell", id: number, domain: string) {
  return domain ? `${type}=${id}&domain=${domain}` : `${type}=${id}`;
}

function GemIcon({ gemId, domain }: { gemId: number; domain: string }) {
  return (
    <a
      href={`https://www.wowhead.com/item=${gemId}`}
      data-wowhead={wowheadAttr("item", gemId, domain)}
      onClick={(e) => e.preventDefault()}
      className="block"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/api/icon?type=item&id=${gemId}`}
        alt=""
        className="w-4 h-4 rounded border border-gray-600/60 object-cover"
        loading="lazy"
        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
      />
    </a>
  );
}

function ItemRow({ item, slotType, domain }: { item: EquippedItem | undefined; slotType: string; domain: string }) {
  const color = item ? getItemQualityColor(item.quality?.type || "COMMON") : "#374151";

  return (
    <div className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-gray-800/40 transition-colors group">
      {/* Item icon with wowhead tooltip */}
      {item ? (
        <a
          href={`https://www.wowhead.com/item=${item.item?.id}`}
          data-wowhead={wowheadAttr("item", item.item?.id, domain)}
          onClick={(e) => e.preventDefault()}
          className="flex-shrink-0"
        >
          <div
            className="w-10 h-10 rounded-lg border-2 overflow-hidden"
            style={{ borderColor: color }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/icon?type=item&id=${item.item?.id}`}
              alt={item.name}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          </div>
        </a>
      ) : (
        <div className="w-10 h-10 rounded-lg border-2 border-gray-700/50 flex-shrink-0 bg-gray-800/30 flex items-center justify-center">
          <span className="text-gray-600 text-xs">–</span>
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="text-xs text-gray-500 uppercase tracking-wider leading-none mb-0.5">
          {SLOT_LABELS[slotType] || slotType}
        </div>
        {item ? (
          <>
            <a
              href={`https://www.wowhead.com/item=${item.item?.id}`}
              data-wowhead={wowheadAttr("item", item.item?.id, domain)}
              onClick={(e) => e.preventDefault()}
              className="text-sm font-medium truncate leading-tight block"
              style={{ color }}
            >
              {item.name}
            </a>
            {item.enchantments && item.enchantments.length > 0 && (
              <div className="text-xs text-teal-400 truncate leading-tight">
                {item.enchantments[0].display_string}
              </div>
            )}
            {/* Gems */}
            {item.gems && item.gems.length > 0 && (
              <div className="flex gap-1 mt-0.5">
                {item.gems.map((gem, i) => (
                  <GemIcon key={i} gemId={gem.item.id} domain={domain} />
                ))}
              </div>
            )}
            {item.level?.value !== undefined && (
              <div className="text-xs text-gray-500 leading-tight">iLvl {item.level.value}</div>
            )}
          </>
        ) : (
          <div className="text-sm text-gray-600 italic leading-tight">Leer</div>
        )}
      </div>
    </div>
  );
}

interface Props {
  equipment: CharacterEquipment;
  wowheadDomain: string;
}

export default function EquipmentPanel({ equipment, wowheadDomain }: Props) {
  // Re-initialize WoWHead tooltips after render
  useEffect(() => {
    if (typeof window !== "undefined" && window.WH?.Tooltips?.refreshLinks) {
      window.WH.Tooltips.refreshLinks();
    }
  });

  const itemsBySlot = new Map<string, EquippedItem>();
  for (const item of equipment.equipped_items || []) {
    itemsBySlot.set(item.slot?.type, item);
  }

  const itemsWithIlvl = equipment.equipped_items?.filter((i) => i.level?.value) || [];
  const avgIlvl =
    itemsWithIlvl.length > 0
      ? Math.round(itemsWithIlvl.reduce((s, i) => s + i.level.value, 0) / itemsWithIlvl.length)
      : 0;

  return (
    <div className="bg-gray-900/80 backdrop-blur border border-amber-500/20 rounded-2xl p-5 shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-amber-400 font-bold text-base uppercase tracking-wider">Ausrüstung</h2>
        {avgIlvl > 0 && (
          <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded-full">
            ⌀ {avgIlvl} iLvl
          </span>
        )}
      </div>
      <div className="space-y-0">
        {SLOT_ORDER.map((slot) => (
          <ItemRow key={slot} slotType={slot} item={itemsBySlot.get(slot)} domain={wowheadDomain} />
        ))}
      </div>
    </div>
  );
}
