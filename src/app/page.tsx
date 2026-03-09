"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle, X, GitCompare } from "lucide-react";
import SearchForm from "@/components/SearchForm";
import CharacterHeader from "@/components/CharacterHeader";
import EquipmentPanel from "@/components/EquipmentPanel";
import TalentsPanel from "@/components/TalentsPanel";
import PerformancePanel from "@/components/PerformancePanel";
import OverallScore from "@/components/OverallScore";
import RecentCharacters, {
  RecentCharacter,
  loadRecentCharacters,
  saveRecentCharacter,
  removeRecentCharacter,
  clearRecentCharacters,
} from "@/components/RecentCharacters";

interface CharacterData {
  summary: import("@/lib/blizzard").CharacterSummary | null;
  equipment: import("@/lib/blizzard").CharacterEquipment | null;
  specializations: import("@/lib/blizzard").CharacterSpecializations | null;
  talentTree: import("@/lib/classicarmory").TBCTalentTree | null;
  wclData: import("@/lib/warcraftlogs").WclCharacterData | null;
  errors: Record<string, string | null>;
}

const WOWHEAD_DOMAINS: Record<string, string> = {
  "classic-tbc": "tbc",
  "classic-wotlk": "wotlk",
  "classic-era": "classic",
  "classic-cata": "cata",
  "classic-mop": "mop",
};

function getErrorMessage(errorText: string, realmType: string): string {
  const lower = errorText.toLowerCase();
  if (lower.includes("404") || lower.includes("not found") || lower.includes("character not found")) {
    if (realmType === "classic-tbc" || realmType === "classic-wotlk") {
      return "Charakter nicht gefunden. TBC/WotLK Anniversary Realms haben bekannte API-Einschränkungen – prüfe Name, Server und Region.";
    }
    return "Charakter nicht gefunden. Bitte prüfe Name, Server und Region.";
  }
  if (lower.includes("rate limit") || lower.includes("429")) {
    return "API Rate Limit erreicht. Bitte warte kurz und versuche es erneut.";
  }
  if (lower.includes("network") || lower.includes("fetch")) {
    return "Netzwerkfehler. Bitte prüfe deine Verbindung und versuche es erneut.";
  }
  return errorText;
}

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 6000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-red-900/90 border border-red-500/50 rounded-xl px-4 py-3 flex items-start gap-3 shadow-2xl max-w-md">
        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
        <p className="text-red-200 text-sm flex-1">{message}</p>
        <button onClick={onClose} className="text-red-400 hover:text-red-200">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CharacterData | null>(null);
  const [realmType, setRealmType] = useState<string>("");
  const [lastSearch, setLastSearch] = useState<{ region: string; realm: string; character: string } | null>(null);
  const [recentChars, setRecentChars] = useState<RecentCharacter[]>([]);

  // Load recent characters from localStorage on mount
  useEffect(() => {
    setRecentChars(loadRecentCharacters());
  }, []);

  const wowheadDomain = WOWHEAD_DOMAINS[realmType] || "";

  const doSearch = useCallback(async (
    region: string,
    realmName: string,
    realmSlug: string,
    namespace: string,
    character: string,
    selectedRealmType: string
  ) => {
    setLoading(true);
    setError(null);
    setData(null);
    setRealmType(selectedRealmType);
    setLastSearch({ region, realm: realmSlug, character });

    // Update URL for sharing/deep linking
    const params = new URLSearchParams({ region, realm: realmSlug, namespace, character, realmType: selectedRealmType });
    router.push(`?${params.toString()}`, { scroll: false });

    try {
      const res = await fetch(`/api/character?${params}`);
      const json = await res.json();

      if (!res.ok) {
        const rawError = json.error || "Fehler beim Laden des Charakters.";
        setError(getErrorMessage(rawError, selectedRealmType));
        return;
      }

      setData(json);

      // Save to recent characters
      const entry: Omit<RecentCharacter, "timestamp"> = {
        region,
        realm: realmName,
        realmSlug,
        namespace,
        character,
        realmType: selectedRealmType,
        characterClass: json.summary?.character_class?.name,
        level: json.summary?.level,
      };
      saveRecentCharacter(entry);
      setRecentChars(loadRecentCharacters());
    } catch {
      setError("Netzwerkfehler. Bitte versuche es erneut.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Auto-search from URL params on initial load
  const [autoSearched, setAutoSearched] = useState(false);
  useEffect(() => {
    if (autoSearched) return;
    const region = searchParams.get("region");
    const realmSlug = searchParams.get("realm");
    const namespace = searchParams.get("namespace");
    const character = searchParams.get("character");
    const urlRealmType = searchParams.get("realmType");

    if (region && realmSlug && namespace && character && urlRealmType) {
      setAutoSearched(true);
      doSearch(region, realmSlug, realmSlug, namespace, character, urlRealmType);
    } else {
      setAutoSearched(true);
    }
  }, [searchParams, doSearch, autoSearched]);

  const handleRecentSelect = (char: RecentCharacter) => {
    doSearch(char.region, char.realm, char.realmSlug, char.namespace, char.character, char.realmType);
  };

  const handleRecentRemove = (char: RecentCharacter) => {
    removeRecentCharacter(char);
    setRecentChars(loadRecentCharacters());
  };

  const handleClearAll = () => {
    clearRecentCharacters();
    setRecentChars([]);
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
          <Link href="/compare" className="inline-flex items-center gap-1.5 mt-3 text-xs text-gray-500 hover:text-amber-400 transition-colors">
            <GitCompare className="w-3.5 h-3.5" /> Charaktere vergleichen
          </Link>
        </header>

        {/* Search */}
        <SearchForm onSearch={doSearch} loading={loading} />

        {/* Recently viewed */}
        <RecentCharacters
          characters={recentChars}
          onSelect={handleRecentSelect}
          onRemove={handleRecentRemove}
          onClearAll={handleClearAll}
        />

        {/* Results */}
        {data && data.summary && (
          <div className="mt-8 space-y-4">
            <CharacterHeader summary={data.summary} wclData={data.wclData} />
            <OverallScore summary={data.summary} wclData={data.wclData} realmType={realmType} equipment={data.equipment} />

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
              <PerformancePanel
                wclData={data.wclData}
                realmType={realmType}
                region={lastSearch?.region}
                realm={lastSearch?.realm}
                character={lastSearch?.character}
              />
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

      {/* Toast error notification */}
      {error && <Toast message={error} onClose={() => setError(null)} />}
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-amber-400 text-xl">Laden...</div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
