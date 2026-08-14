# Blatt & Blüte Freudenberg — Floristik + KI-Beratung

**Kunde:** Blatt & Blüte Freudenberg — Floristik-Geschäft.
**Live:** https://blatt-und-bluete-freudenberg.vercel.app (HTTP 200 verifiziert)

## Was gebaut wurde
- Storefront-Prototyp (React 19 / Vite 8): Katalog, Sale-Items, Blumen-Wissen, Über-uns, Reservierungs-Vorabfrage.
- **Konversationaler Blumen-Berater** (Custom-TS): extrahiert Präferenzen, beantwortet Öffnungszeiten, schlägt Produkte vor.
- `api/chat.ts` Provider-Chain: Amazon Bedrock → OpenAI-Compat-Fallback.
- Vitest-Tests + ESLint.

## Tech
React 19 · TypeScript · Vite 8 · Bedrock/OpenAI · Vitest

## Ergebnis
Lokales Business mit Website + KI-Berater, der Kunden direkt zur Reservierung führt.

---
*Gebaut mit KI-Orchestrierung (Vibe-Building).*
