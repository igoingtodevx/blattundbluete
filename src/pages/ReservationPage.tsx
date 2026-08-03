import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent
} from "react";
import { Icon } from "../components/Icons";
import { OrganicUnderline } from "../components/OrganicUnderline";
import {
  integrationStatus,
  phoneCommunicationText,
  siteConfig
} from "../config/site";
import { getProductById, products } from "../data/products";
import { DemoReservationService } from "../services/reservations";
import {
  clearReservationPrefill,
  safeReadReservationPrefill
} from "../utils/chat";
import type { ChatReservationPrefill, ReservationDraft } from "../types";
import { getPriceLabel } from "../utils/money";

type Errors = Partial<Record<keyof ReservationDraft, string>>;

const service = new DemoReservationService();

const dateInputValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const contactIsValid = (value: string) => {
  const normalized = value.trim();
  const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phone = /^[+()\d][\d\s()/+-]{6,}$/;
  return email.test(normalized) || phone.test(normalized);
};

interface ReservationPageProps {
  prefill?: ChatReservationPrefill | null;
  onPrefillConsumed?: () => void;
}

const createInitialDraft = (prefill?: ChatReservationPrefill | null): ReservationDraft => {
  const stored = prefill ?? safeReadReservationPrefill();
  return {
    mode: "preorder",
    productId:
      stored?.productId ?? products.find((product) => product.stock > 0)?.id ?? "",
    quantity: 1,
    pickupDate: stored?.pickupDate ?? "",
    pickupTime: stored?.pickupTime ?? "",
    name: "",
    contact: "",
    occasion: stored?.occasion ?? "",
    recipient: stored?.recipient,
    budgetMax: stored?.budgetMax,
    style: stored?.style,
    color: stored?.color,
    specialWishes: stored?.specialWishes,
    message: stored?.message ?? ""
  };
};

