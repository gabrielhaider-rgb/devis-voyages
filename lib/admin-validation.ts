// Validation des formulaires d'administration (sans accès à la base : testable).

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

// "650", "650,50", "1 200" ou "12.5" → centimes. null si la saisie n'est pas un prix valide.
export function parseEuros(input: string): number | null {
  const normalized = input.replace(/[\s  €]/g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  return Math.round(Number(normalized) * 100);
}

// "Séjour à Lisbonne, 5 jours" → "sejour-a-lisbonne-5-jours"
export function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function text(form: Record<string, unknown>, name: string) {
  const value = form[name];
  return typeof value === "string" ? value.trim() : "";
}

export type TripInput = {
  slug: string;
  title: string;
  destination: string;
  duration_days: number;
  description: string;
};

export function parseTripForm(form: Record<string, unknown>): Result<TripInput> {
  const title = text(form, "title");
  const destination = text(form, "destination");
  const description = text(form, "description");
  const slug = text(form, "slug") || slugify(title);
  const durationDays = Number(text(form, "duration_days"));

  if (!title) return { ok: false, error: "Le titre est obligatoire." };
  if (!destination) return { ok: false, error: "La destination est obligatoire." };
  if (!Number.isInteger(durationDays) || durationDays < 1 || durationDays > 365) {
    return { ok: false, error: "La durée doit être un nombre de jours entre 1 et 365." };
  }
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return { ok: false, error: "L'adresse de la page ne peut contenir que des minuscules, des chiffres et des tirets." };
  }
  return { ok: true, value: { slug, title, destination, duration_days: durationDays, description } };
}

export type DepartureInput = { departure_date: string; price_per_person_cents: number };

export function parseDepartureForm(form: Record<string, unknown>): Result<DepartureInput> {
  const date = text(form, "departure_date");
  const valid = /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(`${date}T00:00:00Z`));
  if (!valid) return { ok: false, error: "La date de départ n'est pas valide." };

  const price = parseEuros(text(form, "price"));
  if (price === null || price === 0) {
    return { ok: false, error: "Le prix par personne doit être un montant en euros supérieur à 0 (ex. 650 ou 650,50)." };
  }
  return { ok: true, value: { departure_date: date, price_per_person_cents: price } };
}

export type OptionInput = {
  label: string;
  price_cents: number;
  pricing_type: "fixed" | "per_person";
  category: "standard" | "accessibility";
  exclusive_group: string | null;
};

export function parseOptionForm(form: Record<string, unknown>): Result<OptionInput> {
  const label = text(form, "label");
  if (!label) return { ok: false, error: "Le libellé de l'option est obligatoire." };

  const price = parseEuros(text(form, "price"));
  if (price === null) {
    return { ok: false, error: "Le prix doit être un montant en euros (0 pour une prestation incluse)." };
  }

  const pricingType = text(form, "pricing_type");
  if (pricingType !== "fixed" && pricingType !== "per_person") {
    return { ok: false, error: "Choisissez un type de prix : forfait ou par personne." };
  }
  const category = text(form, "category");
  if (category !== "standard" && category !== "accessibility") {
    return { ok: false, error: "Choisissez une catégorie : option ou accessibilité." };
  }

  const group = slugify(text(form, "exclusive_group"));
  return {
    ok: true,
    value: {
      label,
      price_cents: price,
      pricing_type: pricingType,
      category,
      exclusive_group: group || null,
    },
  };
}

// 65050 → "650,50" ; 65000 → "650" (valeur affichée dans les champs de prix).
export function centsToInput(cents: number) {
  return cents % 100 === 0 ? String(cents / 100) : (cents / 100).toFixed(2).replace(".", ",");
}
