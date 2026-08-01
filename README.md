# Blatt & Blüte Freudenberg

Eine mobile-first React-/TypeScript-Website als funktionsfähiges Grundgerüst für den lokalen Blumenladen Blatt & Blüte in Freudenberg.

**Produktion:** https://blatt-und-bluete-freudenberg.vercel.app

## Enthalten

- sechs Hauptbereiche: Start, Blumen & Sträuße, Restposten, Blumenwissen, Über Uns und Vorbestellen,
- exakt 20 Demo-Produkte: 16 Sträuße und 4 Holzdeko-Artikel,
- Suche, Filter, Sortierung, Bestandsstatus und Produktdetails,
- Gemini-gestützter Blumen-Chat mit Website-Wissen, Produktvorschlägen, Auswahlchips und lokalem Fallback,
- Restposten-Logik ab 16:30 Uhr in `Europe/Berlin` mit exakt 50 %,
- FAQ und Pflegewissen,
- validierte Vorbestellungs-/Reservierungsanfrage mit 2,90 € Pfandhinweis,
- Demo-Adapter für Lager und Kassenzettel,
- konfigurierbare Geschäfts-, Google- und Social-Media-Links,
- responsive Navigation, Fokuszustände und reduzierte Bewegung.
- redaktionelle Über-uns-Seite mit austauschbarer Silhouetten-Platzhaltergrafik.

## Lokal starten

```bash
pnpm install
pnpm dev
```

Prüfungen:

```bash
pnpm lint
pnpm test
pnpm build
```

## Veröffentlichen

Der lokale Ordner ist mit dem Vercel-Projekt `blatt-und-bluete-freudenberg` verknüpft. Ein späteres Produktions-Update kann nach den Prüfungen so veröffentlicht werden:

```bash
pnpm dlx vercel@58.4.0 deploy --prod
```

## Konfiguration

`.env.example` zeigt alle vorgesehenen Werte. Variablen mit `VITE_` sind öffentlich im Browser sichtbar und dürfen deshalb keine geheimen Zugangsdaten enthalten.

Die vorhandenen Standardwerte für Adresse, Telefon, Google, Instagram und Facebook wurden aus den bereitgestellten Links bzw. aktuellen öffentlichen Unternehmenseinträgen abgeleitet. Öffnungszeiten und Kontaktdaten bleiben zentral in `src/config/site.ts` austauschbar.

### Gemini-Chat aktivieren

Der Chat ist für Gemini via Vertex AI Express Mode vorbereitet. Er bleibt ohne Zugangsdaten als lokaler Fallback nutzbar. Für den echten KI-Modus:

1. Im Google-Cloud-Projekt `project-254bd332-29e4-4496-aca` für das Dienstkonto `Blatt&Bluete` einen privaten JSON-Schlüssel erstellen und dem Dienstkonto die Rolle **Vertex AI User** geben.
2. In den Vercel-Projektvariablen `GOOGLE_SERVICE_ACCOUNT_JSON` mit dem kompletten Inhalt dieser JSON-Datei anlegen. Nie mit `VITE_` beginnen und niemals in Git einchecken.
3. Neu nach Produktion deployen.

Google Cloud schützt Vertex AI zusätzlich mit der Ausgabenobergrenze **„Blatt & Blüte Bot – 10 € Monatslimit“**. Die Obergrenze ist auf 9 € gesetzt, damit aufgrund möglicher Abrechnungsverzögerungen das gewünschte 10-€-Limit nicht überschritten wird. Sie pausiert Vertex AI für dieses Projekt nach Erreichen der Grenze.

## Demo-Grenzen

- Produkte, Preise und Bestände sind Demo-Daten.
- Eine Formularübermittlung wird geprüft, aber nicht gespeichert oder versendet.
- Es gibt keine Online-Zahlung.
- Ohne `GOOGLE_SERVICE_ACCOUNT_JSON` arbeitet der Chat mit einem lokalen Fallback. Mit dem Dienstkonto nutzt er Gemini und kennt die hinterlegten Website-Fakten, jedoch keine echte POS-Synchronisierung.
- Google-Bewertungen werden nur extern verlinkt.
- Eine Sprachverarbeitung ist nicht angeschlossen; es gibt keine Aufnahmefunktion.
- Eine Kassen-/POS-Synchronisierung ist vorbereitet, aber nicht live.

## POS- und Lagerintegration

### Erwartetes Belegformat

```json
{
  "receiptId": "receipt-2026-0001",
  "type": "sale",
  "createdAt": "2026-07-31T15:30:00.000Z",
  "lines": [
    { "sku": "BB-BQ-S-001", "quantity": 1 }
  ]
}
```

`type` akzeptiert `sale` und `return`. Jeder Artikel wird über seine eindeutige SKU zugeordnet. Verkäufe ziehen positive Ganzzahlen ab; Retouren addieren sie. Der Demo-Service:

- verhindert negative Bestände,
- verarbeitet dieselbe `receiptId` nur einmal,
- stoppt bei unbekannten SKUs oder ungültigen Mengen,
- verändert keine Werte, wenn ein Beleg insgesamt nicht validiert werden kann.

Für den Echtbetrieb werden mindestens benötigt:

1. dokumentiertes Beleg-/Webhook-Format des Kassensystems,
2. sichere serverseitige Signaturprüfung,
3. persistente Tabelle für Belege, Positionen und Idempotenzschlüssel,
4. persistente Bestände mit Zeitstempel und Audit-Protokoll,
5. Fehlerwarteschlange für nicht zuordenbare SKUs,
6. verbindliche Regeln für Stornos und Retouren.

Vorgesehene serverseitige Variablen:

- `POS_PROVIDER`
- `POS_WEBHOOK_SECRET`
- `RESERVATION_WEBHOOK_URL`
- `GOOGLE_PLACE_ID`

Diese Variablen dürfen nie mit `VITE_` beginnen, weil sie sonst in den Client-Build gelangen könnten.

## Anfrage-/CRM-Anschluss

`DemoReservationService` ist der austauschbare Einstiegspunkt. Für den Echtbetrieb muss er durch einen serverseitigen Endpoint ersetzt werden, der:

- alle Eingaben erneut validiert,
- Rate Limits und Missbrauchsschutz nutzt,
- Einwilligung und Datenschutzhinweise abbildet,
- nur notwendige personenbezogene Daten speichert,
- eine Bestätigung durch den Laden ermöglicht,
- Fehler protokolliert, ohne sensible Daten in Browser-Logs auszugeben.

## Brand-Kit

Das einzige verwendete Designsystem ist in [BRAND-KIT.md](./BRAND-KIT.md) dokumentiert.
