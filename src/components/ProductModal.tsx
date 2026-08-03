import { useEffect } from "react";
import type { Product } from "../types";
import { getPriceLabel } from "../utils/money";
import { Icon } from "./Icons";

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
  onReserve: (product: Product) => void;
}

const sizeLabels: Record<Product["size"], string> = {
  small: "Klein",
  medium: "Mittel",
  large: "Groß",
  decor: "Deko"
};

export function ProductModal({
  product,
  onClose,
  onReserve
}: ProductModalProps) {
  useEffect(() => {
    if (!product) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [product, onClose]);

  if (!product) return null;

  const unavailable = product.stock <= 0 || product.status === "soldout";

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="product-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          className="icon-button modal-close"
          type="button"
          onClick={onClose}
          aria-label="Produktdetails schließen"
        >
          <Icon name="close" />
        </button>
        <div className="product-modal-image">
          <img
            src={product.image}
            alt={`${product.name}, Demo-Produktbild`}
            style={{ objectPosition: product.imagePosition }}
          />
          <span className="demo-label">Demo-Produkt</span>
        </div>
        <div className="product-modal-content">
          <p className="product-meta">
            {sizeLabels[product.size]} · {product.sku}
          </p>
          <h2 id="product-modal-title">{product.name}</h2>
          <p className="modal-price">
            {getPriceLabel(product.price, product.priceMax)}
          </p>
          <p>{product.description}</p>
          <dl className="product-facts">
            <div>
              <dt>Blumen & Material</dt>
              <dd>{product.materials.join(", ")}</dd>
            </div>
            <div>
              <dt>Farbwelt</dt>
              <dd>{product.colors.join(", ")}</dd>
            </div>
            {product.dimensions && (
              <div>
                <dt>Maße</dt>
                <dd>{product.dimensions}</dd>
              </div>
            )}
            {product.materialNote && (
              <div>
                <dt>Hinweis</dt>
                <dd>{product.materialNote}</dd>
              </div>
            )}
          </dl>
          <div className={`availability-note ${unavailable ? "error-note" : ""}`}>
            <Icon name={unavailable ? "close" : "check"} />
            <div>
              <strong>
                {unavailable
                  ? "Im Demo-Sortiment nicht verfügbar"
                  : "Beispielauswahl – kein Live-Bestand"}
              </strong>
              <p>
                Preise und Auswahl sind Demo-Richtwerte. Der aktuelle Ladenbestand
                wird bei einer persönlichen Bestätigung geprüft.
              </p>
            </div>
          </div>
          <button
            className="button button-primary button-full"
            type="button"
            disabled={unavailable}
            onClick={() => onReserve(product)}
          >
            <Icon name="calendar" />
            {unavailable
              ? "Nicht vorbestellbar"
              : "Vorbestellung vorbereiten"}
          </button>
        </div>
      </section>
    </div>
  );
}
