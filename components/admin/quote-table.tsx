import Link from "next/link";
import { savedQuoteNumber } from "@/components/quote-document";
import type { AdminQuote } from "@/lib/admin-quotes";
import { formatPrice, formatShortDate } from "@/lib/price";

const savedOn = new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeZone: "Europe/Paris" });

// Liste des devis enregistrés ; chaque ligne ouvre le détail.
export function QuoteTable({ quotes, showClient = true }: { quotes: AdminQuote[]; showClient?: boolean }) {
  if (quotes.length === 0) return <p className="mt-4 text-foreground/70">Aucun devis enregistré.</p>;

  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full min-w-[40rem] text-sm">
        <thead>
          <tr className="border-b border-sand-deep text-left text-foreground/70">
            <th className="pb-2 font-medium">Date</th>
            <th className="pb-2 font-medium">Numéro</th>
            {showClient && <th className="pb-2 font-medium">Client</th>}
            <th className="pb-2 font-medium">Voyage</th>
            <th className="pb-2 font-medium">Départ</th>
            <th className="pb-2 text-right font-medium">Voyageurs</th>
            <th className="pb-2 text-right font-medium">Total</th>
          </tr>
        </thead>
        <tbody>
          {quotes.map((quote) => (
            <tr key={quote.id} className="border-b border-foreground/10 hover:bg-foreground/5">
              <td className="py-2 pr-3 whitespace-nowrap">{savedOn.format(quote.createdAt)}</td>
              <td className="py-2 pr-3 whitespace-nowrap">
                <Link href={`/admin/devis/${quote.id}`} className="text-clay hover:underline">
                  {savedQuoteNumber(quote.id, quote.createdAt)}
                </Link>
              </td>
              {showClient && (
                <td className="py-2 pr-3">
                  <Link href={`/admin/clients/${quote.client.id}`} className="hover:underline">
                    {quote.client.name}
                  </Link>
                </td>
              )}
              <td className="py-2 pr-3">{quote.tripTitle}</td>
              <td className="py-2 pr-3 whitespace-nowrap">{formatShortDate(quote.departureDate)}</td>
              <td className="py-2 pr-3 text-right">{quote.travelers}</td>
              <td className="py-2 text-right whitespace-nowrap">{formatPrice(quote.totalCents)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
