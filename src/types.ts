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

export type ChatChoiceKey = "occasion" | "budget" | "style" | "color" | "pickup";

export interface ChatChoice {
  key: ChatChoiceKey;
  value: string;
  label: string;
}

export interface ChatPreferences {
  occasion?: string;
  budget?: string;
  style?: string;
  color?: string;
  pickup?: string;
}

export interface ChatResponse {
  text: string;
  suggestions?: ChatProductSuggestion[];
  choices?: ChatChoice[];
  action?: {
    label: string;
    page: PageId;
  };
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
