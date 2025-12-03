import Decimal from "decimal.js";

export const expandTokenDecimal = (
  value: string | number | Decimal,
  decimals: string | number
): Decimal => {
  return new Decimal(value).mul(new Decimal(10).pow(decimals));
};

export const expandToken = (
  value: string | number | Decimal,
  decimals: string | number,
  fixed?: number
): string => {
  return expandTokenDecimal(value, decimals).toFixed(fixed);
};

export const shrinkTokenDecimal = (
  value: string | number,
  decimals: string | number
): Decimal => {
  return new Decimal(value).div(new Decimal(10).pow(decimals));
};
export const shrinkToken = (
  value: string | number,
  decimals: string | number,
  fixed?: number
): string => {
  if (!value) return "";
  return new Decimal(value).div(new Decimal(10).pow(decimals)).toFixed(fixed);
};

export function decimalMax(
  a: string | number | Decimal,
  b: string | number | Decimal
): Decimal {
  a = new Decimal(a);
  b = new Decimal(b);
  return a.gt(b) ? a : b;
}

export function decimalMin(
  a: string | number | Decimal,
  b: string | number | Decimal
): Decimal {
  a = new Decimal(a);
  b = new Decimal(b);
  return a.lt(b) ? a : b;
}
