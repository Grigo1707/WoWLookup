"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, GitCompare } from "lucide-react";
import { SearchForm as CompareSearchForm } from "@/components/CompareSearchForm";
import { getItemQualityColor, getParseColor, getParseLabel } from "@/lib/utils";
import type { CharacterSummary, CharacterEquipment } from "@/lib/blizzard";
import type { WclCharacterData } from "@/lib/warcraftlogs";

interface CharData {
  summary: CharacterSummary | null;
  equipment: CharacterEquipment | null;
  wclData: WclCharacterData | null;
}

const CLASS_COLORS: Record<string, string> = {
  "Death Knight": "#C41E3A", "Demon Hunter": "#A330C9", "Druid": "#FF7C0A",
  "Evoker": "#33937F", "Hunter": "#AAD372", "Mage": "#3FC7EB",
  "Monk": "#00FF98", "Paladin": "#F48CBA", "Priest": "#FFFFFF",
  "Rogue": "#FFF468", "Shaman": "#0070DD", "Warlock": "#8788EE", "Warrior": "#C69B3A",
};

function Delta({ a, b, higherIsBetter = true }: { a: number | null; b: number | null; higherIsBetter?: boolean }) {
  if (a === null || b === null) return null;
  const diff = a - b;
  if (diff === 0) return <span className="text-gray-500 text-xs">–</span>;
  const positive = higherIsBetter ? diff > 0 : diff < 0;
  return (
    <span className={`text-xs font-bold ${positive ? "text-green-400" : "text-red-400"}`}>
      {diff > 0 ? "+" : ""}{diff}
    </span>
  );
}

function StatRow({ label, valA, valB, unit = "", higherIsBetter = true }: {
  label: string; valA: number | null; valB: number | null; unit?: string; higherIsBetter?: boolean;
}) {
  const diff = valA !== null && valB !== null ? valA - valB : 0;
  const aWins = higherIsBetter ? diff > 0 : diff < 0;
  const bWins = higherIsBetter ? diff < 0 : diff > 0;

  return (
    <div className="flex items-center py-2 border-b border-gray-800/50 last:border-0">
      <div className={`flex-1 text-right text-sm font-medium ${aWins ? "text-white" : "text-gray-400"}`}>
        {valA !== null ? `${valA}${unit}` : "–"}
        {aWins && <span className="ml-1 text-green-400 text-xs">▶</span>}
      </div>
      <div className="w-32 text-center text-xs text-gray-500 uppercase tracking-wider px-2">{label}</div>
      <div className={`flex-1 text-left text-sm font-medium ${bWins ? "text-white" : "text-gray-400"}`}>
        {bWins && <span className="mr-1 text-green-400 text-xs">◀</span>}
        {valB !== null ? `${valB}${unit}` : "–"}
      </div>
    </div>
  );
}

function CharSummaryCard({ data, side }: { data: CharData | null; side: "left" | "right" }) {
  if (!data?.summary) return (
    <div className="flex-1 bg-gray-900/60 border border-gray-700/50 rounded-xl p-4 text-center text-gray-600 text-sm italic">
      Kein Charakter
    </div>
  );

  const { summary, equipment, wclData } = data;
  const classColor = CLASS_COLORS[summary.character_class?.name] ?? "#9d9d9d";
  const ilvl = summary.equipped_item_level || 0;

  let parseScore: number | null = null;
  if (wclData?.allZoneRankings && wclData.allZoneRankings.length > 0) {
    const vals = wclData.allZoneRankings.map((z) => z.rankings.bestPerformanceAverage).filter((v): v is number => v != null);
    if (vals.length > 0) parseScore = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  } else if (wclData?.zoneRankings?.bestPerformanceAverage != null) {
    parseScore = Math.round(wclData.zoneRankings.bestPerformanceAverage);
  }

  const avgIlvlEquip = equipment?.equipped_items?.filter((i) => i.level?.value) ?? [];
  const avgIlvl = avgIlvlEquip.length > 0
    ? Math.round(avgIlvlEquip.reduce((s, i) => s + i.level.value, 0) / avgIlvlEquip.length)
    : 0;

  return (
    <div className={`flex-1 bg-gray-900/80 border border-gray-700/50 rounded-xl p-4 ${side === "right" ? "text-right" : ""}`}>
      <div className="font-bold text-lg" style={{ color: classColor }}>{summary.name}</div>
      <div className="text-gray-400 text-sm">{summary.character_class?.name} – {summary.active_spec?.name}</div>
      <div className="text-gray-500 text-xs mt-1">{summary.realm?.name} · Lvl {summary.level}</div>
      <div className="mt-3 space-y-1">
        <div className="text-xs text-gray-500">iLvl Ausgerüstet: <span className="text-white font-medium">{ilvl}</span></div>
        <div className="text-xs text-gray-500">⌀ iLvl: <span className="text-white font-medium">{avgIlvl}</span></div>
        {parseScore !== null && (
          <div className="text-xs text-gray-500">WCL: <span className="font-bold" style={{ color: getParseColor(parseScore) }}>{parseScore} ({getParseLabel(parseScore)})</span></div>
        )}
      </div>
    </div>
  );
}

