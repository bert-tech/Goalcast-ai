# ⚽ GoalCast AI — Pronostici con AI

App di pronostici calcistici con analisi AI per i Mondiali 2026.

## Setup locale

```bash
npm install
cp .env.local.example .env.local
# Inserisci le tue chiavi in .env.local
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000)

## Deploy su Vercel

1. Carica questo progetto su GitHub
2. Vai su [vercel.com](https://vercel.com) → New Project → importa il repo
3. In **Settings > Environment Variables** aggiungi:
   - `FOOTBALL_API_KEY` = la tua chiave da football-data.org
   - `ANTHROPIC_API_KEY` = la tua chiave da console.anthropic.com
4. Clicca **Deploy** — done ✅

## Struttura

```
pages/
  index.js          ← Frontend principale
  api/
    matches.js      ← API route: partite da football-data.org
    analyze.js      ← API route: analisi AI con Anthropic
lib/
  flags.js          ← Utility (flag, orari, stage)
styles/
  globals.css       ← Stili globali
```

## Prossimi step

- [ ] Autenticazione utenti (Supabase)
- [ ] Pagamenti (Stripe)
- [ ] Salvataggio pronostici nel database
- [ ] Classifica dinamica reale
