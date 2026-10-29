import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { PrintButton } from "@/components/print-button";
import { QuoteDocument, savedQuoteNumber } from "@/components/quote-document";
import { isAdmin } from "@/lib/admin";
import { getCurrentUser } from "@/lib/auth";
import { getMyProfile } from "@/lib/profile";
import { displayName } from "@/lib/profile-validation";
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
  const user = await getCurrentUser();
  if (!user) redirect(`/connexion?next=/mes-devis/${encodeURIComponent(id)}`);
  const [quote, profile] = await Promise.all([getMyQuote(user.id, id), getMyProfile(user.id)]);
  // Devis d'un autre compte (ex. lien ouvert après avoir changé de compte) :
  // un admin le retrouve dans l'administration, un client revient à ses devis.
  if (!quote) redirect((await isAdmin(user)) ? `/admin/devis/${encodeURIComponent(id)}` : "/mes-devis");

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
        client={
          profile
            ? { name: displayName(profile), email: profile.email, phone: profile.phone }
            : undefined
        }
      />
    </>
  );
}
