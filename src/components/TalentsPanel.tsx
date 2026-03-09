"use client";

import { CharacterSpecializations } from "@/lib/blizzard";
import { TBCTalentTree, TBCTalentNode } from "@/lib/classicarmory";

// Tree background gradients matching the classic WoW themes
const TREE_BACKGROUNDS: Record<number, string> = {
  0: "radial-gradient(ellipse at top, #1a0a3a 0%, #0d0720 60%, #080410 100%)", // Elemental – purple
  1: "radial-gradient(ellipse at top, #2a1800 0%, #1a0f00 60%, #0d0800 100%)", // Enhancement – brown
  2: "radial-gradient(ellipse at top, #001a08 0%, #000f05 60%, #000802 100%)", // Restoration – green
};

const TREE_ACCENT: Record<number, string> = {
  0: "#6b3fa0",
  1: "#8b5e1a",
  2: "#2d7a3a",
};

const COLS = 4;
const ROWS = 9;

function TalentIcon({ node }: { node: TBCTalentNode | null; }) {
  if (!node) {
    return <div className="w-10 h-10" />;
  }

  const invested = node.currentRank > 0;

  return (
    <div className="relative group cursor-default">
      <div
        className="w-10 h-10 rounded overflow-hidden border-2 transition-all"
        style={{
          borderColor: invested ? "#c9a227" : "#3a3a4a",
          boxShadow: invested ? "0 0 6px #c9a22760" : "none",
          filter: invested ? "none" : "grayscale(0.85) brightness(0.5)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/icon?type=spell&id=${node.spellId}`}
          alt=""
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "https://wow.zamimg.com/images/wow/icons/large/inv_misc_questionmark.jpg";
          }}
        />
      </div>
      {/* Rank badge */}
      <div
        className="absolute -bottom-1 -right-1 text-[10px] font-bold leading-none px-1 py-0.5 rounded"
        style={{
          backgroundColor: invested ? "#c9a227" : "#2a2a3a",
          color: invested ? "#000" : "#666",
          border: `1px solid ${invested ? "#e6c04d" : "#444"}`,
        }}
      >
        {node.currentRank}/{node.maxRank}
      </div>
    </div>
  );
}

