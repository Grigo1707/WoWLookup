import { NextRequest, NextResponse } from "next/server";
import { fetchWclCharacterData, WclMetric } from "@/lib/warcraftlogs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const character = searchParams.get("character") || "";
  const realm = searchParams.get("realm") || "";
  const region = searchParams.get("region") || "eu";
  const metric = (searchParams.get("metric") || undefined) as WclMetric | undefined;
  const zoneID = searchParams.get("zoneID") ? Number(searchParams.get("zoneID")) : undefined;

  if (!character || !realm) {
    return NextResponse.json({ error: "Missing character or realm" }, { status: 400 });
  }

  const data = await fetchWclCharacterData(character, realm, region, zoneID ? [zoneID] : undefined, undefined, metric);
  if (!data) {
    return NextResponse.json({ error: "No WCL data found" }, { status: 404 });
  }
  return NextResponse.json(data);
}
