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

export const toReadableNumber = (
  decimals: number,
  number: string = "0"
): string => {
  if (!decimals) return number;
  if (!number) return "0";

  // Remove any non-digit characters
  const digitsOnly = number.replace(/[^\d]/g, "");
  if (!digitsOnly || digitsOnly === "0") return "0";

  // Handle case where number length is less than or equal to decimals
  if (digitsOnly.length <= decimals) {
    const fractionStr = digitsOnly.padStart(decimals, "0");
    return `0.${fractionStr}`.replace(/\.?0+$/, "") || "0";
  }

  // CRITICAL: Preserve ALL decimal digits, not just up to decimals
  // If the original number had more decimal places than 'decimals', keep all of them
  const wholeStr = digitsOnly.substring(0, digitsOnly.length - decimals) || "0";
  // Get ALL remaining digits (not just 'decimals' length) to preserve precision
  const fractionStr = digitsOnly.substring(digitsOnly.length - decimals);

  return `${wholeStr}.${fractionStr}`.replace(/\.?0+$/, "") || "0";
};

export const toNonDivisibleNumber = (
  decimals: number,
  number: string
): string => {
  if (decimals === null || decimals === undefined) return number;
  const [wholePart, fracPart = ""] = number.split(".");
  let processedFracPart: string;
  if (fracPart.length >= decimals) {
    processedFracPart = fracPart;
  } else {
    processedFracPart = fracPart.padEnd(decimals, "0");
  }
  const res = `${wholePart}${processedFracPart}`
    .replace(/^0+/, "")
    .padStart(1, "0");
  return new Decimal(res).toFixed(0, Decimal.ROUND_DOWN);
};
