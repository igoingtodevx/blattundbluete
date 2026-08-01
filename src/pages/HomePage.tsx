import { siteConfig } from "../config/site";
import { products } from "../data/products";
import type { PageId, Product } from "../types";
import { ChatWidget } from "../components/ChatWidget";
import { Icon } from "../components/Icons";
import { OrganicUnderline } from "../components/OrganicUnderline";
import { ProductCard } from "../components/ProductCard";

interface HomePageProps {
  onNavigate: (page: PageId) => void;
  onProduct: (product: Product) => void;
}

export function HomePage({ onNavigate, onProduct }: HomePageProps) {
  const featuredProducts = [
    products[0],
    products[7],
    products[12],
    products[17]
  ];

  return (
    <>
      <section className="home-hero page-gutter" aria-labelledby="home-title">
        <div className="hero-copy bento-panel">
          <h1 id="home-title">
            Blumen, die von{" "}
            <OrganicUnderline>Herzen</OrganicUnderline> kommen.
          </h1>
          <p>
            Schön, dass Sie da sind. Bei Blatt & Blüte in Freudenberg finden
            Sie liebevoll gebundene Sträuße, saisonale Blumen und besondere
            Kleinigkeiten für Zuhause.
          </p>
          <div className="hero-actions">
            <button
              className="button button-primary"
              type="button"
              onClick={() => onNavigate("products")}
            >
              Sträuße entdecken
              <Icon name="arrow" />
            </button>
            <button
              className="button button-outline"
              type="button"
              onClick={() => onNavigate("reservation")}
            >
              Vorbestellen
            </button>
          </div>
          <a className="call-link" href={`tel:${siteConfig.phoneE164}`}>
            <Icon name="phone" />
            Direkt anrufen: {siteConfig.phoneDisplay}
          </a>
        </div>
        <div className="hero-image bento-panel">
          <img
            src="/images/bouquet-hero.png"
            alt="Floristin hält einen frisch gebundenen Strauß in warmen Blütentönen"
          />
          <div className="hero-image-note">
            <Icon name="spark" />
            <span>
              Persönlich gebunden
              <small>nach Farbe, Anlass und Budget</small>
            </span>
          </div>
        </div>
      </section>

      <section
        className="service-bento page-gutter"
        aria-label="Service und aktuelle Hinweise"
      >
        <article className="bento-panel hours-panel">
          <Icon name="clock" />
          <h2>Öffnungszeiten & Standort</h2>
          <div className="hours-list">
            {siteConfig.hours.map((entry) => (
              <div key={entry.days}>
                <strong>{entry.days}</strong>
                <span>{entry.times.join(" · ")}</span>
              </div>
            ))}
          </div>
          <address>
            <Icon name="map" />
            {siteConfig.addressLine}, {siteConfig.postalCity}
          </address>
          <small>{siteConfig.dataNote}</small>
        </article>

        <article className="bento-panel seasonal-panel">
          <div className="seasonal-copy">
            <Icon name="flower" />
            <h2>Saisonale Blumen</h2>
            <p>
              Was gerade gut aussieht, wird frisch und passend zu Ihrem Wunsch
              zusammengestellt. Die Produktübersicht zeigt Demo-Beispiele, kein
              garantiertes Live-Sortiment.
            </p>
            <button
              className="text-button"
              type="button"
              onClick={() => onNavigate("products")}
            >
              Demo-Sortiment ansehen <Icon name="arrow" />
            </button>
          </div>
          <img
            src="/images/bouquet-meadow.png"
            alt="Bunter saisonaler Wiesenstrauß"
            loading="lazy"
          />
        </article>

        <article className="bento-panel service-panel">
          <span className="round-icon">
            <Icon name="leaf" />
          </span>
          <h2>Mit Herz & Fachwissen</h2>
          <p>
            Florale Präsente, Hochzeitsfloristik, Trauerarrangements und
            Wohnaccessoires – für große Pläne am liebsten nach persönlicher
            Absprache.
          </p>
          <a href={`tel:${siteConfig.phoneE164}`} className="text-button">
            Wunsch besprechen <Icon name="arrow" />
          </a>
        </article>

        <article className="bento-panel sale-teaser">
          <span className="round-icon">
            <Icon name="tag" />
          </span>
          <h2>Restposten ab 16:30 Uhr</h2>
          <p>
            Geeignete Demo-Produkte erscheinen täglich ab 16:30 Uhr mit 50 %
            Nachlass – ehrlich beschrieben und nur solange verfügbar.
          </p>
          <button
            className="text-button"
            type="button"
            onClick={() => onNavigate("sale")}
          >
            Restposten ansehen <Icon name="arrow" />
          </button>
        </article>

        <article className="bento-panel chat-teaser">
          <span className="round-icon">
            <Icon name="chat" />
          </span>
          <h2>Eine Frage zwischendurch?</h2>
          <p>
            Der Blumen-Chat hilft bei Website-Bestand, Größen, Anlässen,
            Pflege und einer passenden Vorbestellung – ehrlich und persönlich.
          </p>
          <span className="chat-hint">Unten rechts öffnen</span>
        </article>
      </section>

      <section className="featured-section page-gutter">
        <div className="section-heading">
          <div>
          <h2>Ein paar Lieblingsstücke</h2>
            <p>Vier Beispiele aus dem Demo-Sortiment.</p>
          </div>
          <button
            className="button button-outline"
            type="button"
            onClick={() => onNavigate("products")}
          >
            Alle 20 Produkte
            <Icon name="arrow" />
          </button>
        </div>
        <div className="featured-grid">
          {featuredProducts.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              featured={index === 0}
              onOpen={onProduct}
              onReserve={(item) => {
                sessionStorage.setItem("bb-selected-product", item.id);
                onNavigate("reservation");
              }}
            />
          ))}
        </div>
      </section>

      <section className="google-band page-gutter">
        <div className="bento-panel google-panel">
          <div className="google-mark" aria-hidden="true">
            G
          </div>
          <div>
            <h2>Ihre Erfahrung zählt</h2>
            <p>
              Sie möchten uns weiterempfehlen oder aktuelle Erfahrungen
              ansehen? Besuchen Sie Blatt & Blüte bei Google.
            </p>
          </div>
          <a
            className="button button-primary"
            href={siteConfig.googleUrl}
            target="_blank"
            rel="noreferrer noopener"
          >
            Zu Google
            <Icon name="arrow" />
          </a>
          <small>Externer Link – kein eingebettetes Live-Bewertungswidget.</small>
        </div>
      </section>

      <section className="contact-band page-gutter">
        <div>
          <Icon name="map" />
          <span>
            <strong>Besuchen Sie uns</strong>
            {siteConfig.addressLine}
            <br />
            {siteConfig.postalCity}
          </span>
        </div>
        <div>
          <Icon name="phone" />
          <span>
            <strong>Rufen Sie uns an</strong>
            <a href={`tel:${siteConfig.phoneE164}`}>
              {siteConfig.phoneDisplay}
            </a>
          </span>
        </div>
        <div>
          <Icon name="calendar" />
          <span>
            <strong>Wunsch vorbereiten</strong>
            <button type="button" onClick={() => onNavigate("reservation")}>
              Zur Demo-Anfrage
            </button>
          </span>
        </div>
      </section>

      <ChatWidget
        onNavigate={onNavigate}
        onProduct={(productId) => {
          const product = products.find((item) => item.id === productId);
          if (product) onProduct(product);
        }}
      />
    </>
  );
}
