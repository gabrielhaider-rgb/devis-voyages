import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { saveQuote } from "@/app/devis/actions";
import { PrintButton } from "@/components/print-button";
import { QuoteDocument } from "@/components/quote-document";
import { getTrip } from "@/lib/catalogue";
import { computeQuote } from "@/lib/price";
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
      <div className="rounded-2xl border border-sand-deep bg-cream p-6">
        <h1 className="text-xl font-semibold">Impossible d&apos;établir ce devis</h1>
        <p className="mt-2 text-foreground/80">{resolved.ok ? "" : resolved.reason}</p>
        <Link
          href={trip ? `/voyages/${trip.slug}` : "/"}
          className="mt-4 inline-block text-clay hover:underline"
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
  const now = new Date();

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 print:hidden">
        <Link href={`/voyages/${trip.slug}`} className="text-sm text-foreground/70 hover:underline">
          ← Modifier ma configuration
        </Link>
        <div className="flex flex-wrap gap-3">
          <form action={saveQuote}>
            <input type="hidden" name="voyage" value={trip.slug} />
            <input type="hidden" name="depart" value={departure.id} />
            <input type="hidden" name="voyageurs" value={travelers} />
            <input type="hidden" name="options" value={options.map((o) => o.id).join(",")} />
            <button
              type="submit"
              className="rounded-full border border-clay px-4 py-2 font-medium text-clay hover:bg-clay/10"
            >
              Enregistrer ce devis
            </button>
          </form>
          <PrintButton />
        </div>
      </div>

      <QuoteDocument
        number={quoteNumber(now, params)}
        issuedAt={now}
        tripTitle={trip.title}
        destination={trip.destination}
        durationDays={trip.durationDays}
        departureDate={departure.date}
        travelers={travelers}
        lines={quote.lines}
        totalCents={quote.totalCents}
        includedAccessibility={trip.options.filter((o) => o.priceCents === 0).map((o) => o.label)}
      />
    </>
  );
}

// Un devis non enregistré n'a pas d'identifiant : son numéro est dérivé de la date et
// de la configuration, pour que la même configuration le même jour donne le même numéro.
function quoteNumber(date: Date, params: Record<string, string | string[] | undefined>) {
  const day = date.toLocaleDateString("sv-SE", { timeZone: "Europe/Paris" }).replaceAll("-", "");
  const text = JSON.stringify([params.voyage, params.depart, params.voyageurs, params.options]);
  let hash = 0;
  for (const char of text) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return `DV-${day}-${hash.toString(36).toUpperCase().padStart(4, "0").slice(-4)}`;
}
