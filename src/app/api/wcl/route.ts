import { NextRequest, NextResponse } from "next/server";
import { fetchWclCharacterData, WclMetric } from "@/lib/warcraftlogs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const character = searchParams.get("character") || "";
  const realm = searchParams.get("realm") || "";
  const region = searchParams.get("region") || "eu";
  const metric = (searchParams.get("metric") || undefined) as WclMetric | undefined;
  const zoneID = searchParams.get("zoneID") ? Number(searchParams.get("zoneID")) : undefined;
  const zoneIDsParam = searchParams.get("zoneIDs");
  const zoneNamesParam = searchParams.get("zoneNames");

  if (!character || !realm) {
    return NextResponse.json({ error: "Missing character or realm" }, { status: 400 });
  }

  let zoneIDs: number[] | undefined;
  let zoneNamesMap: Record<number, string> | undefined;

  if (zoneIDsParam) {
    zoneIDs = zoneIDsParam.split(",").map(Number).filter(Boolean);
    if (zoneNamesParam) {
      zoneNamesMap = Object.fromEntries(
        zoneNamesParam.split(",").map((entry) => {
          const [id, ...nameParts] = entry.split(":");
          return [Number(id), nameParts.join(":")];
        })
      );
    }
  } else if (zoneID) {
    zoneIDs = [zoneID];
  }

  const data = await fetchWclCharacterData(character, realm, region, zoneIDs, zoneNamesMap, metric);
  if (!data) {
    return NextResponse.json({ error: "No WCL data found" }, { status: 404 });
  }
  return NextResponse.json(data);
}
