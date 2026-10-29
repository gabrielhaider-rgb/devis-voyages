import Link from "next/link";
import { Suspense } from "react";
import { isAdmin } from "@/lib/admin";
import { getCurrentUser } from "@/lib/auth";

export function SiteHeader() {
  return (
    <header className="print:hidden">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-5 sm:px-8">
        <Link href="/" className="font-display text-2xl font-semibold text-ink">
          Devis voyages
        </Link>
        <nav aria-label="Navigation principale" className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[15px]">
          <Link href="/#voyages" className="hidden hover:text-clay sm:inline">
            Destinations
          </Link>
          <Link href="/#accessibilite" className="hidden hover:text-clay sm:inline">
            Voyager accessible
          </Link>
          <Suspense fallback={<span className="h-11" />}>
            <UserMenu />
          </Suspense>
        </nav>
      </div>
    </header>
  );
}

const pill =
  "inline-flex min-h-11 items-center rounded-full border-[1.5px] border-ink px-4 font-medium hover:bg-ink hover:text-background";

async function UserMenu() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <Link href="/connexion" className={pill}>
        Se connecter
      </Link>
    );
  }

  const admin = await isAdmin(user);

  return (
    <>
      {admin && (
        <>
          <span className="rounded-full bg-clay/15 px-2.5 py-0.5 text-xs font-semibold text-clay-dark">Administrateur</span>
          <Link href="/admin" className="font-medium hover:text-clay">
            Admin
          </Link>
        </>
      )}
      {/* Un admin suit les devis dans l'administration : pas de « Mes devis » pour lui. */}
      {!admin && (
        <Link href="/mes-devis" className="font-medium hover:text-clay">
          Mes devis
        </Link>
      )}
      <Link href="/mon-profil" className="hover:text-clay" title={user.email ?? undefined}>
        Mon profil
      </Link>
      <form action="/auth/deconnexion" method="post">
        <button type="submit" className={pill}>
          Se déconnecter
        </button>
      </form>
    </>
  );
}
