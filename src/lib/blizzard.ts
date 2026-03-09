const BLIZZARD_CLIENT_ID = process.env.BLIZZARD_CLIENT_ID || "";
const BLIZZARD_CLIENT_SECRET = process.env.BLIZZARD_CLIENT_SECRET || "";

interface BlizzardToken {
  access_token: string;
  expires_in: number;
}

let cachedToken: { token: string; expiresAt: number } | null = null;

export async function getBlizzardToken(region: string = "eu"): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 60000) {
    return cachedToken.token;
  }

  const tokenUrl = `https://${region}.battle.net/oauth/token`;
  const credentials = Buffer.from(
    `${BLIZZARD_CLIENT_ID}:${BLIZZARD_CLIENT_SECRET}`
  ).toString("base64");

  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    throw new Error(`Failed to get Blizzard token: ${res.status}`);
  }

  const data: BlizzardToken = await res.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: now + data.expires_in * 1000,
  };

  return cachedToken.token;
}

export interface CharacterEquipment {
  equipped_items: EquippedItem[];
  character: {
    name: string;
    realm: { name: string; slug: string };
    level: number;
  };
}

export interface EquippedItem {
  slot: { type: string; name: string };
  item: { id: number; name: string };
  quality: { type: string; name: string };
  level: { value: number; display_string: string };
  name: string;
  enchantments?: Array<{ display_string: string }>;
  gems?: Array<{ item: { id: number; name: string } }>;
}

export interface CharacterSpecializations {
  specializations: Specialization[];
  active_specialization: { id: number; name: string };
}

export interface Specialization {
  specialization: { id: number; name: string };
  talents: Talent[];
  glyphs?: Glyph[];
  pvp_talent_slots?: PvpTalent[];
}

export interface Talent {
  talent: { id: number; name: string; spell: { id: number; name: string } };
  spell_tooltip: { description: string };
  column_index: number;
  row_index: number;
  rank: number;
}

export interface Glyph {
  glyph: { id: number; name: string };
}

export interface PvpTalent {
  selected?: { talent: { id: number; name: string } };
  slot_number: number;
}

export interface CharacterSummary {
  name: string;
  gender: { type: string; name: string };
  faction: { type: string; name: string };
  race: { id: number; name: string };
  character_class: { id: number; name: string };
  active_spec: { id: number; name: string };
  realm: { name: string; slug: string };
  level: number;
  achievement_points: number;
  last_login_timestamp: number;
  average_item_level: number;
  equipped_item_level: number;
  avatar?: string;
}

export async function fetchCharacterSummary(
  region: string,
  realmSlug: string,
  characterName: string,
  namespace: string
): Promise<CharacterSummary> {
  const token = await getBlizzardToken(region);
  const name = characterName.toLowerCase();
  const url = `https://${region}.api.blizzard.com/profile/wow/character/${realmSlug}/${name}?namespace=${namespace}-${region}&locale=en_US`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    throw new Error(`Character not found: ${res.status}`);
  }

  return res.json();
}

export async function fetchCharacterEquipment(
  region: string,
  realmSlug: string,
  characterName: string,
  namespace: string
): Promise<CharacterEquipment> {
  const token = await getBlizzardToken(region);
  const name = characterName.toLowerCase();
  const url = `https://${region}.api.blizzard.com/profile/wow/character/${realmSlug}/${name}/equipment?namespace=${namespace}-${region}&locale=en_US`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    throw new Error(`Equipment not found: ${res.status}`);
  }

  return res.json();
}

export async function fetchCharacterSpecializations(
  region: string,
  realmSlug: string,
  characterName: string,
  namespace: string
): Promise<CharacterSpecializations> {
  const token = await getBlizzardToken(region);
  const name = characterName.toLowerCase();
  const url = `https://${region}.api.blizzard.com/profile/wow/character/${realmSlug}/${name}/specializations?namespace=${namespace}-${region}&locale=en_US`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    throw new Error(`Specializations not found: ${res.status}`);
  }

  return res.json();
}
