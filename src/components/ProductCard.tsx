import type { Product } from "../types";
import { getPriceLabel } from "../utils/money";
import { Icon } from "./Icons";

interface ProductCardProps {
  product: Product;
  featured?: boolean;
  salePrice?: number;
  onOpen: (product: Product) => void;
  onReserve?: (product: Product) => void;
}

const sizeLabels: Record<Product["size"], string> = {
  small: "Klein",
  medium: "Mittel",
  large: "Groß",
  decor: "Deko"
};

const statusLabels: Record<Product["status"], string> = {
  available: "Verfügbar",
  low: "Knapp verfügbar",
  soldout: "Ausverkauft",
  sale: "Restposten"
};

export function ProductCard({
  product,
  featured,
  salePrice,
  onOpen,
  onReserve
}: ProductCardProps) {
  const unavailable = product.stock <= 0 || product.status === "soldout";

  return (
    <article
      className={`product-card ${featured ? "product-card-featured" : ""}`}
    >
      <button
        className="product-image-button"
        type="button"
        onClick={() => onOpen(product)}
        aria-label={`Details zu ${product.name} öffnen`}
      >
        <img
          src={product.image}
          alt={`${product.name}, Demo-Produktbild`}
          style={{ objectPosition: product.imagePosition }}
          loading="lazy"
        />
        <span className="demo-label">Demo</span>
      </button>
      <div className="product-card-body">
        <div className="product-card-heading">
          <div>
            <p className="product-meta">
              {sizeLabels[product.size]}
              {product.category === "bouquet"
                ? ` · ${product.colors.slice(0, 2).join(" & ")}`
                : " · Holzdeko"}
            </p>
            <h3>{product.name}</h3>
          </div>
          <span
            className={`stock-status status-${unavailable ? "soldout" : product.status}`}
          >
            <i />
            {unavailable
              ? statusLabels.soldout
              : statusLabels[product.status]}
          </span>
        </div>
        {featured && <p className="product-description">{product.description}</p>}
        <div className="product-card-footer">
          <div className="product-price">
            {salePrice !== undefined ? (
              <>
                <s>{getPriceLabel(product.price)}</s>
                <strong>{getPriceLabel(salePrice)}</strong>
              </>
            ) : (
              <strong>{getPriceLabel(product.price, product.priceMax)}</strong>
            )}
          </div>
          <div className="product-actions">
            <button
              className="text-button"
              type="button"
              onClick={() => onOpen(product)}
            >
              Details <Icon name="arrow" />
            </button>
            {onReserve && (
              <button
                className="button button-small button-outline"
                type="button"
                disabled={unavailable}
                onClick={() => onReserve(product)}
              >
                {unavailable ? "Ausverkauft" : "Vorbestellen"}
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
