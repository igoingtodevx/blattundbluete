import { products } from "../data/products";
import { siteConfig } from "../config/site";
import { getPriceLabel } from "../utils/money";
import type { ChatHistoryMessage, ChatPreferences, ChatResponse } from "../types";

export interface ChatService {
  ask(
    question: string,
    preferences?: ChatPreferences,
    history?: ChatHistoryMessage[]
  ): Promise<ChatResponse>;
}

export class ApiChatService implements ChatService {
  async ask(
    question: string,
    preferences: ChatPreferences = {},
    history: ChatHistoryMessage[] = []
  ): Promise<ChatResponse> {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, preferences, history })
    });

    if (!response.ok) {
      throw new Error("Chat API konnte nicht antworten.");
    }

    return (await response.json()) as ChatResponse;
  }
}

const available = products.filter(
  (product) => product.stock > 0 && product.status !== "soldout"
);

const suggestions = (ids: string[]) =>
  ids
    .map((id) => products.find((product) => product.id === id))
    .filter((product) => Boolean(product))
    .map((product) => ({
      productId: product!.id,
      label: `${product!.name} · ${getPriceLabel(product!.price, product!.priceMax)}`
    }));

const pick = <T,>(items: T[], count: number): T[] => items.slice(0, count);

const byOccasion = (preferences?: ChatPreferences) => {
  if (!preferences?.occasion) return null;
  const occasion = preferences.occasion.toLocaleLowerCase("de-DE");
  return pick(
    available.filter((product) =>
      product.occasions.some((entry) =>
        entry.toLocaleLowerCase("de-DE").includes(occasion)
      )
    ),
    3
  );
};

const byBudget = (preferences?: ChatPreferences) => {
  if (!preferences?.budget) return null;
  const budget = preferences.budget;
  const max = budget === "bis-15" ? 15 : budget === "16-25" ? 25 : budget === "26-40" ? 40 : budget === "41-60" ? 60 : Infinity;
  return pick(
    available.filter((product) => (product.priceMax ?? product.price) <= max),
    3
  );
};

