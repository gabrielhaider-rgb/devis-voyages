"use client";

import type { ReactNode } from "react";

// Ouvre la bulle de l'assistant (qui écoute cet évènement), depuis n'importe quel bouton de la page.
export const OPEN_ASSISTANT_EVENT = "devis-voyages:ouvrir-assistant";

export function OpenAssistantButton({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <button type="button" onClick={() => window.dispatchEvent(new Event(OPEN_ASSISTANT_EVENT))} className={className}>
      {children}
    </button>
  );
}
