import { describe, expect, it } from "vitest";
import { parseModelResponse } from "./chat.js";

describe("parseModelResponse E2E (Production-Output)", () => {
  it("jagt den aktuellen Production-Output durch den lokalen Parser", async () => {
    const response = await fetch("https://blatt-und-bluete-demo.vercel.app/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: "Ich suche einen kleinen Strauß für meine Mutter. Was könnt ihr empfehlen?"
      })
    });
    const data = (await response.json()) as { text?: unknown; suggestions?: unknown[] };

    // eslint-disable-next-line no-console
    console.log("PROD raw text head:", JSON.stringify(data.text ?? null).slice(0, 200));

    if (typeof data.text === "string" && data.text.trim().startsWith("{")) {
      const reparsed = parseModelResponse(data.text);
      // eslint-disable-next-line no-console
      console.log("REPARSED head:", JSON.stringify(reparsed.text).slice(0, 200));
      expect(reparsed.text.trim().startsWith("{")).toBe(false);
    } else {
      // eslint-disable-next-line no-console
      console.log("Antwort war bereits sauber");
      expect(true).toBe(true);
    }
  }, 60_000);
});
