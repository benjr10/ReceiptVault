export const currencySymbols: Record<string, string> = {
  NGN: "₦",
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  CNY: "¥",
  INR: "₹",
  ZAR: "R",
  KES: "KSh",
  GHS: "₵",
};

export const currencyCodes = Object.keys(currencySymbols);

export function getCurrencySymbol(code: string): string {
  return currencySymbols[code] || code;
}

export function formatCurrency(amount: number, currencyCode: string = "NGN"): string {
  const symbol = getCurrencySymbol(currencyCode);
  return `${symbol}${amount.toLocaleString("en-NG", { minimumFractionDigits: 0 })}`;
}