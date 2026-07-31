import { describe, expect, it } from "vitest";
import {
  DemoInventoryService,
  InventoryError
} from "./inventory";

const receipt = {
  receiptId: "receipt-1",
  type: "sale" as const,
  createdAt: "2026-07-31T12:00:00.000Z",
  lines: [{ sku: "BB-BQ-S-001", quantity: 1 }]
};

describe("DemoInventoryService", () => {
  it("deducts a sale only once", () => {
    const service = new DemoInventoryService();
    const before = service.getBySku("BB-BQ-S-001")!.stock;
    service.applyReceipt(receipt);
    service.applyReceipt(receipt);
    expect(service.getBySku("BB-BQ-S-001")!.stock).toBe(before - 1);
  });

  it("blocks negative inventory", () => {
    const service = new DemoInventoryService();
    expect(() =>
      service.adjustStock("BB-BQ-S-001", -999)
    ).toThrow(InventoryError);
  });

  it("adds returns", () => {
    const service = new DemoInventoryService();
    const before = service.getBySku("BB-BQ-S-001")!.stock;
    service.applyReceipt({
      ...receipt,
      receiptId: "return-1",
      type: "return"
    });
    expect(service.getBySku("BB-BQ-S-001")!.stock).toBe(before + 1);
  });
});
