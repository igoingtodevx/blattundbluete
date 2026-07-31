import { Icon } from "../components/Icons";
import { OrganicUnderline } from "../components/OrganicUnderline";
import { siteConfig } from "../config/site";
import {
  faqItems,
  knowledgeArticles,
  occasions
} from "../data/content";

export function KnowledgePage() {
  return (
    <div className="knowledge-page page-gutter">
      <section className="page-hero knowledge-hero">
        <div>
          <h1>
            Damit Blumen{" "}
            <OrganicUnderline>länger Freude</OrganicUnderline> machen.
          </h1>
          <p>
            Ein paar einfache Handgriffe helfen Schnittblumen im Alltag. Die
            Hinweise sind bewusst verständlich und ohne pauschale
            Haltbarkeitsversprechen.
          </p>
        </div>
        <img
          src="/images/flower-care.png"
          alt="Floristin schneidet grüne Stiele mit einer sauberen Gartenschere an"
        />
      </section>

      <section className="care-grid" aria-labelledby="care-title">
        <article className="care-feature">
          <div className="care-feature-heading">
            <div>
              <p className="section-index">Die wichtigsten Handgriffe</p>
              <h2 id="care-title">Frisch anschneiden, richtig einstellen</h2>
            </div>
            <Icon name="leaf" />
          </div>
          <div className="care-steps">
            {knowledgeArticles.slice(0, 2).map((article, index) => (
              <article key={article.id}>
                <span>{index + 1}</span>
                <h3>{article.title}</h3>
                <p>{article.summary}</p>
                <ol>
                  {article.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </article>
            ))}
          </div>
          <img
            src="/images/flower-care.png"
            alt=""
            role="presentation"
            loading="lazy"
          />
        </article>

        <div className="care-side-grid">
          {knowledgeArticles.slice(2).map((article, index) => (
            <article
              className={`care-card care-card-${index + 1}`}
              key={article.id}
            >
              <Icon name={index === 0 ? "spark" : "clock"} />
              <h2>{article.title}</h2>
              <p>{article.summary}</p>
              <ul>
                {article.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="occasion-section" aria-labelledby="occasion-title">
        <div className="section-heading">
          <div>
            <h2 id="occasion-title">Für jeden Anlass – und jeden Menschen</h2>
            <p>
              Persönliche Vorlieben zählen mehr als Geschlechterstereotype.
              Lieblingsfarbe, Stil und Anlass sind die besten Hinweise.
            </p>
          </div>
        </div>
        <div className="occasion-grid">
          {occasions.map((occasion, index) => (
            <article key={occasion.title}>
              <img
                src={
                  [
                    "/images/bouquet-meadow.png",
                    "/images/bouquet-soft.png",
                    "/images/bouquet-hero.png",
                    "/images/bouquet-autumn.png"
                  ][index % 4]
                }
                alt=""
                role="presentation"
                loading="lazy"
                style={{
                  objectPosition: `${35 + ((index * 13) % 45)}% ${35 + ((index * 7) % 25)}%`
                }}
              />
              <div>
                <h3>{occasion.title}</h3>
                <p>{occasion.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="faq-section" aria-labelledby="faq-title">
        <div className="faq-intro">
          <p className="section-index">Blumenwissen kompakt</p>
          <h2 id="faq-title">Häufige Fragen</h2>
          <p>
            Kurze Antworten für den Alltag. Für einen konkreten Floristik-Wunsch
            beraten wir Sie lieber persönlich.
          </p>
          <a
            className="button button-outline"
            href={`tel:${siteConfig.phoneE164}`}
          >
            <Icon name="phone" />
            {siteConfig.phoneDisplay}
          </a>
        </div>
        <div className="faq-list">
          {faqItems.map((item, index) => (
            <details key={item.id} open={index === 0}>
              <summary>
                <span>
                  {item.before}
                  <OrganicUnderline>{item.keyword}</OrganicUnderline>
                  {item.after}
                </span>
                <Icon name="plus" />
              </summary>
              <div className="faq-answer">
                <p>{item.answer}</p>
                {item.steps && (
                  <ol>
                    {item.steps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                )}
              </div>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
