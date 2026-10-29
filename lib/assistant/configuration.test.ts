import { describe, expect, it } from "vitest";
import type { Trip } from "../catalogue";
import { priceConfiguration } from "./configuration";

const lisbonne: Trip = {
  slug: "lisbonne-5-jours",
  title: "Lisbonne, 5 jours",
  destination: "Portugal",
  durationDays: 5,
  description: "",
  departures: [
    { id: "d-mai", date: "2027-05-12", pricePerPersonCents: 65000 },
    { id: "d-juillet", date: "2027-07-14", pricePerPersonCents: 82000 },
  ],
  options: [
    { id: "assurance", label: "Assurance annulation", priceCents: 4000, pricingType: "per_person", category: "standard", exclusiveGroup: null },
    { id: "transfert", label: "Transfert aéroport", priceCents: 6000, pricingType: "fixed", category: "standard", exclusiveGroup: "transfert" },
    { id: "vehicule", label: "Transfert en véhicule adapté", priceCents: 8000, pricingType: "fixed", category: "accessibility", exclusiveGroup: "transfert" },
    { id: "pmr", label: "Chambre adaptée (PMR)", priceCents: 0, pricingType: "fixed", category: "accessibility", exclusiveGroup: null },
  ],
};

describe("priceConfiguration", () => {
  it("chiffre le cas n° 4 du PRD et donne le lien pré-rempli", () => {
    const result = priceConfiguration(lisbonne, {
      departure_date: "2027-05-12",
      travelers: 2,
      option_labels: ["assurance annulation", "Transfert en vehicule adapte"],
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.proposal.totalCents).toBe(146000);
      expect(result.proposal.configureUrl).toBe(
        "/voyages/lisbonne-5-jours?depart=d-mai&voyageurs=2&options=assurance%2Cvehicule",
      );
    }
  });

  it("ignore une prestation incluse demandée par l'agent", () => {
    const result = priceConfiguration(lisbonne, { departure_date: "2027-05-12", travelers: 1, option_labels: ["Chambre adaptée (PMR)"] });
    expect(result.ok && result.proposal.totalCents).toBe(65000);
  });

  it("refuse un départ ou une option qui n'existent pas", () => {
    expect(priceConfiguration(lisbonne, { departure_date: "2027-06-01", travelers: 2, option_labels: [] }).ok).toBe(false);
    expect(priceConfiguration(lisbonne, { departure_date: "2027-05-12", travelers: 2, option_labels: ["Spa"] }).ok).toBe(false);
  });

  it("refuse deux options non cumulables et un nombre de voyageurs hors limites", () => {
    expect(
      priceConfiguration(lisbonne, {
        departure_date: "2027-05-12",
        travelers: 2,
        option_labels: ["Transfert aéroport", "Transfert en véhicule adapté"],
      }).ok,
    ).toBe(false);
    expect(priceConfiguration(lisbonne, { departure_date: "2027-05-12", travelers: 12, option_labels: [] }).ok).toBe(false);
  });
});
