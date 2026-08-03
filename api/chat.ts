import { getChatChoices } from "../src/data/chatChoices.js";
import { products } from "../src/data/products.js";
import { buildSystemPrompt } from "./chat.prompt.js";
import {
  extractPreferences,
  filterSuggestionIds,
  getInventoryMode,
  getOpeningStatus,
  mergePreferences,
  renderOpeningAnswer,
  sanitizePreferences,
  shouldAllowUpsell,
  validateAction
} from "./chat.rules.js";
import type {
  ApiRequest,
  ApiResponse,
  CapturedPreferences,
  ChatChoiceKey,
  ChatHistoryMessage,
  ChatResponse,
  OpeningStatus,
  ProviderConfig
} from "./chat.types.js";

const MAX_HISTORY = 10;
const MAX_QUESTION_LENGTH = 500;
const DEFAULT_TIMEOUT_MS = 12_000;
const MAX_PROVIDER_TIMEOUT_MS = 30_000;
const recentRequests = new Map<string, number[]>();

interface BedrockMessage {
  role: "user" | "assistant";
  content: { text: string }[];
}

interface ParsedModelPayload {
  text?: unknown;
  suggestionIds?: unknown;
  action?: unknown;
  nextStep?: unknown;
  capturedPreferences?: unknown;
}

class ProviderError extends Error {
  constructor(
    readonly provider: "bedrock" | "openai-compatible" | "providers",
    readonly status: number | undefined,
    readonly code: string
  ) {
    super(`${provider}:${code}`);
    this.name = "ProviderError";
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const envString = (key: string, fallback = "") => {
  const value = process.env[key];
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
};

const safeRegion = (value: string) => (/^[a-z0-9-]+$/.test(value) ? value : "eu-central-1");
const safeModel = (value: string) => (/^[a-zA-Z0-9._:-]+$/.test(value) ? value : "eu.anthropic.claude-sonnet-4-6");

function providerTimeoutMs(value: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1_000) return DEFAULT_TIMEOUT_MS;
  return Math.min(Math.round(parsed), MAX_PROVIDER_TIMEOUT_MS);
}

export function getProviderConfig(): ProviderConfig {
  return {
    bedrockToken: envString("AWS_BEARER_TOKEN_BEDROCK"),
    bedrockRegion: safeRegion(envString("AWS_BEDROCK_REGION", "eu-central-1")),
    bedrockModel: safeModel(envString("AWS_BEDROCK_MODEL", "eu.anthropic.claude-sonnet-4-6")),
    openAiApiKey: envString("CHAT_LLM_API_KEY"),
    openAiBaseUrl: envString("CHAT_LLM_BASE_URL", "https://api.openai.com/v1").replace(/\/$/, ""),
    openAiModel: envString("CHAT_LLM_MODEL", "gpt-4o-mini"),
    timeoutMs: providerTimeoutMs(envString("CHAT_PROVIDER_TIMEOUT_MS"))
  };
}

function checkRateLimit(request: ApiRequest) {
  const forwardedFor = request.headers?.["x-forwarded-for"];
  const identifier = (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor)?.split(",")[0]?.trim() || "unknown";
  const now = Date.now();
  const windowStart = now - 60_000;
  const requests = (recentRequests.get(identifier) || []).filter((time) => time > windowStart);
  if (requests.length >= 8) return false;
  recentRequests.set(identifier, [...requests, now]);
  return true;
}

function sanitizeHistory(raw: unknown): ChatHistoryMessage[] {
  if (!Array.isArray(raw)) return [];
  const result: ChatHistoryMessage[] = [];
  for (const entry of raw.slice(-MAX_HISTORY)) {
    if (!isRecord(entry)) continue;
    const role = entry.role;
    const text = entry.text;
    if (role !== "user" && role !== "assistant") continue;
    if (typeof text !== "string" || !text.trim()) continue;
    const safeText = [...text]
      .filter((character) => {
        const code = character.charCodeAt(0);
        return code > 31 && code !== 127;
      })
      .join("");
    result.push({ role, text: safeText.trim().slice(0, 400) });
  }
  return result;
}

function buildUserTurn(question: string, preferences: CapturedPreferences, context: string) {
  return `KUNDENFRAGE: ${question}\nERFASSTE_PREFERENZEN: ${JSON.stringify(preferences)}\nSERVERKONTEXT: ${context}`;
}

function normalizedHistory(history: ChatHistoryMessage[]) {
  const messages: BedrockMessage[] = [];
  for (const entry of history) {
    if (messages.length === 0 && entry.role === "assistant") continue;
    const last = messages.at(-1);
    if (last?.role === entry.role) {
      last.content[0]!.text += `\n${entry.text}`;
    } else {
      messages.push({ role: entry.role, content: [{ text: entry.text }] });
    }
  }
  return messages;
}

export function buildBedrockMessages(
  history: ChatHistoryMessage[],
  question: string,
  preferences: CapturedPreferences,
  context: string
): BedrockMessage[] {
  const messages = normalizedHistory(history);
  const currentTurn = buildUserTurn(question, preferences, context);
  const last = messages.at(-1);
  if (last?.role === "user") {
    last.content[0]!.text += `\n\n${currentTurn}`;
  } else {
    messages.push({ role: "user", content: [{ text: currentTurn }] });
  }
  return messages;
}

function buildOpenAiMessages(
  history: ChatHistoryMessage[],
  question: string,
  preferences: CapturedPreferences,
  context: string
) {
  return buildBedrockMessages(history, question, preferences, context).map((message) => ({
    role: message.role,
    content: message.content[0]?.text || ""
  }));
}

async function requestJson(
  url: string,
  init: RequestInit,
  timeoutMs: number,
  provider: ProviderError["provider"]
): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    let data: unknown = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }
    if (!response.ok) throw new ProviderError(provider, response.status, `http_${response.status}`);
    return data;
  } catch (error) {
    if (error instanceof ProviderError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new ProviderError(provider, undefined, "timeout");
    }
    throw new ProviderError(provider, undefined, "network");
  } finally {
    clearTimeout(timeout);
  }
}