export class DemoChatService implements ChatService {
  async ask(
    question: string,
    preferences?: ChatPreferences,
    history?: ChatHistoryMessage[]
  ): Promise<ChatResponse> {
    void history;
    await new Promise((resolve) => globalThis.setTimeout(resolve, 520));

    const normalized = question.toLocaleLowerCase("de-DE");
    const lastAssistant = history
      ? [...history].reverse().find((entry) => entry.role === "assistant")?.text
      : undefined;

    // Kontext: Nutzer antwortet auf eine Beratungsfrage (z.B. Anlass gewählt)
    const occasionProducts = byOccasion(preferences);
    if (preferences?.occasion && /ja|passt|gerne|ok|gern|super/.test(normalized)) {
      const matches = occasionProducts ?? byBudget(preferences) ?? [];
      if (matches.length > 0) {
        return {
          text: `Für ${preferences.occasion} habe ich im Demo-Sortiment diese passenden Vorschläge. Der verbindliche Bestand wird kurz vor Ihrem Besuch im Laden bestätigt.`,
          suggestions: suggestions(matches.map((product) => product.id))
        };
      }
    }

    if (/rose|rosen/.test(normalized)) {
      const roseProducts = available
        .filter((product) =>
          product.materials.some((material) =>
            material.toLocaleLowerCase("de-DE").includes("rose")
          )
        )
        .slice(0, 3);
      return {
        text:
          roseProducts.length > 0
            ? `Im Demo-Bestand finde ich ${roseProducts.length} passende Sträuße mit Rosen. Der tatsächliche Ladenbestand kann sich kurzfristig ändern – für bestimmte Farben bitte kurz anrufen.`
            : "Im Demo-Bestand ist gerade kein Rosenstrauß bestätigt. Bitte rufen Sie für den aktuellen Ladenbestand kurz an.",
        suggestions: suggestions(roseProducts.map((product) => product.id))
      };
    }

    if (/tisch|gäste|hochzeit|feier/.test(normalized)) {
      return {
        text:
          "Für Tischdekoration brauche ich noch fünf Angaben: Gästezahl, Anlass, Farbwelt, Budget und Termin. Danach ist ein kurzes Telefonat am sinnvollsten, weil Blumenmenge und Machbarkeit vom aktuellen Einkauf abhängen.",
        action: { label: "Anfrage vorbereiten", page: "reservation" }
      };
    }

    if (/10.*15|15.*euro|spontan|schnell/.test(normalized)) {
      return {
        text:
          "Ein kleiner Strauß im Richtwert von 10 bis 15 Euro kann je nach aktuellem Bestand möglich sein. Wie schnell er fertig ist, hängt vom Andrang und den vorhandenen Blumen ab. Rufen Sie am besten kurz vor Ihrem Besuch an.",
        suggestions: suggestions(["little-sun", "calm-morning"]),
        action: { label: `Jetzt ${siteConfig.phoneDisplay} anrufen`, page: "home" }
      };
    }

    if (/welche.*sträu|strauß|straeuss|sträuße/.test(normalized)) {
      return {
        text:
          "Wir können kleine, mittlere und große Sträuße in vielen Farbwelten zusammenstellen. Die Website zeigt Demo-Beispiele; Blumenwahl und verbindlicher Preis werden nach Bestand und Wunsch bestätigt.",
        suggestions: suggestions([
          "meadow-moment",
          "rose-letter",
          "big-embrace"
        ]),
        action: { label: "Alle Sträuße ansehen", page: "products" }
      };
    }

    if (/freundin|freund|mutter|mama|oma|date|geschenk/.test(normalized)) {
      return {
        text:
          "Persönliche Vorlieben sind wichtiger als Klischees. Hilfreich sind Lieblingsfarben, Stil (wild, schlicht oder romantisch), Anlass und Budget. Für einen Date-Gruß würde ich im Demo-Sortiment eher klein und persönlich starten.",
        suggestions: suggestions(["heart-leap", "soft-greeting", "rose-letter"])
      };
    }

    if (/saison|gerade|aktuell/.test(normalized)) {
      return {
        text:
          "Welche Blumen heute wirklich im Laden stehen, kann die Demo-Seite nicht zuverlässig wissen. Saisonale Richtungen sind hier als Inspiration markiert; für eine konkrete Sorte bitte kurz anrufen."
      };
    }

    if (/reserv|vorbestell|abhol/.test(normalized)) {
      return {
        text:
          "Sie können hier eine Demo-Anfrage vorbereiten. Sie wird erst nach persönlicher Bestätigung durch den Laden verbindlich. Im aktuellen Demo-Modus werden keine Kontaktdaten gespeichert oder versendet.",
        action: { label: "Vorbestellung starten", page: "reservation" }
      };
    }

    if (/pflege|wasser|vase|anschneid|haltbar/.test(normalized)) {
      return {
        text:
          "Kurz gesagt: saubere Vase, Blätter unter der Wasserlinie entfernen, Stiele schräg anschneiden, Wasser regelmäßig wechseln und den Strauß nicht direkt an Sonne oder Heizung stellen.",
        action: { label: "Blumenwissen öffnen", page: "knowledge" }
      };
    }

    if (/restpost|sale|16:30|günstig|rabatt/.test(normalized)) {
      return {
        text:
          "Geeignete Demo-Produkte werden ab 16:30 Uhr in der Zeitzone Europe/Berlin mit 50 % angezeigt. Ob ein konkreter Strauß im Laden wirklich verfügbar ist, muss weiterhin geprüft werden.",
        action: { label: "Restposten ansehen", page: "sale" }
      };
    }

    // Kontext: Wenn ein Anlass gewählt wurde, aber die Frage unklar ist, Vorschläge zum Anlass
    if (occasionProducts && occasionProducts.length > 0) {
      return {
        text: `Für ${preferences!.occasion} passen im Demo-Sortiment zum Beispiel diese Sträuße. Der tatsächliche Ladenbestand kann sich kurzfristig ändern – für eine verbindliche Auswahl bitte kurz anrufen.`,
        suggestions: suggestions(occasionProducts.map((product) => product.id))
      };
    }

    if (lastAssistant && /danke|ok|gut|super|passt/.test(normalized)) {
      return {
        text:
          "Gern geschehen! Wenn Sie möchten, bereiten Sie gleich eine Vorbestellungsanfrage vor – im Demo-Modus wird sie nur geprüft, nicht gespeichert. Für Verbindliches rufen Sie uns kurz an."
      };
    }

    return {
      text:
        "Das kann ich aus dem Demo-Bestand nicht sicher beantworten. Für Verfügbarkeit, individuelle Preise oder einen besonderen Wunsch rufen Sie bitte kurz an – oder bereiten Sie eine Vorbestellungsanfrage vor.",
      action: { label: "Vorbestellung vorbereiten", page: "reservation" }
    };
  }
}
