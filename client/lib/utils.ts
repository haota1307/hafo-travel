import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export {
  ACCESS_TOKEN_KEY,
  clearAuthData,
  decodeAccessToken,
  decodeJwtPayload,
  decodeRefreshToken,
  REFRESH_TOKEN_KEY,
} from "@/lib/auth-token";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function normalizePath(path: string) {
  return path.replace(/^\/+|\/+$/g, "");
}

const moneyInputFormatters = {
  "en-US": new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }),
  "vi-VN": new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 0,
  }),
};

export function normalizeMoneyInput(value: string) {
  return value.replace(/\D/g, "");
}

export function formatMoneyInputValue(
  value?: string | null,
  locale: keyof typeof moneyInputFormatters = "vi-VN",
) {
  if (!value?.trim()) return "";

  const normalized = normalizeMoneyInput(value);
  if (!normalized) return value;

  const parsed = Number(normalized);
  return Number.isFinite(parsed)
    ? moneyInputFormatters[locale].format(parsed)
    : value;
}

export function parseNullableMoneyInput(value?: string | null) {
  const normalized = normalizeMoneyInput(value ?? "");
  return normalized ? Number(normalized) : null;
}

const numberInputFormatters = {
  "en-US": new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }),
  "vi-VN": new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 0,
  }),
};

export function normalizeNumberInput(value: string) {
  const text = value.replace(/,/g, "").trim();
  const sign = text.startsWith("-") ? "-" : "";
  const numericText = text.replace(/[^\d.]/g, "");
  const [integer = "", ...fractionParts] = numericText.split(".");

  if (!numericText) return sign;

  return `${sign}${integer}${fractionParts.length ? `.${fractionParts.join("")}` : ""}`;
}

export function formatNumberInputValue(
  value?: string | null,
  locale: keyof typeof numberInputFormatters = "en-US",
) {
  if (!value?.trim()) return "";

  const normalized = normalizeNumberInput(value);
  if (!normalized || normalized === "-") return normalized;

  const isNegative = normalized.startsWith("-");
  const unsignedValue = isNegative ? normalized.slice(1) : normalized;
  const [integer = "", fraction] = unsignedValue.split(".");
  const parsed = Number(integer || "0");
  if (!Number.isFinite(parsed)) return value;

  const formattedInteger = numberInputFormatters[locale].format(parsed);
  const formatted =
    fraction === undefined
      ? formattedInteger
      : `${formattedInteger}.${fraction}`;

  return isNegative ? `-${formatted}` : formatted;
}

export function parseNullableNumberInput(value?: string | null) {
  const normalized = normalizeNumberInput(value ?? "");
  const parsed = Number(normalized);

  return normalized && Number.isFinite(parsed) ? parsed : null;
}
