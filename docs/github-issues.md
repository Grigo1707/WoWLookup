# GitHub Issues – WoWLookup Work Items

Diese Datei enthält die Work Items die nach dem GitHub-Push als Issues angelegt werden.
Führe `gh issue create` für jedes Item aus, oder nutze das Script am Ende.

---

## Issue 1: API Keys einrichten und Dokumentation

**Label**: `setup`, `documentation`
**Milestone**: v0.1 MVP

Beschreibung: Blizzard API und WarcraftLogs API Keys dokumentieren und einrichten.
- [ ] Blizzard Developer Account erstellen
- [ ] Client ID + Secret in `.env.local` eintragen
- [ ] WarcraftLogs Client erstellen
- [ ] README Setup-Anleitung verifizieren

---

## Issue 2: Realm-Liste erweitern

**Label**: `enhancement`, `data`

Die aktuelle Realm-Liste in `src/lib/realms.ts` enthält nur die wichtigsten Server.
- [ ] Alle EU Retail Realms hinzufügen
- [ ] Alle US Retail Realms hinzufügen
- [ ] Blizzard API für dynamische Realm-Liste nutzen (`/data/wow/realm/index`)
- [ ] Suche/Filter im Realm-Dropdown

---

## Issue 3: Charakter-Avatar aus Blizzard Media API

**Label**: `enhancement`, `ui`

Charaktere haben aktuell einen Platzhalter-Avatar (erster Buchstabe des Namens).
- [ ] Blizzard Media API integrieren: `GET /profile/wow/character/{realm}/{name}/character-media`
- [ ] Avatar-Bild im CharacterHeader anzeigen
- [ ] Fallback auf aktuellen Platzhalter bei fehlendem Bild

---

## Issue 4: URL-basierte Suche (Deep Links)

**Label**: `enhancement`, `ux`

Charakter-Ergebnisse sollen per URL teilbar sein.
- [ ] URL-Parameter: `?region=eu&realm=thunderstrike&char=Lelamaus`
- [ ] Beim Laden der Seite automatisch suchen falls Parameter vorhanden
- [ ] History API für Browser-Back-Navigation

---

## Issue 5: Mehrere Charaktere vergleichen

**Label**: `feature`, `enhancement`

Zwei Charaktere nebeneinander vergleichen.
- [ ] UI für Vergleichsmodus
- [ ] Side-by-side Equipment-Ansicht
- [ ] Score-Vergleich mit Delta-Anzeige

---

## Issue 6: Classic Talent-Tree Visualisierung

**Label**: `feature`, `classic`

Für Classic-Charaktere soll der Talent-Tree grafisch dargestellt werden.
- [ ] Talent-Baum Daten aus Blizzard API oder statischer Quelle
- [ ] Visuelle Grid-Darstellung (3 Bäume × n Reihen)
- [ ] Punkte-Verteilung anzeigen (z.B. 21/0/30)

---

## Issue 7: WarcraftLogs Zone-Auswahl

**Label**: `enhancement`, `performance`

Aktuell wird nur die aktuelle Zone gezeigt. Nutzer sollen Zone wählen können.
- [ ] Zone-Dropdown (Aktuell, Vorherige Tier)
- [ ] WCL API: Zone IDs dynamisch laden
- [ ] Metrik-Auswahl: DPS / HPS / Tanking

---

## Issue 8: Caching mit Redis oder Vercel KV

**Label**: `performance`, `infrastructure`

API-Responses sollen gecacht werden um Rate Limits zu vermeiden.
- [ ] Vercel KV oder Redis einrichten
- [ ] 5-Minuten Cache für Charakter-Daten
- [ ] Cache-Invalidierung per API-Endpoint

---

## Issue 9: Error Handling verbessern

**Label**: `bug`, `ux`

Bessere Fehlermeldungen für häufige Fehlerszenarien.
- [ ] "Charakter nicht gefunden" klarer kommunizieren
- [ ] Classic TBC 404-Fehler mit Hinweis auf API-Issues
- [ ] Rate Limit Handling mit Retry-Logic
- [ ] Toast-Notifications statt statischer Error-Box

---

## Issue 10: Deployment auf Vercel

**Label**: `infrastructure`, `deployment`

- [ ] Vercel-Projekt erstellen und mit GitHub verbinden
- [ ] Umgebungsvariablen in Vercel setzen
- [ ] Custom Domain einrichten (optional)
- [ ] Preview Deployments für PRs aktivieren

---

## Script: Alle Issues anlegen

```bash
#!/bin/bash
# Führe dieses Script nach `gh auth login` aus

gh issue create --title "API Keys einrichten und Dokumentation" --label "setup,documentation" --body "Blizzard API und WarcraftLogs API Keys einrichten. Siehe docs/github-issues.md"
gh issue create --title "Realm-Liste erweitern" --label "enhancement,data" --body "Alle EU/US Realms hinzufügen, dynamische Liste via Blizzard API"
gh issue create --title "Charakter-Avatar aus Blizzard Media API" --label "enhancement,ui" --body "Echte Charakter-Bilder aus der Blizzard Media API laden"
gh issue create --title "URL-basierte Suche (Deep Links)" --label "enhancement,ux" --body "Charaktere per URL teilen: ?region=eu&realm=thunderstrike&char=Name"
gh issue create --title "Mehrere Charaktere vergleichen" --label "feature,enhancement" --body "Side-by-side Vergleich von zwei Charakteren"
gh issue create --title "Classic Talent-Tree Visualisierung" --label "feature,classic" --body "Grafische Darstellung des Classic Talent-Trees"
gh issue create --title "WarcraftLogs Zone-Auswahl" --label "enhancement,performance" --body "Nutzer können die WCL-Zone auswählen (aktuell, vorherige Tiers)"
gh issue create --title "Caching mit Vercel KV" --label "performance,infrastructure" --body "API-Responses cachen um Rate Limits zu vermeiden"
gh issue create --title "Error Handling verbessern" --label "bug,ux" --body "Bessere Fehlermeldungen, Retry-Logic, Toast-Notifications"
gh issue create --title "Deployment auf Vercel" --label "infrastructure,deployment" --body "Vercel-Deployment einrichten mit CI/CD via GitHub"
```
