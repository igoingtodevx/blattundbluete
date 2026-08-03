import { siteConfig } from "../config/site";
import { getChatChoices } from "../data/chatChoices";
import { products } from "../data/products";
import { getPriceLabel } from "../utils/money";
import {
  CHAT_PHONE_HREF,
  extractPreferencesFromText,
  filterRecommendedProducts,
  mergeChatPreferences,
  sanitizeCapturedPreferences,
  validateChatAction
} from "../utils/chat";
import type {
  CapturedPreferences,
  ChatAction,
  ChatChoice,
  ChatHistoryMessage,
  ChatPreferences,
  ChatProductSuggestion,
  ChatResponse,
  Product
} from "../types";

export interface ChatService {
  ask(
    question: string,
    preferences?: ChatPreferences,
    history?: ChatHistoryMessage[]
  ): Promise<ChatResponse>;
}

const availableProducts = products.filter(
  (product) => product.stock > 0 && product.status !== "soldout"
);

const toSuggestion = (product: Product): ChatProductSuggestion => ({
  productId: product.id,
  label: `${product.name} · ${getPriceLabel(product.price, product.priceMax)}`
});

const toSuggestions = (items: Product[]): ChatProductSuggestion[] =>
  items.slice(0, 3).map(toSuggestion);

const callAction = (label = `Kurz anrufen: ${siteConfig.phoneDisplay}`): ChatAction => ({
  type: "call",
  label,
  href: CHAT_PHONE_HREF
});

const decodeAction = (value: unknown): ChatAction | undefined => {
  const action = validateChatAction(value);
  if (action) return action;
  if (
    typeof value === "object" &&
    value !== null &&
    "label" in value &&
    "page" in value &&
    typeof value.label === "string" &&
    typeof value.page === "string"
  ) {
    return validateChatAction({ type: "navigate", ...value });
  }
  return undefined;
};

const responseFromApi = (value: unknown): ChatResponse => {
  if (typeof value !== "object" || value === null) {
    throw new Error("Ungültige Chat-Antwort.");
  }
  const payload = value as Record<string, unknown>;
  if (typeof payload.text !== "string" || !payload.text.trim()) {
    throw new Error("Chat-Antwort enthält keinen Text.");
  }

  const capturedPreferences = sanitizeCapturedPreferences(
    payload.capturedPreferences
  );
  const validProductIds = new Set(
    filterRecommendedProducts(products, capturedPreferences).map((product) => product.id)
  );
  const suggestions = Array.isArray(payload.suggestions)
    ? payload.suggestions
        .filter(
          (entry): entry is Record<string, unknown> =>
            typeof entry === "object" && entry !== null
        )
        .map((entry) => {
          const productId = typeof entry.productId === "string" ? entry.productId : "";
          const product = products.find((item) => item.id === productId);
          if (!product || !validProductIds.has(product.id)) return undefined;
          return {
            productId: product.id,
            label:
              typeof entry.label === "string" && entry.label.trim()
                ? entry.label.slice(0, 120)
                : toSuggestion(product).label
          };
        })
        .filter((entry): entry is ChatProductSuggestion => Boolean(entry))
        .slice(0, 3)
    : [];

  const actions = Array.isArray(payload.actions)
    ? payload.actions
        .map(decodeAction)
        .filter((entry): entry is ChatAction => Boolean(entry))
        .slice(0, 3)
    : undefined;

  return {
    text: payload.text.slice(0, 1000),
    suggestions,
    choices: Array.isArray(payload.choices)
      ? (payload.choices as ChatChoice[]).slice(0, 8)
      : undefined,
    action: decodeAction(payload.action),
    actions,
    capturedPreferences,
    mode: payload.mode === "fallback" ? "fallback" : "live",
    inventoryMode: payload.inventoryMode === "live" ? "live" : "demo"
  };
};

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

    return responseFromApi(await response.json());
  }
}

const preferenceSummary = (preferences: CapturedPreferences) => {
  const parts = [
    preferences.pickupDate ? `für ${preferences.pickupDate}` : undefined,
    preferences.recipient
      ? `für Ihre${preferences.recipient === "Mutter" ? " Mutter" : ` ${preferences.recipient}`}`
      : undefined,
    preferences.occasion ? `zum Anlass ${preferences.occasion}` : undefined,
    preferences.budgetMax !== undefined ? `bis ${preferences.budgetMax} €` : undefined,
    preferences.color ? `in ${preferences.color}` : undefined
  ].filter(Boolean);
  return parts.length ? parts.join(", ") : "für Ihren Wunsch";
};

const hasPurchaseIntent = (text: string) =>
  /strauß|straeuss|blumen|mutter|mama|budget|euro|€|rosa|rosé|morgen|vorbestell|reserv|geschenk|geburtstag/.test(
    text
  );

const withCaptured = (
  response: Omit<ChatResponse, "capturedPreferences" | "mode" | "inventoryMode">,
  capturedPreferences: CapturedPreferences
): ChatResponse => ({
  ...response,
  capturedPreferences,
  mode: "fallback",
  inventoryMode: "demo"
});

