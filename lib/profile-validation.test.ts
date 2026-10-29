import { describe, expect, it } from "vitest";
import { displayName, parseProfileForm } from "./profile-validation";

describe("parseProfileForm", () => {
  it("accepte prénom et nom, téléphone facultatif", () => {
    expect(parseProfileForm({ first_name: " Marie ", last_name: "Durand", phone: "" })).toEqual({
      ok: true,
      value: { first_name: "Marie", last_name: "Durand", phone: null },
    });
    expect(parseProfileForm({ first_name: "Marie", last_name: "Durand", phone: "+33 6 12 34 56 78" }).ok).toBe(true);
    expect(parseProfileForm({ first_name: "Marie", last_name: "Durand", phone: "06.12.34.56.78" }).ok).toBe(true);
  });

  it("refuse un nom manquant ou un téléphone invalide", () => {
    expect(parseProfileForm({ first_name: "Marie", last_name: "" }).ok).toBe(false);
    expect(parseProfileForm({ first_name: "Marie", last_name: "Durand", phone: "appelez-moi" }).ok).toBe(false);
    expect(parseProfileForm({ first_name: "Marie", last_name: "Durand", phone: "123" }).ok).toBe(false);
  });
});

describe("displayName", () => {
  it("affiche le nom, ou l'email si le profil n'est pas complété", () => {
    expect(displayName({ firstName: "Marie", lastName: "Durand", email: "m@exemple.fr" })).toBe("Marie Durand");
    expect(displayName({ firstName: null, lastName: null, email: "m@exemple.fr" })).toBe("m@exemple.fr");
  });
});
