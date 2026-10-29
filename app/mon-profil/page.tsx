import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { updateProfile } from "@/app/compte/actions";
import { AccountForm } from "@/components/account-form";
import { AccountPage } from "@/components/account-page";
import { getCurrentUser } from "@/lib/auth";
import { getMyProfile } from "@/lib/profile";

export const metadata: Metadata = { title: "Mon profil — Devis voyages" };

export default function MyProfilePage() {
  return (
    <AccountPage title="Mon profil" description="Ces informations apparaissent sur vos devis enregistrés.">
      <Suspense fallback={<p className="text-foreground/70">Chargement…</p>}>
        <ProfileForm />
      </Suspense>
    </AccountPage>
  );
}

async function ProfileForm() {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion?next=/mon-profil");
  const profile = await getMyProfile(user.id);

  return (
    <>
      <p className="mb-4 text-sm text-foreground/70">Email : {profile?.email ?? user.email}</p>
      <AccountForm
        action={updateProfile}
        submitLabel="Enregistrer"
        pendingLabel="Enregistrement…"
        fields={[
          { name: "first_name", label: "Prénom", type: "text", autoComplete: "given-name", defaultValue: profile?.firstName ?? "" },
          { name: "last_name", label: "Nom", type: "text", autoComplete: "family-name", defaultValue: profile?.lastName ?? "" },
          { name: "phone", label: "Téléphone (facultatif)", type: "tel", autoComplete: "tel", optional: true, defaultValue: profile?.phone ?? "" },
        ]}
      />
    </>
  );
}
