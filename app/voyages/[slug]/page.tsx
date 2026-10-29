import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { TripConfigurator, TripConfiguratorFromUrl } from "@/components/trip-configurator";
import { TripPhoto } from "@/components/trip-photo";
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
    <main className="mx-auto w-full max-w-6xl px-4 pt-4 pb-16 sm:px-8">
      <Link href="/#voyages" className="text-sm text-foreground/75 hover:text-clay">
        ← Tous les voyages
      </Link>

      <header className="mt-6 mb-12 grid items-center gap-8 md:grid-cols-2">
        <div>
          <p className="text-sm font-semibold tracking-[0.14em] text-clay uppercase">
            {trip.destination} · {trip.durationDays} jours
          </p>
          <h1 className="mt-3 text-5xl leading-[1.05] tracking-tight sm:text-6xl">{trip.title}</h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-foreground/75">{trip.description}</p>
        </div>
        <TripPhoto src={trip.imageUrl} destination={trip.destination} className="h-72 w-full rounded-t-[160px] rounded-b-3xl sm:h-96" />
      </header>

      {/* La version sans paramètres sert de page statique ; l'adresse la pré-remplit ensuite. */}
      <Suspense fallback={<TripConfigurator trip={trip} />}>
        <TripConfiguratorFromUrl trip={trip} />
      </Suspense>
    </main>
  );
}
