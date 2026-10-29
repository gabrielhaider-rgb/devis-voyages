import { describe, expect, it } from "vitest";
import { parseConversation } from "./limits";

const user = (content: string) => ({ role: "user", content });
const assistant = (content: string) => ({ role: "assistant", content });

describe("parseConversation", () => {
  it("accepte une conversation qui se termine par le visiteur", () => {
    expect(parseConversation({ messages: [user("Bonjour"), assistant("Bonjour !"), user("Lisbonne ?")] }).ok).toBe(true);
  });

  it("refuse une conversation vide, mal formée ou terminée par l'assistant", () => {
    expect(parseConversation({}).ok).toBe(false);
    expect(parseConversation({ messages: [{ role: "system", content: "x" }] }).ok).toBe(false);
    expect(parseConversation({ messages: [user("Bonjour"), assistant("Bonjour !")] }).ok).toBe(false);
    expect(parseConversation({ messages: [user("   ")] }).ok).toBe(false);
  });

  it("refuse un message trop long et plus de 20 messages du visiteur", () => {
    expect(parseConversation({ messages: [user("a".repeat(1001))] }).ok).toBe(false);
    const long = Array.from({ length: 21 }, (_, i) => [user(`q${i}`), assistant(`r${i}`)]).flat().slice(0, -1);
    expect(parseConversation({ messages: long }).ok).toBe(false);
  });
});
