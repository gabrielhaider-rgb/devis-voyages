import { describe, expect, it } from "vitest";
import {
  centsToInput,
  parseDepartureForm,
  parseEuros,
  parseOptionForm,
  parseTripForm,
  slugify,
} from "./admin-validation";

describe("parseEuros", () => {
  it.each([
    ["650", 65000],
    ["650,50", 65050],
    ["12.5", 1250],
    ["1 200", 120000],
    ["0", 0],
    ["80 €", 8000],
  ])("%s → %i centimes", (input, cents) => {
    expect(parseEuros(input)).toBe(cents);
  });

  it.each(["", "-10", "abc", "12,345", "1.2.3"])("refuse %s", (input) => {
    expect(parseEuros(input)).toBeNull();
  });
});

describe("slugify", () => {
  it("retire accents, ponctuation et majuscules", () => {
    expect(slugify("Séjour à Lisbonne, 5 jours !")).toBe("sejour-a-lisbonne-5-jours");
  });
});

describe("parseTripForm", () => {
  const base = { title: "Porto, 3 jours", destination: "Portugal", duration_days: "3", description: "" };

  it("déduit l'adresse de la page du titre si elle est vide", () => {
    const result = parseTripForm(base);
    expect(result).toEqual({
      ok: true,
      value: {
        slug: "porto-3-jours",
        title: "Porto, 3 jours",
        destination: "Portugal",
        duration_days: 3,
        description: "",
        image_url: null,
      },
    });
  });

  it("refuse une durée invalide ou une adresse mal formée", () => {
    expect(parseTripForm({ ...base, duration_days: "0" }).ok).toBe(false);
    expect(parseTripForm({ ...base, duration_days: "2.5" }).ok).toBe(false);
    expect(parseTripForm({ ...base, slug: "Porto 3 jours" }).ok).toBe(false);
    expect(parseTripForm({ ...base, title: "" }).ok).toBe(false);
  });

  it("accepte une photo en https et refuse les autres adresses", () => {
    const withPhoto = parseTripForm({ ...base, image_url: "https://images.unsplash.com/photo-123?w=1200" });
    expect(withPhoto.ok && withPhoto.value.image_url).toBe("https://images.unsplash.com/photo-123?w=1200");
    expect(parseTripForm({ ...base, image_url: "http://exemple.fr/a.jpg" }).ok).toBe(false);
    expect(parseTripForm({ ...base, image_url: "javascript:alert(1)" }).ok).toBe(false);
  });
});

describe("parseDepartureForm", () => {
  it("accepte une date et un prix en euros", () => {
    expect(parseDepartureForm({ departure_date: "2027-05-12", price: "650" })).toEqual({
      ok: true,
      value: { departure_date: "2027-05-12", price_per_person_cents: 65000 },
    });
  });

  it("refuse une date invalide ou un prix nul", () => {
    expect(parseDepartureForm({ departure_date: "12/05/2027", price: "650" }).ok).toBe(false);
    expect(parseDepartureForm({ departure_date: "2027-05-12", price: "0" }).ok).toBe(false);
  });
});

describe("parseOptionForm", () => {
  const base = { label: "Transfert aéroport", price: "60", pricing_type: "fixed", category: "standard", exclusive_group: "" };

  it("accepte une option, sans groupe non cumulable", () => {
    const result = parseOptionForm(base);
    expect(result.ok && result.value).toEqual({
      label: "Transfert aéroport",
      price_cents: 6000,
      pricing_type: "fixed",
      category: "standard",
      exclusive_group: null,
    });
  });

  it("normalise le groupe non cumulable et accepte un prix de 0", () => {
    const result = parseOptionForm({ ...base, price: "0", exclusive_group: "Transfert" });
    expect(result.ok && result.value.exclusive_group).toBe("transfert");
    expect(result.ok && result.value.price_cents).toBe(0);
  });

  it("refuse un type ou une catégorie inconnus", () => {
    expect(parseOptionForm({ ...base, pricing_type: "autre" }).ok).toBe(false);
    expect(parseOptionForm({ ...base, category: "autre" }).ok).toBe(false);
  });
});

describe("centsToInput", () => {
  it("affiche les centimes seulement s'il y en a, et se relit avec parseEuros", () => {
    expect(centsToInput(65000)).toBe("650");
    expect(centsToInput(65050)).toBe("650,50");
    expect(parseEuros(centsToInput(65050))).toBe(65050);
  });
});
