import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { savedQuoteNumber } from "@/components/quote-document";
import { isAdmin } from "@/lib/admin";
import { getCurrentUser } from "@/lib/auth";
import { greeting, savedQuotesSentence } from "@/lib/greeting";
import { formatDate, formatPrice } from "@/lib/price";
import { getMyProfile } from "@/lib/profile";
import { getMyQuotes, type SavedQuote } from "@/lib/saved-quotes";

export const metadata: Metadata = { title: "Mes devis — Devis voyages" };

const savedOn = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: "Europe/Paris" });

export default function MyQuotesPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-12">
      <Suspense fallback={<p className="text-foreground/70">Chargement de votre espace…</p>}>
        <MySpace />
      </Suspense>
    </main>
  );
}

async function MySpace() {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion?next=/mes-devis");
  if (await isAdmin(user)) redirect("/admin/devis");
  const [quotes, profile] = await Promise.all([getMyQuotes(user.id), getMyProfile(user.id)]);
  const firstName = profile?.firstName?.trim() || null;

  return (
    <>
      <p className="text-sm font-semibold tracking-[0.14em] text-clay uppercase">Mon espace</p>
      <h1 className="mt-2 text-4xl tracking-tight sm:text-5xl">{greeting(firstName)}</h1>
      <p className="mt-3 text-lg text-foreground/75">
        {savedQuotesSentence(quotes.length)}{" "}
        {quotes.length === 0 ? (
          <Link href="/" className="text-clay hover:underline">
            Choisir un voyage
          </Link>
        ) : (
          <>
            Vos coordonnées sont dans{" "}
            <Link href="/mon-profil" className="text-clay hover:underline">
              Mon profil
            </Link>
            .
          </>
        )}
      </p>
      {!firstName && (
        <p className="mt-2 text-foreground/75">
          <Link href="/mon-profil" className="text-clay hover:underline">
            Ajoutez votre prénom dans Mon profil
          </Link>{" "}
          pour que nous puissions vous saluer.
        </p>
      )}
      {quotes.length > 0 && (
        <>
          <h2 className="mt-10 text-2xl">Mes devis</h2>
          <QuoteList quotes={quotes} />
        </>
      )}
    </>
  );
}

function QuoteList({ quotes }: { quotes: SavedQuote[] }) {
  return (
    <ul className="mt-4 flex flex-col gap-3">
      {quotes.map((quote) => (
        <li key={quote.id}>
          <Link
            href={`/mes-devis/${quote.id}`}
            className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-sand-deep bg-cream p-4 hover:border-foreground/30"
          >
            <span>
              <span className="block font-medium">{quote.tripTitle}</span>
              <span className="block text-sm text-foreground/70">
                <span className="first-letter:uppercase">Départ {formatDate(quote.departureDate)}</span>
                {" · "}
                {quote.travelers} voyageur{quote.travelers > 1 ? "s" : ""}
              </span>
              <span className="block text-xs text-foreground/75">
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
