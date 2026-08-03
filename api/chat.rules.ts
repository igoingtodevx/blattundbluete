import { products } from "../src/data/products.js";
import type { ChatAction, CapturedPreferences, OpeningStatus, PageId } from "./chat.types.js";

export const CANONICAL_CALL_HREF = "tel:+492734433990";
export const INVENTORY_MODE = "demo" as const;
export const TIMEZONE = "Europe/Berlin" as const;

const allowedPages = new Set<PageId>([
  "home",
  "products",
  "sale",
  "knowledge",
  "about",
  "reservation"
]);

const occasionAliases: Record<string, string> = {
  geburtstag: "geburtstag",
  hochzeit: "hochzeit",
  trauer: "trauer",
  beerdigung: "trauer",
  trost: "trost",
  date: "date",
  liebe: "liebe",
  dankeschön: "dankeschön",
  dankeschoen: "dankeschön",
  dankeschon: "dankeschön",
  muttertag: "muttertag",
  jubiläum: "jubiläum",
  jubilaeum: "jubiläum",
  geschenk: "geschenk",
  wohnung: "wohnung",
  spontan: "spontan",
  tischdeko: "tischdeko",
  advent: "advent",
  abschied: "abschied",
  besserung: "gute besserung",
  "gute besserung": "gute besserung"
};

const styleAliases: Record<string, string> = {
  natürlich: "natürlich",
  natuerlich: "natürlich",
  locker: "natürlich",
  romantisch: "romantisch",
  bunt: "bunt",
  fröhlich: "bunt",
  froehlich: "bunt",
  ruhig: "ruhig",
  elegant: "ruhig",
  modern: "modern",
  minimalistisch: "minimalistisch",
  schlicht: "minimalistisch",
  wild: "wild"
};

const colorAliases: Record<string, string> = {
  rosa: "rosa",
  rose: "rosa",
  pink: "pink",
  rosé: "rosé",
  rot: "rot",
  burgund: "burgund",
  weiß: "weiß",
  weiss: "weiß",
  creme: "creme",
  gelb: "gelb",
  orange: "orange",
  apricot: "apricot",
  blau: "blau",
  grün: "grün",
  gruen: "grün",
  salbei: "salbei",
  lila: "lila",
  violett: "lila",
  pastell: "pastell",
  bunt: "bunt",
  natur: "natur"
};

const recipientAliases: Record<string, string> = {
  mutter: "Mutter",
  mama: "Mutter",
  mutti: "Mutter",
  oma: "Oma",
  grossmutter: "Oma",
  großmutter: "Oma",
  freundin: "Freundin",
  freund: "Freund",
  partnerin: "Partnerin",
  partner: "Partner",
  kollege: "Kollege",
  kollegin: "Kollegin",
  kollegen: "Kollegen",
  papa: "Papa",
  vater: "Vater",
  kind: "Kind",
  kinder: "Kinder"
};

const normalizeKey = (value: string) =>
  value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("de-DE")
    .trim()
    .replace(/\s+/g, " ");

const removeControlCharacters = (value: string) =>
  [...value]
    .filter((character) => {
      const code = character.charCodeAt(0);
      return code > 31 && code !== 127;
    })
    .join("");

