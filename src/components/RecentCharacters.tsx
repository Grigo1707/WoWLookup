"use client";

import { Clock, X, Trash2 } from "lucide-react";

export interface RecentCharacter {
  region: string;
  realm: string;
  realmSlug: string;
  namespace: string;
  character: string;
  realmType: string;
  characterClass?: string;
  level?: number;
  timestamp: number;
}

const STORAGE_KEY = "wow-recent-characters";
const MAX_RECENT = 8;

export function loadRecentCharacters(): RecentCharacter[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveRecentCharacter(char: Omit<RecentCharacter, "timestamp">) {
  try {
    const existing = loadRecentCharacters().filter(
      (c) => !(c.character.toLowerCase() === char.character.toLowerCase() && c.realmSlug === char.realmSlug && c.region === char.region)
    );
    const updated = [{ ...char, timestamp: Date.now() }, ...existing].slice(0, MAX_RECENT);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // localStorage not available
  }
}

export function removeRecentCharacter(char: RecentCharacter) {
  try {
    const existing = loadRecentCharacters().filter(
      (c) => !(c.character === char.character && c.realmSlug === char.realmSlug && c.region === char.region)
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  } catch {
    // ignore
  }
}

export function clearRecentCharacters() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

const CLASS_COLORS: Record<string, string> = {
  "Death Knight": "#C41E3A",
  "Demon Hunter": "#A330C9",
  "Druid": "#FF7C0A",
  "Evoker": "#33937F",
  "Hunter": "#AAD372",
  "Mage": "#3FC7EB",
  "Monk": "#00FF98",
  "Paladin": "#F48CBA",
  "Priest": "#FFFFFF",
  "Rogue": "#FFF468",
  "Shaman": "#0070DD",
  "Warlock": "#8788EE",
  "Warrior": "#C69B3A",
};

interface Props {
  characters: RecentCharacter[];
  onSelect: (char: RecentCharacter) => void;
  onRemove: (char: RecentCharacter) => void;
  onClearAll: () => void;
}

export default function RecentCharacters({ characters, onSelect, onRemove, onClearAll }: Props) {
  if (characters.length === 0) return null;

  return (
    <div className="w-full max-w-2xl mx-auto mt-4">
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-xs text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
          <Clock className="w-3 h-3" /> Zuletzt angesehen
        </span>
        <button
          onClick={onClearAll}
          className="text-xs text-gray-600 hover:text-gray-400 flex items-center gap-1 transition-colors"
        >
          <Trash2 className="w-3 h-3" /> Alle löschen
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {characters.map((char) => {
          const color = char.characterClass ? (CLASS_COLORS[char.characterClass] ?? "#9d9d9d") : "#9d9d9d";
          return (
            <div
              key={`${char.region}-${char.realmSlug}-${char.character}`}
              className="group relative flex items-center gap-2 bg-gray-900/60 border border-gray-700/50 hover:border-amber-500/40 rounded-lg px-3 py-1.5 cursor-pointer transition-all"
              onClick={() => onSelect(char)}
            >
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
              <div className="min-w-0">
                <span className="text-sm font-medium" style={{ color }}>{char.character}</span>
                <span className="text-xs text-gray-500 ml-1.5">{char.realm} ({char.region.toUpperCase()})</span>
                {char.level && <span className="text-xs text-gray-600 ml-1">Lv{char.level}</span>}
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onRemove(char); }}
                className="ml-1 text-gray-600 hover:text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
