import { products } from "../data/products";
import { siteConfig } from "../config/site";
import { getPriceLabel } from "../utils/money";
import type { ChatPreferences, ChatResponse } from "../types";

export interface ChatService {
  ask(question: string, preferences?: ChatPreferences): Promise<ChatResponse>;
}

export class ApiChatService implements ChatService {
  async ask(question: string, preferences: ChatPreferences = {}): Promise<ChatResponse> {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, preferences })
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

export class DemoChatService implements ChatService {
  async ask(question: string, preferences?: ChatPreferences): Promise<ChatResponse> {
    void preferences;
    await new Promise((resolve) => globalThis.setTimeout(resolve, 520));

    const normalized = question.toLocaleLowerCase("de-DE");

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

    return {
      text:
        "Das kann ich aus dem Demo-Bestand nicht sicher beantworten. Für Verfügbarkeit, individuelle Preise oder einen besonderen Wunsch rufen Sie bitte kurz an – oder bereiten Sie eine Vorbestellungsanfrage vor.",
      action: { label: "Vorbestellung vorbereiten", page: "reservation" }
    };
  }
}
