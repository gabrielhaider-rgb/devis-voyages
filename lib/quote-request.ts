import type { Departure, Trip, TripOption } from "@/lib/catalogue";

export const MAX_TRAVELERS = 9;

export type QuoteRequest = {
  departure: Departure;
  travelers: number;
  options: TripOption[];
};

type SearchParams = Record<string, string | string[] | undefined>;

function single(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

// La configuration arrive par l'URL (?depart=…&voyageurs=…&options=a,b) :
// on revérifie tout ce qu'elle contient avant de calculer un devis.
export function resolveQuoteRequest(
  trip: Trip,
  params: SearchParams,
): { ok: true; request: QuoteRequest } | { ok: false; reason: string } {
  const departure = trip.departures.find((d) => d.id === single(params.depart));
  if (!departure) return { ok: false, reason: "La date de départ est introuvable." };

  const travelers = Number(single(params.voyageurs));
  if (!Number.isInteger(travelers) || travelers < 1 || travelers > MAX_TRAVELERS) {
    return { ok: false, reason: `Le nombre de voyageurs doit être compris entre 1 et ${MAX_TRAVELERS}.` };
  }

  const optionIds = (single(params.options) ?? "").split(",").filter(Boolean);
  const options: TripOption[] = [];
  for (const id of new Set(optionIds)) {
    const option = trip.options.find((o) => o.id === id && o.priceCents > 0);
    if (!option) return { ok: false, reason: "Une des options choisies n'existe pas pour ce voyage." };
    options.push(option);
  }

  const groups = options.map((o) => o.exclusiveGroup).filter((g) => g !== null);
  if (new Set(groups).size !== groups.length) {
    return { ok: false, reason: "Deux options non cumulables ont été choisies ensemble." };
  }

  // Même ordre que sur la page voyage : options, puis accessibilité.
  options.sort(
    (a, b) =>
      Number(a.category === "accessibility") - Number(b.category === "accessibility") ||
      trip.options.indexOf(a) - trip.options.indexOf(b),
  );

  return { ok: true, request: { departure, travelers, options } };
}
