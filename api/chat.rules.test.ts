import { describe, expect, it } from "vitest";
import {
  CANONICAL_CALL_HREF,
  filterSuggestionIds,
  getInventoryMode,
  getOpeningStatus,
  mergePreferences,
  extractPreferences,
  renderOpeningAnswer,
  sanitizePreferences,
  shouldAllowUpsell,
  validateAction
} from "./chat.rules.js";

const morning = new Date("2026-08-03T08:00:00.000Z"); // 10:00 Europe/Berlin, Monday

describe("chat business rules", () => {
  it("extracts budget, recipient, color, tomorrow and time from free text", () => {
    const result = extractPreferences("35 €, Mutter, rosa, morgen gegen 11", morning);

    expect(result).toMatchObject({
      recipient: "Mutter",
      budgetMax: 35,
      color: "rosa",
      pickupDate: "2026-08-04",
      pickupTime: "11:00"
    });
  });

  it("rejects invalid budgets and caps long free-text wishes", () => {
    const result = sanitizePreferences({
      budgetMax: -20,
      specialWishes: "x".repeat(1_000)
    });

    expect(result.budgetMax).toBeUndefined();
    expect(result.specialWishes?.length).toBe(240);
  });

  it("lets a valid new color replace an old one but keeps the old value for invalid input", () => {
    const previous = sanitizePreferences({ color: "rosa", style: "romantisch" });
    const updated = mergePreferences(previous, { color: "weiß" });
    const protectedPrevious = mergePreferences(previous, { color: "neon-ultra" });

    expect(updated.color).toBe("weiß");
    expect(protectedPrevious.color).toBe("rosa");
  });

  it("filters unknown, sold-out, zero-stock and over-budget suggestions", () => {
    const filtered = filterSuggestionIds(
      ["soft-greeting", "summer-table", "color-confetti", "wood-tray", "unknown", "soft-greeting"],
      { budgetMax: 35 }
    );

    expect(filtered).toEqual(["soft-greeting"]);
  });

  it("reports demo inventory and never treats it as live stock", () => {
    expect(getInventoryMode()).toBe("demo");
  });

  it("calculates weekday opening, lunch break, closing and Sunday in Berlin time", () => {
    const open = getOpeningStatus(new Date("2026-08-03T08:00:00.000Z")); // Mon 10:00
    const lunch = getOpeningStatus(new Date("2026-08-03T11:00:00.000Z")); // Mon 13:00
    const closed = getOpeningStatus(new Date("2026-08-03T16:30:00.000Z")); // Mon 18:30
    const sunday = getOpeningStatus(new Date("2026-08-09T10:00:00.000Z")); // Sun 12:00
    const saturday = getOpeningStatus(new Date("2026-08-08T09:00:00.000Z")); // Sat 11:00

    expect(open).toMatchObject({ isOpen: true, state: "open" });
    expect(lunch).toMatchObject({ isOpen: false, state: "break", nextOpening: "2026-08-03T14:00" });
    expect(closed).toMatchObject({ isOpen: false, state: "closed", nextOpening: "2026-08-04T09:00" });
    expect(sunday).toMatchObject({ isOpen: false, state: "closed", nextOpening: "2026-08-10T09:00" });
    expect(saturday).toMatchObject({ isOpen: true, state: "open" });
    expect(renderOpeningAnswer(lunch)).toContain("Mittagspause");
    expect(renderOpeningAnswer(saturday)).toContain("samstags");
  });

  it("whitelists navigation, reserve and canonical call actions", () => {
    expect(validateAction({ type: "navigate", label: "Produkte", page: "products" })).toMatchObject({
      type: "navigate",
      page: "products"
    });
    expect(validateAction({ type: "reserve", label: "Anfrage vorbereiten", page: "home" })).toMatchObject({
      type: "reserve",
      page: "reservation"
    });
    expect(validateAction({ type: "call", label: "Jetzt anrufen", href: "https://attacker.invalid" })).toEqual({
      type: "call",
      label: "Jetzt anrufen",
      href: CANONICAL_CALL_HREF
    });
    expect(validateAction({ type: "navigate", label: "Böse", page: "admin" })).toBeUndefined();
  });

  it("allows at most one upsell and never after an explicit rejection", () => {
    expect(shouldAllowUpsell({})).toBe(true);
    expect(shouldAllowUpsell({ upsellOffered: true })).toBe(false);
    expect(shouldAllowUpsell({ upsellDeclined: true })).toBe(false);
  });
});
