import { describe, expect, it } from "vitest";
import { parseModelResponse } from "./chat.js";

describe("parseModelResponse", () => {
  it("entpackt doppelt geschachteltes JSON (Modell legt JSON in text)", () => {
    const raw = JSON.stringify({
      text: JSON.stringify({
        text: "Eine schöne Antwort für Sie.",
        suggestionIds: ["soft-greeting", "little-sun"],
        action: { label: "Zum Katalog", page: "products" },
        nextStep: "budget"
      })
    });
    const result = parseModelResponse(raw);

    expect(result.text).toBe("Eine schöne Antwort für Sie.");
    expect(result.suggestions?.map((entry) => entry.productId)).toEqual([
      "soft-greeting",
      "little-sun"
    ]);
    const action = result.action;
    expect(action?.type === "navigate" ? action.page : undefined).toBe("products");
    expect(result.choices?.length).toBeGreaterThan(0);
  });

  it("strippt <think>-Blöcke vor dem JSON", () => {
    const raw = `<think>\nDer Kunde sucht einen Strauß.\n</think>\n{"text": "Gerne!", "suggestionIds": [], "action": null, "nextStep": null}`;
    const result = parseModelResponse(raw);

    expect(result.text).toBe("Gerne!");
  });

  it("liefert bei Plain-Text den Text als Antwort statt zu crashen", () => {
    const result = parseModelResponse("Für eine Hochzeit berate ich Sie gern. Welches Budget haben Sie?");

    expect(result.text).toContain("Hochzeit");
    expect(result.choices).toEqual([]);
  });

  it("ignoriert unbekannte Produkt-IDs in suggestionIds", () => {
    const raw = JSON.stringify({
      text: "Hier sind Vorschläge.",
      suggestionIds: ["soft-greeting", "does-not-exist"],
      action: null,
      nextStep: null
    });
    const result = parseModelResponse(raw);

    expect(result.suggestions?.length).toBe(1);
    expect(result.suggestions?.[0]?.productId).toBe("soft-greeting");
  });

  it("entpackt langes verschachteltes JSON mit Umlauten (Live-Fall)", () => {
    const inner = `{\n  "text": "Wie schön, dass Sie an Ihre Mutter denken! Wir haben einige wunderbare kleine Sträuße im Angebot. Zum Beispiel der „Zarter Gruß“ – zurückhaltend und elegant in Weiß, Rosé und Salbeigrün. Beide sind um die 13 bis 15 Euro.",\n  "suggestionIds": ["soft-greeting", "calm-morning", "little-sun"],\n  "action": null,\n  "nextStep": "occasion"\n}`;
    const raw = JSON.stringify({
      text: inner,
      suggestionIds: [],
      action: null,
      nextStep: null
    });
    const result = parseModelResponse(raw);

    expect(result.text).toContain("Mutter denken");
    expect(result.suggestions?.map((entry) => entry.productId)).toEqual([
      "soft-greeting",
      "calm-morning",
      "little-sun"
    ]);
  });

  it("entpackt doppelt-escaped verschachteltes JSON (Modell-Fall)", () => {
    const innerWithLiteralEscapes =
      '{\\n  \\"text\\": \\"Hallo aus dem Laden!\\", \\"suggestionIds\\": [], \\"action\\": null, \\"nextStep\\": null}';
    const raw = JSON.stringify({ text: innerWithLiteralEscapes });
    const result = parseModelResponse(raw);

    expect(result.text).toBe("Hallo aus dem Laden!");
  });

  it("entfernt Markdown-Sterne aus dem Antworttext", () => {
    const raw = JSON.stringify({
      text: "Der **Zarte Gruß** ist schön, und _das_ hier auch.",
      suggestionIds: [],
      action: null,
      nextStep: null
    });
    const result = parseModelResponse(raw);

    expect(result.text).toBe("Der Zarte Gruß ist schön, und das hier auch.");
  });

  it("entpackt text als JSON-Objekt (nicht String)", () => {
    const raw = JSON.stringify({
      text: {
        text: "Ein Strauß mit Rosen wäre schön.",
        suggestionIds: ["soft-greeting"],
        action: null,
        nextStep: null
      }
    });
    const result = parseModelResponse(raw);

    expect(result.text).toBe("Ein Strauß mit Rosen wäre schön.");
    expect(result.suggestions?.[0]?.productId).toBe("soft-greeting");
  });

  it("entpackt JSON, wenn der äußere Parse fehlschlug (Fallback-Branch)", () => {
    const raw = `Einleitungstext {\n  "text": "Saubere Antwort",\n  "suggestionIds": [],\n  "action": null,\n  "nextStep": null\n} Ende`;
    const result = parseModelResponse(raw);

    expect(result.text).toBe("Saubere Antwort");
  });

  it("validates captured preferences and canonicalizes a call action", () => {
    const result = parseModelResponse(
      JSON.stringify({
        text: "Ich helfe Ihnen gern.",
        suggestionIds: [],
        action: { type: "call", label: "Anrufen", href: "https://example.invalid" },
        capturedPreferences: {
          budgetMax: "35",
          color: "rosa",
          pickupDate: "2026-08-04",
          pickupTime: "11:00",
          unknown: "discard me"
        },
        nextStep: null
      })
    );

    expect(result.capturedPreferences).toEqual({
      budgetMax: 35,
      color: "rosa",
      pickupDate: "2026-08-04",
      pickupTime: "11:00"
    });
    expect(result.action).toEqual({
      type: "call",
      label: "Anrufen",
      href: "tel:+492734433990"
    });
    expect(result.mode).toBe("live");
    expect(result.inventoryMode).toBe("demo");
  });

  it("deduplicates and removes sold-out suggestions during parsing", () => {
    const result = parseModelResponse(
      JSON.stringify({
        text: "Beispiele.",
        suggestionIds: ["soft-greeting", "soft-greeting", "color-confetti", "wood-tray"],
        action: null,
        nextStep: null
      })
    );

    expect(result.suggestions?.map((entry) => entry.productId)).toEqual(["soft-greeting"]);
  });
});
