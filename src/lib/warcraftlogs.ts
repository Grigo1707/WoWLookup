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

export interface ZoneRankingsEntry {
  zoneID: number;
  zoneName: string;
  rankings: ZoneRankings;
}

export interface WclCharacterData {
  name: string;
  classID: number;
  zoneRankings?: ZoneRankings;
  allZoneRankings?: ZoneRankingsEntry[];
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

const CHARACTER_QUERY_WITH_METRIC = `
  query CharacterRankings($name: String!, $serverSlug: String!, $serverRegion: String!, $zoneID: Int, $metric: CharacterRankingMetricType) {
    characterData {
      character(name: $name, serverSlug: $serverSlug, serverRegion: $serverRegion) {
        name
        classID
        zoneRankings(zoneID: $zoneID, metric: $metric)
      }
    }
  }
`;

const WCL_ENDPOINTS = [
  "https://fresh.warcraftlogs.com/api/v2/client",
  "https://www.warcraftlogs.com/api/v2/client",
];

export type WclMetric = "dps" | "hps" | "bossdps" | "tankhps";

async function queryWcl(endpoint: string, token: string, variables: object, metric?: WclMetric): Promise<WclCharacterData | null> {
  const query = metric ? CHARACTER_QUERY_WITH_METRIC : CHARACTER_QUERY;
  const allVariables = metric ? { ...variables, metric } : variables;
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables: allVariables }),
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
  zoneIDs?: number[],
  zoneNames?: Record<number, string>,
  metric?: WclMetric
): Promise<WclCharacterData | null> {
  try {
    const token = await getWclToken();

    // Single zone or no zone: original behavior
    const firstZoneID = zoneIDs?.[0];
    let baseCharacter: WclCharacterData | null = null;

    for (const endpoint of WCL_ENDPOINTS) {
      const result = await queryWcl(endpoint, token, { name: characterName, serverSlug, serverRegion, zoneID: firstZoneID }, metric);
      if (result) { baseCharacter = result; break; }
    }

    if (!baseCharacter) return null;

    // Fetch additional zones in parallel
    if (zoneIDs && zoneIDs.length > 1) {
      const additionalZoneIDs = zoneIDs.slice(1);
      const additionalResults = await Promise.all(
        additionalZoneIDs.map(async (zid) => {
          for (const endpoint of WCL_ENDPOINTS) {
            const r = await queryWcl(endpoint, token, { name: characterName, serverSlug, serverRegion, zoneID: zid }, metric);
            if (r?.zoneRankings) return { zoneID: zid, rankings: r.zoneRankings as ZoneRankings };
          }
          return null;
        })
      );

      const allZoneRankings: ZoneRankingsEntry[] = [];
      if (baseCharacter.zoneRankings) {
        allZoneRankings.push({
          zoneID: firstZoneID!,
          zoneName: zoneNames?.[firstZoneID!] ?? `Zone ${firstZoneID}`,
          rankings: baseCharacter.zoneRankings as ZoneRankings,
        });
      }
      for (const r of additionalResults) {
        if (r) {
          allZoneRankings.push({
            zoneID: r.zoneID,
            zoneName: zoneNames?.[r.zoneID] ?? `Zone ${r.zoneID}`,
            rankings: r.rankings,
          });
        }
      }
      if (allZoneRankings.length > 0) {
        baseCharacter.allZoneRankings = allZoneRankings;
      }
    }

    return baseCharacter;
  } catch {
    return null;
  }
}
