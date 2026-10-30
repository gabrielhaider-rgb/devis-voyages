import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { updateProfile } from "@/app/compte/actions";
import { AccountForm } from "@/components/account-form";
import { AccountPage } from "@/components/account-page";
import { isAdmin } from "@/lib/admin";
import { getCurrentUser } from "@/lib/auth";
import { getMyProfile } from "@/lib/profile";

export const metadata: Metadata = { title: "Mon profil — Devis voyages" };

export default function MyProfilePage({ searchParams }: PageProps<"/mon-profil">) {
  return (
    <AccountPage title="Mon profil" description="Ces informations apparaissent sur vos devis enregistrés.">
      <Suspense fallback={<p className="text-foreground/70">Chargement…</p>}>
        <ProfileForm searchParams={searchParams} />
      </Suspense>
    </AccountPage>
  );
}

async function ProfileForm({ searchParams }: { searchParams: PageProps<"/mon-profil">["searchParams"] }) {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion?next=/mon-profil");
  const [profile, admin, { enregistre }] = await Promise.all([getMyProfile(user.id), isAdmin(user), searchParams]);

  // Juste après « Enregistrer » : une confirmation et le chemin vers la suite.
  if (enregistre === "1") {
    const firstName = profile?.firstName?.trim();
    return (
      <div role="status" className="flex flex-col gap-4">
        <p className="font-display text-2xl">C&apos;est enregistré{firstName ? `, ${firstName}` : ""} !</p>
        <p className="text-foreground/75">Vos informations apparaissent désormais sur vos devis.</p>
        <Link
          href={admin ? "/admin" : "/mes-devis"}
          className="rounded-full bg-clay px-4 py-3 text-center font-medium text-cream hover:bg-clay-dark"
        >
          {admin ? "Retour à l'administration" : "Voir mes devis"}
        </Link>
        <Link href="/mon-profil" className="text-center text-sm text-clay hover:underline">
          Modifier à nouveau mon profil
        </Link>
      </div>
    );
  }

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
