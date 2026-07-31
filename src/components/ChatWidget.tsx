import { useEffect, useRef, useState } from "react";
import { DemoChatService } from "../services/chat";
import type { ChatResponse, PageId } from "../types";
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
  "Habt ihr noch Rosen?",
  "Was ist gerade saisonal?",
  "Ich brauche spontan einen kleinen Strauß.",
  "Kann ich etwas reservieren?"
];

const chatService = new DemoChatService();

export function ChatWidget({ onNavigate, onProduct }: ChatWidgetProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: "assistant",
      text:
        "Hallo! Ich helfe mit dem Demo-Sortiment, Pflegefragen und der Vorbereitung einer Anfrage. Bestände können sich im Laden kurzfristig ändern."
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

  const send = async (question: string) => {
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
      const response = await chatService.ask(clean);
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
              <span>Regelbasiertes Demo · keine Live-Auskunft</span>
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
