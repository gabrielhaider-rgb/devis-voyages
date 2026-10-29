import { createClient } from "@supabase/supabase-js";
import { cacheLife, cacheTag } from "next/cache";
import { nextDeparture, todayInParis } from "@/lib/departures";
import type { PricingType } from "@/lib/price";

export type TripSummary = {
  slug: string;
  title: string;
  destination: string;
  durationDays: number;
  // Prochain départ à venir (null s'il n'y en a plus).
  nextDeparture: { date: string; pricePerPersonCents: number } | null;
};

export type Departure = {
  id: string;
  date: string;
  pricePerPersonCents: number;
};

export type TripOption = {
  id: string;
  label: string;
  priceCents: number;
  pricingType: PricingType;
  category: "standard" | "accessibility";
  // Les options d'un même groupe ne se cumulent pas (null = cumulable).
  exclusiveGroup: string | null;
};

export type Trip = {
  slug: string;
  title: string;
  destination: string;
  durationDays: number;
  description: string;
  departures: Departure[];
  options: TripOption[];
};

// Tag du cache du catalogue public, vidé par l'admin après chaque modification.
export const CATALOGUE_TAG = "catalogue";

// Le catalogue est public et sans session : un client sans cookies suffit,
// ce qui permet de mettre le résultat en cache.
function createCatalogueClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}

export async function getTrips(): Promise<TripSummary[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOGUE_TAG);

  const { data, error } = await createCatalogueClient()
    .from("trips")
    .select(
      "slug, title, destination, duration_days, departures(departure_date, price_per_person_cents)",
    )
    .is("archived_at", null)
    .order("title");

  if (error) throw new Error(`Lecture du catalogue impossible : ${error.message}`);

  // Le cache est rafraîchi toutes les heures : « aujourd'hui » reste à jour.
  const today = todayInParis();
  return data.map((trip) => ({
    slug: trip.slug,
    title: trip.title,
    destination: trip.destination,
    durationDays: trip.duration_days,
    nextDeparture: nextDeparture(
      trip.departures.map((d) => ({ date: d.departure_date, pricePerPersonCents: d.price_per_person_cents })),
      today,
    ),
  }));
}

export async function getTrip(slug: string): Promise<Trip | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOGUE_TAG);

  const { data, error } = await createCatalogueClient()
    .from("trips")
    .select(
      "slug, title, destination, duration_days, description, departures(id, departure_date, price_per_person_cents), options(id, label, price_cents, pricing_type, category, exclusive_group)",
    )
    .eq("slug", slug)
    .is("archived_at", null)
    .order("departure_date", { referencedTable: "departures" })
    .order("price_cents", { referencedTable: "options", ascending: false })
    .maybeSingle();

  if (error) throw new Error(`Lecture du voyage impossible : ${error.message}`);
  if (!data) return null;

  return {
    slug: data.slug,
    title: data.title,
    destination: data.destination,
    durationDays: data.duration_days,
    description: data.description,
    departures: data.departures.map((d) => ({
      id: d.id,
      date: d.departure_date,
      pricePerPersonCents: d.price_per_person_cents,
    })),
    options: data.options.map((o) => ({
      id: o.id,
      label: o.label,
      priceCents: o.price_cents,
      pricingType: o.pricing_type,
      category: o.category,
      exclusiveGroup: o.exclusive_group,
    })),
  };
}
