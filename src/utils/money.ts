export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR"
  }).format(value);

export const getPriceLabel = (price: number, priceMax?: number) =>
  priceMax
    ? `${formatCurrency(price)}–${formatCurrency(priceMax)}`
    : formatCurrency(price);
