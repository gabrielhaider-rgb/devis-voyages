import { describe, expect, it } from "vitest";
import { greeting, initial, savedQuotesSentence } from "./greeting";

describe("greeting", () => {
  it("salue par le prénom", () => {
    expect(greeting(" Gabriel ")).toBe("Bonjour Gabriel,");
  });

  it("reste poli sans prénom", () => {
    expect(greeting(null)).toBe("Bonjour,");
    expect(greeting("  ")).toBe("Bonjour,");
  });
});

describe("savedQuotesSentence", () => {
  it("accorde selon le nombre de devis", () => {
    expect(savedQuotesSentence(0)).toBe("Vous n'avez pas encore de devis enregistré.");
    expect(savedQuotesSentence(1)).toBe("Retrouvez ici votre devis enregistré.");
    expect(savedQuotesSentence(3)).toBe("Retrouvez ici vos 3 devis enregistrés.");
  });
});

describe("initial", () => {
  it("prend la première lettre en majuscule", () => {
    expect(initial("élodie")).toBe("É");
  });
});
