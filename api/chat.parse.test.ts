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
    expect(result.action?.page).toBe("products");
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
});
