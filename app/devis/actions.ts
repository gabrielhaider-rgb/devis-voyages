"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getTrip } from "@/lib/catalogue";
import { computeQuote } from "@/lib/price";
import { resolveQuoteRequest } from "@/lib/quote-request";
import { createClient } from "@/lib/supabase/server";

// Enregistre le devis du client connecté. Le prix est recalculé ici, côté
// serveur, à partir du catalogue : on ne reprend jamais un montant du navigateur.
export async function saveQuote(formData: FormData) {
  const params = {
    voyage: String(formData.get("voyage") ?? ""),
    depart: String(formData.get("depart") ?? ""),
    voyageurs: String(formData.get("voyageurs") ?? ""),
    options: String(formData.get("options") ?? ""),
  };
  const quotePath = `/devis?${new URLSearchParams(params)}`;

  const user = await getCurrentUser();
  if (!user) redirect(`/connexion?next=${encodeURIComponent(quotePath)}`);

  const trip = await getTrip(params.voyage);
  const resolved = trip ? resolveQuoteRequest(trip, params) : null;
  // Configuration invalide : la page devis affiche le message d'erreur.
  if (!trip || !resolved?.ok) redirect(quotePath);

  const { departure, travelers, options } = resolved.request;
  const quote = computeQuote({
    pricePerPersonCents: departure.pricePerPersonCents,
    travelers,
    options,
  });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quotes")
    .insert({
      trip_slug: trip.slug,
      trip_title: trip.title,
      destination: trip.destination,
      duration_days: trip.durationDays,
      departure_date: departure.date,
      travelers,
      lines: quote.lines,
      included_accessibility: trip.options.filter((o) => o.priceCents === 0).map((o) => o.label),
      total_cents: quote.totalCents,
    })
    .select("id")
    .single();

  if (error) throw new Error(`Enregistrement du devis impossible : ${error.message}`);
  redirect(`/mes-devis/${data.id}`);
}
