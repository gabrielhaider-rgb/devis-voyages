import { formatDate, formatPrice, type QuoteLine } from "@/lib/price";

export type QuoteDocumentProps = {
  number: string;
  issuedAt: Date;
  tripTitle: string;
  destination: string;
  durationDays: number;
  departureDate: string;
  travelers: number;
  lines: QuoteLine[];
  totalCents: number;
  includedAccessibility: string[];
  // Client du devis enregistré (absent pour un devis non enregistré).
  client?: { name: string; email: string; phone: string | null };
};

const issueDate = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Europe/Paris",
});

// Mise en page du devis, à l'écran comme à l'impression (PDF).
export function QuoteDocument(quote: QuoteDocumentProps) {
  return (
    <article className="rounded-xl border border-foreground/15 p-6 sm:p-8 print:rounded-none print:border-0 print:p-0">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-foreground/15 pb-6">
        <div>
          <p className="text-lg font-semibold text-sky-600">Devis voyages</p>
          <p className="text-sm text-foreground/70">Tour-opérateur</p>
        </div>
        <div className="text-sm sm:text-right">
          <h1 className="text-2xl font-semibold">Devis</h1>
          <p>N° {quote.number}</p>
          <p className="text-foreground/70">Établi le {issueDate.format(quote.issuedAt)}</p>
        </div>
      </header>

      <section className="mt-6 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-[auto_1fr]">
        {quote.client && (
          <>
            <span className="text-foreground/70">Client</span>
            <span>
              {quote.client.name} · {quote.client.email}
              {quote.client.phone && ` · ${quote.client.phone}`}
            </span>
          </>
        )}
        <span className="text-foreground/70">Voyage</span>
        <span className="font-medium">
          {quote.tripTitle} — {quote.destination}
        </span>
        <span className="text-foreground/70">Départ</span>
        <span className="first-letter:uppercase">{formatDate(quote.departureDate)}</span>
        <span className="text-foreground/70">Durée</span>
        <span>{quote.durationDays} jours</span>
        <span className="text-foreground/70">Voyageurs</span>
        <span>{quote.travelers}</span>
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

      {quote.includedAccessibility.length > 0 && (
        <section className="mt-8 text-sm">
          <h2 className="font-medium">Accessibilité incluse, sans supplément</h2>
          <ul className="mt-1 list-inside list-disc text-foreground/80">
            {quote.includedAccessibility.map((label) => (
              <li key={label}>{label}</li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-8 border-t border-foreground/15 pt-4 text-xs text-foreground/60">
        Devis indicatif, sans engagement. Prix en euros, toutes taxes comprises. La réservation
        se fait auprès de l&apos;agence.
      </p>
    </article>
  );
}

// Numéro d'un devis enregistré : date d'enregistrement + début de son identifiant.
export function savedQuoteNumber(id: string, createdAt: Date) {
  const day = createdAt.toLocaleDateString("sv-SE", { timeZone: "Europe/Paris" }).replaceAll("-", "");
  return `DV-${day}-${id.slice(0, 4).toUpperCase()}`;
}
