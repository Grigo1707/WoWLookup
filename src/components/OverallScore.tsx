"use client";

import { CharacterSummary } from "@/lib/blizzard";
import { WclCharacterData } from "@/lib/warcraftlogs";
import { getParseColor, getParseLabel } from "@/lib/utils";

interface Props {
  summary: CharacterSummary;
  wclData: WclCharacterData | null;
}

function ScoreRing({ score, maxScore = 100, color }: { score: number; maxScore?: number; color: string }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(1, score / maxScore);
  const offset = circumference * (1 - progress);

  return (
    <svg width="90" height="90" className="transform -rotate-90">
      <circle cx="45" cy="45" r={radius} fill="none" stroke="#1f2937" strokeWidth="8" />
      <circle
        cx="45"
        cy="45"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 1s ease" }}
      />
    </svg>
  );
}

function RatingCard({
  label,
  value,
  color,
  maxValue = 100,
  unit = "",
  description,
}: {
  label: string;
  value: number | null;
  color: string;
  maxValue?: number;
  unit?: string;
  description?: string;
}) {
  return (
    <div className="bg-gray-800/60 rounded-xl p-4 text-center flex flex-col items-center">
      <div className="relative mb-2">
        <ScoreRing score={value ?? 0} maxScore={maxValue} color={value !== null ? color : "#374151"} />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold" style={{ color: value !== null ? color : "#4b5563" }}>
            {value !== null ? `${value}${unit}` : "–"}
          </span>
        </div>
      </div>
      <div className="text-sm font-medium text-gray-300">{label}</div>
      {description && <div className="text-xs text-gray-500 mt-0.5">{description}</div>}
    </div>
  );
}

function getIlvlScore(ilvl: number, isRetail: boolean): number {
  if (isRetail) {
    const min = 400;
    const max = 700;
    return Math.min(100, Math.max(0, Math.round(((ilvl - min) / (max - min)) * 100)));
  } else {
    const min = 50;
    const max = 300;
    return Math.min(100, Math.max(0, Math.round(((ilvl - min) / (max - min)) * 100)));
  }
}

function getOverallRating(ilvlScore: number, parseScore: number | null): { score: number; label: string; color: string } {
  const wclWeight = 0.6;
  const ilvlWeight = 0.4;

  let combined: number;
  if (parseScore !== null) {
    combined = Math.round(parseScore * wclWeight + ilvlScore * ilvlWeight);
  } else {
    combined = ilvlScore;
  }

  return {
    score: combined,
    label: getParseLabel(combined),
    color: getParseColor(combined),
  };
}

export default function OverallScore({ summary, wclData }: Props) {
  const ilvl = summary.equipped_item_level || 0;
  const isRetail = !summary.realm?.slug?.includes("classic");
  const ilvlScore = getIlvlScore(ilvl, isRetail);

  const bestPerf = wclData?.zoneRankings?.bestPerformanceAverage;
  const parseScore = bestPerf !== undefined && bestPerf !== null ? Math.round(bestPerf) : null;
  const parseColor = parseScore !== null ? getParseColor(parseScore) : "#9d9d9d";

  const overall = getOverallRating(ilvlScore, parseScore);

  return (
    <div className="bg-gray-900/80 backdrop-blur border border-amber-500/20 rounded-2xl p-5 shadow-xl">
      <h2 className="text-amber-400 font-bold text-base uppercase tracking-wider mb-4">Gesamtbewertung</h2>

      <div className="grid grid-cols-3 gap-3">
        <RatingCard
          label="Gesamtscore"
          value={overall.score}
          color={overall.color}
          description={overall.label}
        />
        <RatingCard
          label="Item Level"
          value={ilvlScore}
          color={getParseColor(ilvlScore)}
          description={`${ilvl} iLvl`}
        />
        <RatingCard
          label="WCL Perf."
          value={parseScore}
          color={parseColor}
          description={parseScore !== null ? getParseLabel(parseScore) : "Keine Daten"}
        />
      </div>

      <div className="mt-4 p-3 bg-gray-800/40 rounded-lg">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: overall.color }}
          />
          <p className="text-sm text-gray-300">
            <span className="font-semibold" style={{ color: overall.color }}>
              {summary.name}
            </span>{" "}
            ist ein{" "}
            <span className="font-semibold" style={{ color: overall.color }}>
              {overall.label}
            </span>{" "}
            Charakter
            {parseScore !== null
              ? ` mit ${parseScore}er Parse-Wertung und ${ilvl} Item Level.`
              : ` mit ${ilvl} Item Level (keine Log-Daten).`}
          </p>
        </div>
      </div>
    </div>
  );
}
