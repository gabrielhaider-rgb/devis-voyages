import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { PrintButton } from "@/components/print-button";
import { QuoteDocument, savedQuoteNumber } from "@/components/quote-document";
import { getCurrentUser } from "@/lib/auth";
import { getMyQuote } from "@/lib/saved-quotes";

export const metadata: Metadata = { title: "Mon devis — Devis voyages" };

export default function SavedQuotePage({ params }: PageProps<"/mes-devis/[id]">) {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-12 print:max-w-none print:p-0">
      <Suspense fallback={<p className="text-foreground/70">Chargement du devis…</p>}>
        {params.then(({ id }) => (
          <SavedQuote id={id} />
        ))}
      </Suspense>
    </main>
  );
}

async function SavedQuote({ id }: { id: string }) {
  if (!(await getCurrentUser())) redirect(`/connexion?next=/mes-devis/${encodeURIComponent(id)}`);
  const quote = await getMyQuote(id);
  if (!quote) notFound();

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 print:hidden">
        <Link href="/mes-devis" className="text-sm text-foreground/70 hover:underline">
          ← Mes devis
        </Link>
        <PrintButton />
      </div>
      <QuoteDocument
        number={savedQuoteNumber(quote.id, quote.createdAt)}
        issuedAt={quote.createdAt}
        tripTitle={quote.tripTitle}
        destination={quote.destination}
        durationDays={quote.durationDays}
        departureDate={quote.departureDate}
        travelers={quote.travelers}
        lines={quote.lines}
        totalCents={quote.totalCents}
        includedAccessibility={quote.includedAccessibility}
      />
    </>
  );
}