export function ReservationPage({
  prefill,
  onPrefillConsumed
}: ReservationPageProps) {
  const [visiblePrefill, setVisiblePrefill] = useState<ChatReservationPrefill | null>(
    () => prefill ?? safeReadReservationPrefill()
  );
  const appliedPrefillId = useRef<string | null>(null);
  const [draft, setDraft] = useState<ReservationDraft>(() =>
    createInitialDraft(prefill)
  );
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!prefill || appliedPrefillId.current === prefill.id) return;
    appliedPrefillId.current = prefill.id;
    setVisiblePrefill(prefill);
    setDraft((current) => ({
      ...current,
      productId: prefill.productId ?? current.productId,
      occasion: prefill.occasion ?? current.occasion,
      recipient: prefill.recipient,
      budgetMax: prefill.budgetMax,
      style: prefill.style,
      color: prefill.color,
      specialWishes: prefill.specialWishes,
      pickupDate: prefill.pickupDate ?? current.pickupDate,
      pickupTime: prefill.pickupTime ?? current.pickupTime,
      message: prefill.message.slice(0, 500)
    }));
    clearReservationPrefill();
    onPrefillConsumed?.();
  }, [onPrefillConsumed, prefill]);

  const selectedProduct = useMemo(
    () => getProductById(draft.productId),
    [draft.productId]
  );

  const update = <K extends keyof ReservationDraft>(
    key: K,
    value: ReservationDraft[K]
  ) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setSuccess("");
  };

  const validate = () => {
    const next: Errors = {};
    const product = getProductById(draft.productId);

    if (!product) next.productId = "Bitte wählen Sie ein Produkt aus.";
    if (product && (product.stock <= 0 || product.status === "soldout")) {
      next.productId = "Dieses Demo-Produkt ist ausverkauft.";
    }
    if (
      !Number.isInteger(draft.quantity) ||
      draft.quantity <= 0 ||
      (product && draft.quantity > product.stock)
    ) {
      next.quantity = product
        ? `Bitte wählen Sie 1 bis ${product.stock} Stück.`
        : "Bitte wählen Sie eine gültige Menge.";
    }
    if (!draft.pickupDate) next.pickupDate = "Bitte wählen Sie ein Datum.";
    if (!draft.pickupTime) next.pickupTime = "Bitte wählen Sie eine Uhrzeit.";
    if (draft.pickupDate && draft.pickupTime) {
      const pickup = new Date(`${draft.pickupDate}T${draft.pickupTime}:00`);
      if (Number.isNaN(pickup.getTime()) || pickup <= new Date()) {
        next.pickupTime = "Die Abholzeit muss in der Zukunft liegen.";
      }
    }
    if (!draft.name.trim()) next.name = "Bitte geben Sie Ihren Namen an.";
    if (!contactIsValid(draft.contact)) {
      next.contact =
        "Bitte geben Sie eine gültige Telefonnummer oder E-Mail-Adresse an.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError("");
    setSuccess("");
    if (!validate()) return;

    setSubmitting(true);
    try {
      const result = await service.submit(draft);
      setSuccess(result.message);
    } catch {
      setSubmitError(
        "Die Demo-Anfrage konnte nicht geprüft werden. Bitte kontrollieren Sie Ihre Eingaben oder rufen Sie uns an."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="reservation-page page-gutter">
      <section className="page-hero reservation-hero">
        <div>
          <h1>
            Wir bereiten Ihre Blumen{" "}
            <OrganicUnderline>gerne</OrganicUnderline> vor.
          </h1>
          <p>
            Wählen Sie Ihren Wunsch und eine Abholzeit. Die Abholung wird erst
            nach persönlicher Bestätigung durch den Laden verbindlich.
          </p>
        </div>
        <img
          src="/images/bouquet-soft.png"
          alt="Zarter weiß-rosafarbener Strauß mit Salbeiband"
        />
      </section>

      <ol className="form-progress" aria-label="Anfrageschritte">
        <li className="active">
          <span>1</span>
          <div>
            <strong>Auswahl</strong>
            <small>Artikel und Menge</small>
          </div>
        </li>
        <li>
          <span>2</span>
          <div>
            <strong>Abholung</strong>
            <small>Datum und Zeit</small>
          </div>
        </li>
        <li>
          <span>3</span>
          <div>
            <strong>Kontakt</strong>
            <small>Rückmeldung ermöglichen</small>
          </div>
        </li>
      </ol>

      {visiblePrefill && (
        <section className="chat-prefill-banner" aria-label="Übernommene Chat-Beratung">
          <div className="chat-prefill-icon"><Icon name="chat" /></div>
          <div>
            <span className="chat-prefill-kicker">Aus der Blumenberatung übernommen</span>
            <h2>Ihr Wunsch ist schon notiert.</h2>
            <p>{visiblePrefill.message}</p>
          </div>
        </section>
      )}

      <form className="reservation-form" onSubmit={submit} noValidate>
        <section className="request-type-panel" aria-labelledby="request-type">
          <h2 id="request-type">Was möchten Sie tun?</h2>
          <div className="mode-options">
            <label className={draft.mode === "preorder" ? "selected" : ""}>
              <input
                type="radio"
                name="mode"
                value="preorder"
                checked={draft.mode === "preorder"}
                onChange={() => update("mode", "preorder")}
              />
              <span>
                <strong>Vorbestellung</strong>
                <small>Wir bereiten Ihren Wunsch zur Abholung vor.</small>
              </span>
            </label>
            <label className={draft.mode === "reservation" ? "selected" : ""}>
              <input
                type="radio"
                name="mode"
                value="reservation"
                checked={draft.mode === "reservation"}
                onChange={() => update("mode", "reservation")}
              />
              <span>
                <strong>Reservierung</strong>
                <small>
                  Anfrage mit Pfand-/Reservierungsgebühr von 2,90 €.
                </small>
              </span>
            </label>
          </div>

          <fieldset
            className={errors.productId ? "field-error" : ""}
            aria-describedby={
              errors.productId ? "product-error" : "product-note"
            }
          >
            <legend>Produkt auswählen *</legend>
            <div className="product-picker">
              {products.map((product) => {
                const unavailable =
                  product.stock <= 0 || product.status === "soldout";
                return (
                  <label
                    key={product.id}
                    className={[
                      draft.productId === product.id ? "selected" : "",
                      unavailable ? "unavailable" : ""
                    ].join(" ")}
                  >
                    <input
                      type="radio"
                      name="product"
                      value={product.id}
                      checked={draft.productId === product.id}
                      disabled={unavailable}
                      onChange={() => update("productId", product.id)}
                    />
                    <img
                      src={product.image}
                      alt=""
                      role="presentation"
                      style={{ objectPosition: product.imagePosition }}
                      loading="lazy"
                    />
                    <span>
                      <strong>{product.name}</strong>
                      <small>
                        {unavailable
                          ? "Ausverkauft"
                          : getPriceLabel(product.price, product.priceMax)}
                      </small>
                    </span>
                  </label>
                );
              })}
            </div>
            <p id="product-note" className="field-note">
              Demo-Auswahl – der Ladenbestand wird bei Bestätigung geprüft.
            </p>
            {errors.productId && (
              <p id="product-error" className="error-text" role="alert">
                {errors.productId}
              </p>
            )}
          </fieldset>

          <div className={errors.quantity ? "field-error" : ""}>
            <label htmlFor="quantity">Menge *</label>
            <div className="quantity-control">
              <button
                type="button"
                onClick={() =>
                  update("quantity", Math.max(1, draft.quantity - 1))
                }
                aria-label="Menge verringern"
              >
                <Icon name="minus" />
              </button>
              <input
                id="quantity"
                type="number"
                min="1"
                max={selectedProduct?.stock ?? 1}
                value={draft.quantity}
                onChange={(event) =>
                  update("quantity", Number(event.target.value))
                }
              />
              <button
                type="button"
                onClick={() =>
                  update(
                    "quantity",
                    Math.min(
                      selectedProduct?.stock ?? 1,
                      draft.quantity + 1
                    )
                  )
                }
                aria-label="Menge erhöhen"
              >
                <Icon name="plus" />
              </button>
            </div>
            {errors.quantity && (
              <p className="error-text" role="alert">
                {errors.quantity}
              </p>
            )}
          </div>
        </section>

        <section className="pickup-panel" aria-labelledby="pickup-title">
          <h2 id="pickup-title">Abholung & Kontakt</h2>
          <div className="form-grid">
            <label className={errors.pickupDate ? "field-error" : ""}>
              <span>Abholdatum *</span>
              <input
                type="date"
                min={dateInputValue(new Date())}
                value={draft.pickupDate}
                onInput={(event) =>
                  update("pickupDate", event.currentTarget.value)
                }
                aria-invalid={Boolean(errors.pickupDate)}
              />
              {errors.pickupDate && (
                <small className="error-text">{errors.pickupDate}</small>
              )}
            </label>
            <label className={errors.pickupTime ? "field-error" : ""}>
              <span>Abholzeit *</span>
              <input
                type="time"
                value={draft.pickupTime}
                onInput={(event) =>
                  update("pickupTime", event.currentTarget.value)
                }
                aria-invalid={Boolean(errors.pickupTime)}
              />
              {errors.pickupTime && (
                <small className="error-text">{errors.pickupTime}</small>
              )}
            </label>
            <label className={errors.name ? "field-error" : ""}>
              <span>Name *</span>
              <input
                type="text"
                autoComplete="name"
                value={draft.name}
                onChange={(event) => update("name", event.target.value)}
                placeholder="Ihr Name"
                aria-invalid={Boolean(errors.name)}
              />
              {errors.name && (
                <small className="error-text">{errors.name}</small>
              )}
            </label>
            <label className={errors.contact ? "field-error" : ""}>
              <span>Telefon oder E-Mail *</span>
              <input
                type="text"
                autoComplete="email"
                value={draft.contact}
                onChange={(event) => update("contact", event.target.value)}
                placeholder="Ihre Kontaktmöglichkeit"
                aria-invalid={Boolean(errors.contact)}
              />
              {errors.contact && (
                <small className="error-text">{errors.contact}</small>
              )}
            </label>
            <label className="form-span">
              <span>Anlass (optional)</span>
              <input
                type="text"
                value={draft.occasion}
                onChange={(event) => update("occasion", event.target.value)}
                placeholder="z. B. Geburtstag, Hochzeit, Dankeschön"
              />
            </label>
            <label className="form-span">
              <span>Persönliche Nachricht (optional)</span>
              <textarea
                rows={5}
                value={draft.message}
                onChange={(event) => update("message", event.target.value)}
                placeholder="Farben, Blumenwünsche oder weitere Hinweise"
                maxLength={500}
              />
              <small>{draft.message?.length ?? 0}/500 Zeichen</small>
            </label>
          </div>

          {submitError && (
            <div className="form-alert form-alert-error" role="alert">
              <Icon name="close" />
              {submitError}
            </div>
          )}
          {success && (
            <div className="form-alert form-alert-success" role="status">
              <Icon name="check" />
              <div>
                <strong>Demo-Prüfung erfolgreich</strong>
                <p>{success}</p>
              </div>
            </div>
          )}

          <button
            className="button button-primary button-full submit-button"
            type="submit"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <span className="spinner" aria-hidden="true" />
                Anfrage wird geprüft …
              </>
            ) : (
              <>
                Anfrage senden
                <Icon name="send" />
              </>
            )}
          </button>
          <p className="demo-submit-note">
            <Icon name="check" />
            Demo-Modus: Es werden keine personenbezogenen Daten gespeichert
            oder versendet.
          </p>
        </section>

        <aside className="order-summary" aria-labelledby="summary-title">
          <h2 id="summary-title">Ihre Anfrage</h2>
          {selectedProduct ? (
            <div className="summary-product">
              <img
                src={selectedProduct.image}
                alt=""
                role="presentation"
                style={{ objectPosition: selectedProduct.imagePosition }}
              />
              <div>
                <strong>{selectedProduct.name}</strong>
                <span>
                  {getPriceLabel(
                    selectedProduct.price,
                    selectedProduct.priceMax
                  )}
                </span>
                <small>Menge: {draft.quantity}</small>
              </div>
            </div>
          ) : (
            <div className="summary-empty">
              <Icon name="flower" />
              Noch kein Produkt gewählt
            </div>
          )}
          <dl>
            <div>
              <dt>Art</dt>
              <dd>
                {draft.mode === "preorder"
                  ? "Vorbestellung"
                  : "Reservierung"}
              </dd>
            </div>
            <div>
              <dt>Abholung</dt>
              <dd>
                {draft.pickupDate || "noch offen"}
                {draft.pickupTime ? ` · ${draft.pickupTime} Uhr` : ""}
              </dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>Nur Demo-Anfrage</dd>
            </div>
          </dl>
          {draft.mode === "reservation" && (
            <div className="deposit-note">
              <Icon name="tag" />
              <div>
                <strong>Pfand-/Reservierungsgebühr 2,90 €</strong>
                <p>
                  Keine Zahlung auf dieser Website. Rückgabe- oder
                  Verrechnungsbedingungen müssen vom Laden bestätigt werden.
                </p>
              </div>
            </div>
          )}
          <div className="integration-list">
            <p>
              <Icon name="check" />
              {integrationStatus.payments}
            </p>
            <p>
              <Icon name="check" />
              Abholung erst nach Bestätigung verbindlich
            </p>
            <p>
              <Icon name="check" />
              Kein unsicheres Speichern im Browser
            </p>
          </div>
        </aside>
      </form>

      <section className="phone-section" aria-labelledby="phone-title">
        <div className="phone-card">
          <Icon name="phone" />
          <div>
            <h2 id="phone-title">Lieber kurz persönlich?</h2>
            <a href={`tel:${siteConfig.phoneE164}`}>
              {siteConfig.phoneDisplay}
            </a>
            <span>Wir freuen uns auf Ihren Anruf.</span>
          </div>
        </div>
        <blockquote>{phoneCommunicationText}</blockquote>
        <div className="voice-note">
          <Icon name="chat" />
          <div>
            <strong>Noch nicht technisch angebunden</strong>
            <p>
              {integrationStatus.voice} Vor einer späteren Umsetzung müssen
              Einwilligung, Zweckbindung, Aufbewahrung und Datenschutz geklärt
              werden.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
