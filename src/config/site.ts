const env = (import.meta.env ?? {}) as Record<string, string | undefined>;

export const siteConfig = {
  name: "Blatt & Blüte",
  locationName: "Freudenberg",
  phoneDisplay: env.VITE_PHONE_DISPLAY || "02734 433990",
  phoneE164: env.VITE_PHONE_E164 || "+492734433990",
  addressLine: env.VITE_ADDRESS_LINE || "Färberstraße 1",
  postalCity: env.VITE_POSTAL_CITY || "57258 Freudenberg",
  googleUrl:
    env.VITE_GOOGLE_URL || "https://share.google/pG1d7ni72UcSw0EQL",
  instagramUrl:
    env.VITE_INSTAGRAM_URL ||
    "https://www.instagram.com/blatt_und_bluete_freudenberg/",
  facebookUrl:
    env.VITE_FACEBOOK_URL ||
    "https://www.facebook.com/Blatt.Bluete.Freudenberg/?locale=de_DE",
  timezone: "Europe/Berlin",
  hours: [
    {
      days: "Mo–Fr",
      times: ["09:00–12:30", "14:00–18:00"]
    },
    { days: "Sa", times: ["09:00–13:00"] },
    { days: "So", times: ["geschlossen"] }
  ],
  dataNote:
    "Öffnungszeiten laut aktuellem lokalen Unternehmenseintrag; an Feiertagen können sie abweichen."
} as const;

export const phoneCommunicationText =
  "Wir lieben unser Handwerk und können Ihnen jeden beliebigen Wunsch in der Blumenwelt erfüllen. Sprechen Sie mit unserem Anrufbeantworter und äußern Sie ihren Wunsch. Unser System verarbeitet Ihre gesprochenen Daten nur intern und übersetzt uns Ihren genauen Wunsch, damit wir Ihnen bestmöglich aushelfen können. Mögen Sie es doch lieber altmodisch? Wir auch, um ehrlich zu sein. Deshalb lassen Sie uns doch einfach kurz per Telefon quatschen! Wir beißen auch nicht, versprochen ;)";

export const integrationStatus = {
  inventory: "Demo-Bestand – keine Kassensynchronisierung aktiv",
  reservations: "Demo-Übermittlung – keine Anfrage wird gespeichert oder versendet",
  voice:
    "Sprachverarbeitung ist noch nicht technisch angebunden; es gibt keine Aufnahmefunktion.",
  payments: "Keine Online-Zahlung eingerichtet",
  googleReviews: "Externer Link – kein eingebettetes Live-Widget"
} as const;
