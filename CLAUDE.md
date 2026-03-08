# WoWLookup – Claude Code Kontext

## Projekt-Übersicht

Next.js 16 Web-App zum Überprüfen von WoW-Charakteren auf einem Blick.

## Tech Stack

- **Framework**: Next.js 16 (App Router), TypeScript
- **Styling**: Tailwind CSS 4 (kein Konfigurationsfile nötig)
- **Icons**: Lucide React
- **APIs**: Blizzard Profile API, WarcraftLogs GraphQL API v2

## Projekt-Struktur

```
src/
  app/
    page.tsx              # Hauptseite (Client Component)
    layout.tsx            # Root Layout
    globals.css           # Globale Styles
    api/character/route.ts # API Route (Blizzard + WCL)
  components/
    SearchForm.tsx        # Suchformular (Region, Server, Charakter)
    CharacterHeader.tsx   # Charakter-Kopfzeile mit Klassen-Farbe
    EquipmentPanel.tsx    # Ausrüstungs-Übersicht
    TalentsPanel.tsx      # Talente und Spezialisierungen
    PerformancePanel.tsx  # WarcraftLogs Performance
    OverallScore.tsx      # Kombinierter Gesamtscore
  lib/
    blizzard.ts           # Blizzard API Client (Token-Caching)
    warcraftlogs.ts       # WarcraftLogs GraphQL Client
    realms.ts             # Server-Liste (EU/US, Retail/Classic)
    utils.ts              # Hilfsfunktionen (Farben, Scores)
```

## Wichtige Konventionen

- **Sprache**: UI-Text auf Deutsch, Code-Kommentare auf Englisch
- **Farben**: WoW Item Quality Colors für Ausrüstung, Parse-Farben für Performance
- **Design**: Dark Theme, amber/gold als Primärfarbe
- **API**: Alle externen Calls im `/api/character` Route Handler (serverseitig)

## API-Konfiguration

Umgebungsvariablen (`.env.local`):
- `BLIZZARD_CLIENT_ID` + `BLIZZARD_CLIENT_SECRET` → [develop.battle.net](https://develop.battle.net/)
- `WARCRAFTLOGS_CLIENT_ID` + `WARCRAFTLOGS_CLIENT_SECRET` → [warcraftlogs.com/api/clients](https://www.warcraftlogs.com/api/clients/)

## Blizzard API Namespaces

| Spielversion | Namespace-Prefix |
|---|---|
| Retail | `profile` |
| Classic Era | `profile-classic1x` |
| TBC Anniversary | `profile-classic-tbc` |
| WotLK | `profile-classic-wrath` |
| Cataclysm | `profile-classic-cata` |

URL-Format: `https://{region}.api.blizzard.com/profile/wow/character/{realm}/{name}/{endpoint}?namespace={prefix}-{region}&locale=en_US`

## Bekannte Einschränkungen

- TBC Anniversary Realms (Thunderstrike, Crusader Strike) haben teils 404-Fehler wegen API-Migration
- WarcraftLogs-Daten nur für Charaktere die geloggt haben
- Classic Talent-Trees werden von der Blizzard API limitiert zurückgegeben

## Entwicklung

```bash
npm run dev   # Entwicklungsserver
npm run build # Production Build prüfen
npm run lint  # ESLint
```
