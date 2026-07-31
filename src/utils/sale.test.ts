import { describe, expect, it } from "vitest";
import { getSalePrice, getSaleState } from "./sale";

describe("sale logic", () => {
  it("is inactive before 16:30 in Europe/Berlin", () => {
    const result = getSaleState(new Date("2026-07-31T14:29:59.000Z"));
    expect(result.active).toBe(false);
    expect(result.secondsUntilStart).toBe(1);
  });

  it("activates exactly at 16:30 in Europe/Berlin", () => {
    const result = getSaleState(new Date("2026-07-31T14:30:00.000Z"));
    expect(result.active).toBe(true);
    expect(result.secondsUntilStart).toBe(0);
  });

  it("applies 50 percent exactly once", () => {
    expect(getSalePrice(29)).toBe(14.5);
    expect(getSalePrice(14.5)).toBe(7.25);
  });
});
