"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import type { ChatMessage } from "@/lib/assistant/agent";
import type { Proposal } from "@/lib/assistant/configuration";
import { MAX_MESSAGE_LENGTH } from "@/lib/assistant/limits";
import { formatPrice, formatShortDate } from "@/lib/price";

type Entry = ChatMessage & { proposal?: Proposal | null };

const GREETING =
  "Bonjour ! Je peux vous aider à choisir un voyage et à préparer votre devis. Où aimeriez-vous partir, et à combien ?";

// Bulle de discussion avec l'assistant, présente sur toutes les pages (sauf l'administration).
export function AssistantBubble() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [entries, pending, open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  if (pathname.startsWith("/admin")) return null;

  async function send(event?: FormEvent) {
    event?.preventDefault();
    const text = input.trim();
    if (!text || pending) return;

    const next: Entry[] = [...entries, { role: "user", content: text }];
    setEntries(next);
    setInput("");
    setError(null);
    setPending(true);
    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.map(({ role, content }) => ({ role, content })) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "L'assistant est indisponible pour le moment.");
      setEntries([...next, { role: "assistant", content: data.reply, proposal: data.proposal }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "L'assistant est indisponible pour le moment.");
      // On rend au visiteur le message non traité pour qu'il puisse le renvoyer.
      setEntries(entries);
      setInput(text);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="fixed right-4 bottom-4 z-50 flex flex-col items-end gap-3 print:hidden">
      {open && (
        <section
          role="dialog"
          aria-label="Assistant voyages"
          className="flex h-[min(32rem,calc(100dvh-6rem))] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-foreground/15 bg-background shadow-xl"
        >
          <header className="flex items-center justify-between border-b border-foreground/10 px-4 py-3">
            <h2 className="font-semibold">Assistant voyages</h2>
            <div className="flex items-center gap-3 text-sm">
              {entries.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setEntries([]);
                    setError(null);
                  }}
                  className="text-foreground/60 hover:underline"
                >
                  Nouvelle conversation
                </button>
              )}
              <button type="button" onClick={() => setOpen(false)} aria-label="Fermer l'assistant" className="text-lg leading-none">
                ×
              </button>
            </div>
          </header>

          <div ref={listRef} aria-live="polite" className="flex flex-1 flex-col gap-3 overflow-y-auto p-4 text-sm">
            <Bubble role="assistant">{GREETING}</Bubble>
            {entries.map((entry, index) => (
              <div key={index} className="flex flex-col gap-2">
                <Bubble role={entry.role}>{entry.content}</Bubble>
                {entry.proposal && <ProposalCard proposal={entry.proposal} />}
              </div>
            ))}
            {pending && <p className="text-foreground/60">L&apos;assistant réfléchit…</p>}
            {error && (
              <p role="alert" className="text-red-600">
                {error}
              </p>
            )}
          </div>

          <form onSubmit={send} className="flex items-end gap-2 border-t border-foreground/10 p-3">
            <label htmlFor="assistant-input" className="sr-only">
              Votre message
            </label>
            <textarea
              id="assistant-input"
              ref={inputRef}
              rows={2}
              maxLength={MAX_MESSAGE_LENGTH}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) send(e);
              }}
              placeholder="Ex. : 2 adultes, Lisbonne en mai"
              className="flex-1 resize-none rounded-lg border border-foreground/15 bg-background p-2"
            />
            <button
              type="submit"
              disabled={pending || !input.trim()}
              className="rounded-lg bg-sky-600 px-3 py-2 font-medium text-white hover:bg-sky-700 disabled:opacity-50"
            >
              Envoyer
            </button>
          </form>
          <p className="px-3 pb-2 text-[11px] text-foreground/50">
            Réponses générées par une IA : vérifiez la configuration avant d&apos;ouvrir votre devis.
          </p>
        </section>
      )}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="rounded-full bg-sky-600 px-5 py-3 font-medium text-white shadow-lg hover:bg-sky-700"
      >
        {open ? "Fermer" : "Besoin d'aide ?"}
      </button>
    </div>
  );
}

function Bubble({ role, children }: { role: ChatMessage["role"]; children: string }) {
  return (
    <p
      className={`max-w-[85%] whitespace-pre-line rounded-2xl px-3 py-2 ${
        role === "user" ? "self-end bg-sky-600 text-white" : "self-start bg-foreground/5"
      }`}
    >
      {children}
    </p>
  );
}

function ProposalCard({ proposal }: { proposal: Proposal }) {
  return (
    <div className="self-start rounded-xl border border-sky-600/40 p-3">
      <p className="font-medium">{proposal.tripTitle}</p>
      <p className="text-foreground/70">
        Départ le {formatShortDate(proposal.departureDate)} · {proposal.travelers} voyageur
        {proposal.travelers > 1 ? "s" : ""}
      </p>
      {proposal.options.length > 0 && <p className="text-foreground/70">{proposal.options.join(", ")}</p>}
      <p className="mt-1 font-semibold">{formatPrice(proposal.totalCents)}</p>
      <Link
        href={proposal.configureUrl}
        className="mt-2 inline-block rounded-lg bg-sky-600 px-3 py-1.5 font-medium text-white hover:bg-sky-700"
      >
        Voir et ajuster
      </Link>
    </div>
  );
}
