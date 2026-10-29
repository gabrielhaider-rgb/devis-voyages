// Calculs du tableau de bord des devis (sans accès à la base : testable).

export type QuoteForStats = {
  createdAt: Date;
  tripTitle: string;
  totalCents: number;
  hasAccessibility: boolean;
};

export type Dashboard = {
  count: number;
  totalCents: number;
  averageCents: number;
  byTrip: { tripTitle: string; count: number; totalCents: number }[];
  byMonth: { key: string; label: string; count: number }[];
  accessibility: { count: number; percent: number };
};

const monthLabel = new Intl.DateTimeFormat("fr-FR", { month: "short", year: "2-digit", timeZone: "Europe/Paris" });

// "2026-10" pour une date, à l'heure de Paris.
function monthKey(date: Date) {
  return date.toLocaleDateString("sv-SE", { timeZone: "Europe/Paris" }).slice(0, 7);
}

export function computeDashboard(quotes: QuoteForStats[], now: Date): Dashboard {
  const count = quotes.length;
  const totalCents = quotes.reduce((sum, q) => sum + q.totalCents, 0);

  const trips = new Map<string, { tripTitle: string; count: number; totalCents: number }>();
  for (const quote of quotes) {
    const trip = trips.get(quote.tripTitle) ?? { tripTitle: quote.tripTitle, count: 0, totalCents: 0 };
    trip.count += 1;
    trip.totalCents += quote.totalCents;
    trips.set(quote.tripTitle, trip);
  }

  // Les 12 derniers mois, du plus ancien au mois en cours (y compris les mois sans devis).
  const byMonth: Dashboard["byMonth"] = [];
  const [year, month] = monthKey(now).split("-").map(Number);
  for (let offset = 11; offset >= 0; offset--) {
    const date = new Date(Date.UTC(year, month - 1 - offset, 15));
    byMonth.push({ key: monthKey(date), label: monthLabel.format(date), count: 0 });
  }
  for (const quote of quotes) {
    const bucket = byMonth.find((m) => m.key === monthKey(quote.createdAt));
    if (bucket) bucket.count += 1;
  }

  const withAccessibility = quotes.filter((q) => q.hasAccessibility).length;

  return {
    count,
    totalCents,
    averageCents: count > 0 ? Math.round(totalCents / count) : 0,
    byTrip: [...trips.values()].sort((a, b) => b.count - a.count || b.totalCents - a.totalCents),
    byMonth,
    accessibility: { count: withAccessibility, percent: count > 0 ? Math.round((withAccessibility / count) * 100) : 0 },
  };
}
