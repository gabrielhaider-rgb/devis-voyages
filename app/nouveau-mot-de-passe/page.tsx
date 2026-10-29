import type { Metadata } from "next";
import { updatePassword } from "@/app/compte/actions";
import { AccountForm } from "@/components/account-form";
import { AccountPage } from "@/components/account-page";

export const metadata: Metadata = { title: "Nouveau mot de passe — Devis voyages" };

export default function UpdatePasswordPage() {
  return (
    <AccountPage title="Nouveau mot de passe" description="Choisissez votre nouveau mot de passe.">
      <AccountForm
        action={updatePassword}
        submitLabel="Enregistrer le mot de passe"
        pendingLabel="Enregistrement…"
        fields={[
          { name: "password", label: "Nouveau mot de passe (6 caractères minimum)", type: "password", autoComplete: "new-password" },
          { name: "confirmation", label: "Confirmer le mot de passe", type: "password", autoComplete: "new-password" },
        ]}
      />
    </AccountPage>
  );
}
