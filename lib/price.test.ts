import { describe, expect, it } from "vitest";
import { computeQuote, formatPrice, type PricedOption } from "./price";

// Cas de test du PRD (section 4) : voyage « Lisbonne, 5 jours ».
const depart12Mai = 65000;
const depart14Juillet = 82000;
const assurance: PricedOption = { label: "Assurance annulation", priceCents: 4000, pricingType: "per_person" };
const transfert: PricedOption = { label: "Transfert aéroport", priceCents: 6000, pricingType: "fixed" };
const sintra: PricedOption = { label: "Excursion à Sintra", priceCents: 3500, pricingType: "per_person" };
const vehiculeAdapte: PricedOption = { label: "Transfert en véhicule adapté", priceCents: 8000, pricingType: "fixed" };
const assistanceAeroport: PricedOption = { label: "Assistance à l'aéroport", priceCents: 0, pricingType: "per_person" };

describe("computeQuote — cas de test du PRD", () => {
  it("cas 1 : 12/05, 1 voyageur, aucune option → 650 €", () => {
    const quote = computeQuote({ pricePerPersonCents: depart12Mai, travelers: 1, options: [] });
    expect(quote.totalCents).toBe(65000);
  });

  it("cas 2 : 12/05, 2 voyageurs, assurance + transfert → 1 440 €", () => {
    const quote = computeQuote({ pricePerPersonCents: depart12Mai, travelers: 2, options: [assurance, transfert] });
    expect(quote.totalCents).toBe(144000);
  });

  it("cas 3 : 14/07, 4 voyageurs, assurance + transfert + Sintra → 3 640 €", () => {
    const quote = computeQuote({
      pricePerPersonCents: depart14Juillet,
      travelers: 4,
      options: [assurance, transfert, sintra],
    });
    expect(quote.totalCents).toBe(364000);
  });

  it("cas 4 : 12/05, 2 voyageurs, assurance + véhicule adapté + assistance → 1 460 €", () => {
    const quote = computeQuote({
      pricePerPersonCents: depart12Mai,
      travelers: 2,
      options: [assurance, vehiculeAdapte, assistanceAeroport],
    });
    expect(quote.totalCents).toBe(146000);
  });
});

describe("computeQuote — détail des lignes", () => {
  it("multiplie les options par personne et laisse les forfaits tels quels", () => {
    const quote = computeQuote({ pricePerPersonCents: depart12Mai, travelers: 2, options: [assurance, transfert] });
    expect(quote.lines.map((line) => line.amountCents)).toEqual([130000, 8000, 6000]);
  });
});

describe("formatPrice", () => {
  it("formate les centimes en euros", () => {
    expect(formatPrice(144000).replace(/\s/g, " ")).toBe("1 440 €");
    expect(formatPrice(1250).replace(/\s/g, " ")).toBe("12,50 €");
  });
});