const cleanText = (value: string, maxLength: number) =>
  removeControlCharacters(value)
    .replace(/[{}<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);

const hasPromptInjectionMarker = (value: string) =>
  /(?:system\s*prompt|ignore\s+(?:all\s+)?(?:previous|your|the)\s+instructions|jailbreak|developer\s+message)/i.test(
    value
  );

const normalizeChoice = (value: unknown, aliases: Record<string, string>) => {
  if (typeof value !== "string") return undefined;
  const cleaned = cleanText(value, 48);
  if (!cleaned || hasPromptInjectionMarker(cleaned)) return undefined;
  return aliases[normalizeKey(cleaned)];
};

const normalizeRecipient = (value: unknown) => {
  if (typeof value !== "string") return undefined;
  const cleaned = cleanText(value, 64);
  if (!cleaned || hasPromptInjectionMarker(cleaned)) return undefined;
  if (!/^[\p{L}\d][\p{L}\d .,'&()/-]*$/u.test(cleaned)) return undefined;
  const known = recipientAliases[normalizeKey(cleaned)];
  return known || cleaned;
};

const normalizeSpecialWishes = (value: unknown) => {
  if (typeof value !== "string") return undefined;
  const cleaned = cleanText(value, 240);
  if (!cleaned || hasPromptInjectionMarker(cleaned)) return undefined;
  return cleaned;
};

const isValidDateKey = (value: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
};

const normalizeDate = (value: unknown) => {
  if (typeof value !== "string") return undefined;
  const cleaned = cleanText(value, 32);
  return isValidDateKey(cleaned) ? cleaned : undefined;
};

const normalizeTime = (value: unknown) => {
  if (typeof value !== "string") return undefined;
  const cleaned = cleanText(value, 16).toLocaleLowerCase("de-DE");
  const match = /^(\d{1,2})(?::(\d{2}))?(?:\s*uhr)?$/.exec(cleaned);
  if (!match) return undefined;
  const hour = Number(match[1]);
  const minute = Number(match[2] || 0);
  if (hour > 23 || minute > 59) return undefined;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
};

export function normalizeBudgetMax(value: unknown): number | undefined {
  if (typeof value === "number") {
    if (!Number.isFinite(value) || value <= 0 || value > 10_000) return undefined;
    return Math.round(value * 100) / 100;
  }
  if (typeof value !== "string") return undefined;
  const cleaned = normalizeKey(value).replace(/€/g, " euro");
  const range = /^(?:bis[- ]?15|16[- ]25)$/.exec(cleaned);
  if (range) return range[0].startsWith("bis") ? 15 : 25;
  if (/^(?:41[- ]60)$/.test(cleaned)) return 60;
  if (/^(?:60[- ]plus|über 60|ueber 60)$/.test(cleaned)) return 10_000;
  const match = cleaned.match(/\d{1,4}(?:[.,]\d{1,2})?/);
  if (!match) return undefined;
  const numeric = Number(match[0].replace(",", "."));
  return normalizeBudgetMax(numeric);
}

export function sanitizePreferences(raw: unknown): CapturedPreferences {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return {};
  const candidate = raw as Record<string, unknown>;
  const result: CapturedPreferences = {};
  const occasion = normalizeChoice(candidate.occasion, occasionAliases);
  const recipient = normalizeRecipient(candidate.recipient);
  const budgetMax = normalizeBudgetMax(candidate.budgetMax ?? candidate.budget);
  const style = normalizeChoice(candidate.style, styleAliases);
  const color = normalizeChoice(candidate.color, colorAliases);
  const pickupDate = normalizeDate(candidate.pickupDate);
  const pickupTime = normalizeTime(candidate.pickupTime);
  const specialWishes = normalizeSpecialWishes(candidate.specialWishes ?? candidate.wishes);

  if (occasion) result.occasion = occasion;
  if (recipient) result.recipient = recipient;
  if (budgetMax !== undefined) result.budgetMax = budgetMax;
  if (style) result.style = style;
  if (color) result.color = color;
  if (pickupDate) result.pickupDate = pickupDate;
  if (pickupTime) result.pickupTime = pickupTime;
  if (specialWishes) result.specialWishes = specialWishes;
  if (typeof candidate.upsellOffered === "boolean") result.upsellOffered = candidate.upsellOffered;
  if (typeof candidate.upsellDeclined === "boolean") result.upsellDeclined = candidate.upsellDeclined;
  return result;
}

function berlinDateParts(now: Date) {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  });
  const parts = Object.fromEntries(formatter.formatToParts(now).map((part) => [part.type, part.value]));
  const date = `${parts.year}-${parts.month}-${parts.day}`;
  const weekday = new Date(Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day))).getUTCDay();
  return {
    date,
    time: `${parts.hour}:${parts.minute}`,
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    weekday
  };
}

function addBerlinDays(dateKey: string, days: number) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const result = new Date(Date.UTC(year, month - 1, day + days));
  return result.toISOString().slice(0, 10);
}

function dateForTime(dateKey: string, time: string) {
  return `${dateKey}T${time}`;
}

function nextWeekdayOpening(dateKey: string, weekday: number) {
  let offset = 1;
  while (true) {
    const candidate = (weekday + offset) % 7;
    if (candidate !== 0) return dateForTime(addBerlinDays(dateKey, offset), candidate === 6 ? "09:00" : "09:00");
    offset += 1;
  }
}

const weekdayLabels = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];

