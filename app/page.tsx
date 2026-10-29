import Link from "next/link";
import { getTrips, type TripSummary } from "@/lib/catalogue";
import { formatPrice, formatShortDate } from "@/lib/price";

export default async function Home() {
  const trips = await getTrips();

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:py-14">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Nos voyages
        </h1>
        <p className="mt-2 text-foreground/70">
          Choisissez un voyage, configurez-le et obtenez votre devis en quelques
          minutes.
        </p>
      </header>

      {trips.length === 0 ? (
        <p className="text-foreground/70">Aucun voyage disponible pour le moment.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {trips.map((trip) => (
            <li key={trip.slug}>
              <TripCard trip={trip} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

function TripCard({ trip }: { trip: TripSummary }) {
  return (
    <Link
      href={`/voyages/${trip.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-foreground/10 transition hover:border-foreground/30 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      <div className="flex h-36 items-end bg-gradient-to-br from-sky-600 to-teal-500 p-4">
        <span className="text-sm font-medium uppercase tracking-wide text-white/90">
          {trip.destination}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h2 className="text-lg font-semibold group-hover:underline">{trip.title}</h2>
        <p className="text-sm text-foreground/70">{trip.durationDays} jours</p>
        <div className="mt-auto pt-3 text-sm">
          {trip.nextDeparture === null ? (
            "Aucun départ prévu"
          ) : (
            <>
              <p className="text-foreground/70">
                Prochain départ : {formatShortDate(trip.nextDeparture.date)}
              </p>
              <p>
                <span className="text-base font-semibold">
                  {formatPrice(trip.nextDeparture.pricePerPersonCents)}
                </span>{" "}
                / personne
              </p>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
