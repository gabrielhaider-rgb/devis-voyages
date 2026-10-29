import Link from "next/link";
import { OpenAssistantButton } from "@/components/open-assistant-button";
import { TripPhoto } from "@/components/trip-photo";
import { getTrips, type TripSummary } from "@/lib/catalogue";
import { formatPrice, formatShortDate } from "@/lib/price";

export default async function Home() {
  const trips = await getTrips();
  // Le voyage mis en avant : celui dont le prochain départ est le plus proche.
  const featured = trips
    .filter((t) => t.nextDeparture)
    .sort((a, b) => a.nextDeparture!.date.localeCompare(b.nextDeparture!.date))[0];

  return (
    <main className="w-full">
      <section className="mx-auto grid w-full max-w-6xl items-end gap-10 px-4 pt-8 sm:px-8 md:grid-cols-2 md:pt-12">
        <div className="pb-4 md:pb-12">
          <p className="text-sm font-semibold tracking-[0.14em] text-clay uppercase">Départs 2027 · devis en 2 minutes</p>
          <h1 className="mt-4 text-5xl leading-[1.03] tracking-tight sm:text-6xl lg:text-7xl">
            Le monde vous attend. À vous d&apos;écrire la suite.
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-foreground/75">
            {trips.length} voyages préparés par nos conseillers, accessibles à tous. Choisissez votre date et vos
            options, et recevez votre devis tout de suite.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#voyages" className="inline-flex min-h-12 items-center rounded-full bg-clay px-7 font-semibold text-cream hover:bg-clay-dark">
              Voir les voyages
            </a>
            <OpenAssistantButton className="inline-flex min-h-12 items-center rounded-full border-[1.5px] border-foreground/30 px-6 font-medium hover:border-foreground">
              Me faire conseiller
            </OpenAssistantButton>
          </div>
        </div>

        {featured && (
          <div className="relative h-[420px] md:h-[540px]">
            <Link href={`/voyages/${featured.slug}`} className="absolute inset-y-0 right-0 left-0 overflow-hidden rounded-t-[220px] rounded-b-3xl sm:left-10" aria-label={featured.title}>
              <TripPhoto src={featured.imageUrl} destination={featured.destination} className="h-full w-full" />
            </Link>
            <div className="absolute bottom-10 left-0 w-60 rounded-2xl bg-cream p-5 shadow-[0_12px_32px_rgba(43,36,32,0.12)]">
              <p className="font-display text-xl">{featured.title}</p>
              <p className="mt-1 text-sm text-foreground/75">
                Prochain départ : {formatShortDate(featured.nextDeparture!.date)}
              </p>
              <p className="mt-2 text-2xl font-semibold">
                {formatPrice(featured.nextDeparture!.pricePerPersonCents)}{" "}
                <span className="text-sm font-normal text-foreground/75">/ pers.</span>
              </p>
            </div>
          </div>
        )}
      </section>

      <section id="voyages" className="mx-auto w-full max-w-6xl scroll-mt-8 px-4 pt-20 sm:px-8">
        <h2 className="text-4xl sm:text-5xl">Nos carnets de route</h2>
        {trips.length === 0 ? (
          <p className="mt-6 text-foreground/75">Aucun voyage disponible pour le moment.</p>
        ) : (
          <ul className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {trips.map((trip) => (
              <li key={trip.slug}>
                <TripCard trip={trip} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section id="accessibilite" className="mx-auto w-full max-w-6xl scroll-mt-8 px-4 pt-16 pb-20 sm:px-8">
        <div className="grid gap-8 rounded-[28px] bg-ink p-8 text-background sm:p-12 md:grid-cols-3">
          <div>
            <h2 className="text-2xl">Voyager accessible</h2>
            <p className="mt-2 leading-relaxed text-sand-deep">
              Chambres adaptées et assistance aéroport incluses, transferts en véhicule adapté sur demande.
            </p>
          </div>
          <div>
            <h2 className="text-2xl">Un devis en 2 minutes</h2>
            <p className="mt-2 leading-relaxed text-sand-deep">Prix détaillé ligne par ligne, sans engagement, à télécharger en PDF.</p>
          </div>
          <div>
            <h2 className="text-2xl">Un assistant à l&apos;écoute</h2>
            <p className="mt-2 leading-relaxed text-sand-deep">
              Décrivez votre envie : il vous propose le voyage qui vous ressemble.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

function TripCard({ trip }: { trip: TripSummary }) {
  return (
    <Link
      href={`/voyages/${trip.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-[20px] bg-cream shadow-[0_1px_0_rgba(43,36,32,0.08)] transition hover:shadow-[0_12px_32px_rgba(43,36,32,0.12)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
    >
      <TripPhoto src={trip.imageUrl} destination={trip.destination} className="h-56 w-full transition duration-500 group-hover:scale-[1.03]" />
      <div className="flex flex-1 flex-col gap-1.5 px-6 pt-5 pb-6">
        <p className="text-xs font-semibold tracking-[0.12em] text-clay uppercase">
          {trip.destination} · {trip.durationDays} jours
        </p>
        <h3 className="text-3xl">{trip.title.split(",")[0]}</h3>
        <p className="line-clamp-2 leading-relaxed text-foreground/75">{trip.pitch}</p>
        <div className="mt-auto flex items-baseline justify-between gap-3 pt-4">
          {trip.nextDeparture ? (
            <>
              <span className="text-sm text-foreground/75">Départ le {formatShortDate(trip.nextDeparture.date)}</span>
              <span className="text-2xl font-semibold whitespace-nowrap">
                {formatPrice(trip.nextDeparture.pricePerPersonCents)}{" "}
                <span className="text-sm font-normal text-foreground/75">/ pers.</span>
              </span>
            </>
          ) : (
            <span className="text-sm text-foreground/75">Aucun départ prévu</span>
          )}
        </div>
      </div>
    </Link>
  );
}
