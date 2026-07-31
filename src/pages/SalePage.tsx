import { useEffect, useMemo, useState } from "react";
import { Icon } from "../components/Icons";
import { OrganicUnderline } from "../components/OrganicUnderline";
import { ProductCard } from "../components/ProductCard";
import { siteConfig } from "../config/site";
import { ageingNotes } from "../data/content";
import { products } from "../data/products";
import type { PageId, Product } from "../types";
import {
  formatCountdown,
  getSalePrice,
  getSaleState,
  isSaleProduct
} from "../utils/sale";

interface SalePageProps {
  onNavigate: (page: PageId) => void;
  onProduct: (product: Product) => void;
}

export function SalePage({ onNavigate, onProduct }: SalePageProps) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const saleState = getSaleState(now, siteConfig.timezone);
  const saleProducts = useMemo(
    () => products.filter(isSaleProduct).slice(0, 6),
    []
  );

  const reserve = (product: Product) => {
    sessionStorage.setItem("bb-selected-product", product.id);
    onNavigate("reservation");
  };

  return (
    <div className="sale-page page-gutter">
      <section className="page-hero sale-hero">
        <div>
          <h1>
            Schönes darf <OrganicUnderline>weiterblühen</OrganicUnderline>.
          </h1>
          <p>
            Ab 16:30 Uhr zeigen wir hier ausgewählte Demo-Produkte zum halben
            Preis – liebevoll gestaltet, ehrlich beschrieben und nur solange
            verfügbar.
          </p>
          <span className="timezone-label">
            <Icon name="clock" />
            Zeitzone: {siteConfig.timezone}
          </span>
        </div>
        <img
          src="/images/bouquet-autumn.png"
          alt="Warmer Herbststrauß mit geöffneten Blüten"
        />
      </section>

      <section className="sale-status-grid" aria-labelledby="sale-status-title">
        <article
          className={`sale-clock-card ${saleState.active ? "is-active" : ""}`}
        >
          <div className="sale-card-title">
            <div>
              <p>Heute in Freudenberg</p>
              <h2 id="sale-status-title">
                {saleState.active
                  ? "Restposten sind freigeschaltet"
                  : "Noch ein wenig Geduld"}
              </h2>
            </div>
            <span className="sale-icon">
              <Icon name={saleState.active ? "tag" : "clock"} />
            </span>
          </div>
          {saleState.active ? (
            <>
              <strong className="sale-live">50 % auf geeignete Produkte</strong>
              <p>
                Die unten gezeigten Preise sind einmalig halbiert. Verfügbarkeit
                und Zustand müssen bei der Abholung bestätigt werden.
              </p>
            </>
          ) : (
            <>
              <strong className="countdown">
                {formatCountdown(saleState.secondsUntilStart)}
              </strong>
              <p>
                Die ausgewählten Restposten werden heute um 16:30 Uhr
                freigeschaltet. Vorher zeigen wir keine rabattierte
                Bestellmöglichkeit.
              </p>
            </>
          )}
          <div className="sale-state-explainer">
            <span className={!saleState.active ? "current" : ""}>
              <Icon name="clock" />
              Vor 16:30 Uhr: Hinweis
            </span>
            <span className={saleState.active ? "current" : ""}>
              <Icon name="tag" />
              Ab 16:30 Uhr: 50 %
            </span>
          </div>
        </article>

        <article className="sale-help-card">
          <Icon name="phone" />
          <h2>Ein konkreter Wunsch?</h2>
          <p>
            Der tatsächliche Zustand kann je Produkt variieren. Wir sagen Ihnen
            gern ehrlich, was heute noch da ist.
          </p>
          <a
            className="button button-outline"
            href={`tel:${siteConfig.phoneE164}`}
          >
            {siteConfig.phoneDisplay} anrufen
          </a>
        </article>
      </section>

      <section className="sale-products" aria-labelledby="sale-products-title">
        <div className="section-heading">
          <div>
            <h2 id="sale-products-title">
              {saleState.active
                ? "Heute im Demo-Restposten"
                : "Ab 16:30 Uhr an dieser Stelle"}
            </h2>
            <p>
              Nur SALE-fähige Produkte mit positivem Demo-Bestand werden
              freigeschaltet.
            </p>
          </div>
        </div>

        {saleState.active ? (
          <div className="sale-product-grid">
            {saleProducts.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                featured={index === 0}
                salePrice={getSalePrice(product.price)}
                onOpen={onProduct}
                onReserve={reserve}
              />
            ))}
          </div>
        ) : (
          <div className="locked-sale-state">
            <Icon name="flower" />
            <div>
              <h3>Noch keine reduzierten Produkte sichtbar</h3>
              <p>
                Das schützt vor missverständlichen Vorab-Reservierungen.
                Schauen Sie nach 16:30 Uhr erneut vorbei oder rufen Sie für den
                aktuellen Ladenbestand an.
              </p>
            </div>
          </div>
        )}
      </section>

      <section className="ageing-section" aria-labelledby="ageing-title">
        <div className="ageing-intro">
          <p className="section-index">Gut zu wissen</p>
          <h2 id="ageing-title">Noch schön, nur anders</h2>
          <p>
            Restposten sind florale Einzelstücke, die nicht mehr ganz perfekt
            aussehen müssen, aber weiterhin Freude machen können. Wir
            dramatisieren nichts und schauen genau hin.
          </p>
        </div>
        <div className="ageing-grid">
          {ageingNotes.map((note, index) => (
            <article key={note.title}>
              <span>{index + 1}</span>
              <div>
                <h3>{note.title}</h3>
                <p>{note.text}</p>
              </div>
            </article>
          ))}
        </div>
        <div className="quality-note">
          <Icon name="check" />
          <p>
            <strong>Qualität bleibt die Grenze.</strong> Stark beschädigte oder
            unhygienische Ware wird nicht angeboten. Einzelne Blüten können
            vorab entfernt werden; nicht jede Sorte eignet sich später zum
            Trocknen.
          </p>
        </div>
      </section>
    </div>
  );
}