function textBlocks(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap((entry) => textBlocks(entry));
  if (!isRecord(value)) return [];
  if (typeof value.text === "string" && value.text.trim()) return [value.text];
  return [];
}

export async function callBedrock(
  question: string,
  preferences: CapturedPreferences,
  history: ChatHistoryMessage[],
  context: string,
  config = getProviderConfig(),
  systemPrompt = buildSystemPrompt(getOpeningStatus(new Date()), preferences)
): Promise<string> {
  if (!config.bedrockToken) throw new ProviderError("bedrock", undefined, "not_configured");
  const url = `https://bedrock-runtime.${config.bedrockRegion}.amazonaws.com/model/${encodeURIComponent(config.bedrockModel)}/converse`;
  const data = await requestJson(
    url,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.bedrockToken}`
      },
      body: JSON.stringify({
        system: [{ text: systemPrompt }],
        messages: buildBedrockMessages(history, question, preferences, context),
        inferenceConfig: { maxTokens: 700, temperature: 0.55, topP: 0.95 }
      })
    },
    config.timeoutMs,
    "bedrock"
  );
  const message = isRecord(data) && isRecord(data.output) && isRecord(data.output.message) ? data.output.message : undefined;
  const text = textBlocks(message && message.content).join("\n").trim();
  if (!text) throw new ProviderError("bedrock", undefined, "empty_response");
  return text;
}

export async function callOpenAICompatible(
  question: string,
  preferences: CapturedPreferences,
  history: ChatHistoryMessage[],
  context: string,
  config = getProviderConfig(),
  systemPrompt = buildSystemPrompt(getOpeningStatus(new Date()), preferences)
): Promise<string> {
  if (!config.openAiApiKey) throw new ProviderError("openai-compatible", undefined, "not_configured");
  const data = await requestJson(
    `${config.openAiBaseUrl}/chat/completions`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.openAiApiKey}`
      },
      body: JSON.stringify({
        model: config.openAiModel,
        messages: [{ role: "system", content: systemPrompt }, ...buildOpenAiMessages(history, question, preferences, context)],
        temperature: 0.55,
        max_tokens: 700,
        response_format: { type: "json_object" }
      })
    },
    config.timeoutMs,
    "openai-compatible"
  );
  const choice = isRecord(data) && Array.isArray(data.choices) ? data.choices[0] : undefined;
  const content = isRecord(choice) ? choice.message : undefined;
  const text = textBlocks(content).join("\n").trim() || (isRecord(content) && typeof content.content === "string" ? content.content.trim() : "");
  if (!text) throw new ProviderError("openai-compatible", undefined, "empty_response");
  return text;
}

const cleanModelText = (value: string) =>
  value
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/^\s*```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .replace(/\*\*/g, "")
    .replace(/_/g, "")
    .replace(/`/g, "")
    .trim()
    .slice(0, 1_200);

