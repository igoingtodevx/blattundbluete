import { getProductById } from "../data/products";
import type {
  CapturedPreferences,
  ChatAction,
  ChatMessage,
  ChatProductSuggestion,
  ChatReservationPrefill,
  PageId,
  Product
} from "../types";

export const CHAT_STATE_STORAGE_KEY = "bb-chat-state-v1";
export const CHAT_RESERVATION_PREFILL_STORAGE_KEY =
  "bb-chat-reservation-prefill-v1";
export const CHAT_STATE_VERSION = 1 as const;
export const CHAT_PHONE_HREF = "tel:+492734433990" as const;

export interface PersistedChatState {
  version: typeof CHAT_STATE_VERSION;
  messages: ChatMessage[];
  preferences: CapturedPreferences;
  open: boolean;
}

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const getSessionStorage = (): StorageLike | undefined => {
  if (typeof window === "undefined") return undefined;
  try {
    return window.sessionStorage;
  } catch {
    return undefined;
  }
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const cleanString = (value: unknown, maxLength: number): string | undefined => {
  if (typeof value !== "string") return undefined;
  const cleaned = value.trim().replace(/\s+/g, " ");
  return cleaned ? cleaned.slice(0, maxLength) : undefined;
};

const cleanDate = (value: unknown): string | undefined =>
  typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? value
    : undefined;

const cleanTime = (value: unknown): string | undefined =>
  typeof value === "string" && /^\d{2}:\d{2}$/.test(value)
    ? value
    : undefined;

export const sanitizeCapturedPreferences = (
  value: unknown
): CapturedPreferences => {
  if (!isRecord(value)) return {};

  const budgetMax =
    typeof value.budgetMax === "number" && Number.isFinite(value.budgetMax)
      ? Math.min(1000, Math.max(1, Math.round(value.budgetMax)))
      : undefined;

  return {
    occasion: cleanString(value.occasion, 80),
    recipient: cleanString(value.recipient, 80),
    budgetMax,
    style: cleanString(value.style, 80),
    color: cleanString(value.color, 80),
    pickupDate: cleanDate(value.pickupDate),
    pickupTime: cleanTime(value.pickupTime),
    specialWishes: cleanString(value.specialWishes, 240),
    upsellOffered:
      typeof value.upsellOffered === "boolean" ? value.upsellOffered : undefined,
    upsellDeclined:
      typeof value.upsellDeclined === "boolean" ? value.upsellDeclined : undefined
  };
};

const berlinDateParts = (now: Date) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(now);
  const get = (type: string) => parts.find((part) => part.type === type)?.value;
  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day"))
  };
};

const relativeDate = (offset: number, now: Date): string => {
  const base = berlinDateParts(now);
  const date = new Date(Date.UTC(base.year, base.month - 1, base.day + offset));
  return date.toISOString().slice(0, 10);
};

const hourWords: Record<string, number> = {
  eins: 1,
  ein: 1,
  zwei: 2,
  drei: 3,
  vier: 4,
  fünf: 5,
  fuenf: 5,
  sechs: 6,
  sieben: 7,
  acht: 8,
  neun: 9,
  zehn: 10,
  elf: 11,
  zwölf: 12,
  zwoelf: 12
};

const parsePickupTime = (text: string): string | undefined => {
  const numeric = text.match(
    /\b(?:um|gegen)?\s*(\d{1,2})(?::|\.)(\d{2})\s*uhr?\b/
  );
  const numericHour = text.match(/\b(?:um|gegen)\s*(\d{1,2})\s*uhr?\b/);
  const wordHour = text.match(
    /\b(?:um|gegen)\s+(eins?|zwei|drei|vier|fünf|fuenf|sechs|sieben|acht|neun|zehn|elf|zwölf|zwoelf)\s*(?:uhr)?\b/
  );
  const hour = numeric?.[1] ?? numericHour?.[1];
  const minute = numeric?.[2] ?? "00";
  const parsedHour = hour
    ? Number(hour)
    : wordHour
      ? hourWords[wordHour[1]]
      : undefined;
  if (parsedHour === undefined || parsedHour > 23) return undefined;
  return `${String(parsedHour).padStart(2, "0")}:${minute}`;
};

const findBudget = (text: string): number | undefined => {
  const match = text.match(
    /(?:maximal|höchstens|bis\s+zu|bis|unter|ungefähr|etwa|rund|ca\.?)?\s*(\d{1,3})(?:[,.]\d{1,2})?\s*(?:€|euro)(?!\w)/
  );
  return match ? Number(match[1]) : undefined;
};

