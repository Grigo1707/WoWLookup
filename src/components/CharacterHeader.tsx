"use client";

import { Shield, Star, TrendingUp } from "lucide-react";
import { CharacterSummary } from "@/lib/blizzard";
import { WclCharacterData } from "@/lib/warcraftlogs";
import { getParseColor } from "@/lib/utils";

const CLASS_COLORS: Record<string, string> = {
  "Death Knight": "#C41E3A",
  "Demon Hunter": "#A330C9",
  Druid: "#FF7C0A",
  Evoker: "#33937F",
  Hunter: "#AAD372",
  Mage: "#3FC7EB",
  Monk: "#00FF98",
  Paladin: "#F48CBA",
  Priest: "#FFFFFF",
  Rogue: "#FFF468",
  Shaman: "#0070DD",
  Warlock: "#8788EE",
  Warrior: "#C69B3A",
};

interface Props {
  summary: CharacterSummary;
  wclData: WclCharacterData | null;
}

export default function CharacterHeader({ summary, wclData }: Props) {
  const classColor = CLASS_COLORS[summary.character_class?.name] || "#ffffff";
  const zoneRankings = wclData?.zoneRankings;
  const bestPerf = zoneRankings?.bestPerformanceAverage;

  const overallScore = bestPerf !== undefined && bestPerf !== null ? Math.round(bestPerf) : null;
  const parseColor = overallScore !== null ? getParseColor(overallScore) : "#9d9d9d";

  return (
    <div className="bg-gray-900/80 backdrop-blur border border-amber-500/20 rounded-2xl p-6 shadow-2xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {/* Avatar */}
        <div
          className="w-16 h-16 rounded-xl border-2 flex-shrink-0 overflow-hidden"
          style={{ borderColor: classColor }}
        >
          {summary.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={summary.avatar} alt={summary.name} className="w-full h-full object-cover" />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-2xl font-bold"
              style={{ color: classColor, backgroundColor: `${classColor}15` }}
            >
              {summary.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold" style={{ color: classColor }}>
            {summary.name}
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {summary.character_class?.name}
            {summary.active_spec?.name && ` · ${summary.active_spec.name}`}
            {" · "}{summary.race?.name}
          </p>
          <div className="flex flex-wrap gap-3 mt-2">
            <span className="flex items-center gap-1 text-sm text-gray-300">
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              {summary.realm?.name} ({summary.faction?.name || "–"})
            </span>
            <span className="flex items-center gap-1 text-sm text-gray-300">
              <Star className="w-3.5 h-3.5 text-amber-400" />
              Level {summary.level}
            </span>
          </div>
        </div>

        {/* Item Level + Score */}
        <div className="flex gap-4 flex-shrink-0">
          <div className="text-center">
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Item Level</div>
            <div className="text-2xl font-bold text-amber-400">{summary.equipped_item_level || "–"}</div>
            {summary.average_item_level && (
              <div className="text-xs text-gray-500">⌀ {summary.average_item_level}</div>
            )}
          </div>

          {overallScore !== null && (
            <div className="text-center">
              <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">WCL Score</div>
              <div className="text-2xl font-bold flex items-center gap-1" style={{ color: parseColor }}>
                <TrendingUp className="w-5 h-5" />
                {overallScore}
              </div>
              <div className="text-xs" style={{ color: parseColor }}>Best Avg</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
