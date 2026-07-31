import type { Product } from "../types";

export const SALE_HOUR = 16;
export const SALE_MINUTE = 30;
export const SALE_DISCOUNT = 0.5;

interface BerlinClock {
  hour: number;
  minute: number;
  second: number;
}

const getClockInTimezone = (
  date: Date,
  timezone = "Europe/Berlin"
): BerlinClock => {
  const parts = new Intl.DateTimeFormat("de-DE", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23"
  }).formatToParts(date);

  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);

  return {
    hour: read("hour"),
    minute: read("minute"),
    second: read("second")
  };
};

export const getSaleState = (
  date: Date,
  timezone = "Europe/Berlin"
) => {
  const clock = getClockInTimezone(date, timezone);
  const nowSeconds = clock.hour * 3600 + clock.minute * 60 + clock.second;
  const saleSeconds = SALE_HOUR * 3600 + SALE_MINUTE * 60;
  const active = nowSeconds >= saleSeconds;

  return {
    active,
    clock,
    secondsUntilStart: active ? 0 : saleSeconds - nowSeconds
  };
};

export const getSalePrice = (price: number) =>
  Math.round(price * SALE_DISCOUNT * 100) / 100;

export const isSaleProduct = (product: Product) =>
  product.saleEligible && product.stock > 0 && product.status !== "soldout";

export const formatCountdown = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  return [hours, minutes, remainingSeconds]
    .map((value) => value.toString().padStart(2, "0"))
    .join(":");
};