const colorAliases: Record<string, string[]> = {
  rosa: ["rosa", "rosé", "rose", "pink", "apricot"],
  rot: ["rot", "burgund", "rost", "pflaume"],
  weiß: ["weiß", "weiss", "creme"],
  blau: ["blau"],
  gelb: ["gelb"],
  grün: ["grün", "gruen", "olive", "salbei"]
};

const findColor = (text: string): string | undefined => {
  const entry = Object.entries(colorAliases).find(([, aliases]) =>
    aliases.some((alias) => text.includes(alias))
  );
  return entry?.[0];
};

const findOccasion = (text: string): string | undefined => {
  const occasions: [RegExp, string][] = [
    [/geburtstag|geburtstags?/, "geburtstag"],
    [/hochzeit|trauung|feier/, "hochzeit"],
    [/dankeschön|dankeschoen|danke/, "dankeschön"],
    [/gute besserung|krank/, "gute besserung"],
    [/trauer|beerdigung|kondolenz/, "trauer"],
    [/date|liebe|romant/, "liebe"],
    [/wohnung|zuhause|tisch/, "wohnung"]
  ];
  return occasions.find(([pattern]) => pattern.test(text))?.[1];
};

const findRecipient = (text: string): string | undefined => {
  const recipients: [RegExp, string][] = [
    [/mutter|mama|mutti/, "Mutter"],
    [/vater|papa/, "Vater"],
    [/oma|großmutter|grossmutter/, "Großmutter"],
    [/freundin|partnerin/, "Freundin"],
    [/freund|partner/, "Freund"],
    [/kolleg(?:e|in)/, "Kollegium"]
  ];
  return recipients.find(([pattern]) => pattern.test(text))?.[1];
};

const findStyle = (text: string): string | undefined => {
  if (/natürlich|natuerlich|wild|locker|wiesen/.test(text)) return "natürlich";
  if (/romant|zart|liebevoll/.test(text)) return "romantisch";
  if (/bunt|fröhlich|froehlich|farbig/.test(text)) return "bunt";
  if (/ruhig|elegant|schlicht|minimal/.test(text)) return "ruhig";
  return undefined;
};

const findSpecialWishes = (question: string): string | undefined => {
  if (!/karte|schleife|ohne\s+duft|allerg|trocken|persönlich|persoenlich/.test(question)) {
    return undefined;
  }
  const sentence = question.match(
    /(?:mit|ohne|bitte|wunsch|wünsche|wuensche)\s+([^.!?]{3,100})/i
  );
  return cleanString(sentence?.[0] ?? question, 240);
};

export const extractPreferencesFromText = (
  question: string,
  _current: CapturedPreferences = {},
  now = new Date()
): CapturedPreferences => {
  const text = question.trim().toLocaleLowerCase("de-DE");
  if (!text) return {};

  const result: CapturedPreferences = {
    recipient: findRecipient(text),
    occasion: findOccasion(text),
    budgetMax: findBudget(text),
    color: findColor(text),
    style: findStyle(text),
    specialWishes: findSpecialWishes(text)
  };

  if (/übermorgen|uebermorgen/.test(text)) result.pickupDate = relativeDate(2, now);
  else if (/morgen/.test(text)) result.pickupDate = relativeDate(1, now);
  else if (/heute/.test(text)) result.pickupDate = relativeDate(0, now);

  result.pickupTime = parsePickupTime(text);
  return sanitizeCapturedPreferences({ ..._current, ...result });
};

export const mergeChatPreferences = (
  current: CapturedPreferences = {},
  delta: CapturedPreferences = {}
): CapturedPreferences => {
  const next = sanitizeCapturedPreferences({ ...current, ...delta });
  return Object.fromEntries(
    Object.entries(next).filter(([, value]) => value !== undefined)
  ) as CapturedPreferences;
};

const normalize = (value: string) =>
  value
    .toLocaleLowerCase("de-DE")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const matchesColor = (product: Product, requested: string) => {
  const aliases = colorAliases[normalize(requested)] ?? [requested];
  return product.colors.some((color) => {
    const normalized = normalize(color);
    return aliases.some((alias) => normalized.includes(normalize(alias)));
  });
};

const matchesOccasion = (product: Product, requested: string) => {
  const needle = normalize(requested);
  return product.occasions.some((occasion) => normalize(occasion).includes(needle));
};

