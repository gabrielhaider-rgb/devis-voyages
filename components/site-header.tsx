import Link from "next/link";
import { Suspense } from "react";
import { signOut } from "@/app/compte/actions";
import { isAdmin } from "@/lib/admin";
import { getCurrentUser } from "@/lib/auth";

export function SiteHeader() {
  return (
    <header className="border-b border-foreground/10 print:hidden">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="font-semibold text-sky-600">
          Devis voyages
        </Link>
        <Suspense fallback={<span className="h-5" />}>
          <UserMenu />
        </Suspense>
      </div>
    </header>
  );
}

async function UserMenu() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <Link href="/connexion" className="text-sm hover:underline">
        Se connecter
      </Link>
    );
  }

  const admin = await isAdmin(user);

  return (
    <nav className="flex items-center gap-4 text-sm">
      {admin && (
        <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:text-amber-300">
          Administrateur
        </span>
      )}
      <span className="hidden text-foreground/60 sm:inline">{user.email}</span>
      {admin && (
        <Link href="/admin" className="font-medium hover:underline">
          Admin
        </Link>
      )}
      <Link href="/mes-devis" className="font-medium hover:underline">
        Mes devis
      </Link>
      <Link href="/mon-profil" className="hover:underline">
        Mon profil
      </Link>
      <form action={signOut}>
        <button type="submit" className="text-foreground/70 hover:underline">
          Se déconnecter
        </button>
      </form>
    </nav>
  );
}
