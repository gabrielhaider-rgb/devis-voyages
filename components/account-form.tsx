"use client";

import { useActionState } from "react";
import type { FormState } from "@/app/compte/actions";

type Field = {
  name: string;
  label: string;
  type: "email" | "password";
  autoComplete: string;
};

export function AccountForm({
  action,
  fields,
  submitLabel,
  pendingLabel,
  next,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  fields: Field[];
  submitLabel: string;
  pendingLabel: string;
  next?: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {next && <input type="hidden" name="next" value={next} />}
      {fields.map((field) => (
        <div key={field.name} className="flex flex-col gap-1">
          <label htmlFor={field.name} className="text-sm font-medium">
            {field.label}
          </label>
          <input
            id={field.name}
            name={field.name}
            type={field.type}
            autoComplete={field.autoComplete}
            required
            minLength={field.type === "password" ? 6 : undefined}
            className="rounded-lg border border-foreground/15 bg-background p-3"
          />
        </div>
      ))}
      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}
      {state.message && (
        <p role="status" className="text-sm text-sky-700 dark:text-sky-400">
          {state.message}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-sky-600 px-4 py-3 font-medium text-white hover:bg-sky-700 disabled:opacity-60"
      >
        {pending ? pendingLabel : submitLabel}
      </button>
    </form>
  );
}
