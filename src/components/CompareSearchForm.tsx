"use client";

import { useState, useEffect } from "react";
import { Search, ChevronDown } from "lucide-react";
import { REGIONS, getRealmsByRegion } from "@/lib/realms";

interface Props {
  onSearch: (region: string, realm: string, realmSlug: string, namespace: string, character: string, realmType: string) => void;
  loading: boolean;
}

export function SearchForm({ onSearch, loading }: Props) {
  const [region, setRegion] = useState("eu");
  const [realmSlug, setRealmSlug] = useState("");
  const [namespace, setNamespace] = useState("");
  const [realmType, setRealmType] = useState("");
  const [character, setCharacter] = useState("");
  const [realmName, setRealmName] = useState("");

  const realms = getRealmsByRegion(region);

  useEffect(() => {
    setRealmSlug(""); setRealmName(""); setNamespace("");
  }, [region]);

  const handleRealmChange = (value: string) => {
    const [slug, ns] = value.split("|");
    const realm = realms.find((r) => r.slug === slug);
    setRealmSlug(slug); setNamespace(ns);
    setRealmType(realm?.type || ""); setRealmName(realm?.name || slug);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!realmSlug || !character.trim()) return;
    onSearch(region, realmName, realmSlug, namespace, character.trim(), realmType);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-900/80 backdrop-blur border border-amber-500/20 rounded-xl p-4 shadow-xl">
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="relative">
          <label className="text-xs text-gray-500 mb-1 block uppercase tracking-wider">Region</label>
          <div className="relative">
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-2 text-white text-sm appearance-none pr-6 focus:outline-none focus:border-amber-500"
            >
              {REGIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
            <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
          </div>
        </div>
        <div className="relative">
          <label className="text-xs text-gray-500 mb-1 block uppercase tracking-wider">Server</label>
          <div className="relative">
            <select
              value={realmSlug ? `${realmSlug}|${namespace}` : ""}
              onChange={(e) => handleRealmChange(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-2 text-white text-sm appearance-none pr-6 focus:outline-none focus:border-amber-500"
              required
            >
              <option value="">Server...</option>
              {realms.map((r) => (
                <option key={`${r.slug}|${r.namespace}`} value={`${r.slug}|${r.namespace}`}>{r.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block uppercase tracking-wider">Name</label>
          <input
            type="text"
            value={character}
            onChange={(e) => setCharacter(e.target.value)}
            placeholder="Name..."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-amber-500"
            required
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={loading || !realmSlug || !character.trim()}
        className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 disabled:from-gray-700 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 rounded-lg transition-all text-sm flex items-center justify-center gap-2"
      >
        {loading ? (
          <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : <Search className="w-3.5 h-3.5" />}
        {loading ? "Suche..." : "Laden"}
      </button>
    </form>
  );
}
