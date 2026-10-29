import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { signUp } from "@/app/compte/actions";
import { AccountForm } from "@/components/account-form";
import { AccountPage } from "@/components/account-page";
import { safeNext } from "@/lib/safe-next";

export const metadata: Metadata = { title: "Créer un compte — Devis voyages" };

export default function SignUpPage({ searchParams }: PageProps<"/inscription">) {
  return (
    <AccountPage title="Créer un compte" description="Un compte vous permet d'enregistrer vos devis et de les retrouver.">
      <Suspense>
        <SignUpContent searchParams={searchParams} />
      </Suspense>
    </AccountPage>
  );
}

async function SignUpContent({ searchParams }: { searchParams: PageProps<"/inscription">["searchParams"] }) {
  const next = safeNext((await searchParams).next);

  return (
    <>
      <AccountForm
        action={signUp}
        next={next}
        submitLabel="Créer mon compte"
        pendingLabel="Création…"
        fields={[
          { name: "email", label: "Email", type: "email", autoComplete: "email" },
          { name: "password", label: "Mot de passe (6 caractères minimum)", type: "password", autoComplete: "new-password" },
          { name: "confirmation", label: "Confirmer le mot de passe", type: "password", autoComplete: "new-password" },
        ]}
      />
      <p className="mt-4 text-sm">
        Déjà un compte ?{" "}
        <Link href={`/connexion?next=${encodeURIComponent(next)}`} className="text-sky-600 hover:underline">
          Se connecter
        </Link>
      </p>
    </>
  );
}
