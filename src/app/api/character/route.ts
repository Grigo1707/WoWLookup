import { NextRequest, NextResponse } from "next/server";
import {
  fetchCharacterSummary,
  fetchCharacterEquipment,
  fetchCharacterSpecializations,
} from "@/lib/blizzard";
import {
  fetchClassicArmoryCharacterSummary,
  fetchClassicArmoryEquipment,
  fetchClassicArmoryTalentTree,
} from "@/lib/classicarmory";
import { fetchWclCharacterData } from "@/lib/warcraftlogs";

const CLASSIC_ARMORY_REALM_TYPES = new Set(["classic-tbc", "classic-wotlk", "classic-cata"]);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const region = searchParams.get("region") || "eu";
  const realm = searchParams.get("realm") || "";
  const character = searchParams.get("character") || "";
  const namespace = searchParams.get("namespace") || "profile";
  const realmType = searchParams.get("realmType") || "";

  if (!realm || !character) {
    return NextResponse.json({ error: "Missing realm or character" }, { status: 400 });
  }

  const useClassicArmory = CLASSIC_ARMORY_REALM_TYPES.has(realmType);

  try {
    let summaryPromise, equipmentPromise, specializationsPromise;

    if (useClassicArmory) {
      summaryPromise = fetchClassicArmoryCharacterSummary(region, realm, character, realmType);
      equipmentPromise = fetchClassicArmoryEquipment(region, realm, character, realmType);
      specializationsPromise = Promise.resolve(null);
    } else {
      summaryPromise = fetchCharacterSummary(region, realm, character, namespace);
      equipmentPromise = fetchCharacterEquipment(region, realm, character, namespace);
      specializationsPromise = fetchCharacterSpecializations(region, realm, character, namespace);
    }

    const WCL_ZONES: Record<string, { ids: number[]; names: Record<number, string> }> = {
      "classic-tbc": {
        ids: [1047, 1048],
        names: { 1047: "Karazhan", 1048: "Gruul & Magtheridon" },
      },
    };
    const wclZoneConfig = WCL_ZONES[realmType];

    const [summary, equipment, specializations, wclData] = await Promise.allSettled([
      summaryPromise,
      equipmentPromise,
      specializationsPromise,
      fetchWclCharacterData(character, realm, region, wclZoneConfig?.ids, wclZoneConfig?.names),
    ]);

    // For classic-armory, fetch the full talent tree using the class_id from summary
    let talentTree = null;
    if (useClassicArmory && summary.status === "fulfilled" && summary.value) {
      const classId = summary.value.character_class?.id || 0;
      if (classId > 0) {
        talentTree = await fetchClassicArmoryTalentTree(region, realm, character, realmType, classId);
      }
    }

    const result = {
      summary: summary.status === "fulfilled" ? summary.value : null,
      equipment: equipment.status === "fulfilled" ? equipment.value : null,
      specializations: specializations.status === "fulfilled" ? specializations.value : null,
      talentTree,
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
        {
          error: "Character not found. Please check the name, realm, and region.",
          details: result.errors,
        },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
