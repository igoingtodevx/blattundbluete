import { useEffect, useRef, useState } from "react";
import { ApiChatService, DemoChatService } from "../services/chat";
import type { ChatChoice, ChatPreferences, ChatResponse, PageId } from "../types";
import { Icon } from "./Icons";

interface ChatWidgetProps {
  onNavigate: (page: PageId) => void;
  onProduct: (productId: string) => void;
}

interface Message {
  id: number;
  role: "assistant" | "user";
  text: string;
  response?: ChatResponse;
}

const quickQuestions = [
  "Ich suche einen Strauß.",
  "Habt ihr noch Rosen?",
  "Wo kann ich parken?",
  "Ich brauche spontan einen kleinen Strauß."
];

const apiChatService = new ApiChatService();
const demoChatService = new DemoChatService();

export function ChatWidget({ onNavigate, onProduct }: ChatWidgetProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [preferences, setPreferences] = useState<ChatPreferences>({});
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: "assistant",
      text:
        "Hallo! Was darf ich heute für Sie blumig machen? Ich helfe Ihnen mit Sträußen, Website-Bestand, Pflege, Anfahrt und einer passenden Vorbestellung."
    }
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [messages, open, loading]);

  const send = async (question: string, nextPreferences = preferences) => {
    const clean = question.trim();
    if (!clean || loading) return;

    setMessages((current) => [
      ...current,
      { id: Date.now(), role: "user", text: clean }
    ]);
    setInput("");
    setError("");
    setLoading(true);

    try {
      let response: ChatResponse;
      try {
        response = await apiChatService.ask(clean, nextPreferences);
      } catch {
        response = await demoChatService.ask(clean, nextPreferences);
      }
      setMessages((current) => [
        ...current,
        {
          id: Date.now() + 1,
          role: "assistant",
          text: response.text,
          response
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
    const nextPreferences = { ...preferences, [choice.key]: choice.value };
    setPreferences(nextPreferences);
    void send(choice.label, nextPreferences);
  };

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    void send(input);
  };

  return (
    <>
      <button
        className={`chat-launcher ${open ? "is-open" : ""}`}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="chat-panel"
      >
        <Icon name={open ? "close" : "chat"} />
        <span>{open ? "Schließen" : "Blumen-Chat"}</span>
      </button>

      {open && (
        <section
          className="chat-panel"
          id="chat-panel"
          aria-label="Blatt & Blüte Demo-Chat"
        >
          <header>
            <div className="chat-avatar">
              <Icon name="flower" />
            </div>
            <div>
              <strong>Blumen-Chat</strong>
              <span>Persönliche Beratung · Website-Bestand auf Anfrage</span>
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
                <p>{message.text}</p>
                {message.response?.suggestions && (
                  <div className="chat-product-suggestions">
                    {message.response.suggestions.map((suggestion) => (
                      <button
                        type="button"
                        key={suggestion.productId}
                        onClick={() => onProduct(suggestion.productId)}
                      >
                        {suggestion.label}
                        <Icon name="arrow" />
                      </button>
                    ))}
                  </div>
                )}
                {message.response?.action && (
                  <button
                    type="button"
                    className="chat-action"
                    onClick={() =>
                      onNavigate(message.response!.action!.page)
                    }
                  >
                    {message.response.action.label}
                    <Icon name="arrow" />
                  </button>
                )}
                {message.response?.choices && message.response.choices.length > 0 && (
                  <div className="chat-choices" aria-label="Beratung auswählen">
                    {message.response.choices.map((choice) => {
                      const selected = preferences[choice.key] === choice.value;
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
                <em>Antwort wird vorbereitet</em>
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
              placeholder="Ihre Frage …"
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
