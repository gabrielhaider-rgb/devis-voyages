"use client";

import { useActionState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import type { FormState } from "@/app/compte/actions";

// Formulaire d'administration : affiche l'erreur ou la confirmation renvoyée par l'action.
export function ActionForm({
  action,
  children,
  className,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  children: ReactNode;
  className?: string;
}) {
  const [state, formAction] = useActionState(action, {});

  return (
    <form action={formAction} className={className}>
      {children}
      {state.error && (
        <p role="alert" className="basis-full text-sm text-red-600">
          {state.error}
        </p>
      )}
      {state.message && (
        <p role="status" className="basis-full text-sm text-green-700">
          {state.message}
        </p>
      )}
    </form>
  );
}

export function SubmitButton({ children, pendingLabel = "Enregistrement…" }: { children: ReactNode; pendingLabel?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-clay px-4 py-2 text-sm font-medium text-cream hover:bg-clay-dark disabled:opacity-60"
    >
      {pending ? pendingLabel : children}
    </button>
  );
}

// Bouton qui demande confirmation avant d'envoyer son formulaire (suppressions).
export function ConfirmButton({ children, question }: { children: ReactNode; question: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(event) => {
        if (!window.confirm(question)) event.preventDefault();
      }}
      className="rounded-lg border border-red-600/40 px-3 py-2 text-sm text-red-700 hover:bg-red-600/10 disabled:opacity-60"
    >
      {children}
    </button>
  );
}
