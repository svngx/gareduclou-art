# Gare du Clou — Website Setup

## 1. Projekt lokal starten

```bash
cd website
npm install
npm run dev
```

Die Site läuft dann unter `http://localhost:4321`.

## 2. Git-Repository einrichten

```bash
cd website
git init
git add .
git commit -m "init: Astro-Projekt mit Rhizom-Engine und drei Beispiel-Stücken"
```

## 3. GitHub-Repository erstellen

Auf github.com ein neues Repository anlegen (z.B. `gareduclou-art`), dann:

```bash
git remote add origin https://github.com/DEIN-USER/gareduclou-art.git
git branch -M main
git push -u origin main
```

## 4. Vercel verbinden

1. **vercel.com** → „Add New Project"
2. GitHub-Repository `gareduclou-art` importieren
3. Framework wird automatisch als **Astro** erkannt
4. „Deploy" klicken — fertig

Jeder `git push` auf `main` löst automatisch ein neues Deployment aus.

## 5. Custom Domain

1. In Vercel → Project Settings → Domains
2. `gareduclou.art` eingeben
3. DNS-Einträge beim Domain-Provider setzen:
   - **A-Record:** `76.76.21.21`
   - **CNAME:** `cname.vercel-dns.com` (für `www`)
4. SSL-Zertifikat wird automatisch bereitgestellt

## Projektstruktur

```
website/
├── astro.config.mjs          # Site-Config
├── vercel.json                # Vercel-Erkennung
├── package.json
├── tsconfig.json
├── public/
│   ├── rhizom.js              # Canvas-Engine (Startseite)
│   └── medien/                # Bilder, Audio, Video
│       ├── spurweite/
│       ├── passage/
│       └── ankunft/
└── src/
    ├── content.config.ts      # Zod-Schema für Stücke
    ├── content/               # Markdown-Stücke
    │   ├── spurweite/
    │   ├── passage/
    │   └── ankunft/
    ├── layouts/
    │   └── Base.astro         # Basis-Layout mit Design-Tokens
    ├── components/            # (kommt mit Figma)
    └── pages/
        ├── index.astro        # Rhizom-Startseite
        └── [id].astro         # Dynamische Stück-Seite
```

## Neues Stück anlegen

Eine neue Markdown-Datei im passenden Register-Ordner erstellen:

```markdown
---
id: mein-neues-stueck
register: passage
datum: 2026-04-15
title:
  de: Titel auf Deutsch
  en: English Title
bezuege:
  - id-eines-anderen-stuecks
schichten:
  - kern
  - annotation
sprachen:
  - de
medien: []
---

:::kern
Der Kerntext des Stücks.
:::

:::annotation
Annotationen, Verweise, Kommentar.
:::
```

Die `id` muss einzigartig sein und wird zur URL: `gareduclou.art/mein-neues-stueck`.

Bezüge sind bidirektional — wenn Stück A auf Stück B verweist, erscheint der Bezug automatisch auch bei B.
