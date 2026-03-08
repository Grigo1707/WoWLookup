"use client";

import { TrendingUp, Award, Zap } from "lucide-react";
import { WclCharacterData, BossRanking } from "@/lib/warcraftlogs";
import { getParseColor, getParseLabel } from "@/lib/utils";

interface Props {
  wclData: WclCharacterData;
}

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

export default function PerformancePanel({ wclData }: Props) {
  const rankings = wclData.zoneRankings;

  if (!rankings) {
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

  const bestPerf = rankings.bestPerformanceAvg;
  const medianPerf = rankings.medianPerformanceAvg;
  const bestColor = bestPerf !== null && bestPerf !== undefined ? getParseColor(bestPerf) : "#9d9d9d";
  const medianColor = medianPerf !== null && medianPerf !== undefined ? getParseColor(medianPerf) : "#9d9d9d";

  const sortedRankings = [...(rankings.rankings || [])].sort(
    (a, b) => (b.rankPercent || 0) - (a.rankPercent || 0)
  );

  return (
    <div className="bg-gray-900/80 backdrop-blur border border-amber-500/20 rounded-2xl p-5 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-amber-400 font-bold text-base uppercase tracking-wider flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Performance
        </h2>
        <a
          href={`https://www.warcraftlogs.com/character/${wclData.name}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
        >
          Warcraft Logs ↗
        </a>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {bestPerf !== null && bestPerf !== undefined && (
          <div className="bg-gray-800/60 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Award className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs text-gray-400 uppercase tracking-wider">Best Avg</span>
            </div>
            <div className="text-2xl font-bold" style={{ color: bestColor }}>
              {Math.round(bestPerf)}
            </div>
            <div className="text-xs mt-0.5" style={{ color: bestColor }}>
              {getParseLabel(bestPerf)}
            </div>
          </div>
        )}
        {medianPerf !== null && medianPerf !== undefined && (
          <div className="bg-gray-800/60 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Zap className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs text-gray-400 uppercase tracking-wider">Median Avg</span>
            </div>
            <div className="text-2xl font-bold" style={{ color: medianColor }}>
              {Math.round(medianPerf)}
            </div>
            <div className="text-xs mt-0.5" style={{ color: medianColor }}>
              {getParseLabel(medianPerf)}
            </div>
          </div>
        )}
      </div>

      {/* Boss Rankings */}
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
    </div>
  );
}
