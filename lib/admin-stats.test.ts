import { describe, expect, it } from "vitest";
import { computeDashboard, type QuoteForStats } from "./admin-stats";

const quote = (date: string, tripTitle: string, euros: number, hasAccessibility = false): QuoteForStats => ({
  createdAt: new Date(date),
  tripTitle,
  totalCents: euros * 100,
  hasAccessibility,
});

const now = new Date("2026-10-29T12:00:00Z");
const quotes = [
  quote("2026-10-02T10:00:00Z", "Lisbonne, 5 jours", 1440, true),
  quote("2026-10-20T10:00:00Z", "Lisbonne, 5 jours", 1460),
  quote("2026-09-15T10:00:00Z", "Rome, 4 jours", 1785),
  quote("2025-08-01T10:00:00Z", "Rome, 4 jours", 560), // plus de 12 mois : hors graphique
];

describe("computeDashboard", () => {
  const dashboard = computeDashboard(quotes, now);

  it("calcule les chiffres clés", () => {
    expect(dashboard.count).toBe(4);
    expect(dashboard.totalCents).toBe(524500);
    expect(dashboard.averageCents).toBe(131125);
  });

  it("classe les voyages du plus demandé au moins demandé, puis par montant", () => {
    expect(dashboard.byTrip).toEqual([
      { tripTitle: "Lisbonne, 5 jours", count: 2, totalCents: 290000 },
      { tripTitle: "Rome, 4 jours", count: 2, totalCents: 234500 },
    ]);
  });

  it("compte les devis des 12 derniers mois, mois vides compris", () => {
    expect(dashboard.byMonth).toHaveLength(12);
    expect(dashboard.byMonth.at(-1)).toMatchObject({ key: "2026-10", count: 2 });
    expect(dashboard.byMonth.at(-2)).toMatchObject({ key: "2026-09", count: 1 });
    expect(dashboard.byMonth[0].key).toBe("2025-11");
    expect(dashboard.byMonth.reduce((sum, m) => sum + m.count, 0)).toBe(3);
  });

  it("calcule la part des devis avec accessibilité payante", () => {
    expect(dashboard.accessibility).toEqual({ count: 1, percent: 25 });
  });

  it("gère l'absence de devis", () => {
    const empty = computeDashboard([], now);
    expect(empty.averageCents).toBe(0);
    expect(empty.accessibility.percent).toBe(0);
    expect(empty.byMonth).toHaveLength(12);
  });

  it("range un devis du 31 au soir, heure de Paris, dans le bon mois", () => {
    const late = computeDashboard([quote("2026-09-30T22:30:00Z", "Rome, 4 jours", 560)], now);
    expect(late.byMonth.find((m) => m.key === "2026-10")?.count).toBe(1);
  });
});
