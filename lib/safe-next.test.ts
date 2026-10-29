import { describe, expect, it } from "vitest";
import { safeNext } from "./safe-next";

describe("safeNext", () => {
  it("garde un chemin interne au site", () => {
    expect(safeNext("/devis?voyage=rome-4-jours&voyageurs=2")).toBe("/devis?voyage=rome-4-jours&voyageurs=2");
  });

  it.each(["https://pirate.example", "//pirate.example", "/\\pirate.example", "", undefined, ["/a"]])(
    "remplace %s par la page par défaut",
    (next) => {
      expect(safeNext(next)).toBe("/mes-devis");
    },
  );
});
