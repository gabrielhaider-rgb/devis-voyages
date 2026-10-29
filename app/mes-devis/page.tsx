import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { savedQuoteNumber } from "@/components/quote-document";
import { isAdmin } from "@/lib/admin";
import { getCurrentUser } from "@/lib/auth";
import { formatDate, formatPrice } from "@/lib/price";
import { getMyQuotes } from "@/lib/saved-quotes";

export const metadata: Metadata = { title: "Mes devis — Devis voyages" };

const savedOn = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: "Europe/Paris" });

export default function MyQuotesPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Mes devis</h1>
      <Suspense fallback={<p className="mt-6 text-foreground/70">Chargement de vos devis…</p>}>
        <QuoteList />
      </Suspense>
    </main>
  );
}

async function QuoteList() {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion?next=/mes-devis");
  if (await isAdmin(user)) redirect("/admin/devis");
  const quotes = await getMyQuotes(user.id);

  if (quotes.length === 0) {
    return (
      <p className="mt-6 text-foreground/70">
        Vous n&apos;avez pas encore enregistré de devis.{" "}
        <Link href="/" className="text-sky-600 hover:underline">
          Choisir un voyage
        </Link>
      </p>
    );
  }

  return (
    <ul className="mt-6 flex flex-col gap-3">
      {quotes.map((quote) => (
        <li key={quote.id}>
          <Link
            href={`/mes-devis/${quote.id}`}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-foreground/15 p-4 hover:border-foreground/30"
          >
            <span>
              <span className="block font-medium">{quote.tripTitle}</span>
              <span className="block text-sm text-foreground/70">
                <span className="first-letter:uppercase">Départ {formatDate(quote.departureDate)}</span>
                {" · "}
                {quote.travelers} voyageur{quote.travelers > 1 ? "s" : ""}
              </span>
              <span className="block text-xs text-foreground/60">
                N° {savedQuoteNumber(quote.id, quote.createdAt)} · enregistré le{" "}
                {savedOn.format(quote.createdAt)}
              </span>
            </span>
            <span className="text-lg font-semibold">{formatPrice(quote.totalCents)}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
