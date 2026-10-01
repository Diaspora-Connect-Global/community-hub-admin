/**
 * Money display. The API sends every amount as an INTEGER in the currency's
 * minor unit; forms convert it to major units once (÷100), and these helpers
 * only format. Symbols and their placement come from Intl, never a hard-coded "$".
 */

/** The platform's base currency — what the backend falls back to when a record names none. */
export const PLATFORM_BASE_CURRENCY = "GHS";

/** The currency an amount is actually in: the record's code, else the backend's fallback (GHS). */
export function resolveCurrency(code: string | null | undefined): string {
  return (code ?? "").trim().toUpperCase() || PLATFORM_BASE_CURRENCY;
}

/** The currencies the platform settles in (all 2-decimal). */
export const SUPPORTED_CURRENCIES = ["GHS", "USD", "EUR", "GBP", "NGN", "KES"] as const;

/**
 * Major → minor units for a value typed into a form (25 → 2500, 12.5 → 1250),
 * rounded to the nearest minor unit. Call it once, where the form is submitted.
 */
export function toMinorUnits(amountMajor: number): number {
  return Math.round(amountMajor * 100);
}

/** Format an amount in integer MINOR units (÷100 once, here), e.g. (12550, "GHS") → "GH₵125.50". */
export function formatMinorUnits(amountMinor: number, currency: string | null | undefined, locale?: string): string {
  return formatMoney(amountMinor / 100, currency, locale);
}

/** Format an amount already in MAJOR units, e.g. (125.5, "GHS") → "GH₵125.50". */
export function formatMoney(amountMajor: number, currency: string | null | undefined, locale?: string): string {
  const code = resolveCurrency(currency);
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency: code }).format(amountMajor);
  } catch {
    // Intl throws on a code it doesn't know; still show the amount and the code.
    return `${amountMajor.toFixed(2)} ${code}`;
  }
}
