"use client";

import { useState } from "react";
import { TrendingUp, Award, Zap } from "lucide-react";
import { WclCharacterData, BossRanking, ZoneRankings, ZoneRankingsEntry, WclMetric } from "@/lib/warcraftlogs";
import { getParseColor, getParseLabel } from "@/lib/utils";

interface Props {
  wclData: WclCharacterData;
  realmType?: string;
  region?: string;
  realm?: string;
  character?: string;
}

const METRICS: { value: WclMetric; label: string }[] = [
  { value: "dps", label: "DPS" },
  { value: "hps", label: "HPS" },
  { value: "bossdps", label: "Boss-DPS" },
  { value: "tankhps", label: "Tank-HPS" },
];

function ParseBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.min(100, value)}%`, backgroundColor: color }}
      />
    </div>
  );
}

function BossRow({ ranking }: { ranking: BossRanking }) {
  const color = getParseColor(ranking.rankPercent);

  return (
    <div className="py-2.5 px-3 rounded-lg hover:bg-gray-800/50 transition-colors">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-gray-300 truncate flex-1 mr-2">{ranking.encounter?.name}</span>
        <div className="flex items-center gap-2 flex-shrink-0">
          {ranking.bestAmount > 0 && (
            <span className="text-xs text-gray-400">
              {Math.round(ranking.bestAmount).toLocaleString()}
            </span>
          )}
          <span
            className="text-sm font-bold w-10 text-right"
            style={{ color }}
          >
            {Math.round(ranking.rankPercent)}
          </span>
        </div>
      </div>
      <ParseBar value={ranking.rankPercent} color={color} />
      <div className="flex items-center gap-3 mt-1">
        <span className="text-xs" style={{ color }}>{getParseLabel(ranking.rankPercent)}</span>
        {ranking.totalKills > 0 && (
          <span className="text-xs text-gray-500">{ranking.totalKills} Kills</span>
        )}
        {ranking.spec && (
          <span className="text-xs text-gray-500">{ranking.spec}</span>
        )}
      </div>
    </div>
  );
}

function ZoneSection({ entry }: { entry: ZoneRankingsEntry }) {
  const { zoneName, rankings } = entry;
  const bestPerf = rankings.bestPerformanceAverage;
  const medianPerf = rankings.medianPerformanceAverage;
  const bestColor = bestPerf != null ? getParseColor(bestPerf) : "#9d9d9d";
  const medianColor = medianPerf != null ? getParseColor(medianPerf) : "#9d9d9d";
  const sortedRankings = [...(rankings.rankings || [])].sort(
    (a, b) => (b.rankPercent || 0) - (a.rankPercent || 0)
  );

  return (
    <div>
      <h3 className="text-xs text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
        {zoneName}
        <span className="flex gap-2 ml-auto">
          {bestPerf != null && (
            <span style={{ color: bestColor }} className="font-bold">
              ⌀ Best {Math.round(bestPerf)}
            </span>
          )}
          {medianPerf != null && (
            <span style={{ color: medianColor }} className="font-bold">
              ⌀ Median {Math.round(medianPerf)}
            </span>
          )}
        </span>
      </h3>
      {sortedRankings.length > 0 ? (
        <div className="space-y-0.5 mb-4">
          {sortedRankings.map((r, i) => (
            <BossRow key={i} ranking={r} />
          ))}
        </div>
      ) : (
        <p className="text-gray-600 text-xs italic mb-4 px-3">Keine Daten für diese Zone.</p>
      )}
    </div>
  );
}

function SingleZoneContent({ rankings }: { rankings: ZoneRankings }) {
  const bestPerf = rankings.bestPerformanceAverage;
  const medianPerf = rankings.medianPerformanceAverage;
  const bestColor = bestPerf != null ? getParseColor(bestPerf) : "#9d9d9d";
  const medianColor = medianPerf != null ? getParseColor(medianPerf) : "#9d9d9d";
  const sortedRankings = [...(rankings.rankings || [])].sort(
    (a, b) => (b.rankPercent || 0) - (a.rankPercent || 0)
  );

  return (
    <>
      <div className="grid grid-cols-2 gap-3 mb-4">
        {bestPerf != null && (
          <div className="bg-gray-800/60 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Award className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs text-gray-400 uppercase tracking-wider">Best Avg</span>
            </div>
            <div className="text-2xl font-bold" style={{ color: bestColor }}>{Math.round(bestPerf)}</div>
            <div className="text-xs mt-0.5" style={{ color: bestColor }}>{getParseLabel(bestPerf)}</div>
          </div>
        )}
        {medianPerf != null && (
          <div className="bg-gray-800/60 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Zap className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs text-gray-400 uppercase tracking-wider">Median Avg</span>
            </div>
            <div className="text-2xl font-bold" style={{ color: medianColor }}>{Math.round(medianPerf)}</div>
            <div className="text-xs mt-0.5" style={{ color: medianColor }}>{getParseLabel(medianPerf)}</div>
          </div>
        )}
      </div>
      {sortedRankings.length > 0 && (
        <div>
          <h3 className="text-xs text-gray-400 uppercase tracking-wider mb-2">Boss Rankings</h3>
          <div className="space-y-0.5">
            {sortedRankings.map((r, i) => (
              <BossRow key={i} ranking={r} />
            ))}
          </div>
        </div>
      )}
    </>
  );
}

export default function PerformancePanel({ wclData, realmType, region, realm, character }: Props) {
  const [metric, setMetric] = useState<WclMetric>("dps");
  const [displayData, setDisplayData] = useState<WclCharacterData>(wclData);
  const [loadingMetric, setLoadingMetric] = useState(false);

  const isFresh = realmType === "classic-tbc" || realmType === "classic-wotlk";
  const wclBase = isFresh ? "https://fresh.warcraftlogs.com" : "https://www.warcraftlogs.com";
  const wclCharUrl = region && realm && character
    ? `${wclBase}/character/${region}/${realm}/${character}`
    : `${wclBase}/character/${wclData.name}`;

  const handleMetricChange = async (newMetric: WclMetric) => {
    if (!region || !realm || !character) return;
    setMetric(newMetric);
    setLoadingMetric(true);
    try {
      const params = new URLSearchParams({ character, realm, region, metric: newMetric });
      const res = await fetch(`/api/wcl?${params}`);
      if (res.ok) {
        const data = await res.json();
        setDisplayData(data);
      }
    } finally {
      setLoadingMetric(false);
    }
  };

  const hasMultiZone = displayData.allZoneRankings && displayData.allZoneRankings.length > 0;
  const hasAnyData = hasMultiZone || !!displayData.zoneRankings;

  if (!hasAnyData) {
    return (
      <div className="bg-gray-900/80 backdrop-blur border border-amber-500/20 rounded-2xl p-5">
        <h2 className="text-amber-400 font-bold text-base uppercase tracking-wider mb-4">Performance</h2>
        <div className="text-center py-6">
          <p className="text-gray-500 text-sm">Keine Warcraft Logs Daten verfügbar.</p>
          <p className="text-gray-600 text-xs mt-1">Der Charakter wurde möglicherweise noch nicht geloggt.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/80 backdrop-blur border border-amber-500/20 rounded-2xl p-5 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-amber-400 font-bold text-base uppercase tracking-wider flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Performance
          {loadingMetric && <span className="text-xs text-gray-500 font-normal">(lädt...)</span>}
        </h2>
        <div className="flex items-center gap-3">
          {/* Metric selector */}
          {region && realm && character && (
            <div className="flex items-center gap-1">
              {METRICS.map((m) => (
                <button
                  key={m.value}
                  onClick={() => handleMetricChange(m.value)}
                  disabled={loadingMetric}
                  className={`text-xs px-2 py-1 rounded transition-colors ${
                    metric === m.value
                      ? "bg-amber-500/30 text-amber-300 border border-amber-500/50"
                      : "text-gray-500 hover:text-gray-300 border border-transparent"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          )}
          <a
            href={wclCharUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
          >
            Warcraft Logs ↗
          </a>
        </div>
      </div>

      {hasMultiZone ? (
        <div className="space-y-2">
          {displayData.allZoneRankings!.map((entry) => (
            <ZoneSection key={entry.zoneID} entry={entry} />
          ))}
        </div>
      ) : (
        <SingleZoneContent rankings={displayData.zoneRankings!} />
      )}
    </div>
  );
}
