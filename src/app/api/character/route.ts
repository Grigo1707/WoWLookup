import { NextRequest, NextResponse } from "next/server";
import {
  fetchCharacterSummary,
  fetchCharacterEquipment,
  fetchCharacterSpecializations,
} from "@/lib/blizzard";
import {
  fetchClassicArmoryCharacterSummary,
  fetchClassicArmoryEquipment,
  fetchClassicArmorySpecializations,
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
      // class_id is fetched after summary resolves – we'll handle below
      specializationsPromise = Promise.resolve(null);
    } else {
      summaryPromise = fetchCharacterSummary(region, realm, character, namespace);
      equipmentPromise = fetchCharacterEquipment(region, realm, character, namespace);
      specializationsPromise = fetchCharacterSpecializations(region, realm, character, namespace);
    }

    const [summary, equipment, specializations, wclData] = await Promise.allSettled([
      summaryPromise,
      equipmentPromise,
      specializationsPromise,
      fetchWclCharacterData(character, realm, region),
    ]);

    // For classic-armory, fetch talents now that we have the class_id from summary
    let finalSpecializations = specializations;
    if (useClassicArmory && summary.status === "fulfilled" && summary.value) {
      const classId = summary.value.character_class?.id || 0;
      if (classId > 0) {
        const talentsResult = await fetchClassicArmorySpecializations(region, realm, character, realmType, classId);
        finalSpecializations = { status: "fulfilled", value: talentsResult } as typeof finalSpecializations;
      }
    }

    const result = {
      summary: summary.status === "fulfilled" ? summary.value : null,
      equipment: equipment.status === "fulfilled" ? equipment.value : null,
      specializations: finalSpecializations.status === "fulfilled" ? finalSpecializations.value : null,
      wclData: wclData.status === "fulfilled" ? wclData.value : null,
      errors: {
        summary: summary.status === "rejected" ? summary.reason?.message : null,
        equipment: equipment.status === "rejected" ? equipment.reason?.message : null,
        specializations: finalSpecializations.status === "rejected" ? (finalSpecializations as PromiseRejectedResult).reason?.message : null,
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
