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
  const requested = (await searchParams).next;
  // Sans page demandée, le nouveau compte arrive sur l'accueil (voir signUp).
  const next = requested ? safeNext(requested) : undefined;

  return (
    <>
      <AccountForm
        action={signUp}
        next={next}
        submitLabel="Créer mon compte"
        pendingLabel="Création…"
        fields={[
          { name: "first_name", label: "Prénom", type: "text", autoComplete: "given-name" },
          { name: "last_name", label: "Nom", type: "text", autoComplete: "family-name" },
          { name: "phone", label: "Téléphone (facultatif, pour que l'agence puisse vous rappeler)", type: "tel", autoComplete: "tel", optional: true },
          { name: "email", label: "Email", type: "email", autoComplete: "email" },
          { name: "password", label: "Mot de passe (6 caractères minimum)", type: "password", autoComplete: "new-password" },
          { name: "confirmation", label: "Confirmer le mot de passe", type: "password", autoComplete: "new-password" },
        ]}
      />
      <p className="mt-4 text-sm">
        Déjà un compte ?{" "}
        <Link href={next ? `/connexion?next=${encodeURIComponent(next)}` : "/connexion"} className="text-clay hover:underline">
          Se connecter
        </Link>
      </p>
    </>
  );
}
