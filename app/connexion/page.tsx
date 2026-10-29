import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { signIn } from "@/app/compte/actions";
import { AccountForm } from "@/components/account-form";
import { AccountPage } from "@/components/account-page";
import { safeNext } from "@/lib/safe-next";

export const metadata: Metadata = { title: "Connexion — Devis voyages" };

export default function LoginPage({ searchParams }: PageProps<"/connexion">) {
  return (
    <AccountPage title="Connexion" description="Connectez-vous pour enregistrer et retrouver vos devis.">
      <Suspense>
        <LoginContent searchParams={searchParams} />
      </Suspense>
    </AccountPage>
  );
}

async function LoginContent({ searchParams }: { searchParams: PageProps<"/connexion">["searchParams"] }) {
  const params = await searchParams;
  // Sans page demandée, la destination dépend du rôle (voir signIn).
  const next = params.next ? safeNext(params.next) : undefined;
  const query = next ? `?next=${encodeURIComponent(next)}` : "";

  return (
    <>
      {params.erreur === "lien" && (
        <p role="alert" className="mb-4 text-sm text-red-600">
          Ce lien n&apos;est plus valide. Reconnectez-vous ou demandez un nouveau lien.
        </p>
      )}
      <AccountForm
        action={signIn}
        next={next}
        submitLabel="Se connecter"
        pendingLabel="Connexion…"
        fields={[
          { name: "email", label: "Email", type: "email", autoComplete: "email" },
          { name: "password", label: "Mot de passe", type: "password", autoComplete: "current-password" },
        ]}
      />
      <div className="mt-4 flex flex-col gap-2 text-sm">
        <Link href="/mot-de-passe-oublie" className="text-sky-600 hover:underline">
          Mot de passe oublié ?
        </Link>
        <p>
          Pas encore de compte ?{" "}
          <Link href={`/inscription${query}`} className="text-sky-600 hover:underline">
            Créer un compte
          </Link>
        </p>
      </div>
    </>
  );
}
