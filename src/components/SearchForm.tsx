"use client";

import { useState, useEffect } from "react";
import { Search, ChevronDown } from "lucide-react";
import { REGIONS, getRealmsByRegion } from "@/lib/realms";

interface SearchFormProps {
  onSearch: (region: string, realm: string, realmSlug: string, namespace: string, character: string, realmType: string) => void;
  loading: boolean;
}

export default function SearchForm({ onSearch, loading }: SearchFormProps) {
  const [region, setRegion] = useState("eu");
  const [realmSlug, setRealmSlug] = useState("");
  const [namespace, setNamespace] = useState("");
  const [realmType, setRealmType] = useState("");
  const [character, setCharacter] = useState("");
  const [realmName, setRealmName] = useState("");

  const realms = getRealmsByRegion(region);

  useEffect(() => {
    setRealmSlug("");
    setRealmName("");
    setNamespace("");
  }, [region]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!realmSlug || !character.trim()) return;
    onSearch(region, realmName, realmSlug, namespace, character.trim(), realmType);
  };

  const handleRealmChange = (value: string) => {
    const [slug, ns] = value.split("|");
    const realm = realms.find((r) => r.slug === slug);
    setRealmSlug(slug);
    setNamespace(ns);
    setRealmType(realm?.type || "");
    setRealmName(realm?.name || slug);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="bg-gray-900/80 backdrop-blur border border-amber-500/20 rounded-2xl p-6 shadow-2xl shadow-amber-500/5">
        <h2 className="text-amber-400 font-bold text-lg mb-4 flex items-center gap-2">
          <Search className="w-5 h-5" />
          Charakter suchen
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          {/* Region */}
          <div className="relative">
            <label className="text-xs text-gray-400 mb-1 block uppercase tracking-wider">Region</label>
            <div className="relative">
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white appearance-none pr-8 focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
              >
                {REGIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Realm */}
          <div className="relative">
            <label className="text-xs text-gray-400 mb-1 block uppercase tracking-wider">Server</label>
            <div className="relative">
              <select
                value={realmSlug ? `${realmSlug}|${namespace}` : ""}
                onChange={(e) => handleRealmChange(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white appearance-none pr-8 focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
                required
              >
                <option value="">Server wählen...</option>
                {realms.map((r) => (
                  <option key={`${r.slug}|${r.namespace}`} value={`${r.slug}|${r.namespace}`}>
                    {r.name} ({r.typeLabel})
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Character */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block uppercase tracking-wider">Charaktername</label>
            <input
              type="text"
              value={character}
              onChange={(e) => setCharacter(e.target.value)}
              placeholder="Charaktername..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition-colors"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !realmSlug || !character.trim()}
          className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 disabled:from-gray-700 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
        >
          {loading ? (
            <>
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Suche läuft...
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              Charakter laden
            </>
          )}
        </button>
      </div>
    </form>
  );
}