export const filterRecommendedProducts = (
  allProducts: Product[],
  preferences: CapturedPreferences = {},
  limit = 3
): Product[] => {
  let candidates = allProducts.filter(
    (product) => product.stock > 0 && product.status !== "soldout"
  );

  if (preferences.budgetMax !== undefined) {
    candidates = candidates.filter(
      (product) => (product.priceMax ?? product.price) <= preferences.budgetMax!
    );
  }

  if (preferences.color) {
    candidates = candidates.filter((product) => matchesColor(product, preferences.color!));
  }

  if (preferences.occasion) {
    const occasionMatches = candidates.filter((product) =>
      matchesOccasion(product, preferences.occasion!)
    );
    if (occasionMatches.length > 0) candidates = occasionMatches;
  }

  if (preferences.recipient) {
    const recipientMatches = candidates.filter((product) =>
      matchesOccasion(product, preferences.recipient!)
    );
    if (recipientMatches.length > 0) candidates = recipientMatches;
  }

  return candidates
    .map((product) => {
      let score = 0;
      if (preferences.color && matchesColor(product, preferences.color)) score += 4;
      if (preferences.occasion && matchesOccasion(product, preferences.occasion)) score += 4;
      if (preferences.recipient && matchesOccasion(product, preferences.recipient)) score += 3;
      if (preferences.style) {
        const text = normalize(
          `${product.description} ${product.colors.join(" ")} ${product.materials.join(" ")}`
        );
        if (text.includes(normalize(preferences.style))) score += 2;
      }
      return { product, score };
    })
    .sort(
      (a, b) =>
        b.score - a.score ||
        (a.product.priceMax ?? a.product.price) -
          (b.product.priceMax ?? b.product.price)
    )
    .slice(0, Math.max(1, Math.min(limit, 3)))
    .map(({ product }) => product);
};

const knownPages: PageId[] = [
  "home",
  "products",
  "sale",
  "knowledge",
  "about",
  "reservation"
];

export const validateChatAction = (value: unknown): ChatAction | undefined => {
  if (!isRecord(value)) return undefined;
  const label = cleanString(value.label, 80);
  if (!label || typeof value.type !== "string") return undefined;
  if (value.type === "call") {
    return value.href === CHAT_PHONE_HREF
      ? { type: "call", label, href: CHAT_PHONE_HREF }
      : undefined;
  }
  if (value.type === "navigate") {
    return typeof value.page === "string" && knownPages.includes(value.page as PageId)
      ? { type: "navigate", label, page: value.page as PageId }
      : undefined;
  }
  if (value.type === "reserve") {
    return value.page === "reservation"
      ? {
          type: "reserve",
          label,
          page: "reservation",
          productId: cleanString(value.productId, 100)
        }
      : undefined;
  }
  return undefined;
};

const suggestionList = (value: unknown): ChatProductSuggestion[] => {
  if (!Array.isArray(value)) return [];
  return value
    .filter(isRecord)
    .map((entry) => {
      const productId = cleanString(entry.productId, 100);
      const label = cleanString(entry.label, 120);
      return productId && label ? { productId, label } : undefined;
    })
    .filter((entry): entry is ChatProductSuggestion => Boolean(entry))
    .slice(0, 3);
};

const safeResponse = (value: unknown) => {
  if (!isRecord(value)) return undefined;
  const text = cleanString(value.text, 1000);
  if (!text) return undefined;
  const action = validateChatAction(value.action);
  const actions = Array.isArray(value.actions)
    ? value.actions
        .map(validateChatAction)
        .filter((entry): entry is ChatAction => Boolean(entry))
        .slice(0, 3)
    : undefined;
  const mode = value.mode === "live" ? "live" : "fallback";
  const inventoryMode = value.inventoryMode === "live" ? "live" : "demo";
  return {
    text,
    suggestions: suggestionList(value.suggestions),
    action,
    actions,
    capturedPreferences: sanitizeCapturedPreferences(value.capturedPreferences),
    mode,
    inventoryMode
  } as const;
};

const safeMessage = (value: unknown): ChatMessage | undefined => {
  if (!isRecord(value)) return undefined;
  const id = cleanString(value.id, 80);
  const text = cleanString(value.text, 1000);
  if (!id || !text || (value.role !== "user" && value.role !== "assistant")) {
    return undefined;
  }
  const response = safeResponse(value.response);
  return {
    id,
    role: value.role,
    text,
    response
  };
};

