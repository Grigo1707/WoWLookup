import { NextRequest, NextResponse } from "next/server";
import {
  fetchCharacterSummary,
  fetchCharacterEquipment,
  fetchCharacterSpecializations,
} from "@/lib/blizzard";
import { fetchWclCharacterData } from "@/lib/warcraftlogs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const region = searchParams.get("region") || "eu";
  const realm = searchParams.get("realm") || "";
  const character = searchParams.get("character") || "";
  const namespace = searchParams.get("namespace") || "profile";

  if (!realm || !character) {
    return NextResponse.json({ error: "Missing realm or character" }, { status: 400 });
  }

  try {
    const [summary, equipment, specializations, wclData] = await Promise.allSettled([
      fetchCharacterSummary(region, realm, character, namespace),
      fetchCharacterEquipment(region, realm, character, namespace),
      fetchCharacterSpecializations(region, realm, character, namespace),
      fetchWclCharacterData(character, realm, region),
    ]);

    const result = {
      summary: summary.status === "fulfilled" ? summary.value : null,
      equipment: equipment.status === "fulfilled" ? equipment.value : null,
      specializations: specializations.status === "fulfilled" ? specializations.value : null,
      wclData: wclData.status === "fulfilled" ? wclData.value : null,
      errors: {
        summary: summary.status === "rejected" ? summary.reason?.message : null,
        equipment: equipment.status === "rejected" ? equipment.reason?.message : null,
        specializations: specializations.status === "rejected" ? specializations.reason?.message : null,
        wclData: wclData.status === "rejected" ? wclData.reason?.message : null,
      },
    };

    if (!result.summary && !result.equipment) {
      return NextResponse.json(
        { error: "Character not found. Please check the name, realm, and region." },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
