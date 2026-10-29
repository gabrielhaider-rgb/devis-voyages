import { notFound, redirect } from "next/navigation";
import { getCurrentUser, type CurrentUser } from "@/lib/auth";
import type { Departure, TripOption } from "@/lib/catalogue";
import { createClient } from "@/lib/supabase/server";

// Rôle du compte connecté (la RLS ne laisse lire que son propre profil).
export async function isAdmin(user: CurrentUser) {
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  return data?.role === "admin";
}

// À appeler en tête de chaque page et action d'administration. La base vérifie
// aussi le rôle (RLS) : cette garde sert surtout à afficher la bonne page.
export async function requireAdmin(nextPath = "/admin") {
  const user = await getCurrentUser();
  if (!user) redirect(`/connexion?next=${encodeURIComponent(nextPath)}`);
  // Un non-admin voit une page « introuvable » : on ne révèle pas que l'admin existe.
  if (!(await isAdmin(user))) notFound();
  return user;
}

export type AdminTripSummary = {
  id: string;
  slug: string;
  title: string;
  destination: string;
  archived: boolean;
  departureCount: number;
  optionCount: number;
};

export async function getAdminTrips(): Promise<AdminTripSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trips")
    .select("id, slug, title, destination, archived_at, departures(count), options(count)")
    .order("title");
  if (error) throw new Error(`Lecture du catalogue impossible : ${error.message}`);

  return data.map((trip) => ({
    id: trip.id,
    slug: trip.slug,
    title: trip.title,
    destination: trip.destination,
    archived: trip.archived_at !== null,
    departureCount: trip.departures[0]?.count ?? 0,
    optionCount: trip.options[0]?.count ?? 0,
  }));
}

export type AdminTrip = {
  id: string;
  slug: string;
  title: string;
  destination: string;
  durationDays: number;
  description: string;
  archived: boolean;
  departures: Departure[];
  options: TripOption[];
};

export async function getAdminTrip(id: string): Promise<AdminTrip | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trips")
    .select(
      "id, slug, title, destination, duration_days, description, archived_at, departures(id, departure_date, price_per_person_cents), options(id, label, price_cents, pricing_type, category, exclusive_group)",
    )
    .eq("id", id)
    .order("departure_date", { referencedTable: "departures" })
    .order("label", { referencedTable: "options" })
    .maybeSingle();
  if (error) throw new Error(`Lecture du voyage impossible : ${error.message}`);
  if (!data) return null;

  return {
    id: data.id,
    slug: data.slug,
    title: data.title,
    destination: data.destination,
    durationDays: data.duration_days,
    description: data.description,
    archived: data.archived_at !== null,
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