export function getOpeningStatus(now: Date): OpeningStatus {
  const local = berlinDateParts(now);
  const isWeekday = local.weekday >= 1 && local.weekday <= 5;
  const isSaturday = local.weekday === 6;
  const firstClose = isSaturday ? 13 * 60 : 12 * 60 + 30;
  const secondOpen = 14 * 60;
  const closing = isSaturday ? 13 * 60 : 18 * 60;
  const currentMinutes = local.hour * 60 + local.minute;
  let state: OpeningStatus["state"] = "closed";
  let reason: OpeningStatus["reason"] = "after-closing";
  let nextOpening: string | null = null;

  if (local.weekday === 0) {
    reason = "sunday";
    nextOpening = nextWeekdayOpening(local.date, local.weekday);
  } else if (currentMinutes < 9 * 60) {
    reason = "before-opening";
    nextOpening = dateForTime(local.date, "09:00");
  } else if (currentMinutes < firstClose) {
    state = "open";
    reason = "open";
  } else if (isWeekday && currentMinutes < secondOpen) {
    state = "break";
    reason = "lunch-break";
    nextOpening = dateForTime(local.date, "14:00");
  } else if (currentMinutes < closing) {
    state = "open";
    reason = "open";
  } else {
    reason = "after-closing";
    nextOpening = nextWeekdayOpening(local.date, local.weekday);
  }

  if (!isWeekday && !isSaturday && local.weekday !== 0) {
    nextOpening = nextWeekdayOpening(local.date, local.weekday);
  }

  return {
    timezone: TIMEZONE,
    localDate: local.date,
    localTime: local.time,
    weekday: local.weekday,
    weekdayLabel: weekdayLabels[local.weekday] || "",
    isOpen: state === "open",
    state,
    reason,
    nextOpening
  };
}

const readableNextOpening = (status: OpeningStatus) => {
  if (!status.nextOpening) return "";
  const [date, time] = status.nextOpening.split("T");
  const [year, month, day] = date.split("-").map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return `${weekdayLabels[weekday]} um ${time} Uhr`;
};

export function renderOpeningAnswer(status: OpeningStatus) {
  if (status.isOpen) {
    if (status.weekday === 6) {
      return "Ja, heute ist regulär geöffnet – samstags von 09:00 bis 13:00 Uhr. Feiertagszeiten können abweichen.";
    }
    return `Ja, heute ist regulär geöffnet – am ${status.weekdayLabel} von 09:00 bis 12:30 Uhr und nach der Mittagspause wieder von 14:00 bis 18:00 Uhr. Feiertagszeiten können abweichen.`;
  }
  if (status.reason === "lunch-break") {
    return `Gerade ist Mittagspause. Die nächste reguläre Öffnung ist heute um 14:00 Uhr. Feiertagszeiten können abweichen.`;
  }
  return `Heute ist geschlossen. Die nächste reguläre Öffnung ist ${readableNextOpening(status)}. Feiertagszeiten können abweichen.`;
}

export function extractPreferences(question: string, now: Date): Partial<CapturedPreferences> {
  const result: Partial<CapturedPreferences> = {};
  const input = cleanText(question, 500);
  const normalized = normalizeKey(input);
  const budgetMatch = input.match(/(?:max(?:imal)?|bis zu|bis|budget|für|fuer)?\s*(\d{1,4}(?:[.,]\d{1,2})?)\s*(?:€|euro|eur)/i);
  const budgetMax = budgetMatch ? normalizeBudgetMax(budgetMatch[1]) : undefined;
  if (budgetMax !== undefined) result.budgetMax = budgetMax;

  for (const [key, label] of Object.entries(recipientAliases)) {
    const escaped = normalizeKey(key).replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&");
    if (new RegExp(`\\b${escaped}\\b`, "i").test(normalized)) {
      result.recipient = label;
      break;
    }
  }

  for (const [key, value] of Object.entries(colorAliases)) {
    const escaped = normalizeKey(key).replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&");
    if (new RegExp(`\\b${escaped}\\b`, "i").test(normalized)) {
      result.color = value;
      break;
    }
  }

  for (const [key, value] of Object.entries(styleAliases)) {
    const escaped = normalizeKey(key).replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&");
    if (new RegExp(`\\b${escaped}\\b`, "i").test(normalized)) {
      result.style = value;
      break;
    }
  }

  for (const [key, value] of Object.entries(occasionAliases)) {
    const escaped = normalizeKey(key).replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&");
    if (new RegExp(`(?:^|\\s|,)${escaped}(?:$|\\s|[,.!?])`, "i").test(normalized)) {
      result.occasion = value;
      break;
    }
  }

  const explicitDate = input.match(/\b(?:am|für|fuer)?\s*(\d{1,2})[./-](\d{1,2})(?:[./-](\d{2,4}))?\b/i);
  if (explicitDate) {
    const year = Number(explicitDate[3] || berlinDateParts(now).date.slice(0, 4));
    const yearValue = year < 100 ? 2_000 + year : year;
    const candidate = `${yearValue}-${String(Number(explicitDate[2])).padStart(2, "0")}-${String(Number(explicitDate[1])).padStart(2, "0")}`;
    if (isValidDateKey(candidate)) result.pickupDate = candidate;
  } else if (/\bübermorgen\b|\buebermorgen\b/i.test(input)) {
    result.pickupDate = addBerlinDays(berlinDateParts(now).date, 2);
  } else if (/\bmorgen\b/i.test(input)) {
    result.pickupDate = addBerlinDays(berlinDateParts(now).date, 1);
  } else if (/\bheute\b/i.test(input)) {
    result.pickupDate = berlinDateParts(now).date;
  }

  const relativeTimeMatch = input.match(/(?:gegen|um|ab|ca\.?|circa)\s*(\d{1,2})(?::(\d{2}))?\s*(?:uhr)?\b/i);
  const explicitTimeMatch = input.match(/\b(\d{1,2})(?::(\d{2}))?\s*uhr\b/i) || input.match(/\b(\d{1,2}):(\d{2})\b/);
  const timeMatch = relativeTimeMatch || explicitTimeMatch;
  if (timeMatch) result.pickupTime = normalizeTime(`${timeMatch[1]}:${timeMatch[2] || "00"}`);

  const wishesMatch = input.match(/(?:sonderwunsch|sonderwünsche|wunsch|wünsche|bitte beachten)\s*[:,-]?\s*([^.!?\n]{1,240})/i);
  const wishes = wishesMatch ? normalizeSpecialWishes(wishesMatch[1]) : undefined;
  if (wishes) result.specialWishes = wishes;

  if (/(?:kein(?:en|e)?\s+(?:zusatz|upgrade|extra)|ohne\s+(?:zusatz|upgrade|extra)|nein\s*,?\s*danke)/i.test(input)) {
    result.upsellDeclined = true;
  }
  return result;
}

