import { describe, expect, it } from "vitest";
import handler from "./chat.js";

interface ApiResponseLike {
  status: (code: number) => ApiResponseLike;
  json: (body: unknown) => void;
}

function createResponse() {
  let statusCode = 200;
  let body: unknown = null;
  const response: ApiResponseLike = {
    status(code: number) {
      statusCode = code;
      return response;
    },
    json(payload: unknown) {
      body = payload;
    }
  };
  return {
    response,
    getStatus: () => statusCode,
    getBody: () =>
      body as { text?: string; suggestions?: unknown[]; choices?: unknown[]; action?: unknown } | null
  };
}

const request = (payload: unknown) =>
  ({
    method: "POST",
    headers: { "x-forwarded-for": "127.0.0.1" },
    body: payload
  }) as never;

const hasLLMKey = Boolean(process.env.CHAT_LLM_API_KEY);

describe.skipIf(!hasLLMKey)("api/chat LLM (Integration)", () => {
  it("beantwortet eine einfache Frage mit gültiger ChatResponse", async () => {
    const res = createResponse();
    await handler(request({ question: "Ich suche einen kleinen Strauß für meine Mutter. Was könnt ihr empfehlen?" }), res.response);

    console.log("DEBUG status:", res.getStatus(), "body:", JSON.stringify(res.getBody()));
    expect(res.getStatus()).toBe(200);
    expect(res.getBody()?.text).toBeTruthy();
    expect(typeof res.getBody()?.text).toBe("string");
    expect(res.getBody()!.text!.length).toBeGreaterThan(20);
  }, 30_000);

  it("nutzt den Verlauf für eine Folgefrage", async () => {
    const history = [
      { role: "user" as const, text: "Ich suche einen Strauß für eine Hochzeit." },
      {
        role: "assistant" as const,
        text: "Für eine Hochzeit berate ich Sie gern. Welches Budget haben Sie ungefähr?"
      }
    ];
    const res = createResponse();
    await handler(
      request({ question: "Budget ist 100 Euro.", preferences: { occasion: "hochzeit" }, history }),
      res.response
    );

    expect(res.getStatus()).toBe(200);
    expect(res.getBody()?.text).toBeTruthy();
    expect(res.getBody()!.text!.toLocaleLowerCase("de-DE")).not.toContain("welches budget");
  }, 30_000);
});
