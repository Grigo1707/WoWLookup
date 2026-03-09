// In-memory cache for WowHead item data (keyed by "domain:itemId")
const itemCache = new Map<string, WowheadItemData | null>();

export interface WowheadItemData {
  level: number;
  hitRating: number;
  spellHitRating: number;
  inventorySlotId: number; // Wowhead inventory slot ID (e.g. 23 = Held In Off-Hand, 14 = Shield)
}

export interface CharacterHitStats {
  totalHit: number;
  totalSpellHit: number;
  meleeHitCap: number;
  spellHitCap: number;
  meleeHitCapPct: number;
  spellHitCapPct: number;
}

// Hit rating needed for cap + cap percentage
export const HIT_CAPS: Record<string, { melee: number; spell: number; meleePct: number; spellPct: number }> = {
  tbc:     { melee: 142,  spell: 202,  meleePct: 9,  spellPct: 16 },
  wotlk:   { melee: 263,  spell: 446,  meleePct: 8,  spellPct: 17 },
  classic: { melee: 0,    spell: 0,    meleePct: 0,  spellPct: 0  }, // no hit rating in Classic Era
  cata:    { melee: 961,  spell: 1742, meleePct: 8,  spellPct: 17 },
  mop:     { melee: 2550, spell: 5100, meleePct: 15, spellPct: 15 },
};

export async function fetchWowheadItem(
  itemId: number,
  domain: string
): Promise<WowheadItemData | null> {
  const cacheKey = `${domain}:${itemId}`;
  if (itemCache.has(cacheKey)) {
    return itemCache.get(cacheKey)!;
  }

  try {
    const url =
      domain === "retail"
        ? `https://www.wowhead.com/item=${itemId}&xml`
        : `https://www.wowhead.com/${domain}/item=${itemId}&xml`;

    const res = await fetch(url, {
      signal: AbortSignal.timeout(5000),
      next: { revalidate: 86400 },
    } as RequestInit & { next?: { revalidate: number } });

    if (!res.ok) {
      itemCache.set(cacheKey, null);
      return null;
    }

    const xml = await res.text();

    const levelMatch = xml.match(/<level>(\d+)<\/level>/);
    const inventorySlotMatch = xml.match(/<inventorySlot id="(\d+)">/);

    // Parse jsonEquip CDATA block for hit stats (Wowhead uses mlehitrtng / splhitrtng)
    const jsonEquipMatch = xml.match(/<jsonEquip><!\[CDATA\[([\s\S]*?)\]\]><\/jsonEquip>/);
    const jsonEquip = jsonEquipMatch ? `{${jsonEquipMatch[1]}}` : "{}";
    let equip: Record<string, number> = {};
    try { equip = JSON.parse(jsonEquip); } catch { /* ignore malformed */ }

    // mlehitrtng = generic "Hit Rating" (melee + spell in TBC/WotLK/Cata)
    // splhitrtng = "Spell Hit Rating" (spell only)
    const mleHit = equip["mlehitrtng"] ?? 0;
    const splHit = equip["splhitrtng"] ?? 0;

    const data: WowheadItemData = {
      level: levelMatch ? parseInt(levelMatch[1], 10) : 0,
      hitRating: mleHit,
      spellHitRating: splHit,
      inventorySlotId: inventorySlotMatch ? parseInt(inventorySlotMatch[1], 10) : 0,
    };

    itemCache.set(cacheKey, data);
    return data;
  } catch {
    itemCache.set(cacheKey, null);
    return null;
  }
}
