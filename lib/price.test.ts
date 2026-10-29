import { describe, expect, it } from "vitest";
import { computeQuote, formatDate, formatPrice, formatShortDate, type PricedOption } from "./price";

// Cas de test du PRD (section 4) : voyage « Lisbonne, 5 jours ».
const depart12Mai = 65000;
const depart14Juillet = 82000;
const assurance: PricedOption = { label: "Assurance annulation", priceCents: 4000, pricingType: "per_person" };
const transfert: PricedOption = { label: "Transfert aéroport", priceCents: 6000, pricingType: "fixed" };
const sintra: PricedOption = { label: "Excursion à Sintra", priceCents: 3500, pricingType: "per_person" };
const vehiculeAdapte: PricedOption = { label: "Transfert en véhicule adapté", priceCents: 8000, pricingType: "fixed" };

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

  it("cas 4 : 12/05, 2 voyageurs, assurance + véhicule adapté → 1 460 €", () => {
    const quote = computeQuote({
      pricePerPersonCents: depart12Mai,
      travelers: 2,
      options: [assurance, vehiculeAdapte],
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

describe("formatDate et formatShortDate", () => {
  it("écrivent les dates en français, avec « 1er » pour le premier du mois", () => {
    expect(formatDate("2027-05-12")).toBe("mercredi 12 mai 2027");
    expect(formatDate("2027-04-01")).toBe("jeudi 1er avril 2027");
    expect(formatShortDate("2027-04-01")).toBe("1er avril 2027");
    expect(formatShortDate("2027-06-10")).toBe("10 juin 2027");
    expect(formatShortDate("2027-11-21")).toBe("21 novembre 2027");
  });
});
