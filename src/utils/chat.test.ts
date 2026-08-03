import { describe, expect, it } from "vitest";
import { products } from "../data/products";
import {
  buildReservationPrefill,
  extractPreferencesFromText,
  filterRecommendedProducts,
  formatReservationMessage,
  mergeChatPreferences,
  safeReadChatState,
  safeWriteChatState,
  validateChatAction
} from "./chat";
import type { CapturedPreferences, ChatAction, ChatMessage } from "../types";

const memoryStorage = (): Storage => {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
    clear: () => values.clear(),
    key: (index) => Array.from(values.keys())[index] ?? null,
    get length() {
      return values.size;
    }
  };
};

describe("chat conversion helpers", () => {
  it("captures recipient, budget, color, relative date and time from free text", () => {
    const captured = extractPreferencesFromText(
      "Morgen für meine Mutter, 35 €, rosa, gegen elf Uhr",
      {},
      new Date("2026-08-03T10:00:00+02:00")
    );

    expect(captured).toMatchObject({
      recipient: "Mutter",
      budgetMax: 35,
      color: "rosa",
      pickupDate: "2026-08-04",
      pickupTime: "11:00"
    });
  });

  it("merges new captured fields without erasing known preferences", () => {
    const current: CapturedPreferences = {
      occasion: "geburtstag",
      budgetMax: 35,
      color: "rosa"
    };

    expect(mergeChatPreferences(current, { pickupTime: "11:00" })).toEqual({
      occasion: "geburtstag",
      budgetMax: 35,
      color: "rosa",
      pickupTime: "11:00"
    });
  });

  it("returns at most three available products that fit budget and color", () => {
    const matches = filterRecommendedProducts(products, {
      budgetMax: 35,
      color: "rosa",
      recipient: "Mutter"
    });

    expect(matches.length).toBeLessThanOrEqual(3);
    expect(matches.length).toBeGreaterThan(0);
    expect(matches.every((product) => (product.priceMax ?? product.price) <= 35)).toBe(
      true
    );
    expect(matches.every((product) => product.stock > 0 && product.status !== "soldout")).toBe(
      true
    );
    expect(matches.some((product) => product.colors.some((color) => /ros|pink/i.test(color)))).toBe(
      true
    );
  });

  it("creates a contact-free reservation draft and readable message", () => {
    const prefill = buildReservationPrefill(
      {
        occasion: "geburtstag",
        recipient: "Mutter",
        budgetMax: 35,
        style: "natürlich",
        color: "rosa",
        pickupDate: "2026-08-04",
        pickupTime: "11:00",
        specialWishes: "Bitte mit einer kleinen Karte."
      },
      [{ productId: "apricot-hour", label: "Aprikosenstunde" }],
      { type: "reserve", label: "Vorbestellung vorbereiten", page: "reservation" }
    );

    expect(prefill.productId).toBe("apricot-hour");
    expect(prefill.message).toContain("Mutter");
    expect(prefill.message).toContain("35 €");
    expect(prefill.message).toContain("rosa");
    expect(prefill.message).not.toMatch(/name|telefon|e-mail|kontakt/i);
    expect(formatReservationMessage(prefill)).toContain("2026-08-04");
  });

  it("accepts only the real call action and known pages", () => {
    const call: ChatAction = {
      type: "call",
      label: "Kurz anrufen",
      href: "tel:+492734433990"
    };

    expect(validateChatAction(call)).toEqual(call);
    expect(validateChatAction({ type: "call", label: "Fake", href: "tel:+49123" })).toBeUndefined();
    expect(validateChatAction({ type: "navigate", label: "Los", page: "unknown" })).toBeUndefined();
  });

  it("writes and defensively restores versioned chat state", () => {
    const storage = memoryStorage();
    const messages: ChatMessage[] = [
      {
        id: "m1",
        role: "assistant",
        text: "Hallo",
        response: { text: "Hallo", mode: "fallback", inventoryMode: "demo" }
      }
    ];

    safeWriteChatState({ messages, preferences: { budgetMax: 35 }, open: true }, storage);
    expect(safeReadChatState(storage)).toMatchObject({
      messages,
      preferences: { budgetMax: 35 },
      open: true
    });

    storage.setItem("bb-chat-state-v1", "{invalid");
    expect(safeReadChatState(storage)).toBeNull();
  });
});
