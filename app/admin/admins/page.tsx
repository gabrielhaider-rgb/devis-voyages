import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { setUserRole } from "@/app/admin/actions";
import { getProfiles, requireAdmin } from "@/lib/admin";

export const metadata: Metadata = { title: "Admins — Administration" };

export default function AdminsPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-12">
      <Suspense fallback={<p className="text-foreground/70">Chargement…</p>}>
        <ProfileList />
      </Suspense>
    </main>
  );
}

async function ProfileList() {
  const me = await requireAdmin("/admin/admins");
  const profiles = await getProfiles();

  return (
    <>
      <Link href="/admin" className="text-sm text-foreground/70 hover:underline">
        ← Catalogue
      </Link>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">Admins</h1>
      <p className="mt-2 text-sm text-foreground/70">
        Les admins gèrent le catalogue et nomment les autres admins. Vous ne pouvez pas retirer votre propre rôle.
      </p>

      <ul className="mt-6 flex flex-col gap-2">
        {profiles.map((profile) => {
          const isMe = profile.id === me.id;
          const isAdmin = profile.role === "admin";
          return (
            <li
              key={profile.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-foreground/15 p-3"
            >
              <span className="text-sm">
                {profile.email}
                {isMe && <span className="text-foreground/60"> (vous)</span>}
                {isAdmin && (
                  <span className="ml-2 rounded-full bg-sky-600/15 px-2 py-0.5 text-xs font-medium text-sky-700 dark:text-sky-400">
                    Admin
                  </span>
                )}
              </span>
              {!isMe && (
                <form action={setUserRole}>
                  <input type="hidden" name="id" value={profile.id} />
                  <input type="hidden" name="role" value={isAdmin ? "client" : "admin"} />
                  <button
                    type="submit"
                    className="rounded-lg border border-foreground/20 px-3 py-1.5 text-sm hover:border-foreground/40"
                  >
                    {isAdmin ? "Retirer le rôle admin" : "Nommer admin"}
                  </button>
                </form>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}
