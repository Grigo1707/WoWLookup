// In-memory cache for WowHead item data (keyed by "domain:itemId")
const itemCache = new Map<string, WowheadItemData | null>();

export interface WowheadItemData {
  level: number;
  hitRating: number;
  spellHitRating: number;
}

export interface CharacterHitStats {
  totalHit: number;
  totalSpellHit: number;
  meleeHitCap: number;
  spellHitCap: number;
}

// Hit rating needed per 1% hit chance
export const HIT_CAPS: Record<string, { melee: number; spell: number }> = {
  tbc:      { melee: 142,  spell: 202 },
  wotlk:    { melee: 263,  spell: 446 },
  classic:  { melee: 0,    spell: 0   }, // no hit rating in Classic Era
  cata:     { melee: 961,  spell: 1742 },
  mop:      { melee: 2550, spell: 5100 },
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
    const hitMatch = xml.match(/\+(\d+)\s+Hit Rating/i);
    const spellHitMatch = xml.match(/\+(\d+)\s+Spell Hit Rating/i);

    const data: WowheadItemData = {
      level: levelMatch ? parseInt(levelMatch[1], 10) : 0,
      hitRating: hitMatch ? parseInt(hitMatch[1], 10) : 0,
      spellHitRating: spellHitMatch ? parseInt(spellHitMatch[1], 10) : 0,
    };

    itemCache.set(cacheKey, data);
    return data;
  } catch {
    itemCache.set(cacheKey, null);
    return null;
  }
}
