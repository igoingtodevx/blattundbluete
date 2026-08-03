export type PageId =
  | "home"
  | "products"
  | "sale"
  | "knowledge"
  | "about"
  | "reservation";

export type ProductCategory = "bouquet" | "decor";
export type BouquetSize = "small" | "medium" | "large" | "decor";
export type ProductStatus = "available" | "low" | "soldout" | "sale";
export type InventorySource = "demo-unconfirmed" | "live-synced";
export type ChatMode = "live" | "fallback";
export type InventoryMode = "demo" | "live";

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: ProductCategory;
  size: BouquetSize;
  price: number;
  priceMax?: number;
  description: string;
  colors: string[];
  materials: string[];
  stock: number;
  unit: "Stück";
  occasions: string[];
  seasons: string[];
  saleEligible: boolean;
  status: ProductStatus;
  demo: true;
  inventorySource: InventorySource;
  lastInventoryUpdate: string;
  image: string;
  imagePosition?: string;
  materialNote?: string;
  dimensions?: string;
}

export interface ChatProductSuggestion {
  productId: string;
  label: string;
}

export type ChatChoiceKey =
  | "occasion"
  | "budget"
  | "style"
  | "color"
  | "pickup";

export interface ChatChoice {
  key: ChatChoiceKey;
  value: string;
  label: string;
}

/** Structured, contact-free facts captured during a consultation. */
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

/** Kept as a semantic alias for existing service call sites. */
export type ChatPreferences = CapturedPreferences;

export interface ChatHistoryMessage {
  role: "user" | "assistant";
  text: string;
}

export type ChatAction =
  | { type: "navigate"; label: string; page: PageId }
  | { type: "call"; label: string; href: "tel:+492734433990" }
  | {
      type: "reserve";
      label: string;
      page: "reservation";
      productId?: string;
    };

export interface ChatResponse {
  text: string;
  suggestions?: ChatProductSuggestion[];
  choices?: ChatChoice[];
  action?: ChatAction;
  actions?: ChatAction[];
  capturedPreferences?: CapturedPreferences;
  mode: ChatMode;
  inventoryMode: InventoryMode;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  response?: ChatResponse;
}

export interface ChatReservationPrefill extends CapturedPreferences {
  id: string;
  productId?: string;
  message: string;
}

export interface ReservationDraft {
  mode: "preorder" | "reservation";
  productId: string;
  quantity: number;
  pickupDate: string;
  pickupTime: string;
  name: string;
  contact: string;
  occasion?: string;
  recipient?: string;
  budgetMax?: number;
  style?: string;
  color?: string;
  specialWishes?: string;
  message?: string;
}

export interface ParsedReceiptLine {
  sku: string;
  quantity: number;
}

export interface ParsedReceipt {
  receiptId: string;
  type: "sale" | "return";
  createdAt: string;
  lines: ParsedReceiptLine[];
}
