"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "@/lib/assistant/agent";
import type { Proposal } from "@/lib/assistant/configuration";
import { MAX_MESSAGE_LENGTH } from "@/lib/assistant/limits";
import { OPEN_ASSISTANT_EVENT } from "@/components/open-assistant-button";
import { useDictation, useSpeech } from "@/components/use-voice";
import { formatPrice, formatShortDate } from "@/lib/price";

type Entry = ChatMessage & { proposal?: Proposal | null };

// Pages où la bulle n'a pas sa place : administration et pages de compte
// (connexion, inscription, mot de passe, profil), pour ne pas gêner les formulaires.
const HIDDEN_ON = ["/admin", "/connexion", "/inscription", "/mot-de-passe-oublie", "/nouveau-mot-de-passe", "/mon-profil"];

const GREETING =
  "Bonjour ! Je peux vous aider à choisir un voyage et à préparer votre devis. Où aimeriez-vous partir, et à combien ?";

// Bulle de discussion avec l'assistant, présente sur les pages du parcours de voyage.
export function AssistantBubble() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const speech = useSpeech();
  // Une phrase dictée part directement, et sa réponse est lue à voix haute.
  const dictation = useDictation((text) => send(text, true));

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [entries, pending, open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // « Me faire conseiller » (accueil) ouvre la bulle.
  useEffect(() => {
    const openBubble = () => setOpen(true);
    window.addEventListener(OPEN_ASSISTANT_EVENT, openBubble);
    return () => window.removeEventListener(OPEN_ASSISTANT_EVENT, openBubble);
  }, []);

  if (HIDDEN_ON.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) return null;

  function close() {
    dictation.stop();
    speech.cancel();
    setOpen(false);
  }

  async function send(spoken?: string, viaVoice = false) {
    const text = (spoken ?? input).trim();
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
      if (viaVoice && !muted) speech.speak(data.reply);
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
          className="flex h-[min(32rem,calc(100dvh-6rem))] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-sand-deep bg-cream shadow-xl"
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
                  className="text-foreground/75 hover:underline"
                >
                  Nouvelle conversation
                </button>
              )}
              {speech.supported && (
                <button
                  type="button"
                  onClick={() => {
                    if (!muted) speech.cancel();
                    setMuted(!muted);
                  }}
                  aria-pressed={!muted}
                  aria-label={muted ? "Activer la lecture à voix haute" : "Couper la lecture à voix haute"}
                  title={muted ? "Lecture à voix haute coupée" : "Réponses lues à voix haute après une dictée"}
                  className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-foreground/5"
                >
                  <SpeakerIcon muted={muted} />
                </button>
              )}
              <button type="button" onClick={close} aria-label="Fermer l'assistant" className="text-lg leading-none">
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
            {pending && <p className="text-foreground/75">L&apos;assistant réfléchit…</p>}
            {speech.speaking && (
              <button type="button" onClick={speech.cancel} className="self-start text-sm text-clay hover:underline">
                Arrêter la lecture
              </button>
            )}
            {(error || dictation.error) && (
              <p role="alert" className="text-red-700">
                {error ?? dictation.error}
              </p>
            )}
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              send();
            }}
            className="flex items-end gap-2 border-t border-foreground/10 p-3"
          >
            <label htmlFor="assistant-input" className="sr-only">
              Votre message
            </label>
            <textarea
              id="assistant-input"
              ref={inputRef}
              rows={2}
              maxLength={MAX_MESSAGE_LENGTH}
              value={dictation.listening ? dictation.interim : input}
              readOnly={dictation.listening}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder={dictation.listening ? "Je vous écoute…" : "Ex. : 2 adultes, Lisbonne en mai"}
              className="flex-1 resize-none rounded-lg border border-sand-deep bg-cream p-2"
            />
            {dictation.supported && (
              <button
                type="button"
                onClick={dictation.listening ? dictation.stop : dictation.start}
                disabled={pending}
                aria-pressed={dictation.listening}
                aria-label={dictation.listening ? "Arrêter la dictée" : "Dicter mon message"}
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-[1.5px] disabled:opacity-50 ${
                  dictation.listening ? "animate-pulse border-clay bg-clay text-cream" : "border-foreground/30 hover:border-foreground"
                }`}
              >
                <MicIcon />
              </button>
            )}
            <button
              type="submit"
              disabled={pending || dictation.listening || !input.trim()}
              className="rounded-full bg-clay px-3 py-2 font-medium text-cream hover:bg-clay-dark disabled:opacity-50"
            >
              Envoyer
            </button>
          </form>
          <p className="px-3 pb-2 text-[11px] text-foreground/75">
            Réponses générées par une IA : vérifiez la configuration avant d&apos;ouvrir votre devis.
            {dictation.supported &&
              " La dictée utilise la reconnaissance vocale de votre navigateur (sur Chrome, elle passe par les serveurs de Google)."}
          </p>
        </section>
      )}

      <button
        type="button"
        onClick={() => (open ? close() : setOpen(true))}
        aria-expanded={open}
        className="rounded-full bg-clay px-5 py-3 font-medium text-cream shadow-lg hover:bg-clay-dark"
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
        role === "user" ? "self-end bg-clay text-cream" : "self-start bg-foreground/5"
      }`}
    >
      {children}
    </p>
  );
}

function ProposalCard({ proposal }: { proposal: Proposal }) {
  return (
    <div className="self-start rounded-xl border border-clay/40 p-3">
      <p className="font-medium">{proposal.tripTitle}</p>
      <p className="text-foreground/70">
        Départ le {formatShortDate(proposal.departureDate)} · {proposal.travelers} voyageur
        {proposal.travelers > 1 ? "s" : ""}
      </p>
      {proposal.options.length > 0 && <p className="text-foreground/70">{proposal.options.join(", ")}</p>}
      <p className="mt-1 font-semibold">{formatPrice(proposal.totalCents)}</p>
      <Link
        href={proposal.configureUrl}
        className="mt-2 inline-block rounded-full bg-clay px-3 py-1.5 font-medium text-cream hover:bg-clay-dark"
      >
        Voir et ajuster
      </Link>
    </div>
  );
}

function MicIcon() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
    </svg>
  );
}

function SpeakerIcon({ muted }: { muted: boolean }) {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 9v6h4l5 4V5L8 9H4z" />
      {muted ? <path d="M17 9l4 6M21 9l-4 6" /> : <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" />}
    </svg>
  );
}
