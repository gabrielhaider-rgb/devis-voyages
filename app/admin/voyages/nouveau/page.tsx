import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { createTrip } from "@/app/admin/actions";
import { AdminHeader } from "@/components/admin/admin-header";
import { ActionForm, SubmitButton } from "@/components/admin/action-form";
import { TripFields } from "@/components/admin/trip-fields";
import { requireAdmin } from "@/lib/admin";

export const metadata: Metadata = { title: "Nouveau voyage — Administration" };

export default function NewTripPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-12">
      <Suspense fallback={<p className="text-foreground/70">Chargement…</p>}>
        <NewTrip />
      </Suspense>
    </main>
  );
}

async function NewTrip() {
  await requireAdmin("/admin/voyages/nouveau");
  return (
    <>
      <AdminHeader active="catalogue" />
      <Link href="/admin" className="text-sm text-foreground/70 hover:underline">
        ← Catalogue
      </Link>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">Nouveau voyage</h1>
      <p className="mt-2 text-sm text-foreground/70">
        Le voyage reste archivé (invisible sur le site) jusqu&apos;à ce que vous le publiiez, une fois ses départs ajoutés.
      </p>
      <ActionForm action={createTrip} className="mt-6 flex flex-col gap-4">
        <TripFields />
        <div>
          <SubmitButton>Créer le voyage</SubmitButton>
        </div>
      </ActionForm>
    </>
  );
}
