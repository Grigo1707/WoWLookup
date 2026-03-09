"use client";

import { useState } from "react";
import { AlertCircle } from "lucide-react";
import SearchForm from "@/components/SearchForm";
import CharacterHeader from "@/components/CharacterHeader";
import EquipmentPanel from "@/components/EquipmentPanel";
import TalentsPanel from "@/components/TalentsPanel";
import PerformancePanel from "@/components/PerformancePanel";
import OverallScore from "@/components/OverallScore";

interface CharacterData {
  summary: import("@/lib/blizzard").CharacterSummary | null;
  equipment: import("@/lib/blizzard").CharacterEquipment | null;
  specializations: import("@/lib/blizzard").CharacterSpecializations | null;
  talentTree: import("@/lib/classicarmory").TBCTalentTree | null;
  wclData: import("@/lib/warcraftlogs").WclCharacterData | null;
  errors: Record<string, string | null>;
}

export default function HomePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CharacterData | null>(null);
  const [realmType, setRealmType] = useState<string>("");

  const WOWHEAD_DOMAINS: Record<string, string> = {
    "classic-tbc": "tbc",
    "classic-wotlk": "wotlk",
    "classic-era": "classic",
    "classic-cata": "cata",
    "classic-mop": "mop",
  };
  const wowheadDomain = WOWHEAD_DOMAINS[realmType] || "";

  const handleSearch = async (
    region: string,
    _realmName: string,
    realmSlug: string,
    namespace: string,
    character: string,
    selectedRealmType: string
  ) => {
    setLoading(true);
    setError(null);
    setData(null);
    setRealmType(selectedRealmType);

    try {
      const params = new URLSearchParams({ region, realm: realmSlug, namespace, character, realmType: selectedRealmType });
      const res = await fetch(`/api/character?${params}`);
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Fehler beim Laden des Charakters.");
        return;
      }

      setData(json);
    } catch {
      setError("Netzwerkfehler. Bitte versuche es erneut.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-amber-500/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-blue-500/5 blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <header className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
              <span className="text-amber-400 text-xl">⚔</span>
            </div>
            <h1 className="text-4xl font-black tracking-tight">
              <span className="text-amber-400">Wow</span>
              <span className="text-white">Lookup</span>
            </h1>
          </div>
          <p className="text-gray-400 text-sm max-w-md mx-auto">
            Auf einen Blick Ausrüstung, Talente und Performance-Wertung von World of Warcraft Charakteren prüfen.
          </p>
        </header>

        {/* Search */}
        <SearchForm onSearch={handleSearch} loading={loading} />

        {/* Error */}
        {error && (
          <div className="mt-6 max-w-2xl mx-auto bg-red-900/20 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}


        {/* Results */}
        {data && data.summary && (
          <div className="mt-8 space-y-4">
            <CharacterHeader summary={data.summary} wclData={data.wclData} />
            <OverallScore summary={data.summary} wclData={data.wclData} realmType={realmType} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {data.equipment && <EquipmentPanel equipment={data.equipment} wowheadDomain={wowheadDomain} />}
              {(data.specializations || data.talentTree) ? (
                <TalentsPanel specializations={data.specializations} talentTree={data.talentTree ?? null} wowheadDomain={wowheadDomain} />
              ) : (
                <div className="bg-gray-900/80 backdrop-blur border border-amber-500/20 rounded-2xl p-5">
                  <h2 className="text-amber-400 font-bold text-base uppercase tracking-wider mb-4">Talente</h2>
                  <p className="text-gray-500 text-sm italic">Keine Talent-Daten verfügbar.</p>
                </div>
              )}
            </div>

            {data.wclData ? (
              <PerformancePanel wclData={data.wclData} />
            ) : (
              <div className="bg-gray-900/80 backdrop-blur border border-amber-500/20 rounded-2xl p-5">
                <h2 className="text-amber-400 font-bold text-base uppercase tracking-wider mb-2">Performance</h2>
                <p className="text-gray-500 text-sm italic">
                  Keine Warcraft Logs Daten gefunden. Der Charakter wurde möglicherweise noch nicht auf{" "}
                  <a href="https://www.warcraftlogs.com" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:underline">
                    warcraftlogs.com
                  </a>{" "}
                  geloggt.
                </p>
              </div>
            )}

            {Object.entries(data.errors).some(([, v]) => v !== null) && (
              <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-3">
                <p className="text-yellow-400 text-xs font-medium mb-1">Hinweise:</p>
                {Object.entries(data.errors).map(([key, msg]) =>
                  msg ? (
                    <p key={key} className="text-yellow-300/70 text-xs">• {key}: {msg}</p>
                  ) : null
                )}
              </div>
            )}
          </div>
        )}

        {!data && !loading && !error && (
          <div className="mt-16 text-center">
            <div className="text-6xl mb-4 opacity-10">⚔</div>
            <p className="text-gray-600 text-sm">Suche nach einem Charakter um zu beginnen</p>
          </div>
        )}
      </div>
    </div>
  );
}
