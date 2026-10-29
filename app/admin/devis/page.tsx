import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AdminHeader } from "@/components/admin/admin-header";
import { MonthlyChart } from "@/components/admin/monthly-chart";
import { requireAdmin } from "@/lib/admin";
import { getAllQuotes } from "@/lib/admin-quotes";
import { computeDashboard } from "@/lib/admin-stats";
import { formatPrice } from "@/lib/price";

export const metadata: Metadata = { title: "Devis — Administration" };

export default function QuotesDashboardPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-12">
      <Suspense fallback={<p className="text-foreground/70">Chargement…</p>}>
        <QuotesDashboard />
      </Suspense>
    </main>
  );
}

async function QuotesDashboard() {
  await requireAdmin("/admin/devis");
  const quotes = await getAllQuotes();
  const dashboard = computeDashboard(quotes, new Date());

  return (
    <>
      <AdminHeader active="devis" />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">Tableau de bord des devis</h1>
        <Link href="/admin/devis/liste" className="rounded-lg border border-foreground/15 px-4 py-2 text-sm hover:border-foreground/30">
          Voir la liste des devis
        </Link>
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Devis enregistrés" value={String(dashboard.count)} />
        <Stat label="Montant total" value={formatPrice(dashboard.totalCents)} />
        <Stat label="Montant moyen" value={formatPrice(dashboard.averageCents)} />
        <Stat
          label="Avec accessibilité payante"
          value={`${dashboard.accessibility.percent} %`}
          detail={`${dashboard.accessibility.count} devis sur ${dashboard.count}`}
        />
      </dl>
      <p className="mt-2 text-xs text-foreground/60">
        Les devis enregistrés avant la V4 sont comptés sans accessibilité payante (information non enregistrée à l&apos;époque).
      </p>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Devis par mois (12 derniers mois)</h2>
        <div className="mt-4 rounded-xl border border-foreground/15 p-4">
          <MonthlyChart months={dashboard.byMonth} />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Devis par voyage</h2>
        {dashboard.byTrip.length === 0 ? (
          <p className="mt-4 text-foreground/70">Aucun devis enregistré pour le moment.</p>
        ) : (
          <table className="mt-4 w-full text-sm">
            <thead>
              <tr className="border-b border-foreground/15 text-left text-foreground/70">
                <th className="pb-2 font-medium">Voyage</th>
                <th className="pb-2 text-right font-medium">Devis</th>
                <th className="pb-2 text-right font-medium">Montant total</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.byTrip.map((trip) => (
                <tr key={trip.tripTitle} className="border-b border-foreground/10">
                  <td className="py-2">{trip.tripTitle}</td>
                  <td className="py-2 text-right">{trip.count}</td>
                  <td className="py-2 text-right whitespace-nowrap">{formatPrice(trip.totalCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}

function Stat({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="rounded-xl border border-foreground/15 p-4">
      <dt className="text-sm text-foreground/70">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold">{value}</dd>
      {detail && <dd className="text-xs text-foreground/60">{detail}</dd>}
    </div>
  );
}