export function mergePreferences(
  previous: CapturedPreferences,
  ...updates: Partial<CapturedPreferences>[]
): CapturedPreferences {
  const result = sanitizePreferences(previous);
  for (const update of updates) {
    const safe = sanitizePreferences(update);
    for (const key of [
      "occasion",
      "recipient",
      "budgetMax",
      "style",
      "color",
      "pickupDate",
      "pickupTime",
      "specialWishes"
    ] as const) {
      const value = safe[key];
      if (value !== undefined) (result as Record<string, unknown>)[key] = value;
    }
    if (safe.upsellOffered) result.upsellOffered = true;
    if (safe.upsellDeclined) result.upsellDeclined = true;
  }
  return result;
}

const normalizeProductText = (value: string) => normalizeKey(value).replace(/-/g, " ");

const matchesColor = (productColors: string[], requestedColor: string) => {
  const requested = normalizeProductText(requestedColor);
  if (requested === "bunt") return productColors.length > 1;
  return productColors.some((color) => {
    const candidate = normalizeProductText(color);
    if (requested === "rosa" || requested === "rose") return /rosa|rose|pink/.test(candidate);
    if (requested === "weiss") return /weiss|creme/.test(candidate);
    return candidate.includes(requested) || requested.includes(candidate);
  });
};

export function filterSuggestionIds(ids: unknown, preferences: CapturedPreferences): string[] {
  if (!Array.isArray(ids)) return [];
  const safePreferences = sanitizePreferences(preferences);
  const seen = new Set<string>();
  const result: string[] = [];
  for (const id of ids) {
    if (typeof id !== "string" || seen.has(id)) continue;
    const product = products.find((entry) => entry.id === id);
    if (!product || product.stock <= 0 || product.status === "soldout") continue;
    const price = product.priceMax ?? product.price;
    if (safePreferences.budgetMax !== undefined && price > safePreferences.budgetMax) continue;
    if (safePreferences.color && !matchesColor(product.colors, safePreferences.color)) continue;
    if (safePreferences.occasion) {
      const requestedOccasion = normalizeProductText(safePreferences.occasion);
      const matchesOccasion = product.occasions.some((occasion) => {
        const candidate = normalizeProductText(occasion);
        return candidate === requestedOccasion || candidate.includes(requestedOccasion) || requestedOccasion.includes(candidate);
      });
      if (!matchesOccasion) continue;
    }
    seen.add(id);
    result.push(id);
    if (result.length >= 3) break;
  }
  return result;
}

export function validateAction(raw: unknown): ChatAction | undefined {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return undefined;
  const candidate = raw as Record<string, unknown>;
  const type = typeof candidate.type === "string" ? candidate.type : "navigate";
  const label = typeof candidate.label === "string" ? cleanText(candidate.label, 64) : "";
  if (!label) return undefined;
  if (type === "call") return { type: "call", label, href: CANONICAL_CALL_HREF };
  if (type === "reserve") return { type: "reserve", label, page: "reservation" };
  if (type === "navigate" && typeof candidate.page === "string" && allowedPages.has(candidate.page as PageId)) {
    return { type: "navigate", label, page: candidate.page as PageId };
  }
  return undefined;
}

export function shouldAllowUpsell(preferences: CapturedPreferences) {
  return preferences.upsellOffered !== true && preferences.upsellDeclined !== true;
}

export function getInventoryMode() {
  return products.every((product) => product.inventorySource === "live-synced") ? "live" : INVENTORY_MODE;
}
