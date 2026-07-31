import { useEffect, useState, type PropsWithChildren } from "react";
import { siteConfig } from "../config/site";
import type { PageId } from "../types";
import { BrandMark } from "./BrandMark";
import { Icon } from "./Icons";

interface LayoutProps extends PropsWithChildren {
  activePage: PageId;
  onNavigate: (page: PageId) => void;
}

const navigation: { page: PageId; label: string }[] = [
  { page: "home", label: "Startseite" },
  { page: "products", label: "Blumen & Sträuße" },
  { page: "sale", label: "Restposten" },
  { page: "knowledge", label: "Blumenwissen" },
  { page: "about", label: "Über Uns" }
];

export function Layout({
  activePage,
  onNavigate,
  children
}: LayoutProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [activePage]);

  const navigate = (page: PageId) => {
    onNavigate(page);
    setMenuOpen(false);
  };

  return (
    <div className="site-shell">
      <a className="skip-link" href="#main-content">
        Zum Inhalt springen
      </a>
      <header className="site-header">
        <button
          className="brand-button"
          type="button"
          onClick={() => navigate("home")}
          aria-label="Zur Startseite"
        >
          <BrandMark />
          <span>
            <strong>Blatt & Blüte</strong>
            <small>Freudenberg</small>
          </span>
        </button>

        <nav
          className={`main-navigation ${menuOpen ? "is-open" : ""}`}
          aria-label="Hauptnavigation"
        >
          {navigation.map((item) => (
            <button
              key={item.page}
              type="button"
              className={activePage === item.page ? "active" : ""}
              aria-current={activePage === item.page ? "page" : undefined}
              onClick={() => navigate(item.page)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="header-actions">
          <a
            className="header-phone"
            href={`tel:${siteConfig.phoneE164}`}
            aria-label={`${siteConfig.phoneDisplay} anrufen`}
          >
            <Icon name="phone" />
            <span>{siteConfig.phoneDisplay}</span>
          </a>
          <button
            className="button button-primary header-cta"
            type="button"
            onClick={() => navigate("reservation")}
            aria-current={activePage === "reservation" ? "page" : undefined}
          >
            <Icon name="calendar" />
            Vorbestellen
          </button>
          <button
            className="menu-button"
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Menü schließen" : "Menü öffnen"}
          >
            <Icon name={menuOpen ? "close" : "menu"} />
          </button>
        </div>
      </header>

      <main id="main-content">{children}</main>

      <footer className="site-footer">
        <div className="footer-top">
          <div className="footer-brand">
            <BrandMark />
            <div>
              <strong>Blatt & Blüte</strong>
              <p>Florales mit Gefühl – mitten in Freudenberg.</p>
            </div>
          </div>
          <address>
            <Icon name="map" />
            <span>
              {siteConfig.addressLine}
              <br />
              {siteConfig.postalCity}
            </span>
          </address>
          <div className="footer-contact">
            <Icon name="phone" />
            <a href={`tel:${siteConfig.phoneE164}`}>
              {siteConfig.phoneDisplay}
            </a>
          </div>
          <div className="footer-socials" aria-label="Social Media">
            <a
              href={siteConfig.instagramUrl}
              target="_blank"
              rel="noreferrer noopener"
              aria-label="Instagram öffnen"
            >
              <Icon name="instagram" />
            </a>
            <a
              href={siteConfig.facebookUrl}
              target="_blank"
              rel="noreferrer noopener"
              aria-label="Facebook öffnen"
            >
              <Icon name="facebook" />
            </a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Blatt & Blüte</span>
          <span>Demo-Grundgerüst – Bestände und Anfragen sind nicht live.</span>
          <span>
            Impressum · Datenschutz <small>(Platzhalter)</small>
          </span>
        </div>
      </footer>
    </div>
  );
}
