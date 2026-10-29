const euros = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

// Les prix sont stockés en centimes : formatPrice(65000) → "650 €".
export function formatPrice(cents: number) {
  return euros.format(cents / 100);
}
