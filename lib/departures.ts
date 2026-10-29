export type DepartureSummary = { date: string; pricePerPersonCents: number };

// Le départ affiché sur l'accueil : le plus proche à partir d'aujourd'hui
// (dates au format "AAAA-MM-JJ", comparables comme du texte).
export function nextDeparture<T extends DepartureSummary>(departures: T[], today: string): T | null {
  return (
    departures
      .filter((d) => d.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date))[0] ?? null
  );
}

// Date du jour à Paris, au format "AAAA-MM-JJ".
export function todayInParis(now = new Date()) {
  return now.toLocaleDateString("sv-SE", { timeZone: "Europe/Paris" });
}
