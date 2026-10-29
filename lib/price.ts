const wholeEuros = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});
const eurosAndCents = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
});

// Les prix sont stockés en centimes : formatPrice(65000) → "650 €",
// formatPrice(1250) → "12,50 €".
// L'espace fine insécable (U+202F) d'Intl n'existe pas dans la police Geist
// et disparaît à l'impression : on la remplace par une espace insécable.
export function formatPrice(cents: number) {
  return (cents % 100 === 0 ? wholeEuros : eurosAndCents)
    .format(cents / 100)
    .replaceAll("\u202f", "\u00a0");
}

export type PricingType = "fixed" | "per_person";

export type PricedOption = {
  label: string;
  priceCents: number;
  pricingType: PricingType;
};

export type QuoteLine = {
  label: string;
  detail: string;
  amountCents: number;
};

export type Quote = {
  lines: QuoteLine[];
  totalCents: number;
};

// Seul endroit où le prix d'un devis est calculé (PRD, section 4) :
// prix par personne × voyageurs + options fixes + options par personne × voyageurs.
export function computeQuote({
  pricePerPersonCents,
  travelers,
  options,
}: {
  pricePerPersonCents: number;
  travelers: number;
  options: PricedOption[];
}): Quote {
  const travelersLabel = `${travelers} voyageur${travelers > 1 ? "s" : ""}`;

  const lines: QuoteLine[] = [
    {
      label: "Voyage",
      detail: `${formatPrice(pricePerPersonCents)} × ${travelersLabel}`,
      amountCents: pricePerPersonCents * travelers,
    },
    ...options.map((option) =>
      option.pricingType === "per_person"
        ? {
            label: option.label,
            detail: `${formatPrice(option.priceCents)} × ${travelersLabel}`,
            amountCents: option.priceCents * travelers,
          }
        : {
            label: option.label,
            detail: "Forfait",
            amountCents: option.priceCents,
          },
    ),
  ];

  return {
    lines,
    totalCents: lines.reduce((sum, line) => sum + line.amountCents, 0),
  };
}

const longDate = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

// En français, le premier jour du mois s'écrit « 1er » : "1 avril" → "1er avril".
function firstOfMonth(text: string) {
  return text.replace(/(^|\s)1(?= \D)/, "$11er");
}

// "2027-05-12" → "mercredi 12 mai 2027"
export function formatDate(isoDate: string) {
  return firstOfMonth(longDate.format(new Date(`${isoDate}T00:00:00Z`)));
}

const shortDate = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

// "2027-06-10" → "10 juin 2027"
export function formatShortDate(isoDate: string) {
  return firstOfMonth(shortDate.format(new Date(`${isoDate}T00:00:00Z`)));
}
