import { products } from "../data/products";
import type { ParsedReceipt, Product } from "../types";

export class InventoryError extends Error {}

export interface InventoryService {
  list(): Product[];
  getBySku(sku: string): Product | undefined;
  adjustStock(sku: string, delta: number): Product;
  applyReceipt(receipt: ParsedReceipt): Product[];
}

export class DemoInventoryService implements InventoryService {
  private readonly stockBySku = new Map(
    products.map((product) => [product.sku, product.stock])
  );

  private readonly processedReceiptIds = new Set<string>();

  list(): Product[] {
    return products.map((product) => ({
      ...product,
      stock: this.stockBySku.get(product.sku) ?? product.stock
    }));
  }

  getBySku(sku: string): Product | undefined {
    const product = products.find((entry) => entry.sku === sku);
    if (!product) return undefined;
    return {
      ...product,
      stock: this.stockBySku.get(sku) ?? product.stock
    };
  }

  adjustStock(sku: string, delta: number): Product {
    if (!Number.isInteger(delta)) {
      throw new InventoryError("Bestandsänderungen müssen ganzzahlig sein.");
    }

    const product = this.getBySku(sku);
    if (!product) {
      throw new InventoryError(`Unbekannte SKU: ${sku}`);
    }

    const nextStock = product.stock + delta;
    if (nextStock < 0) {
      throw new InventoryError(
        `Bestand für ${sku} darf nicht negativ werden.`
      );
    }

    this.stockBySku.set(sku, nextStock);
    return { ...product, stock: nextStock };
  }

  applyReceipt(receipt: ParsedReceipt): Product[] {
    if (this.processedReceiptIds.has(receipt.receiptId)) {
      return this.list();
    }

    const unknownSkus = receipt.lines
      .filter((line) => !this.getBySku(line.sku))
      .map((line) => line.sku);
    if (unknownSkus.length > 0) {
      throw new InventoryError(
        `Nicht zuordenbare Produkte: ${unknownSkus.join(", ")}`
      );
    }

    const multiplier = receipt.type === "sale" ? -1 : 1;
    for (const line of receipt.lines) {
      if (!Number.isInteger(line.quantity) || line.quantity <= 0) {
        throw new InventoryError("Belegmengen müssen positive Ganzzahlen sein.");
      }

      const product = this.getBySku(line.sku);
      if (!product) continue;
      const nextStock = product.stock + line.quantity * multiplier;
      if (nextStock < 0) {
        throw new InventoryError(
          `Beleg ${receipt.receiptId} würde ${line.sku} negativ setzen.`
        );
      }
    }

    for (const line of receipt.lines) {
      this.adjustStock(line.sku, line.quantity * multiplier);
    }
    this.processedReceiptIds.add(receipt.receiptId);
    return this.list();
  }
}