export class DemoChatService implements ChatService {
  async ask(
    question: string,
    preferences: ChatPreferences = {},
    history: ChatHistoryMessage[] = []
  ): Promise<ChatResponse> {
    void history;
    await new Promise((resolve) => globalThis.setTimeout(resolve, 420));

    const normalized = question.trim().toLocaleLowerCase("de-DE");
    const capturedPreferences = mergeChatPreferences(
      preferences,
      extractPreferencesFromText(question, preferences)
    );

    if (/wie viele|wieviel|stück|noch da|bestand|lager/.test(normalized)) {
      return withCaptured(
        {
          text:
            "Die gezeigten Mengen gehören nur zum Beispielsortiment und sind kein bestätigter Ladenbestand. Für eine bestimmte Sorte oder Farbe prüft das Team den aktuellen Stand gern kurz telefonisch.",
          action: callAction()
        },
        capturedPreferences
      );
    }

    if (/liefer|liefern|nach siegen|versand/.test(normalized)) {
      return withCaptured(
        {
          text:
            "Eine Lieferung kann ich aus dieser Demo nicht verbindlich zusagen. Für Ort, Termin und Machbarkeit ist ein kurzes Gespräch mit dem Laden am zuverlässigsten.",
          action: callAction("Lieferwunsch kurz besprechen")
        },
        capturedPreferences
      );
    }

    if (hasPurchaseIntent(normalized)) {
      const matches = filterRecommendedProducts(products, capturedPreferences);
      if (matches.length > 0) {
        const suggestions = toSuggestions(matches);
        const reserve: ChatAction = {
          type: "reserve",
          label: "Wunsch zur Vorbestellung vorbereiten",
          page: "reservation",
          productId: suggestions[0]?.productId
        };
        return withCaptured(
          {
            text: `Ich habe Ihren Wunsch ${preferenceSummary(capturedPreferences)} aufgenommen. Diese Auswahl passt im Demo-Sortiment am besten – Preise und Sortiment sind Beispiele, nicht live bestätigt. Soll ich daraus direkt eine Anfrage zur persönlichen Bestätigung vorbereiten?`,
            suggestions,
            action: reserve,
            actions: [callAction("Lieber kurz anrufen")]
          },
          capturedPreferences
        );
      }

      return withCaptured(
        {
          text: `Für ${preferenceSummary(capturedPreferences)} finde ich in den Demo-Beispielen gerade keinen sicheren Treffer. Das Team kann Farben und Alternativen telefonisch persönlich abgleichen.`,
          action: callAction("Alternative kurz besprechen")
        },
        capturedPreferences
      );
    }

    if (/rose|rosen/.test(normalized)) {
      const roseProducts = availableProducts
        .filter((product) =>
          product.materials.some((material) => /rose/i.test(material))
        )
        .slice(0, 3);
      return withCaptured(
        {
          text:
            "Rosen sind im Beispielsortiment in mehreren Richtungen vertreten. Die Auswahl ist nicht live bestätigt – für eine bestimmte Farbe oder Menge rufen Sie am besten kurz an.",
          suggestions: toSuggestions(roseProducts),
          action: callAction()
        },
        capturedPreferences
      );
    }

    if (/pflege|wasser|vase|anschneid|haltbar/.test(normalized)) {
      return withCaptured(
        {
          text:
            "Kurz gesagt: saubere Vase, Blätter unter der Wasserlinie entfernen, Stiele schräg anschneiden, Wasser regelmäßig wechseln und den Strauß nicht direkt an Sonne oder Heizung stellen.",
          action: { type: "navigate", label: "Blumenwissen öffnen", page: "knowledge" }
        },
        capturedPreferences
      );
    }

    if (/öffnungs|offen|auf\?|adresse|wo finde|anfahrt/.test(normalized)) {
      return withCaptured(
        {
          text:
            "Die bestätigten Zeiten und die Adresse finden Sie auf der Startseite. Bei Feiertagen können Zeiten abweichen – für eine sichere Auskunft hilft ein kurzer Anruf.",
          action: callAction()
        },
        capturedPreferences
      );
    }

    if (/restpost|sale|rabatt|günstig|guenstig/.test(normalized)) {
      return withCaptured(
        {
          text:
            "Die Restposten-Seite zeigt den Demo-Ablauf. Rabatt, Zustand und konkrete Verfügbarkeit müssen im Laden bestätigt werden.",
          action: { type: "navigate", label: "Demo-Restposten ansehen", page: "sale" }
        },
        capturedPreferences
      );
    }

    if (/danke|ok|gut|super|passt/.test(normalized)) {
      return withCaptured(
        {
          text:
            "Sehr gern. Wenn ein Beispiel für Sie passt, bereite ich die Anfrage mit den gemerkten Wünschen vor – verbindlich wird sie erst nach persönlicher Bestätigung.",
          action: {
            type: "reserve",
            label: "Anfrage vorbereiten",
            page: "reservation"
          }
        },
        capturedPreferences
      );
    }

    const suggestions = toSuggestions(filterRecommendedProducts(products, capturedPreferences));
    return withCaptured(
      {
        text:
          "Ich helfe Ihnen gern bei Anlass, Farbwelt, Stil und Budget. Was ist der wichtigste Rahmen für Ihren Strauß?",
        suggestions,
        choices: getChatChoices("occasion").slice(0, 5)
      },
      capturedPreferences
    );
  }
}
