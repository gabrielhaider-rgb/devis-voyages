import Link from "next/link";

const TABS = [
  { key: "catalogue", label: "Catalogue", href: "/admin" },
  { key: "devis", label: "Devis", href: "/admin/devis" },
  { key: "clients", label: "Clients", href: "/admin/clients" },
  { key: "admins", label: "Admins", href: "/admin/admins" },
] as const;

export type AdminTab = (typeof TABS)[number]["key"];

// En-tête des pages d'administration : rappel du mode admin et onglets.
// À n'afficher qu'après requireAdmin(), pour qu'un non-admin ne le voie jamais.
export function AdminHeader({ active }: { active: AdminTab }) {
  return (
    <div className="mb-8">
      <p
        role="status"
        className="mb-4 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-900 dark:text-amber-200"
      >
        Vous êtes connecté en tant qu&apos;<strong>administrateur</strong>. Les modifications du catalogue
        s&apos;appliquent immédiatement au site public.
      </p>
      <nav aria-label="Administration" className="flex gap-1 overflow-x-auto border-b border-foreground/10">
        {TABS.map((tab) => (
          <Link
            key={tab.key}
            href={tab.href}
            aria-current={tab.key === active ? "page" : undefined}
            className={`-mb-px border-b-2 px-4 py-2 text-sm whitespace-nowrap ${
              tab.key === active
                ? "border-sky-600 font-medium text-sky-700 dark:text-sky-400"
                : "border-transparent text-foreground/70 hover:text-foreground"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