export const safeReadChatState = (
  storage: StorageLike | undefined = getSessionStorage()
): PersistedChatState | null => {
  if (!storage) return null;
  try {
    const raw = storage.getItem(CHAT_STATE_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || parsed.version !== CHAT_STATE_VERSION) return null;
    const messages = Array.isArray(parsed.messages)
      ? parsed.messages.map(safeMessage).filter((entry): entry is ChatMessage => Boolean(entry))
      : [];
    if (!messages.length) return null;
    return {
      version: CHAT_STATE_VERSION,
      messages: messages.slice(-32),
      preferences: sanitizeCapturedPreferences(parsed.preferences),
      open: parsed.open === true
    };
  } catch {
    return null;
  }
};

export const safeWriteChatState = (
  state: Pick<PersistedChatState, "messages" | "preferences" | "open">,
  storage: StorageLike | undefined = getSessionStorage()
) => {
  if (!storage) return;
  try {
    storage.setItem(
      CHAT_STATE_STORAGE_KEY,
      JSON.stringify({
        version: CHAT_STATE_VERSION,
        messages: state.messages.slice(-32).map((message) => ({
          ...message,
          text: message.text.slice(0, 1000)
        })),
        preferences: sanitizeCapturedPreferences(state.preferences),
        open: state.open === true
      })
    );
  } catch {
    // sessionStorage can be blocked or full; the chat remains usable in memory.
  }
};

export const formatReservationMessage = (
  prefill: Partial<ChatReservationPrefill>
): string => {
  const product = prefill.productId ? getProductById(prefill.productId) : undefined;
  const lines = ["Beratungsnotiz aus dem Blumen-Chat:"];
  if (product) lines.push(`Wunschprodukt: ${product.name} (Demo-Beispiel)`);
  if (prefill.occasion || prefill.recipient) {
    lines.push(
      `Anlass/Empfänger: ${[prefill.occasion, prefill.recipient].filter(Boolean).join(" · ")}`
    );
  }
  if (prefill.budgetMax !== undefined) lines.push(`Budgetrahmen: bis ${prefill.budgetMax} €`);
  if (prefill.style) lines.push(`Stil: ${prefill.style}`);
  if (prefill.color) lines.push(`Farbe: ${prefill.color}`);
  if (prefill.pickupDate) lines.push(`Wunschtermin: ${prefill.pickupDate}`);
  if (prefill.pickupTime) lines.push(`Wunschzeit: ${prefill.pickupTime} Uhr`);
  if (prefill.specialWishes) lines.push(`Weitere Wünsche: ${prefill.specialWishes}`);
  lines.push("Bitte im Laden persönlich bestätigen.");
  return lines.join("\n").slice(0, 900);
};

export const buildReservationPrefill = (
  preferences: CapturedPreferences,
  suggestions: ChatProductSuggestion[] = [],
  action?: Extract<ChatAction, { type: "reserve" }>
): ChatReservationPrefill => {
  const productId = action?.productId ?? suggestions[0]?.productId;
  const base = {
    id: `chat-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    productId,
    ...sanitizeCapturedPreferences(preferences)
  };
  return { ...base, message: formatReservationMessage(base) };
};

export const safeReadReservationPrefill = (
  storage: StorageLike | undefined = getSessionStorage()
): ChatReservationPrefill | null => {
  if (!storage) return null;
  try {
    const raw = storage.getItem(CHAT_RESERVATION_PREFILL_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return null;
    const id = cleanString(parsed.id, 100);
    if (!id) return null;
    const productId = cleanString(parsed.productId, 100);
    const preferences = sanitizeCapturedPreferences(parsed);
    return {
      id,
      productId,
      ...preferences,
      message:
        cleanString(parsed.message, 900) ??
        formatReservationMessage({ ...preferences, productId })
    };
  } catch {
    return null;
  }
};

export const safeWriteReservationPrefill = (
  prefill: ChatReservationPrefill,
  storage: StorageLike | undefined = getSessionStorage()
) => {
  if (!storage) return;
  try {
    storage.setItem(
      CHAT_RESERVATION_PREFILL_STORAGE_KEY,
      JSON.stringify({
        ...prefill,
        message: prefill.message.slice(0, 900),
        ...sanitizeCapturedPreferences(prefill)
      })
    );
  } catch {
    // Best effort only; no contact data is part of this draft.
  }
};

export const clearReservationPrefill = (
  storage: StorageLike | undefined = getSessionStorage()
) => {
  try {
    storage?.removeItem(CHAT_RESERVATION_PREFILL_STORAGE_KEY);
  } catch {
    // Ignore blocked storage.
  }
};
