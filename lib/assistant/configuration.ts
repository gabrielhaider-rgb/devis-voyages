import type { Trip } from "@/lib/catalogue";
import { computeQuote, formatPrice } from "@/lib/price";
import { resolveQuoteRequest } from "@/lib/quote-request";

// Ce que l'agent demande à chiffrer : il désigne départ et options par leur
// date et leur libellé, tels qu'il les a lus dans le catalogue.
export type ConfigurationInput = {
  departure_date: string;
  travelers: number;
  option_labels: string[];
};

export type Proposal = {
  tripTitle: string;
  departureDate: string;
  travelers: number;
  options: string[];
  totalCents: number;
  configureUrl: string;
};

function normalize(text: string) {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

// Chiffre une configuration avec les règles du site (mêmes vérifications que la
// page devis, même fonction de calcul) : l'agent ne calcule jamais un prix lui-même.
export function priceConfiguration(
  trip: Trip,
  input: ConfigurationInput,
): { ok: true; proposal: Proposal; lines: string[] } | { ok: false; error: string } {
  const departure = trip.departures.find((d) => d.date === input.departure_date);
  if (!departure) {
    return {
      ok: false,
      error: `Aucun départ le ${input.departure_date}. Départs possibles : ${trip.departures.map((d) => d.date).join(", ")}.`,
    };
  }

  const optionIds: string[] = [];
  for (const label of input.option_labels) {
    const option = trip.options.find((o) => normalize(o.label) === normalize(label));
    if (!option) return { ok: false, error: `L'option « ${label} » n'existe pas pour ce voyage.` };
    if (option.priceCents === 0) continue; // incluse d'office, rien à choisir
    optionIds.push(option.id);
  }

  const params = {
    depart: departure.id,
    voyageurs: String(input.travelers),
    options: optionIds.join(","),
  };
  const resolved = resolveQuoteRequest(trip, params);
  if (!resolved.ok) return { ok: false, error: resolved.reason };

  const { travelers, options } = resolved.request;
  const quote = computeQuote({ pricePerPersonCents: departure.pricePerPersonCents, travelers, options });
  const query = new URLSearchParams({ depart: departure.id, voyageurs: String(travelers) });
  if (options.length > 0) query.set("options", options.map((o) => o.id).join(","));

  return {
    ok: true,
    proposal: {
      tripTitle: trip.title,
      departureDate: departure.date,
      travelers,
      options: options.map((o) => o.label),
      totalCents: quote.totalCents,
      configureUrl: `/voyages/${trip.slug}?${query}`,
    },
    lines: quote.lines.map((line) => `${line.label} (${line.detail}) : ${formatPrice(line.amountCents)}`),
  };
}