function TalentTreeTab({ tab, index }: { tab: TBCTalentTree["tabs"][0]; index: number }) {
  // Build grid: rows × cols
  const grid: (TBCTalentNode | null)[][] = Array.from({ length: ROWS }, () =>
    Array(COLS).fill(null)
  );
  for (const node of tab.nodes) {
    if (node.row < ROWS && node.col < COLS) {
      grid[node.row][node.col] = node;
    }
  }

  const bg = TREE_BACKGROUNDS[index] ?? TREE_BACKGROUNDS[0];
  const accent = TREE_ACCENT[index] ?? "#6b3fa0";

  return (
    <div
      className="rounded-xl border overflow-hidden flex-1"
      style={{ borderColor: accent + "60", background: bg, minWidth: 0 }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2 border-b"
        style={{ borderColor: accent + "40", backgroundColor: accent + "25" }}
      >
        <div
          className="w-6 h-6 rounded border overflow-hidden flex-shrink-0"
          style={{ borderColor: accent }}
        >
          {tab.nodes[0]?.spellId && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/api/icon?type=spell&id=${tab.nodes[0].spellId}`}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
            />
          )}
        </div>
        <span className="text-sm font-bold text-white truncate">{tab.name}</span>
        <span
          className="ml-auto text-xs font-bold px-1.5 py-0.5 rounded flex-shrink-0"
          style={{ backgroundColor: accent + "40", color: accent === TREE_ACCENT[0] ? "#a78bfa" : accent === TREE_ACCENT[1] ? "#fbbf24" : "#4ade80" }}
        >
          {tab.totalPoints}
        </span>
      </div>

      {/* Grid */}
      <div className="p-2">
        {grid.map((row, rIdx) => {
          const hasContent = row.some((n) => n !== null);
          if (!hasContent) return null;
          return (
            <div key={rIdx} className="flex gap-1 justify-center mb-1">
              {row.map((node, cIdx) => (
                <TalentIcon key={cIdx} node={node} />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Retail / generic talent display (unchanged) ──────────────────────────────
function RetailTalentsDisplay({ specializations }: { specializations: CharacterSpecializations }) {
  const activeSpec =
    specializations.specializations?.find(
      (s) => s.specialization?.id === specializations.active_specialization?.id
    ) || specializations.specializations?.[0];

  if (!activeSpec) {
    return <p className="text-gray-500 text-sm">Keine Talent-Daten verfügbar.</p>;
  }

  const talents = activeSpec.talents || [];
  const talentRows: Record<number, typeof talents[number][]> = {};
  for (const t of talents) {
    if (!talentRows[t.row_index]) talentRows[t.row_index] = [];
    talentRows[t.row_index].push(t);
  }

  return (
    <>
      {specializations.specializations && specializations.specializations.length > 1 && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {specializations.specializations.map((spec) => (
            <div
              key={spec.specialization?.id}
              className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap ${
                spec.specialization?.id === specializations.active_specialization?.id
                  ? "bg-amber-500 text-black"
                  : "bg-gray-800 text-gray-400"
              }`}
            >
              {spec.specialization?.name}
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        {Object.entries(talentRows)
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([rowIndex, rowTalents]) => (
            <div key={rowIndex} className="flex gap-2 flex-wrap">
              {rowTalents
                .sort((a, b) => a.column_index - b.column_index)
                .map((talent) => (
                  <div
                    key={talent.talent?.id}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium cursor-default ${
                      talent.rank > 0
                        ? "bg-amber-500/20 border-amber-500/50 text-amber-300"
                        : "bg-gray-800/50 border-gray-700 text-gray-500"
                    }`}
                    title={talent.talent?.name}
                  >
                    {talent.talent?.name}
                    {talent.rank > 1 && <span className="ml-1 text-amber-500">×{talent.rank}</span>}
                  </div>
                ))}
            </div>
          ))}
      </div>

      {activeSpec.pvp_talent_slots && activeSpec.pvp_talent_slots.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-800">
          <h3 className="text-xs text-gray-400 uppercase tracking-wider mb-2">PvP Talente</h3>
          <div className="flex flex-wrap gap-2">
            {activeSpec.pvp_talent_slots.map((slot) =>
              slot.selected ? (
                <div
                  key={slot.slot_number}
                  className="px-3 py-1.5 rounded-lg border bg-red-500/10 border-red-500/30 text-red-300 text-xs font-medium"
                >
                  {slot.selected.talent?.name}
                </div>
              ) : null
            )}
          </div>
        </div>
      )}

      {activeSpec.glyphs && activeSpec.glyphs.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-800">
          <h3 className="text-xs text-gray-400 uppercase tracking-wider mb-2">Glyphen</h3>
          <div className="flex flex-wrap gap-2">
            {activeSpec.glyphs.map((g) => (
              <div
                key={g.glyph?.id}
                className="px-3 py-1.5 rounded-lg border bg-teal-500/10 border-teal-500/30 text-teal-300 text-xs font-medium"
              >
                {g.glyph?.name}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
interface Props {
  specializations: CharacterSpecializations | null;
  talentTree: TBCTalentTree | null;
}

export default function TalentsPanel({ specializations, talentTree }: Props) {
  return (
    <div className="bg-gray-900/80 backdrop-blur border border-amber-500/20 rounded-2xl p-5 shadow-xl">
      <h2 className="text-amber-400 font-bold text-base uppercase tracking-wider mb-4">Talente</h2>

      {talentTree ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {talentTree.tabs.map((tab, i) => (
            <TalentTreeTab key={i} tab={tab} index={i} />
          ))}
        </div>
      ) : specializations ? (
        <RetailTalentsDisplay specializations={specializations} />
      ) : (
        <p className="text-gray-500 text-sm italic">Keine Talent-Daten verfügbar.</p>
      )}
    </div>
  );
}
