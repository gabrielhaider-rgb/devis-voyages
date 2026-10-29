// Prénom, nom et téléphone d'un compte (mêmes règles que la base, migration 007).

export type ProfileInput = { first_name: string; last_name: string; phone: string | null };

function text(form: Record<string, unknown>, name: string) {
  const value = form[name];
  return typeof value === "string" ? value.trim() : "";
}

export function parseProfileForm(
  form: Record<string, unknown>,
): { ok: true; value: ProfileInput } | { ok: false; error: string } {
  const firstName = text(form, "first_name");
  const lastName = text(form, "last_name");
  const phone = text(form, "phone");

  if (!firstName || !lastName) return { ok: false, error: "Le prénom et le nom sont obligatoires." };
  if (firstName.length > 80 || lastName.length > 80) {
    return { ok: false, error: "Le prénom et le nom ne peuvent pas dépasser 80 caractères." };
  }
  if (phone && !/^\+?[0-9 .()-]{6,25}$/.test(phone)) {
    return { ok: false, error: "Le numéro de téléphone n'est pas valide (ex. 06 12 34 56 78 ou +33 6 12 34 56 78)." };
  }
  return { ok: true, value: { first_name: firstName, last_name: lastName, phone: phone || null } };
}

// Nom affiché d'un compte : « Prénom Nom », ou l'email tant que le profil n'est pas complété.
export function displayName(profile: { firstName: string | null; lastName: string | null; email: string }) {
  const name = [profile.firstName, profile.lastName].filter(Boolean).join(" ");
  return name || profile.email;
}
