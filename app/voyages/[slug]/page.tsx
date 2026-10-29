import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { TripConfigurator, TripConfiguratorFromUrl } from "@/components/trip-configurator";
import { getTrip, getTrips } from "@/lib/catalogue";

export async function generateStaticParams() {
  const trips = await getTrips();
  return trips.map((trip) => ({ slug: trip.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/voyages/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const trip = await getTrip(slug);
  return { title: trip ? `${trip.title} — Devis voyages` : "Voyage introuvable" };
}

export default async function TripPage({ params }: PageProps<"/voyages/[slug]">) {
  const { slug } = await params;
  const trip = await getTrip(slug);
  if (!trip) notFound();

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-12">
      <Link href="/" className="text-sm text-foreground/70 hover:underline">
        ← Tous les voyages
      </Link>

      <header className="mt-4 mb-8">
        <p className="text-sm font-medium uppercase tracking-wide text-sky-600">
          {trip.destination} · {trip.durationDays} jours
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
          {trip.title}
        </h1>
        <p className="mt-3 max-w-2xl text-foreground/80">{trip.description}</p>
      </header>

      {/* La version sans paramètres sert de page statique ; l'adresse la pré-remplit ensuite. */}
      <Suspense fallback={<TripConfigurator trip={trip} />}>
        <TripConfiguratorFromUrl trip={trip} />
      </Suspense>
    </main>
  );
}
