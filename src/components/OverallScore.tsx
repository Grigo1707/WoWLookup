"use client";

import { CharacterSummary, CharacterEquipment } from "@/lib/blizzard";
import { WclCharacterData } from "@/lib/warcraftlogs";
import { getParseColor, getParseLabel, calculateGearscore } from "@/lib/utils";

interface Props {
  summary: CharacterSummary;
  wclData: WclCharacterData | null;
  realmType?: string;
  equipment?: CharacterEquipment | null;
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

const ILVL_RANGES: Record<string, [number, number]> = {
  retail:        [400, 700],
  "classic-era": [1,   90],
  "classic-tbc": [85,  120],
  "classic-wotlk":[187, 277],
  "classic-cata": [277, 410],
  "classic-mop":  [450, 553],
};

function getIlvlScore(ilvl: number, realmType: string): number {
  const [min, max] = ILVL_RANGES[realmType] ?? ILVL_RANGES["retail"];
  return Math.min(100, Math.max(0, Math.round(((ilvl - min) / (max - min)) * 100)));
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

export default function OverallScore({ summary, wclData, realmType = "retail", equipment }: Props) {
  const ilvl = summary.equipped_item_level || 0;
  const ilvlScore = getIlvlScore(ilvl, realmType || "retail");
  const gearscore = equipment ? calculateGearscore(equipment) : null;

  // Use average across all zones if available, otherwise fall back to single zone
  let bestPerf: number | null | undefined;
  if (wclData?.allZoneRankings && wclData.allZoneRankings.length > 0) {
    const values = wclData.allZoneRankings
      .map((z) => z.rankings.bestPerformanceAverage)
      .filter((v): v is number => v !== null && v !== undefined);
    bestPerf = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : null;
  } else {
    bestPerf = wclData?.zoneRankings?.bestPerformanceAverage;
  }
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

      {gearscore && (gearscore.missingEnchants.length > 0 || gearscore.missingGems.length > 0) && (
        <div className="mt-3 p-3 bg-red-900/10 border border-red-500/20 rounded-lg">
          <p className="text-xs text-red-400 font-medium mb-1">Ausrüstungs-Warnungen</p>
          {gearscore.missingEnchants.length > 0 && (
            <p className="text-xs text-red-300/70">
              ⚠ {gearscore.missingEnchants.length} Slot{gearscore.missingEnchants.length > 1 ? "s" : ""} ohne Enchant
            </p>
          )}
          {gearscore.missingGems.length > 0 && (
            <p className="text-xs text-red-300/70">
              ⚠ {gearscore.missingGems.length} Slot{gearscore.missingGems.length > 1 ? "s" : ""} mit leeren Fassungen
            </p>
          )}
        </div>
      )}
    </div>
  );
}
