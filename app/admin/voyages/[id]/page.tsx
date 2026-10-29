import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  addDeparture,
  addOption,
  deleteDeparture,
  deleteOption,
  setTripArchived,
  updateDeparture,
  updateOption,
  updateTrip,
} from "@/app/admin/actions";
import { AdminHeader } from "@/components/admin/admin-header";
import { ActionForm, ConfirmButton, SubmitButton } from "@/components/admin/action-form";
import { Field, inputClass } from "@/components/admin/fields";
import { TripFields } from "@/components/admin/trip-fields";
import { getAdminTrip, requireAdmin, type AdminTrip } from "@/lib/admin";
import { centsToInput } from "@/lib/admin-validation";
import type { TripOption } from "@/lib/catalogue";

export const metadata: Metadata = { title: "Modifier un voyage — Administration" };

export default function EditTripPage({ params }: PageProps<"/admin/voyages/[id]">) {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:py-12">
      <Suspense fallback={<p className="text-foreground/70">Chargement…</p>}>
        {params.then(({ id }) => (
          <EditTrip id={id} />
        ))}
      </Suspense>
    </main>
  );
}

async function EditTrip({ id }: { id: string }) {
  await requireAdmin(`/admin/voyages/${id}`);
  const trip = await getAdminTrip(id);
  if (!trip) notFound();

  return (
    <>
      <AdminHeader active="catalogue" />
      <Link href="/admin" className="text-sm text-foreground/70 hover:underline">
        ← Catalogue
      </Link>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">{trip.title}</h1>
        <ArchiveButton trip={trip} />
      </div>
      {!trip.archived && (
        <Link href={`/voyages/${trip.slug}`} className="mt-1 inline-block text-sm text-sky-600 hover:underline">
          Voir la page sur le site →
        </Link>
      )}

      <Section title="Informations">
        <ActionForm action={updateTrip} className="flex flex-col gap-4">
          <input type="hidden" name="id" value={trip.id} />
          <TripFields trip={trip} />
          <div>
            <SubmitButton>Enregistrer</SubmitButton>
          </div>
        </ActionForm>
      </Section>

      <Section title="Départs" hint="Prix par personne, en euros.">
        <div className="flex flex-col gap-3">
          {trip.departures.map((departure) => (
            <div key={departure.id} className="flex flex-wrap items-end gap-3 rounded-lg border border-foreground/10 p-3">
              <ActionForm action={updateDeparture} className="flex flex-1 flex-wrap items-end gap-3">
                <input type="hidden" name="id" value={departure.id} />
                <Field label="Date">
                  <input name="departure_date" type="date" required defaultValue={departure.date} className={inputClass} />
                </Field>
                <Field label="Prix / pers. (€)">
                  <input name="price" inputMode="decimal" required defaultValue={centsToInput(departure.pricePerPersonCents)} className={inputClass} />
                </Field>
                <SubmitButton>Enregistrer</SubmitButton>
              </ActionForm>
              <form action={deleteDeparture}>
                <input type="hidden" name="id" value={departure.id} />
                <ConfirmButton question="Supprimer ce départ ? Les devis déjà enregistrés ne sont pas modifiés.">
                  Supprimer
                </ConfirmButton>
              </form>
            </div>
          ))}
          <ActionForm action={addDeparture} className="flex flex-wrap items-end gap-3 rounded-lg border border-dashed border-foreground/20 p-3">
            <input type="hidden" name="trip_id" value={trip.id} />
            <Field label="Nouvelle date">
              <input name="departure_date" type="date" required className={inputClass} />
            </Field>
            <Field label="Prix / pers. (€)">
              <input name="price" inputMode="decimal" required placeholder="650" className={inputClass} />
            </Field>
            <SubmitButton pendingLabel="Ajout…">Ajouter le départ</SubmitButton>
          </ActionForm>
        </div>
      </Section>

      <Section
        title="Options"
        hint="Prix en euros ; 0 = prestation incluse (affichée sans case à cocher). Deux options avec le même groupe non cumulable s'excluent (ex. « transfert »)."
      >
        <div className="flex flex-col gap-3">
          {trip.options.map((option) => (
            <div key={option.id} className="flex flex-col gap-3 rounded-lg border border-foreground/10 p-3">
              <ActionForm action={updateOption} className="flex flex-wrap items-end gap-3">
                <input type="hidden" name="id" value={option.id} />
                <OptionFields option={option} />
                <SubmitButton>Enregistrer</SubmitButton>
              </ActionForm>
              <form action={deleteOption}>
                <input type="hidden" name="id" value={option.id} />
                <ConfirmButton question={`Supprimer l'option « ${option.label} » ? Les devis déjà enregistrés ne sont pas modifiés.`}>
                  Supprimer
                </ConfirmButton>
              </form>
            </div>
          ))}
          <ActionForm action={addOption} className="flex flex-wrap items-end gap-3 rounded-lg border border-dashed border-foreground/20 p-3">
            <input type="hidden" name="trip_id" value={trip.id} />
            <OptionFields />
            <SubmitButton pendingLabel="Ajout…">Ajouter l&apos;option</SubmitButton>
          </ActionForm>
        </div>
      </Section>
    </>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-xl font-semibold">{title}</h2>
      {hint && <p className="mt-1 text-sm text-foreground/70">{hint}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function ArchiveButton({ trip }: { trip: AdminTrip }) {
  const canPublish = trip.departures.length > 0;
  return (
    <form action={setTripArchived} className="flex items-center gap-3">
      <input type="hidden" name="id" value={trip.id} />
      <input type="hidden" name="archive" value={String(!trip.archived)} />
      <span
        className={`rounded-full px-3 py-1 text-xs font-medium ${
          trip.archived ? "bg-foreground/10 text-foreground/70" : "bg-green-600/15 text-green-700 dark:text-green-400"
        }`}
      >
        {trip.archived ? "Archivé" : "En ligne"}
      </span>
      {trip.archived ? (
        <button
          type="submit"
          disabled={!canPublish}
          title={canPublish ? undefined : "Ajoutez au moins un départ avant de publier."}
          className="rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800 disabled:opacity-50"
        >
          Publier sur le site
        </button>
      ) : (
        <button type="submit" className="rounded-lg border border-foreground/20 px-4 py-2 text-sm hover:border-foreground/40">
          Archiver
        </button>
      )}
    </form>
  );
}

function OptionFields({ option }: { option?: TripOption }) {
  return (
    <>
      <Field label="Libellé" className="min-w-48 flex-1">
        <input name="label" required defaultValue={option?.label} placeholder="Transfert aéroport" className={inputClass} />
      </Field>
      <Field label="Prix (€)" className="w-24">
        <input
          name="price"
          inputMode="decimal"
          required
          defaultValue={option ? centsToInput(option.priceCents) : undefined}
          placeholder="60"
          className={inputClass}
        />
      </Field>
      <Field label="Type de prix">
        <select name="pricing_type" defaultValue={option?.pricingType ?? "fixed"} className={inputClass}>
          <option value="fixed">Forfait</option>
          <option value="per_person">Par personne</option>
        </select>
      </Field>
      <Field label="Catégorie">
        <select name="category" defaultValue={option?.category ?? "standard"} className={inputClass}>
          <option value="standard">Option</option>
          <option value="accessibility">Accessibilité</option>
        </select>
      </Field>
      <Field label="Groupe non cumulable" className="w-40">
        <input name="exclusive_group" defaultValue={option?.exclusiveGroup ?? ""} placeholder="(aucun)" className={inputClass} />
      </Field>
    </>
  );
}
