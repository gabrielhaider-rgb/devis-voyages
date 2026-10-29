import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { setUserRole } from "@/app/admin/actions";
import { ConfirmButton } from "@/components/admin/action-form";
import { AdminHeader } from "@/components/admin/admin-header";
import { QuoteTable } from "@/components/admin/quote-table";
import { requireAdmin } from "@/lib/admin";
import { getAllQuotes, getClient } from "@/lib/admin-quotes";
import { formatPrice } from "@/lib/price";

export const metadata: Metadata = { title: "Fiche client — Administration" };

const joinedOn = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: "Europe/Paris" });

export default function ClientPage({ params }: PageProps<"/admin/clients/[id]">) {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-12">
      <Suspense fallback={<p className="text-foreground/70">Chargement…</p>}>
        {params.then(({ id }) => (
          <ClientDetail id={id} />
        ))}
      </Suspense>
    </main>
  );
}

async function ClientDetail({ id }: { id: string }) {
  await requireAdmin(`/admin/clients/${id}`);
  const [client, quotes] = await Promise.all([getClient(id), getAllQuotes(id)]);
  if (!client) notFound();
  const total = quotes.reduce((sum, q) => sum + q.totalCents, 0);

  return (
    <>
      <AdminHeader active="clients" />
      <Link href="/admin/clients" className="text-sm text-foreground/70 hover:underline">
        ← Clients
      </Link>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{client.name}</h1>
          <p className="mt-2 text-sm">
            <a href={`mailto:${client.email}`} className="text-clay hover:underline">
              {client.email}
            </a>
            {" · "}
            {client.phone ? (
              <a href={`tel:${client.phone.replace(/[^\d+]/g, "")}`} className="text-clay hover:underline">
                {client.phone}
              </a>
            ) : (
              <span className="text-foreground/75">pas de téléphone</span>
            )}
          </p>
          <p className="text-sm text-foreground/70">Inscrit le {joinedOn.format(client.createdAt)}</p>
        </div>
        {client.role === "client" && (
          <form action={setUserRole}>
            <input type="hidden" name="id" value={client.id} />
            <input type="hidden" name="role" value="admin" />
            <ConfirmButton question={`Nommer ${client.name} administrateur ? Il pourra modifier le catalogue et voir tous les devis.`}>
              Nommer admin
            </ConfirmButton>
          </form>
        )}
      </div>

      <h2 className="mt-10 text-xl font-semibold">
        Devis ({quotes.length}) · {formatPrice(total)}
      </h2>
      <QuoteTable quotes={quotes} showClient={false} />
    </>
  );
}
