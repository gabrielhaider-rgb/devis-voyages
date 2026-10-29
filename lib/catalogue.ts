import { createClient } from "@supabase/supabase-js";
import { cacheLife } from "next/cache";

export type TripSummary = {
  slug: string;
  title: string;
  destination: string;
  durationDays: number;
  fromPriceCents: number | null;
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