function candidateJson(value: string): string {
  const cleaned = value.trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  return start >= 0 && end > start ? cleaned.slice(start, end + 1) : "";
}

function suggestionForId(id: string) {
  const product = products.find((entry) => entry.id === id);
  if (!product) return undefined;
  const price = product.priceMax ? `${product.price}–${product.priceMax} €` : `${product.price} €`;
  return { productId: id, label: `${product.name} · ${price}` };
}

const nextStepKeys = new Set<ChatChoiceKey>(["occasion", "budget", "style", "color", "pickup"]);

export function parseModelResponse(raw: string, depth = 0): ChatResponse {
  const cleaned = raw.trim().replace(/^```json\s*|\s*```$/gi, "");
  const candidate = candidateJson(cleaned);
  let parsed: ParsedModelPayload | null = null;
  if (candidate) {
    try {
      const value: unknown = JSON.parse(candidate);
      parsed = isRecord(value) ? value : null;
    } catch {
      parsed = null;
    }
  }

  if (depth < 2 && parsed) {
    if (typeof parsed.text === "string" && parsed.text.trim().startsWith("{")) {
      try {
        const inner = JSON.parse(parsed.text) as unknown;
        if (isRecord(inner)) return parseModelResponse(JSON.stringify(inner), depth + 1);
      } catch {
        const unescaped = parsed.text.replace(/\\\\/g, "\\").replace(/\\n/g, "\n").replace(/\\"/g, '"');
        try {
          const inner = JSON.parse(unescaped) as unknown;
          if (isRecord(inner)) return parseModelResponse(JSON.stringify(inner), depth + 1);
        } catch {
          // Keep the outer response and use its text below.
        }
      }
    } else if (isRecord(parsed.text)) {
      return parseModelResponse(JSON.stringify(parsed.text), depth + 1);
    }
  }

  if (!parsed || typeof parsed.text !== "string" || !parsed.text.trim()) {
    const plain = cleanModelText(cleaned);
    return {
      text: plain || "Dazu möchte ich Ihnen lieber eine sichere Auskunft geben. Rufen Sie uns bitte an.",
      suggestions: [],
      choices: [],
      capturedPreferences: {},
      mode: "live",
      inventoryMode: getInventoryMode()
    };
  }

  const capturedPreferences = sanitizePreferences(parsed.capturedPreferences);
  const suggestionIds = filterSuggestionIds(parsed.suggestionIds, capturedPreferences);
  const nextStep = typeof parsed.nextStep === "string" && nextStepKeys.has(parsed.nextStep as ChatChoiceKey)
    ? (parsed.nextStep as ChatChoiceKey)
    : null;
  const suggestions = suggestionIds.map(suggestionForId).filter((entry): entry is NonNullable<ReturnType<typeof suggestionForId>> => Boolean(entry));
  const action = validateAction(parsed.action);
  return {
    text: cleanModelText(parsed.text) || "Dazu möchte ich Ihnen lieber eine sichere Auskunft geben. Rufen Sie uns bitte an.",
    suggestions,
    choices: getChatChoices(nextStep),
    ...(action ? { action } : {}),
    capturedPreferences,
    mode: "live",
    inventoryMode: getInventoryMode()
  };
}

function isOpeningQuestion(question: string) {
  return /öffnungszeit|öffnungszeiten|geöffnet|offen|wann habt ihr auf|habt ihr jetzt auf/i.test(question);
}

function isInventoryQuestion(question: string) {
  return /bestand|lager|stückzahl|wie viele|noch .*\b(da|dahaben|haben)|restposten|verfügbar/i.test(question);
}

function isUnconfirmedServiceQuestion(question: string) {
  return /liefer|parkplatz|parken|eisdiele|gebühr|rabatt|restposten|sonderöffnungszeit|feiertag/i.test(question);
}

function deterministicFactAnswer(question: string, status: OpeningStatus) {
  if (isOpeningQuestion(question)) {
    if (/feiertag|sonderöffnungszeit/i.test(question)) {
      return {
        text: "Zu Sonderöffnungszeiten kann ich keine bestätigte Aussage machen. Bitte rufen Sie kurz an; die regulären Zeiten können an Feiertagen abweichen.",
        action: validateAction({ type: "call", label: "Kurz anrufen" })
      };
    }
    return { text: renderOpeningAnswer(status) };
  }
  if (isInventoryQuestion(question)) {
    return {
      text: "Auf der Website sehen Sie derzeit nur ein Beispielsortiment – daraus kann ich keinen echten aktuellen Stückbestand ableiten. Für eine konkrete Auskunft rufen Sie bitte kurz an.",
      action: validateAction({ type: "call", label: "Bestand telefonisch klären" })
    };
  }
  if (isUnconfirmedServiceQuestion(question)) {
    return {
      text: "Dazu liegt mir keine bestätigte Ladeninformation vor. Ich möchte Ihnen nichts versprechen, was nicht geprüft ist – bitte rufen Sie kurz an.",
      action: validateAction({ type: "call", label: "Kurz anrufen" })
    };
  }
  return undefined;
}

async function generateWithProviders(
  question: string,
  preferences: CapturedPreferences,
  history: ChatHistoryMessage[],
  context: string,
  status: OpeningStatus,
  config: ProviderConfig
) {
  const systemPrompt = buildSystemPrompt(status, preferences);
  let lastError: ProviderError | undefined;
  if (config.bedrockToken) {
    try {
      return { raw: await callBedrock(question, preferences, history, context, config, systemPrompt), mode: "live" as const };
    } catch (error) {
      lastError = error instanceof ProviderError ? error : new ProviderError("bedrock", undefined, "unknown");
    }
  }
  if (config.openAiApiKey) {
    try {
      return {
        raw: await callOpenAICompatible(question, preferences, history, context, config, systemPrompt),
        mode: "fallback" as const
      };
    } catch (error) {
      lastError = error instanceof ProviderError ? error : new ProviderError("openai-compatible", undefined, "unknown");
    }
  }
  throw lastError || new ProviderError("providers", undefined, "not_configured");
}

export default async function handler(request: ApiRequest, response: ApiResponse) {
  if (request.method !== "POST") return response.status(405).json({ error: "Method not allowed" });
  if (!checkRateLimit(request)) {
    return response.status(429).json({ error: "Bitte warten Sie einen Moment, bevor Sie weiterschreiben." });
  }
  if (!isRecord(request.body)) return response.status(400).json({ error: "Ungültiger Anfragekörper." });
  const question = typeof request.body.question === "string" ? request.body.question.trim().slice(0, MAX_QUESTION_LENGTH) : "";
  if (!question) return response.status(400).json({ error: "Bitte schreiben Sie eine Frage." });

  const config = getProviderConfig();
  if (!config.bedrockToken && !config.openAiApiKey) {
    return response.status(503).json({ error: "Der Blumen-Chat wird gerade vorbereitet." });
  }

  try {
    const now = new Date();
    const status = getOpeningStatus(now);
    const bodyPreferences = sanitizePreferences(request.body.preferences);
    const history = sanitizeHistory(request.body.history);
    const extracted = extractPreferences(question, now);
    const preferences = mergePreferences(bodyPreferences, extracted);
    const context = JSON.stringify({
      openingStatus: status,
      inventoryMode: getInventoryMode(),
      upsellAllowed: shouldAllowUpsell(preferences)
    });
    const providerResult = await generateWithProviders(question, preferences, history, context, status, config);
    const parsed = parseModelResponse(providerResult.raw);
    const capturedPreferences = mergePreferences(preferences, parsed.capturedPreferences);
    const deterministic = deterministicFactAnswer(question, status);
    const suggestionIds = deterministic ? [] : filterSuggestionIds(parsed.suggestions.map((suggestion) => suggestion.productId), capturedPreferences);
    const finalSuggestions = suggestionIds.map(suggestionForId).filter((entry): entry is NonNullable<ReturnType<typeof suggestionForId>> => Boolean(entry));
    const action = deterministic?.action || validateAction(parsed.action);

    return response.status(200).json({
      text: deterministic?.text || parsed.text,
      suggestions: finalSuggestions,
      choices: deterministic ? [] : parsed.choices,
      ...(action ? { action } : {}),
      capturedPreferences,
      mode: providerResult.mode,
      inventoryMode: getInventoryMode()
    } satisfies ChatResponse);
  } catch (error) {
    const providerError = error instanceof ProviderError ? error : new ProviderError("providers", undefined, "unknown");
    console.error("Blatt & Blüte chat provider failure", {
      provider: providerError.provider,
      status: providerError.status,
      code: providerError.code
    });
    return response.status(502).json({
      error: "Der Blumen-Chat braucht gerade einen kleinen Moment. Bitte versuchen Sie es erneut oder rufen Sie uns an."
    });
  }
}
