"use client";

import { CharacterSpecializations } from "@/lib/blizzard";

interface Props {
  specializations: CharacterSpecializations;
}

export default function TalentsPanel({ specializations }: Props) {
  const activeSpec = specializations.specializations?.find(
    (s) => s.specialization?.id === specializations.active_specialization?.id
  ) || specializations.specializations?.[0];

  if (!activeSpec) {
    return (
      <div className="bg-gray-900/80 backdrop-blur border border-amber-500/20 rounded-2xl p-5">
        <h2 className="text-amber-400 font-bold text-base uppercase tracking-wider mb-4">Talente</h2>
        <p className="text-gray-500 text-sm">Keine Talent-Daten verfügbar.</p>
      </div>
    );
  }

  const talents = activeSpec.talents || [];
  const pvpTalents = activeSpec.pvp_talent_slots || [];

  // Group talents by row for display
  const talentRows: Record<number, typeof talents[0][]> = {};
  for (const t of talents) {
    if (!talentRows[t.row_index]) talentRows[t.row_index] = [];
    talentRows[t.row_index].push(t);
  }

  return (
    <div className="bg-gray-900/80 backdrop-blur border border-amber-500/20 rounded-2xl p-5 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-amber-400 font-bold text-base uppercase tracking-wider">Talente</h2>
        <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full">
          {specializations.active_specialization?.name || "Unbekannt"}
        </span>
      </div>

      {/* All Specializations Tabs */}
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

      {talents.length > 0 ? (
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
                      className="group relative"
                      title={`${talent.talent?.name}\n${talent.spell_tooltip?.description || ""}`}
                    >
                      <div
                        className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-default ${
                          talent.rank > 0
                            ? "bg-amber-500/20 border-amber-500/50 text-amber-300"
                            : "bg-gray-800/50 border-gray-700 text-gray-500"
                        }`}
                      >
                        {talent.talent?.name}
                        {talent.rank > 1 && (
                          <span className="ml-1 text-amber-500">×{talent.rank}</span>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            ))}
        </div>
      ) : (
        <p className="text-gray-500 text-sm italic">Keine Talent-Einträge gefunden.</p>
      )}

      {/* PvP Talents */}
      {pvpTalents.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-800">
          <h3 className="text-xs text-gray-400 uppercase tracking-wider mb-2">PvP Talente</h3>
          <div className="flex flex-wrap gap-2">
            {pvpTalents.map((slot) =>
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

      {/* Glyphs */}
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
    </div>
  );
}
