import { describe, expect, it } from "vitest";
import { products } from "./products";

describe("demo product catalogue", () => {
  it("contains exactly 16 bouquets and 4 wood decor products", () => {
    expect(products).toHaveLength(20);
    expect(products.filter((product) => product.category === "bouquet")).toHaveLength(
      16
    );
    expect(products.filter((product) => product.category === "decor")).toHaveLength(
      4
    );
  });

  it("contains six small, six medium and four large bouquets", () => {
    const bouquets = products.filter(
      (product) => product.category === "bouquet"
    );
    expect(bouquets.filter((product) => product.size === "small")).toHaveLength(
      6
    );
    expect(bouquets.filter((product) => product.size === "medium")).toHaveLength(
      6
    );
    expect(bouquets.filter((product) => product.size === "large")).toHaveLength(
      4
    );
  });

  it("uses unique ids and SKUs and never has negative stock", () => {
    expect(new Set(products.map((product) => product.id)).size).toBe(20);
    expect(new Set(products.map((product) => product.sku)).size).toBe(20);
    expect(products.every((product) => product.stock >= 0)).toBe(true);
  });
});
