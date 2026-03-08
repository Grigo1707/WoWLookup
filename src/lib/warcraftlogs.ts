const WCL_CLIENT_ID = process.env.WARCRAFTLOGS_CLIENT_ID || "";
const WCL_CLIENT_SECRET = process.env.WARCRAFTLOGS_CLIENT_SECRET || "";

let wclToken: { token: string; expiresAt: number } | null = null;

async function getWclToken(): Promise<string> {
  const now = Date.now();
  if (wclToken && wclToken.expiresAt > now + 60000) {
    return wclToken.token;
  }

  const credentials = Buffer.from(`${WCL_CLIENT_ID}:${WCL_CLIENT_SECRET}`).toString("base64");

  const res = await fetch("https://www.warcraftlogs.com/oauth/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    throw new Error(`Failed to get WCL token: ${res.status}`);
  }

  const data = await res.json();
  wclToken = {
    token: data.access_token,
    expiresAt: now + data.expires_in * 1000,
  };

  return wclToken.token;
}

export interface WclCharacterData {
  name: string;
  classID: number;
  zoneRankings?: ZoneRankings;
}

export interface ZoneRankings {
  bestPerformanceAverage: number | null;
  medianPerformanceAverage: number | null;
  rankings: BossRanking[];
}

export interface BossRanking {
  encounter: { id: number; name: string };
  rankPercent: number;
  medianPercent: number;
  bestAmount: number;
  spec: string;
  lockedIn: boolean;
  totalKills: number;
  fastestKill: number;
  allStars?: {
    points: number;
    rank: number;
    rankPercent: number;
    total: number;
  };
}

const CHARACTER_QUERY = `
  query CharacterRankings($name: String!, $serverSlug: String!, $serverRegion: String!, $zoneID: Int) {
    characterData {
      character(name: $name, serverSlug: $serverSlug, serverRegion: $serverRegion) {
        name
        classID
        zoneRankings(zoneID: $zoneID)
      }
    }
  }
`;

const WCL_ENDPOINTS = [
  "https://fresh.warcraftlogs.com/api/v2/client",
  "https://www.warcraftlogs.com/api/v2/client",
];

async function queryWcl(endpoint: string, token: string, variables: object): Promise<WclCharacterData | null> {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: CHARACTER_QUERY, variables }),
    next: { revalidate: 300 },
  });

  if (!res.ok) return null;

  const data = await res.json();
  return data?.data?.characterData?.character || null;
}

export async function fetchWclCharacterData(
  characterName: string,
  serverSlug: string,
  serverRegion: string,
  zoneID?: number
): Promise<WclCharacterData | null> {
  try {
    const token = await getWclToken();
    const variables = { name: characterName, serverSlug, serverRegion, zoneID };

    for (const endpoint of WCL_ENDPOINTS) {
      const result = await queryWcl(endpoint, token, variables);
      if (result) return result;
    }

    return null;
  } catch {
    return null;
  }
}
