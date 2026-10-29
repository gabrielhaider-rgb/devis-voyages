import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AdminHeader } from "@/components/admin/admin-header";
import { QuoteTable } from "@/components/admin/quote-table";
import { requireAdmin } from "@/lib/admin";
import { getAllQuotes } from "@/lib/admin-quotes";

export const metadata: Metadata = { title: "Liste des devis — Administration" };

export default function QuoteListPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-12">
      <Suspense fallback={<p className="text-foreground/70">Chargement…</p>}>
        <QuoteList />
      </Suspense>
    </main>
  );
}

async function QuoteList() {
  await requireAdmin("/admin/devis/liste");
  const quotes = await getAllQuotes();
  return (
    <>
      <AdminHeader active="devis" />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">Liste des devis</h1>
        <Link href="/admin/devis" className="rounded-lg border border-sand-deep px-4 py-2 text-sm hover:border-foreground/30">
          Tableau de bord
        </Link>
      </div>
      <QuoteTable quotes={quotes} />
    </>
  );
}
