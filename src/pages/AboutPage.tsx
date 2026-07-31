import { Icon } from "../components/Icons";
import { siteConfig } from "../config/site";
import type { PageId } from "../types";

interface AboutPageProps {
  onNavigate: (page: PageId) => void;
}

const values = [
  {
    icon: "flower" as const,
    title: "Persönlich statt beliebig",
    text: "Ein Strauß darf nach einem Menschen aussehen. Deshalb zählen Farbe, Anlass und Gefühl für uns mehr als feste Schablonen."
  },
  {
    icon: "leaf" as const,
    title: "Saisonal gedacht",
    text: "Was gerade schön und verfügbar ist, darf die Gestaltung mitbestimmen – ehrlich, wandelbar und mit Blick auf die Natur."
  },
  {
    icon: "spark" as const,
    title: "Mit Ruhe beraten",
    text: "Sie müssen nicht schon wissen, was Sie suchen. Wir hören zu, sortieren Ideen und finden gemeinsam einen passenden nächsten Schritt."
  }
];

export function AboutPage({ onNavigate }: AboutPageProps) {
  return (
    <div className="about-page page-gutter">
      <section className="about-lead bento-panel" aria-labelledby="about-title">
        <div className="about-lead-heading">
          <p className="section-index">Einblick in Blatt & Blüte</p>
          <h1 id="about-title">Wer sind wir?</h1>
        </div>

        <figure className="about-portrait">
          <img
            src="/images/about-owners-placeholder.png"
            alt="Künstlerische Platzhalterillustration zweier Floristinnen zwischen Blumen und Blättern"
          />
          <figcaption>
            Platzhaltergrafik – echte Porträts und Namen können hier später
            ergänzt werden.
          </figcaption>
        </figure>

        <div className="about-lead-copy">
          <p className="about-lead-intro">
            Hinter Blatt & Blüte stehen zwei Menschen mit Freude an Farbe,
            Formen und den kleinen Gesten, die einen Tag heller machen.
          </p>
          <p>
            Unser Laden soll ein Ort sein, an dem Sie kurz durchatmen und mit
            einem guten Gefühl wieder hinausgehen. Ob kleiner Gruß, saisonaler
            Strauß oder ein besonderer Anlass: Wir schauen gemeinsam, was zu
            Ihnen und zum Moment passt.
          </p>
        </div>
      </section>

      <section className="about-values" aria-labelledby="values-title">
        <div className="section-heading">
          <div>
            <p className="section-index">Unsere Haltung</p>
            <h2 id="values-title">Was uns wichtig ist</h2>
            <p>
              Gute Floristik beginnt für uns mit einem offenen Ohr und endet
              mit etwas, das sich wirklich nach Ihnen anfühlt.
            </p>
          </div>
        </div>
        <div className="about-values-grid">
          {values.map((value) => (
            <article className="about-value-card bento-panel" key={value.title}>
              <span className="round-icon">
                <Icon name={value.icon} />
              </span>
              <h2>{value.title}</h2>
              <p>{value.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="about-next bento-panel" aria-labelledby="about-next-title">
        <div>
          <p className="section-index">Lust auf Blumen?</p>
          <h2 id="about-next-title">Erzählen Sie uns von Ihrem Anlass.</h2>
          <p>
            Für eine konkrete Idee ist ein kurzer Anruf oft der persönlichste
            Weg. Oder Sie stöbern erst einmal durch unser Demo-Sortiment.
          </p>
        </div>
        <div className="about-next-actions">
          <a className="button button-primary" href={`tel:${siteConfig.phoneE164}`}>
            <Icon name="phone" />
            {siteConfig.phoneDisplay}
          </a>
          <button
            className="button button-outline"
            type="button"
            onClick={() => onNavigate("products")}
          >
            Blumen entdecken
            <Icon name="arrow" />
          </button>
        </div>
      </section>
    </div>
  );
}
