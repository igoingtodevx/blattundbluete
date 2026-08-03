import { useMemo, useState } from "react";
import { ProductCard } from "../components/ProductCard";
import { Icon } from "../components/Icons";
import { OrganicUnderline } from "../components/OrganicUnderline";
import {
  bouquetCount,
  decorCount,
  products
} from "../data/products";
import type {
  BouquetSize,
  PageId,
  Product,
  ProductCategory,
  ProductStatus
} from "../types";

interface CataloguePageProps {
  onNavigate: (page: PageId) => void;
  onProduct: (product: Product) => void;
  onReserve: (product: Product) => void;
}

type SortOption = "recommended" | "price-asc" | "price-desc" | "name";
type CategoryFilter = "all" | ProductCategory;
type SizeFilter = "all" | BouquetSize;
type StatusFilter = "all" | ProductStatus;

export function CataloguePage({
  onNavigate,
  onProduct,
  onReserve
}: CataloguePageProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [size, setSize] = useState<SizeFilter>("all");
  const [occasion, setOccasion] = useState("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [price, setPrice] = useState("all");
  const [sort, setSort] = useState<SortOption>("recommended");

  const allOccasions = useMemo(
    () =>
      Array.from(new Set(products.flatMap((product) => product.occasions))).sort(
        (a, b) => a.localeCompare(b, "de")
      ),
    []
  );

  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("de-DE");
    const next = products.filter((product) => {
      const haystack = [
        product.name,
        product.description,
        ...product.materials,
        ...product.colors,
        ...product.occasions
      ]
        .join(" ")
        .toLocaleLowerCase("de-DE");

      const priceMatches =
        price === "all" ||
        (price === "under-20" && product.price < 20) ||
        (price === "20-40" && product.price >= 20 && product.price <= 40) ||
        (price === "over-40" && product.price > 40);

      return (
        (!normalizedSearch || haystack.includes(normalizedSearch)) &&
        (category === "all" || product.category === category) &&
        (size === "all" || product.size === size) &&
        (occasion === "all" || product.occasions.includes(occasion)) &&
        (status === "all" || product.status === status) &&
        priceMatches
      );
    });

    return next.sort((a, b) => {
      if (sort === "price-asc") return a.price - b.price;
      if (sort === "price-desc") return b.price - a.price;
      if (sort === "name") return a.name.localeCompare(b.name, "de");
      return products.indexOf(a) - products.indexOf(b);
    });
  }, [category, occasion, price, search, size, sort, status]);

  const resetFilters = () => {
    setSearch("");
    setCategory("all");
    setSize("all");
    setOccasion("all");
    setStatus("all");
    setPrice("all");
    setSort("recommended");
  };

  return (
    <div className="catalogue-page page-gutter">
      <section className="page-hero catalogue-hero">
        <div>
          <h1>
            Finden Sie Ihren{" "}
            <OrganicUnderline>Lieblingsstrauß</OrganicUnderline>.
          </h1>
          <p>
            16 Sträuße und 4 Holzdekorationen als Demo. Preise und Bestände
            sind Richtwerte und werden erst im Laden bestätigt.
          </p>
          <label className="search-field">
            <span className="sr-only">Produkte durchsuchen</span>
            <Icon name="search" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nach Sträußen, Blumen oder Anlässen suchen …"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Suche leeren"
              >
                <Icon name="close" />
              </button>
            )}
          </label>
        </div>
        <img
          src="/images/bouquet-hero.png"
          alt="Großer Strauß in Apricot, Rosé und Salbeigrün"
        />
      </section>

      <div className="catalogue-layout">
        <aside className="filter-panel" aria-label="Produktfilter">
          <div className="filter-heading">
            <h2>Filter</h2>
            <button type="button" onClick={resetFilters}>
              Zurücksetzen
            </button>
          </div>
          <fieldset>
            <legend>Kategorie</legend>
            <label>
              <input
                type="radio"
                name="category"
                checked={category === "all"}
                onChange={() => setCategory("all")}
              />
              Alle <span>20</span>
            </label>
            <label>
              <input
                type="radio"
                name="category"
                checked={category === "bouquet"}
                onChange={() => setCategory("bouquet")}
              />
              Sträuße <span>{bouquetCount}</span>
            </label>
            <label>
              <input
                type="radio"
                name="category"
                checked={category === "decor"}
                onChange={() => setCategory("decor")}
              />
              Holzdeko <span>{decorCount}</span>
            </label>
          </fieldset>

          <label className="filter-select">
            <span>Größe</span>
            <select
              value={size}
              onChange={(event) => setSize(event.target.value as SizeFilter)}
            >
              <option value="all">Alle Größen</option>
              <option value="small">Klein (6)</option>
              <option value="medium">Mittel (6)</option>
              <option value="large">Groß (4)</option>
              <option value="decor">Deko (4)</option>
            </select>
          </label>

          <label className="filter-select">
            <span>Anlass</span>
            <select
              value={occasion}
              onChange={(event) => setOccasion(event.target.value)}
            >
              <option value="all">Alle Anlässe</option>
              {allOccasions.map((item) => (
                <option key={item} value={item}>
                  {item.charAt(0).toLocaleUpperCase("de-DE") + item.slice(1)}
                </option>
              ))}
            </select>
          </label>

          <label className="filter-select">
            <span>Preis</span>
            <select
              value={price}
              onChange={(event) => setPrice(event.target.value)}
            >
              <option value="all">Alle Preise</option>
              <option value="under-20">Unter 20 €</option>
              <option value="20-40">20–40 €</option>
              <option value="over-40">Über 40 €</option>
            </select>
          </label>

          <label className="filter-select">
            <span>Verfügbarkeit</span>
            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as StatusFilter)
              }
            >
              <option value="all">Alle Status</option>
              <option value="available">Verfügbar</option>
              <option value="low">Knapp verfügbar</option>
              <option value="soldout">Ausverkauft</option>
            </select>
          </label>
        </aside>

        <section className="catalogue-results" aria-labelledby="results-title">
          <div className="catalogue-toolbar">
            <div>
              <h2 id="results-title">
                {filteredProducts.length} Demo-
                {filteredProducts.length === 1 ? "Produkt" : "Produkte"}
              </h2>
              <p>Bestände zuletzt als Demo-Daten eingetragen.</p>
            </div>
            <label>
              <span>Sortieren</span>
              <select
                value={sort}
                onChange={(event) =>
                  setSort(event.target.value as SortOption)
                }
              >
                <option value="recommended">Empfohlen</option>
                <option value="price-asc">Preis aufsteigend</option>
                <option value="price-desc">Preis absteigend</option>
                <option value="name">Name A–Z</option>
              </select>
            </label>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="empty-state">
              <Icon name="flower" />
              <h3>Keine passenden Demo-Produkte</h3>
              <p>
                Für diese Filterkombination gibt es gerade keinen Treffer.
                Setzen Sie die Filter zurück oder fragen Sie telefonisch nach
                einem individuellen Wunsch.
              </p>
              <button
                className="button button-primary"
                type="button"
                onClick={resetFilters}
              >
                Filter zurücksetzen
              </button>
            </div>
          ) : (
            <div className="product-grid">
              {filteredProducts.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  featured={index === 0 && filteredProducts.length > 4}
                  onOpen={onProduct}
                  onReserve={onReserve}
                />
              ))}
            </div>
          )}

          <div className="inventory-caveat">
            <Icon name="clock" />
            <p>
              <strong>Kein garantierter Echtzeitbestand.</strong> Bestände
              können sich im Laden kurzfristig ändern. Bei einem bestimmten
              Wunsch rufen Sie uns am besten kurz an.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
