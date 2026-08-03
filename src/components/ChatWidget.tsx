import { useEffect, useRef, useState, type FormEvent } from "react";
import { ApiChatService, DemoChatService } from "../services/chat";
import {
  buildReservationPrefill,
  extractPreferencesFromText,
  mergeChatPreferences,
  safeReadChatState,
  safeWriteChatState
} from "../utils/chat";
import type {
  CapturedPreferences,
  ChatAction,
  ChatChoice,
  ChatHistoryMessage,
  ChatMessage,
  ChatResponse,
  PageId
} from "../types";
import { Icon } from "./Icons";

interface ChatWidgetProps {
  onNavigate: (page: PageId) => void;
  onProduct: (productId: string) => void;
  onStartReservation: (prefill: ReturnType<typeof buildReservationPrefill>) => void;
  onPreferencesChange?: (preferences: CapturedPreferences) => void;
}

const quickQuestions = [
  "Morgen für meine Mutter, 35 €, rosa, gegen elf Uhr",
  "Ich suche einen kleinen Strauß bis 20 €",
  "Wie viele Rosen sind noch da?"
];

const apiChatService = new ApiChatService();
const demoChatService = new DemoChatService();

const initialMessage: ChatMessage = {
  id: "welcome",
  role: "assistant",
  text:
    "Schön, dass Sie da sind. Nennen Sie mir einfach Anlass, Farbwelt oder Budget – ich mache daraus einen passenden nächsten Schritt.",
  response: {
    text:
      "Schön, dass Sie da sind. Nennen Sie mir einfach Anlass, Farbwelt oder Budget – ich mache daraus einen passenden nächsten Schritt.",
    mode: "fallback",
    inventoryMode: "demo"
  }
};

const messageId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const buildHistory = (current: ChatMessage[]): ChatHistoryMessage[] =>
  current
    .map((entry) => ({ role: entry.role, text: entry.text }))
    .slice(-10);

const choicePreferences = (
  choice: ChatChoice,
  current: CapturedPreferences
): CapturedPreferences => {
  if (choice.key === "budget" || choice.key === "pickup") {
    return extractPreferencesFromText(choice.label, current);
  }
  return { [choice.key]: choice.value } as CapturedPreferences;
};

const actionList = (response: ChatResponse): ChatAction[] => {
  const all = [response.action, ...(response.actions ?? [])].filter(
    (action): action is ChatAction => Boolean(action)
  );
  return all.filter(
    (action, index) =>
      all.findIndex((candidate) =>
        candidate.type === action.type &&
        candidate.label === action.label &&
        (candidate.type === "call"
          ? candidate.href === action.href
          : candidate.type === "navigate"
            ? candidate.page === action.page
            : candidate.productId === action.productId)
      ) === index
  );
};

const statusLabel = (response?: ChatResponse) => {
  if (response?.mode === "live") return "KI-Beratung";
  return "Demo-Antwort";
};

