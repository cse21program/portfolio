export function parsePriceCents(label: string) {
  const trimmed = label.trim();
  if (!trimmed || /\/\s*hour/i.test(trimmed)) {
    return null;
  }
  const lowered = trimmed.toLowerCase();
  if (lowered === "free" || lowered === "quote" || lowered === "premium" || lowered === "custom") {
    return null;
  }
  const match = trimmed.replace(/,/g, "").match(/(\d+(?:\.\d{1,2})?)/);
  if (!match) {
    return null;
  }
  const dollars = Number(match[1]);
  if (!Number.isFinite(dollars) || dollars <= 0) {
    return null;
  }
  return Math.round(dollars * 100);
}

export function formatUsd(cents: number) {
  const amount = Math.max(0, cents);
  if (amount % 100 === 0) {
    return `$${(amount / 100).toLocaleString("en-US")}`;
  }
  return `$${(amount / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
