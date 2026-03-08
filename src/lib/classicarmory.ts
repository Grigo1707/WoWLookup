import type { CharacterSummary, CharacterEquipment, CharacterSpecializations } from "./blizzard";

const BASE_URL = "https://classic-armory.org/api/v1";

// Maps our realm type to the classic-armory "flavor" parameter
const REALM_TYPE_TO_FLAVOR: Record<string, string> = {
  "classic-tbc": "tbc-anniversary",
  "classic-wotlk": "wotlk-anniversary",
  "classic-cata": "cata",
  "classic-era": "classic",
};

interface ClassicArmoryCharacter {
  name: string;
  class_name: string;
  class_id: number;
  race_name: string;
  gender: string;
  faction: string;
  level: number;
  item_level: number;
  gearscore: number;
  guild_name: string;
  realm_name: string;
  realm_slug: string;
  avatar: string;
  specialization_name: string | null;
}

interface ClassicArmoryEquipmentItem {
  item_id: number;
  slot_type: string;
  slot: { type: string; name: string };
  name: string;
  quality_type: string;
  quality: { type: string; name: string };
  icon_file_id: number;
  enchant_display: string[];
  enchantments?: Array<{ display_string: string }>;
  gem_item_ids?: number[];
}

async function post<T>(endpoint: string, body: object): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    throw new Error(`classic-armory ${endpoint} failed: ${res.status}`);
  }

  return res.json();
}

function buildBody(region: string, realmSlug: string, characterName: string, realmType: string) {
  return {
    region,
    realm: realmSlug,
    name: characterName,
    flavor: REALM_TYPE_TO_FLAVOR[realmType] || "tbc-anniversary",
  };
}

export async function fetchClassicArmoryCharacterSummary(
  region: string,
  realmSlug: string,
  characterName: string,
  realmType: string
): Promise<CharacterSummary> {
  const body = buildBody(region, realmSlug, characterName, realmType);
  const raw = await post<{ character: ClassicArmoryCharacter }>("/character", body);
  const data = raw.character;

  return {
    name: data.name,
    gender: { type: data.gender?.toUpperCase() || "MALE", name: data.gender || "Male" },
    faction: { type: data.faction?.toUpperCase() || "ALLIANCE", name: data.faction || "Alliance" },
    race: { id: 0, name: data.race_name },
    character_class: { id: data.class_id || 0, name: data.class_name },
    active_spec: { id: 0, name: data.specialization_name || "" },
    realm: { name: data.realm_name, slug: data.realm_slug || realmSlug },
    level: data.level,
    achievement_points: 0,
    last_login_timestamp: 0,
    average_item_level: data.item_level,
    equipped_item_level: data.item_level,
  };
}

export async function fetchClassicArmoryEquipment(
  region: string,
  realmSlug: string,
  characterName: string,
  realmType: string
): Promise<CharacterEquipment> {
  const body = buildBody(region, realmSlug, characterName, realmType);
  const data = await post<{ equipment: ClassicArmoryEquipmentItem[] }>("/character/equipment", body);

  const equipped_items = (data.equipment || []).map((item) => ({
    slot: item.slot || { type: item.slot_type, name: item.slot_type },
    item: { id: item.item_id, name: item.name },
    quality: item.quality || {
      type: (item.quality_type || "common").toUpperCase(),
      name: item.quality_type || "Common",
    },
    // TBC Classic items have no item level in the API
    level: { value: undefined as unknown as number, display_string: "" },
    name: item.name,
    enchantments: item.enchant_display?.map((s) => ({ display_string: s })),
    gems: item.gem_item_ids?.map((id) => ({ item: { id, name: "" } })),
  }));

  return {
    equipped_items,
    character: {
      name: characterName,
      realm: { name: realmSlug, slug: realmSlug },
      level: 0,
    },
  };
}

export async function fetchClassicArmorySpecializations(
  region: string,
  realmSlug: string,
  characterName: string,
  realmType: string,
  classId: number
): Promise<CharacterSpecializations | null> {
  try {
    const body = { ...buildBody(region, realmSlug, characterName, realmType), class_id: classId };
    const data = await post<{ talents: { tree: { talentRanks: Record<string, { id: number; rank: number; spellId: number }> } } }>("/character/talents", body);

    // TBC has tree-style talents – return a minimal structure
    const talentRanks = data.talents?.tree?.talentRanks || {};
    const talents = Object.values(talentRanks).map((t) => ({
      talent: { id: t.id, name: String(t.id), spell: { id: t.spellId, name: String(t.spellId) } },
      spell_tooltip: { description: "" },
      column_index: 0,
      row_index: 0,
      rank: t.rank,
    }));

    return {
      specializations: [{ specialization: { id: 0, name: "TBC" }, talents }],
      active_specialization: { id: 0, name: "" },
    };
  } catch {
    return null;
  }
}
