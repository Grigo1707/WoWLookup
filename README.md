# WoWLookup ⚔

Auf einen Blick Ausrüstung, Talente und Performance-Wertung von World of Warcraft Charakteren prüfen.

## Features

- 🔍 **Charaktersuche** – Suche nach Charakteren auf EU/US Servern (Retail & Classic)
- ⚔ **Ausrüstung** – Vollständige Ausrüstungsübersicht mit Item Level, Verzauberungen und Juwelen
- 🌟 **Talente** – Aktive Spezialisierung und Talent-Auswahl
- 📊 **Performance** – Warcraft Logs Parses und Boss-Rankings
- 🏆 **Gesamtbewertung** – Kombinierter Score aus Item Level und WCL-Performance

## Setup

### 1. Abhängigkeiten installieren

```bash
npm install
```

### 2. API Keys einrichten

Kopiere `.env.local.example` zu `.env.local` und trage deine API Keys ein:

```bash
cp .env.local.example .env.local
```

- **Blizzard API**: Account erstellen auf [develop.battle.net](https://develop.battle.net/)
- **WarcraftLogs API**: Client erstellen auf [warcraftlogs.com/api/clients](https://www.warcraftlogs.com/api/clients/)

### 3. Starten

```bash
npm run dev
```

Öffne [http://localhost:3000](http://localhost:3000).

## Tech Stack

- [Next.js 16](https://nextjs.org/) – React Framework
- [Tailwind CSS 4](https://tailwindcss.com/) – Styling
- [Lucide React](https://lucide.dev/) – Icons
- [Blizzard API](https://develop.battle.net/) – Charakter- und Ausrüstungsdaten
- [WarcraftLogs API v2](https://www.warcraftlogs.com/v2-api-docs/) – Performance-Daten

## Deployment

```bash
npm run build
npm start
```

Empfohlen: [Vercel](https://vercel.com) für Zero-Config Deployment.
