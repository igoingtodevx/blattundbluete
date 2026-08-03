export type PageId =
  | "home"
  | "products"
  | "sale"
  | "knowledge"
  | "about"
  | "reservation";

export type ChatChoiceKey = "occasion" | "budget" | "style" | "color" | "pickup";

export interface CapturedPreferences {
  occasion?: string;
  recipient?: string;
  budgetMax?: number;
  style?: string;
  color?: string;
  pickupDate?: string;
  pickupTime?: string;
  specialWishes?: string;
  upsellOffered?: boolean;
  upsellDeclined?: boolean;
}

export interface ChatHistoryMessage {
  role: "user" | "assistant";
  text: string;
}

export interface ChatChoice {
  key: ChatChoiceKey;
  value: string;
  label: string;
}

export interface ChatProductSuggestion {
  productId: string;
  label: string;
}

export type ChatAction =
  | { type: "navigate"; label: string; page: PageId }
  | { type: "reserve"; label: string; page: "reservation" }
  | { type: "call"; label: string; href: string };

export interface ChatResponse {
  text: string;
  suggestions: ChatProductSuggestion[];
  choices: ChatChoice[];
  action?: ChatAction;
  capturedPreferences: CapturedPreferences;
  mode: "live" | "fallback";
  inventoryMode: "demo" | "live";
}

export interface ApiRequest {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
  body?: unknown;
}

export interface ApiResponse {
  status: (code: number) => ApiResponse;
  json: (body: unknown) => void;
}

export interface OpeningStatus {
  timezone: "Europe/Berlin";
  localDate: string;
  localTime: string;
  weekday: number;
  weekdayLabel: string;
  isOpen: boolean;
  state: "open" | "break" | "closed";
  reason: "open" | "before-opening" | "lunch-break" | "after-closing" | "sunday";
  nextOpening: string | null;
}

export interface ProviderConfig {
  bedrockToken: string;
  bedrockRegion: string;
  bedrockModel: string;
  openAiApiKey: string;
  openAiBaseUrl: string;
  openAiModel: string;
  timeoutMs: number;
}
