import type { ParsedReceipt } from "../types";
import { InventoryError } from "./inventory";

interface RawReceipt {
  receiptId?: unknown;
  type?: unknown;
  createdAt?: unknown;
  lines?: unknown;
}

export interface POSReceiptParser {
  parse(payload: unknown): ParsedReceipt;
}

export class DemoPOSReceiptParser implements POSReceiptParser {
  parse(payload: unknown): ParsedReceipt {
    if (!payload || typeof payload !== "object") {
      throw new InventoryError("Belegformat ist ungültig.");
    }

    const raw = payload as RawReceipt;
    if (
      typeof raw.receiptId !== "string" ||
      (raw.type !== "sale" && raw.type !== "return") ||
      typeof raw.createdAt !== "string" ||
      !Array.isArray(raw.lines)
    ) {
      throw new InventoryError("Pflichtfelder im Beleg fehlen.");
    }

    const lines = raw.lines.map((line) => {
      if (
        !line ||
        typeof line !== "object" ||
        typeof (line as { sku?: unknown }).sku !== "string" ||
        typeof (line as { quantity?: unknown }).quantity !== "number"
      ) {
        throw new InventoryError("Belegposition ist ungültig.");
      }
      return {
        sku: (line as { sku: string }).sku,
        quantity: (line as { quantity: number }).quantity
      };
    });

    return {
      receiptId: raw.receiptId,
      type: raw.type,
      createdAt: raw.createdAt,
      lines
    };
  }
}
