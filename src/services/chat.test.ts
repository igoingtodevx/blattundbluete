import { afterEach, describe, expect, it, vi } from "vitest";
import { DemoChatService } from "./chat";

describe("DemoChatService", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("prioritizes a concrete spontaneous budget request", async () => {
    vi.useFakeTimers();
    const responsePromise = new DemoChatService().ask(
      "Ich kann nur spontan vorbeikommen. Wie schnell könnt ihr einen kleinen Strauß für 10 bis 15 Euro fertig machen?"
    );

    await vi.advanceTimersByTimeAsync(520);
    const response = await responsePromise;

    expect(response.text).toContain("aufgenommen");
    expect(response.text).toContain("nicht live bestätigt");
  });
});
