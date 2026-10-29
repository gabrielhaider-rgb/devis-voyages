import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { setUserRole } from "@/app/admin/actions";
import { ConfirmButton } from "@/components/admin/action-form";
import { AdminHeader } from "@/components/admin/admin-header";
import { requireAdmin } from "@/lib/admin";
import { getAdmins } from "@/lib/admin-quotes";

export const metadata: Metadata = { title: "Admins — Administration" };

const since = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: "Europe/Paris" });

export default function AdminsPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-12">
      <Suspense fallback={<p className="text-foreground/70">Chargement…</p>}>
        <AdminList />
      </Suspense>
    </main>
  );
}

async function AdminList() {
  const me = await requireAdmin("/admin/admins");
  const admins = await getAdmins();

  return (
    <>
      <AdminHeader active="admins" />
      <h1 className="text-3xl font-semibold tracking-tight">Admins</h1>
      <p className="mt-2 text-sm text-foreground/70">
        Pour nommer un admin, ouvrez sa fiche dans l&apos;onglet{" "}
        <Link href="/admin/clients" className="text-sky-600 hover:underline">
          Clients
        </Link>
        . Vous ne pouvez pas retirer votre propre rôle.
      </p>

      <ul className="mt-6 flex flex-col gap-2">
        {admins.map((admin) => {
          const isMe = admin.id === me.id;
          return (
            <li key={admin.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-foreground/15 p-3">
              <span className="text-sm">
                <span className="font-medium">{admin.name}</span>
                {isMe && <span className="text-foreground/60"> (vous)</span>}
                <span className="block text-foreground/70">{admin.email}</span>
                {admin.adminSince && (
                  <span className="block text-xs text-foreground/60">Admin depuis le {since.format(admin.adminSince)}</span>
                )}
              </span>
              {!isMe && (
                <form action={setUserRole}>
                  <input type="hidden" name="id" value={admin.id} />
                  <input type="hidden" name="role" value="client" />
                  <ConfirmButton question={`Retirer le rôle admin de ${admin.name} ?`}>Retirer le rôle admin</ConfirmButton>
                </form>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}
