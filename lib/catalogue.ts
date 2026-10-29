import { createClient } from "@supabase/supabase-js";
import { cacheLife } from "next/cache";
import type { PricingType } from "@/lib/price";

export type TripSummary = {
  slug: string;
  title: string;
  destination: string;
  durationDays: number;
  fromPriceCents: number | null;
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

  const { data, error } = await createCatalogueClient()
    .from("trips")
    .select(
      "slug, title, destination, duration_days, departures(price_per_person_cents)",
    )
    .order("title");

  if (error) throw new Error(`Lecture du catalogue impossible : ${error.message}`);

  return data.map((trip) => {
    const prices = trip.departures.map((d) => d.price_per_person_cents);
    return {
      slug: trip.slug,
      title: trip.title,
      destination: trip.destination,
      durationDays: trip.duration_days,
      fromPriceCents: prices.length > 0 ? Math.min(...prices) : null,
    };
  });
}

export async function getTrip(slug: string): Promise<Trip | null> {
  "use cache";
  cacheLife("hours");

  const { data, error } = await createCatalogueClient()
    .from("trips")
    .select(
      "slug, title, destination, duration_days, description, departures(id, departure_date, price_per_person_cents), options(id, label, price_cents, pricing_type, category)",
    )
    .eq("slug", slug)
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
    })),
  };
}
