import type { Metadata } from "next";
import Link from "next/link";
import { sendPasswordReset } from "@/app/compte/actions";
import { AccountForm } from "@/components/account-form";
import { AccountPage } from "@/components/account-page";

export const metadata: Metadata = { title: "Mot de passe oublié — Devis voyages" };

export default function ForgotPasswordPage() {
  return (
    <AccountPage
      title="Mot de passe oublié"
      description="Indiquez votre email : vous recevrez un lien pour choisir un nouveau mot de passe."
    >
      <AccountForm
        action={sendPasswordReset}
        submitLabel="Envoyer le lien"
        pendingLabel="Envoi…"
        fields={[{ name: "email", label: "Email", type: "email", autoComplete: "email" }]}
      />
      <Link href="/connexion" className="mt-4 inline-block text-sm text-clay hover:underline">
        ← Retour à la connexion
      </Link>
    </AccountPage>
  );
}
