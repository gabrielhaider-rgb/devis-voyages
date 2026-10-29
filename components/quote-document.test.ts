import { describe, expect, it } from "vitest";
import { tripLabel } from "./quote-document";

describe("tripLabel", () => {
  it("ajoute la destination quand le titre ne la contient pas", () => {
    expect(tripLabel("Lisbonne, 5 jours", "Portugal")).toBe("Lisbonne, 5 jours — Portugal");
  });

  it("ne répète pas la destination déjà présente dans le titre", () => {
    expect(tripLabel("Japon, 12 jours", "Japon")).toBe("Japon, 12 jours");
    expect(tripLabel("Islande, 8 jours", "islande")).toBe("Islande, 8 jours");
    expect(tripLabel("Séjour en Égypte", "Egypte")).toBe("Séjour en Égypte");
  });
});
