import Link from "next/link";
import { Suspense } from "react";
import { signOut } from "@/app/compte/actions";
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

  return (
    <nav className="flex items-center gap-4 text-sm">
      <span className="hidden text-foreground/60 sm:inline">{user.email}</span>
      <Link href="/mes-devis" className="font-medium hover:underline">
        Mes devis
      </Link>
      <form action={signOut}>
        <button type="submit" className="text-foreground/70 hover:underline">
          Se déconnecter
        </button>
      </form>
    </nav>
  );
}
