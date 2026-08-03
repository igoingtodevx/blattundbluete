import { describe, expect, it } from "vitest";

const liveUrl = process.env.LIVE_CHAT_URL || "https://blatt-und-bluete-freudenberg.vercel.app/api/chat";
const runLiveSmoke = process.env.RUN_LIVE_E2E === "1";

describe.skipIf(!runLiveSmoke)("live chat smoke (opt-in, real sales domain)", () => {
  it("returns HTTP 200 and the complete public ChatResponse schema", async () => {
    const response = await fetch(liveUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: "Ich suche morgen etwas für meine Mutter, maximal 35 Euro, eher rosa.",
        preferences: {},
        history: []
      })
    });

    expect(response.status).toBe(200);
    const data: unknown = await response.json();
    expect(typeof data).toBe("object");
    expect(data).not.toBeNull();
    const body = data as {
      text?: unknown;
      suggestions?: unknown;
      choices?: unknown;
      capturedPreferences?: unknown;
      mode?: unknown;
      inventoryMode?: unknown;
      action?: unknown;
    };

    expect(typeof body.text).toBe("string");
    expect(String(body.text).trim().length).toBeGreaterThan(0);
    expect(Array.isArray(body.suggestions)).toBe(true);
    expect(Array.isArray(body.choices)).toBe(true);
    expect(typeof body.capturedPreferences).toBe("object");
    expect(body.mode === "live" || body.mode === "fallback").toBe(true);
    expect(body.inventoryMode === "demo" || body.inventoryMode === "live").toBe(true);

    for (const suggestion of body.suggestions as unknown[]) {
      expect(typeof suggestion).toBe("object");
      expect(typeof (suggestion as { productId?: unknown }).productId).toBe("string");
      expect(typeof (suggestion as { label?: unknown }).label).toBe("string");
    }

    if (body.action !== undefined) {
      const action = body.action as { type?: unknown; label?: unknown; page?: unknown; href?: unknown };
      expect(typeof action.type).toBe("string");
      expect(typeof action.label).toBe("string");
      if (action.type === "call") {
        expect(action.href).toBe("tel:+492734433990");
      } else if (action.type === "reserve") {
        expect(action.page).toBe("reservation");
      } else {
        expect(action.type).toBe("navigate");
        expect(["home", "products", "sale", "knowledge", "about", "reservation"]).toContain(action.page);
      }
    }
  }, 60_000);
});
