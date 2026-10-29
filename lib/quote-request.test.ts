import { describe, expect, it } from "vitest";
import type { Trip } from "./catalogue";
import { resolveQuoteRequest } from "./quote-request";

const trip: Trip = {
  slug: "lisbonne-5-jours",
  title: "Lisbonne, 5 jours",
  destination: "Portugal",
  durationDays: 5,
  description: "",
  imageUrl: null,
  departures: [{ id: "d1", date: "2027-05-12", pricePerPersonCents: 65000 }],
  options: [
    { id: "transfert", label: "Transfert aéroport", priceCents: 6000, pricingType: "fixed", category: "standard", exclusiveGroup: "transfert" },
    { id: "assurance", label: "Assurance annulation", priceCents: 4000, pricingType: "per_person", category: "standard", exclusiveGroup: null },
    { id: "vehicule", label: "Transfert en véhicule adapté", priceCents: 8000, pricingType: "fixed", category: "accessibility", exclusiveGroup: "transfert" },
    { id: "pmr", label: "Chambre adaptée (PMR)", priceCents: 0, pricingType: "fixed", category: "accessibility", exclusiveGroup: null },
  ],
};

describe("resolveQuoteRequest", () => {
  it("accepte une configuration valide et remet les options dans l'ordre", () => {
    const result = resolveQuoteRequest(trip, { depart: "d1", voyageurs: "2", options: "vehicule,assurance" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.request.travelers).toBe(2);
      expect(result.request.options.map((o) => o.id)).toEqual(["assurance", "vehicule"]);
    }
  });

  it("accepte une configuration sans option", () => {
    expect(resolveQuoteRequest(trip, { depart: "d1", voyageurs: "1" }).ok).toBe(true);
  });

  it("refuse un départ inconnu", () => {
    expect(resolveQuoteRequest(trip, { depart: "autre", voyageurs: "2" }).ok).toBe(false);
  });

  it.each(["0", "10", "2.5", "abc", undefined])("refuse %s voyageurs", (voyageurs) => {
    expect(resolveQuoteRequest(trip, { depart: "d1", voyageurs }).ok).toBe(false);
  });

  it("refuse une option d'un autre voyage ou une option incluse", () => {
    expect(resolveQuoteRequest(trip, { depart: "d1", voyageurs: "2", options: "inconnue" }).ok).toBe(false);
    expect(resolveQuoteRequest(trip, { depart: "d1", voyageurs: "2", options: "pmr" }).ok).toBe(false);
  });

  it("refuse deux options non cumulables", () => {
    expect(resolveQuoteRequest(trip, { depart: "d1", voyageurs: "2", options: "transfert,vehicule" }).ok).toBe(false);
  });
});
