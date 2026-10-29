import { describe, expect, it } from "vitest";
import { nextDeparture, todayInParis } from "./departures";

// Islande : le départ de juin passe à 2 000 €, celui de septembre reste à 1 890 €.
const islande = [
  { date: "2027-09-02", pricePerPersonCents: 189000 },
  { date: "2027-06-10", pricePerPersonCents: 200000 },
];

describe("nextDeparture", () => {
  it("prend le départ le plus proche, pas le moins cher", () => {
    expect(nextDeparture(islande, "2026-10-29")).toEqual({ date: "2027-06-10", pricePerPersonCents: 200000 });
  });

  it("ignore les départs passés, mais garde celui du jour même", () => {
    expect(nextDeparture(islande, "2027-06-11")?.date).toBe("2027-09-02");
    expect(nextDeparture(islande, "2027-06-10")?.date).toBe("2027-06-10");
  });

  it("renvoie null s'il n'y a plus de départ à venir", () => {
    expect(nextDeparture(islande, "2027-09-03")).toBeNull();
    expect(nextDeparture([], "2026-10-29")).toBeNull();
  });
});

describe("todayInParis", () => {
  it("donne la date de Paris, même quand il est déjà le lendemain à Paris", () => {
    expect(todayInParis(new Date("2026-10-29T23:30:00Z"))).toBe("2026-10-30");
  });
});
