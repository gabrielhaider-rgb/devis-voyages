import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AdminHeader } from "@/components/admin/admin-header";
import { inputClass } from "@/components/admin/fields";
import { requireAdmin } from "@/lib/admin";
import { getClients } from "@/lib/admin-quotes";
import { formatPrice } from "@/lib/price";

export const metadata: Metadata = { title: "Clients — Administration" };

const joinedOn = new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeZone: "Europe/Paris" });

export default function ClientsPage({ searchParams }: PageProps<"/admin/clients">) {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-12">
      <Suspense fallback={<p className="text-foreground/70">Chargement…</p>}>
        <ClientList searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function ClientList({ searchParams }: { searchParams: PageProps<"/admin/clients">["searchParams"] }) {
  await requireAdmin("/admin/clients");
  const { q } = await searchParams;
  const search = typeof q === "string" ? q : "";
  const clients = await getClients(search);

  return (
    <>
      <AdminHeader active="clients" />
      <h1 className="text-3xl font-semibold tracking-tight">Clients</h1>

      <form role="search" className="mt-6 flex max-w-md gap-2">
        <label htmlFor="q" className="sr-only">
          Rechercher un client
        </label>
        <input id="q" name="q" type="search" defaultValue={search} placeholder="Nom ou email" className={inputClass} />
        <button type="submit" className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700">
          Rechercher
        </button>
      </form>
      {search && (
        <p className="mt-2 text-sm text-foreground/70">
          {clients.length} résultat{clients.length > 1 ? "s" : ""} pour « {search} » ·{" "}
          <Link href="/admin/clients" className="text-sky-600 hover:underline">
            Tout afficher
          </Link>
        </p>
      )}

      {clients.length === 0 ? (
        <p className="mt-6 text-foreground/70">Aucun client.</p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[40rem] text-sm">
            <thead>
              <tr className="border-b border-foreground/15 text-left text-foreground/70">
                <th className="pb-2 font-medium">Client</th>
                <th className="pb-2 font-medium">Email</th>
                <th className="pb-2 font-medium">Téléphone</th>
                <th className="pb-2 font-medium">Inscription</th>
                <th className="pb-2 text-right font-medium">Devis</th>
                <th className="pb-2 text-right font-medium">Montant total</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id} className="border-b border-foreground/10 hover:bg-foreground/5">
                  <td className="py-2 pr-3">
                    <Link href={`/admin/clients/${client.id}`} className="text-sky-600 hover:underline">
                      {client.name}
                    </Link>
                  </td>
                  <td className="py-2 pr-3">{client.email}</td>
                  <td className="py-2 pr-3 whitespace-nowrap">{client.phone ?? "—"}</td>
                  <td className="py-2 pr-3 whitespace-nowrap">{joinedOn.format(client.createdAt)}</td>
                  <td className="py-2 pr-3 text-right">{client.quoteCount}</td>
                  <td className="py-2 text-right whitespace-nowrap">{formatPrice(client.quoteTotalCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
