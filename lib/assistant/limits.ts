import type { ChatMessage } from "@/lib/assistant/agent";

export const MAX_USER_MESSAGES = 20;
export const MAX_MESSAGE_LENGTH = 1000;

// Vérifie la conversation envoyée par le navigateur avant tout appel payant.
export function parseConversation(body: unknown): { ok: true; messages: ChatMessage[] } | { ok: false; error: string } {
  const raw = (body as { messages?: unknown } | null)?.messages;
  if (!Array.isArray(raw) || raw.length === 0) return { ok: false, error: "Conversation vide." };

  const messages: ChatMessage[] = [];
  for (const item of raw) {
    const role = (item as { role?: unknown })?.role;
    const content = (item as { content?: unknown })?.content;
    if ((role !== "user" && role !== "assistant") || typeof content !== "string" || !content.trim()) {
      return { ok: false, error: "Message mal formé." };
    }
    // Les réponses de l'assistant sont un peu plus longues que les messages du visiteur.
    if (content.length > (role === "user" ? MAX_MESSAGE_LENGTH : MAX_MESSAGE_LENGTH * 3)) {
      return { ok: false, error: `Un message ne peut pas dépasser ${MAX_MESSAGE_LENGTH} caractères.` };
    }
    messages.push({ role, content: content.trim() });
  }

  if (messages[0].role !== "user" || messages.at(-1)!.role !== "user") {
    return { ok: false, error: "Message mal formé." };
  }
  if (messages.filter((m) => m.role === "user").length > MAX_USER_MESSAGES) {
    return {
      ok: false,
      error: `Cette conversation a atteint ${MAX_USER_MESSAGES} messages. Recommencez une nouvelle conversation.`,
    };
  }
  return { ok: true, messages };
}
