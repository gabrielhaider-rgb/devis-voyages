import { Field, inputClass } from "@/components/admin/fields";

type TripValues = { slug: string; title: string; destination: string; durationDays: number; description: string };

// Champs communs à la création et à la modification d'un voyage.
export function TripFields({ trip }: { trip?: TripValues }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Titre">
        <input name="title" required defaultValue={trip?.title} placeholder="Porto, 3 jours" className={inputClass} />
      </Field>
      <Field label="Destination">
        <input name="destination" required defaultValue={trip?.destination} placeholder="Portugal" className={inputClass} />
      </Field>
      <Field label="Durée (jours)">
        <input name="duration_days" type="number" min={1} max={365} required defaultValue={trip?.durationDays} className={inputClass} />
      </Field>
      <Field label="Adresse de la page (vide = déduite du titre)">
        <input name="slug" defaultValue={trip?.slug} placeholder="porto-3-jours" className={inputClass} />
      </Field>
      <Field label="Description" className="sm:col-span-2">
        <textarea name="description" rows={3} defaultValue={trip?.description} className={inputClass} />
      </Field>
    </div>
  );
}
