import { describe, expect, it } from "vitest";
import { speechChunks } from "./speech-text";

describe("speechChunks", () => {
  it("retire la mise en forme et les liens", () => {
    expect(speechChunks("**Rome** pour 2 : [voir le devis](/voyages/rome?x=1) https://exemple.fr")).toEqual([
      "Rome pour 2 : voir le devis",
    ]);
  });

  it("regroupe les phrases courtes et découpe les longues", () => {
    const long = `${"Très belle journée à Lisbonne ".repeat(10).trim()}.`;
    const chunks = speechChunks(`Bonjour. Voici votre voyage. ${long}`);
    expect(chunks[0]).toMatch(/^Bonjour\. Voici votre voyage\./);
    for (const chunk of chunks) expect(chunk.length).toBeLessThanOrEqual(180);
    expect(chunks.join(" ").replace(/\s+/g, " ")).toContain("Lisbonne");
  });

  it("ne renvoie rien pour un texte vide", () => {
    expect(speechChunks("  ** ")).toEqual([]);
  });
});
