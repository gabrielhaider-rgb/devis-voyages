import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AdminHeader } from "@/components/admin/admin-header";
import { PrintButton } from "@/components/print-button";
import { QuoteDocument, savedQuoteNumber } from "@/components/quote-document";
import { requireAdmin } from "@/lib/admin";
import { getAdminQuote } from "@/lib/admin-quotes";

export const metadata: Metadata = { title: "Détail du devis — Administration" };

export default function AdminQuotePage({ params }: PageProps<"/admin/devis/[id]">) {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-12 print:max-w-none print:p-0">
      <Suspense fallback={<p className="text-foreground/70">Chargement…</p>}>
        {params.then(({ id }) => (
          <AdminQuote id={id} />
        ))}
      </Suspense>
    </main>
  );
}

async function AdminQuote({ id }: { id: string }) {
  await requireAdmin(`/admin/devis/${id}`);
  const quote = await getAdminQuote(id);
  if (!quote) notFound();

  return (
    <>
      <div className="print:hidden">
        <AdminHeader active="devis" />
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <Link href="/admin/devis/liste" className="text-sm text-foreground/70 hover:underline">
            ← Liste des devis
          </Link>
          <PrintButton />
        </div>
        <section className="mb-6 rounded-xl border border-sky-600/30 bg-sky-600/5 p-4 text-sm">
          <h2 className="font-semibold">Client</h2>
          <p className="mt-1">{quote.client.name}</p>
          <p>
            <a href={`mailto:${quote.client.email}`} className="text-sky-600 hover:underline">
              {quote.client.email}
            </a>
          </p>
          <p>
            {quote.client.phone ? (
              <a href={`tel:${quote.client.phone.replace(/[^\d+]/g, "")}`} className="text-sky-600 hover:underline">
                {quote.client.phone}
              </a>
            ) : (
              <span className="text-foreground/60">Pas de téléphone renseigné</span>
            )}
          </p>
          <Link href={`/admin/clients/${quote.client.id}`} className="mt-2 inline-block text-sky-600 hover:underline">
            Voir la fiche client →
          </Link>
        </section>
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
        client={quote.client}
      />
    </>
  );
}
