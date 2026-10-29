import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getAdminTrips, requireAdmin } from "@/lib/admin";

export const metadata: Metadata = { title: "Administration — Devis voyages" };

export default function AdminPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-12">
      <Suspense fallback={<p className="text-foreground/70">Chargement…</p>}>
        <TripList />
      </Suspense>
    </main>
  );
}

async function TripList() {
  await requireAdmin();
  const trips = await getAdminTrips();

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">Catalogue</h1>
        <div className="flex gap-3 text-sm">
          <Link href="/admin/admins" className="rounded-lg border border-foreground/15 px-4 py-2 hover:border-foreground/30">
            Admins
          </Link>
          <Link href="/admin/voyages/nouveau" className="rounded-lg bg-sky-600 px-4 py-2 font-medium text-white hover:bg-sky-700">
            Nouveau voyage
          </Link>
        </div>
      </div>

      <ul className="mt-6 flex flex-col gap-3">
        {trips.map((trip) => (
          <li key={trip.id}>
            <Link
              href={`/admin/voyages/${trip.id}`}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-foreground/15 p-4 hover:border-foreground/30"
            >
              <span>
                <span className="block font-medium">{trip.title}</span>
                <span className="block text-sm text-foreground/70">
                  {trip.destination} · {trip.departureCount} départ{trip.departureCount > 1 ? "s" : ""} ·{" "}
                  {trip.optionCount} option{trip.optionCount > 1 ? "s" : ""}
                </span>
              </span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  trip.archived ? "bg-foreground/10 text-foreground/70" : "bg-green-600/15 text-green-700 dark:text-green-400"
                }`}
              >
                {trip.archived ? "Archivé" : "En ligne"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
