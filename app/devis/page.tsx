import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PrintButton } from "@/components/print-button";
import { getTrip } from "@/lib/catalogue";
import { computeQuote, formatDate, formatPrice } from "@/lib/price";
import { resolveQuoteRequest } from "@/lib/quote-request";

export const metadata: Metadata = { title: "Votre devis — Devis voyages" };

export default function QuotePage({ searchParams }: PageProps<"/devis">) {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-12 print:max-w-none print:p-0">
      <Suspense fallback={<p className="text-foreground/70">Préparation du devis…</p>}>
        <QuoteContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function QuoteContent({
  searchParams,
}: {
  searchParams: PageProps<"/devis">["searchParams"];
}) {
  const params = await searchParams;
  const slug = typeof params.voyage === "string" ? params.voyage : "";
  const trip = slug ? await getTrip(slug) : null;
  const resolved = trip
    ? resolveQuoteRequest(trip, params)
    : { ok: false as const, reason: "Ce voyage est introuvable." };

  if (!trip || !resolved.ok) {
    return (
      <div className="rounded-xl border border-foreground/15 p-6">
        <h1 className="text-xl font-semibold">Impossible d&apos;établir ce devis</h1>
        <p className="mt-2 text-foreground/80">{resolved.ok ? "" : resolved.reason}</p>
        <Link
          href={trip ? `/voyages/${trip.slug}` : "/"}
          className="mt-4 inline-block text-sky-600 hover:underline"
        >
          {trip ? "← Revenir à la configuration du voyage" : "← Voir tous les voyages"}
        </Link>
      </div>
    );
  }

  const { departure, travelers, options } = resolved.request;
  const quote = computeQuote({
    pricePerPersonCents: departure.pricePerPersonCents,
    travelers,
    options,
  });
  const includedOptions = trip.options.filter((o) => o.priceCents === 0);
  const now = new Date();

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 print:hidden">
        <Link href={`/voyages/${trip.slug}`} className="text-sm text-foreground/70 hover:underline">
          ← Modifier ma configuration
        </Link>
        <PrintButton />
      </div>

      <article className="rounded-xl border border-foreground/15 p-6 sm:p-8 print:rounded-none print:border-0 print:p-0">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-foreground/15 pb-6">
          <div>
            <p className="text-lg font-semibold text-sky-600">Devis voyages</p>
            <p className="text-sm text-foreground/70">Tour-opérateur</p>
          </div>
          <div className="text-sm sm:text-right">
            <h1 className="text-2xl font-semibold">Devis</h1>
            <p>N° {quoteNumber(now, params)}</p>
            <p className="text-foreground/70">Établi le {formatToday(now)}</p>
          </div>
        </header>

        <section className="mt-6 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-[auto_1fr]">
          <span className="text-foreground/70">Voyage</span>
          <span className="font-medium">
            {trip.title} — {trip.destination}
          </span>
          <span className="text-foreground/70">Départ</span>
          <span className="first-letter:uppercase">{formatDate(departure.date)}</span>
          <span className="text-foreground/70">Durée</span>
          <span>{trip.durationDays} jours</span>
          <span className="text-foreground/70">Voyageurs</span>
          <span>{travelers}</span>
        </section>

        <table className="mt-8 w-full text-sm">
          <thead>
            <tr className="border-b border-foreground/15 text-left text-foreground/70">
              <th className="pb-2 font-medium">Désignation</th>
              <th className="pb-2 font-medium">Détail</th>
              <th className="pb-2 text-right font-medium">Montant</th>
            </tr>
          </thead>
          <tbody>
            {quote.lines.map((line) => (
              <tr key={line.label} className="border-b border-foreground/10">
                <td className="py-2 pr-4">{line.label}</td>
                <td className="py-2 pr-4 text-foreground/70">{line.detail}</td>
                <td className="py-2 text-right whitespace-nowrap">{formatPrice(line.amountCents)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="text-base font-semibold">
              <td className="pt-4" colSpan={2}>
                Total TTC
              </td>
              <td className="pt-4 text-right whitespace-nowrap">{formatPrice(quote.totalCents)}</td>
            </tr>
          </tfoot>
        </table>

        {includedOptions.length > 0 && (
          <section className="mt-8 text-sm">
            <h2 className="font-medium">Accessibilité incluse, sans supplément</h2>
            <ul className="mt-1 list-inside list-disc text-foreground/80">
              {includedOptions.map((option) => (
                <li key={option.id}>{option.label}</li>
              ))}
            </ul>
          </section>
        )}

        <p className="mt-8 border-t border-foreground/15 pt-4 text-xs text-foreground/60">
          Devis indicatif, sans engagement. Prix en euros, toutes taxes comprises. La
          réservation se fait auprès de l&apos;agence.
        </p>
      </article>
    </>
  );
}

function formatToday(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Paris",
  }).format(date);
}

// Le devis n'est pas enregistré : son numéro est dérivé de la date et de la
// configuration, pour que la même configuration le même jour donne le même numéro.
function quoteNumber(date: Date, params: Record<string, string | string[] | undefined>) {
  const day = date.toLocaleDateString("sv-SE", { timeZone: "Europe/Paris" }).replaceAll("-", "");
  const text = JSON.stringify([params.voyage, params.depart, params.voyageurs, params.options]);
  let hash = 0;
  for (const char of text) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return `DV-${day}-${hash.toString(36).toUpperCase().padStart(4, "0").slice(-4)}`;
}