function ComparePanel({ dataA, dataB }: { dataA: CharData | null; dataB: CharData | null }) {
  const summA = dataA?.summary;
  const summB = dataB?.summary;

  const ilvlA = summA?.equipped_item_level ?? null;
  const ilvlB = summB?.equipped_item_level ?? null;
  const levelA = summA?.level ?? null;
  const levelB = summB?.level ?? null;
  const achA = summA?.achievement_points ?? null;
  const achB = summB?.achievement_points ?? null;

  const parseScore = (d: CharData | null): number | null => {
    if (!d?.wclData) return null;
    if (d.wclData.allZoneRankings && d.wclData.allZoneRankings.length > 0) {
      const vals = d.wclData.allZoneRankings.map((z) => z.rankings.bestPerformanceAverage).filter((v): v is number => v != null);
      return vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
    }
    return d.wclData.zoneRankings?.bestPerformanceAverage != null ? Math.round(d.wclData.zoneRankings.bestPerformanceAverage) : null;
  };

  const avgIlvl = (d: CharData | null): number | null => {
    const items = d?.equipment?.equipped_items?.filter((i) => i.level?.value) ?? [];
    return items.length > 0 ? Math.round(items.reduce((s, i) => s + i.level.value, 0) / items.length) : null;
  };

  return (
    <div className="bg-gray-900/80 border border-amber-500/20 rounded-2xl p-5 mt-4">
      <h3 className="text-amber-400 font-bold text-sm uppercase tracking-wider mb-3">Direktvergleich</h3>
      <StatRow label="Level" valA={levelA} valB={levelB} />
      <StatRow label="iLvl equip." valA={ilvlA} valB={ilvlB} />
      <StatRow label="⌀ iLvl" valA={avgIlvl(dataA)} valB={avgIlvl(dataB)} />
      <StatRow label="WCL Parse" valA={parseScore(dataA)} valB={parseScore(dataB)} />
      <StatRow label="Achievements" valA={achA} valB={achB} />
    </div>
  );
}

async function fetchCharacter(region: string, realmSlug: string, namespace: string, character: string, realmType: string): Promise<CharData> {
  const params = new URLSearchParams({ region, realm: realmSlug, namespace, character, realmType });
  const res = await fetch(`/api/character?${params}`);
  if (!res.ok) throw new Error("Charakter nicht gefunden");
  return res.json();
}

function CompareContent() {
  const [dataA, setDataA] = useState<CharData | null>(null);
  const [dataB, setDataB] = useState<CharData | null>(null);
  const [loadingA, setLoadingA] = useState(false);
  const [loadingB, setLoadingB] = useState(false);
  const [errorA, setErrorA] = useState<string | null>(null);
  const [errorB, setErrorB] = useState<string | null>(null);

  const handleSearchA = async (region: string, _realm: string, realmSlug: string, namespace: string, character: string, realmType: string) => {
    setLoadingA(true); setErrorA(null);
    try { setDataA(await fetchCharacter(region, realmSlug, namespace, character, realmType)); }
    catch (e) { setErrorA(e instanceof Error ? e.message : "Fehler"); }
    finally { setLoadingA(false); }
  };

  const handleSearchB = async (region: string, _realm: string, realmSlug: string, namespace: string, character: string, realmType: string) => {
    setLoadingB(true); setErrorB(null);
    try { setDataB(await fetchCharacter(region, realmSlug, namespace, character, realmType)); }
    catch (e) { setErrorB(e instanceof Error ? e.message : "Fehler"); }
    finally { setLoadingB(false); }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-amber-500/5 blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/" className="text-gray-500 hover:text-amber-400 transition-colors flex items-center gap-1.5 text-sm">
            <ArrowLeft className="w-4 h-4" /> Zurück
          </Link>
          <div className="flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-amber-400" />
            <h1 className="text-2xl font-black">
              <span className="text-amber-400">Char</span>
              <span className="text-white">Vergleich</span>
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Charakter A */}
          <div>
            <p className="text-xs text-amber-400 uppercase tracking-wider mb-2 font-bold">Charakter A</p>
            <CompareSearchForm onSearch={handleSearchA} loading={loadingA} />
            {errorA && <p className="text-red-400 text-sm mt-2">{errorA}</p>}
            <div className="mt-3">
              <CharSummaryCard data={dataA} side="left" />
            </div>
          </div>

          {/* Charakter B */}
          <div>
            <p className="text-xs text-amber-400 uppercase tracking-wider mb-2 font-bold">Charakter B</p>
            <CompareSearchForm onSearch={handleSearchB} loading={loadingB} />
            {errorB && <p className="text-red-400 text-sm mt-2">{errorB}</p>}
            <div className="mt-3">
              <CharSummaryCard data={dataB} side="right" />
            </div>
          </div>
        </div>

        {(dataA || dataB) && <ComparePanel dataA={dataA} dataB={dataB} />}
      </div>
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense>
      <CompareContent />
    </Suspense>
  );
}