export function ChatWidget({
  onNavigate,
  onProduct,
  onStartReservation,
  onPreferencesChange
}: ChatWidgetProps) {
  const stored = safeReadChatState();
  const [open, setOpen] = useState(stored?.open ?? false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [preferences, setPreferences] = useState<CapturedPreferences>(
    stored?.preferences ?? {}
  );
  const [messages, setMessages] = useState<ChatMessage[]>(
    stored?.messages?.length ? stored.messages : [initialMessage]
  );
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    safeWriteChatState({ messages, preferences, open });
    onPreferencesChange?.(preferences);
  }, [messages, preferences, open, onPreferencesChange]);

  useEffect(() => {
    if (open) {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [messages, open, loading]);

  const send = async (question: string, preferenceOverride?: CapturedPreferences) => {
    const clean = question.trim();
    if (!clean || loading) return;

    const nextPreferences = mergeChatPreferences(
      preferenceOverride ?? preferences,
      extractPreferencesFromText(clean, preferenceOverride ?? preferences)
    );
    const history = buildHistory(messages);
    setPreferences(nextPreferences);
    setMessages((current) => [
      ...current,
      { id: messageId("user"), role: "user", text: clean }
    ]);
    setInput("");
    setError("");
    setLoading(true);

    try {
      let response: ChatResponse;
      try {
        response = await apiChatService.ask(clean, nextPreferences, history);
      } catch {
        response = await demoChatService.ask(clean, nextPreferences, history);
      }

      const capturedPreferences = mergeChatPreferences(
        nextPreferences,
        response.capturedPreferences
      );
      const normalizedResponse: ChatResponse = {
        ...response,
        capturedPreferences
      };
      setPreferences(capturedPreferences);
      setMessages((current) => [
        ...current,
        {
          id: messageId("assistant"),
          role: "assistant",
          text: normalizedResponse.text,
          response: normalizedResponse
        }
      ]);
    } catch {
      setError(
        "Die Demo-Antwort konnte nicht geladen werden. Bitte versuchen Sie es erneut oder rufen Sie kurz an."
      );
    } finally {
      setLoading(false);
    }
  };

  const selectChoice = (choice: ChatChoice) => {
    const nextPreferences = mergeChatPreferences(
      preferences,
      choicePreferences(choice, preferences)
    );
    void send(choice.label, nextPreferences);
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void send(input);
  };

  const handleProduct = (productId: string) => {
    setOpen(false);
    onProduct(productId);
  };

  const handleAction = (action: ChatAction, response: ChatResponse) => {
    if (action.type === "navigate") {
      setOpen(false);
      onNavigate(action.page);
      return;
    }
    if (action.type === "reserve") {
      setOpen(false);
      onStartReservation(
        buildReservationPrefill(
          response.capturedPreferences ?? preferences,
          response.suggestions ?? [],
          action
        )
      );
    }
  };

  const latestResponse = [...messages]
    .reverse()
    .find((message) => message.role === "assistant" && message.response)?.response;
  const inventoryLabel = latestResponse?.inventoryMode === "live" ? "Live-Sortiment" : "Beispielsortiment";

  return (
    <>
      <button
        className={`chat-launcher ${open ? "is-open" : ""}`}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="chat-panel"
      >
        <span className="chat-launcher-icon"><Icon name={open ? "close" : "chat"} /></span>
        <span>{open ? "Schließen" : "Blumen-Chat"}</span>
        {!open && <small>Wunsch beraten</small>}
      </button>

      {open && (
        <section
          className="chat-panel"
          id="chat-panel"
          aria-label="Blatt & Blüte Beratung"
        >
          <header>
            <div className="chat-avatar">
              <Icon name="flower" />
            </div>
            <div>
              <strong>Persönliche Blumenberatung</strong>
              <div className="chat-status-line">
                <span className={`chat-status-dot ${latestResponse?.mode === "live" ? "is-live" : ""}`} />
                <span>{statusLabel(latestResponse)}</span>
                <span className="chat-inventory-pill">{inventoryLabel}</span>
              </div>
            </div>
            <button
              type="button"
              className="icon-button"
              onClick={() => setOpen(false)}
              aria-label="Chat schließen"
            >
              <Icon name="close" />
            </button>
          </header>

          <div className="chat-messages" ref={scrollRef} aria-live="polite">
            {messages.map((message) => (
              <div
                className={`chat-message chat-message-${message.role}`}
                key={message.id}
              >
                {message.role === "assistant" && message.response && (
                  <div className="chat-message-meta">
                    <span>{statusLabel(message.response)}</span>
                    <span>{message.response.inventoryMode === "live" ? "Live-Sortiment" : "Beispielsortiment"}</span>
                  </div>
                )}
                <p>{message.text}</p>
                {message.response?.suggestions && message.response.suggestions.length > 0 && (
                  <div className="chat-product-suggestions" aria-label="Passende Demo-Beispiele">
                    <span className="chat-section-label">Das könnte passen</span>
                    {message.response.suggestions.map((suggestion) => (
                      <button
                        type="button"
                        key={suggestion.productId}
                        onClick={() => handleProduct(suggestion.productId)}
                      >
                        <span>{suggestion.label}</span>
                        <Icon name="arrow" />
                      </button>
                    ))}
                  </div>
                )}
                {message.response && actionList(message.response).length > 0 && (
                  <div className="chat-actions">
                    {actionList(message.response).map((action) =>
                      action.type === "call" ? (
                        <a
                          className="chat-action chat-action-call"
                          href={action.href}
                          key={`${action.type}-${action.label}`}
                        >
                          <Icon name="phone" />
                          <span>{action.label}</span>
                        </a>
                      ) : (
                        <button
                          type="button"
                          className={`chat-action ${action.type === "reserve" ? "chat-action-primary" : ""}`}
                          key={`${action.type}-${action.label}`}
                          onClick={() => handleAction(action, message.response!)}
                        >
                          <span>{action.label}</span>
                          <Icon name={action.type === "reserve" ? "calendar" : "arrow"} />
                        </button>
                      )
                    )}
                  </div>
                )}
                {message.response?.choices && message.response.choices.length > 0 && (
                  <div className="chat-choices" aria-label="Beratung auswählen">
                    {message.response.choices.map((choice) => {
                      const selected =
                        choice.key === "budget"
                          ? preferences.budgetMax !== undefined && choice.label.includes(String(preferences.budgetMax))
                          : choice.key === "pickup"
                            ? Boolean(preferences.pickupDate)
                            : choice.key !== "budget" &&
                                choice.key !== "pickup" &&
                                preferences[choice.key] === choice.value;
                      return (
                        <button
                          className={selected ? "is-selected" : ""}
                          type="button"
                          key={`${choice.key}-${choice.value}`}
                          onClick={() => selectChoice(choice)}
                          disabled={loading}
                        >
                          <span>{choice.label}</span>
                          {selected && <span aria-hidden="true">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="chat-message chat-message-assistant chat-loading">
                <span />
                <span />
                <span />
                <em>Ihre Wünsche werden sortiert …</em>
              </div>
            )}
            {error && (
              <div className="chat-error" role="alert">
                {error}
              </div>
            )}
          </div>

          {messages.length === 1 && (
            <div className="quick-questions" aria-label="Schnellfragen">
              {quickQuestions.map((question) => (
                <button
                  key={question}
                  type="button"
                  onClick={() => void send(question)}
                >
                  {question}
                </button>
              ))}
            </div>
          )}

          <form className="chat-form" onSubmit={onSubmit}>
            <label htmlFor="chat-input" className="sr-only">
              Frage eingeben
            </label>
            <input
              id="chat-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="z. B. morgen für meine Mutter …"
              maxLength={320}
              disabled={loading}
            />
            <button
              type="submit"
              className="icon-button"
              disabled={!input.trim() || loading}
              aria-label="Frage absenden"
            >
              <Icon name="send" />
            </button>
          </form>
        </section>
      )}
    </>
  );
}
