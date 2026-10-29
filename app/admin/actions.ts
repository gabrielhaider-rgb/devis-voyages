"use server";

import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import type { FormState } from "@/app/compte/actions";
import { requireAdmin } from "@/lib/admin";
import { parseDepartureForm, parseOptionForm, parseTripForm } from "@/lib/admin-validation";
import { CATALOGUE_TAG } from "@/lib/catalogue";
import { createClient } from "@/lib/supabase/server";
import { resolveTripImage } from "@/lib/trip-image";

// Messages des erreurs de la base traduits pour l'admin.
function frenchError(error: { code?: string; message: string }) {
  if (error.code === "23505") {
    if (/departures/.test(error.message)) return "Un départ existe déjà à cette date.";
    return "Cette adresse de page est déjà utilisée par un autre voyage.";
  }
  if (error.code === "42501") return "Action refusée : votre compte n'a pas les droits d'administration.";
  return "L'enregistrement a échoué. Réessayez.";
}

// Après chaque modification : le site public se met à jour tout de suite,
// et la page d'administration se recharge avec les nouvelles données.
function catalogueChanged() {
  updateTag(CATALOGUE_TAG);
  refresh();
}

function fields(formData: FormData) {
  return Object.fromEntries(formData);
}

// --- Voyages -----------------------------------------------------------------

// Valide le formulaire d'un voyage et vérifie que la photo est bien une image
// (une page Unsplash est convertie en adresse d'image directe).
async function readTripForm(formData: FormData) {
  const parsed = parseTripForm(fields(formData));
  if (!parsed.ok || !parsed.value.image_url) return parsed;
  const image = await resolveTripImage(parsed.value.image_url);
  if (!image.ok) return image;
  return { ok: true as const, value: { ...parsed.value, image_url: image.url } };
}

export async function createTrip(_: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = await readTripForm(formData);
  if (!parsed.ok) return { error: parsed.error };

  const supabase = await createClient();
  // Un nouveau voyage reste archivé (invisible) tant qu'il n'a pas de départ.
  const { data, error } = await supabase
    .from("trips")
    .insert({ ...parsed.value, archived_at: new Date().toISOString() })
    .select("id")
    .single();
  if (error) return { error: frenchError(error) };

  updateTag(CATALOGUE_TAG);
  redirect(`/admin/voyages/${data.id}`);
}

export async function updateTrip(_: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = await readTripForm(formData);
  if (!parsed.ok) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase.from("trips").update(parsed.value).eq("id", String(formData.get("id")));
  if (error) return { error: frenchError(error) };

  catalogueChanged();
  return { message: "Voyage enregistré." };
}

export async function setTripArchived(formData: FormData) {
  await requireAdmin();
  const archive = formData.get("archive") === "true";
  const supabase = await createClient();
  const { error } = await supabase
    .from("trips")
    .update({ archived_at: archive ? new Date().toISOString() : null })
    .eq("id", String(formData.get("id")));
  if (error) throw new Error(frenchError(error));
  catalogueChanged();
}

// --- Départs -----------------------------------------------------------------

export async function addDeparture(_: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = parseDepartureForm(fields(formData));
  if (!parsed.ok) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("departures")
    .insert({ ...parsed.value, trip_id: String(formData.get("trip_id")) });
  if (error) return { error: frenchError(error) };

  catalogueChanged();
  return { message: "Départ ajouté." };
}

export async function updateDeparture(_: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = parseDepartureForm(fields(formData));
  if (!parsed.ok) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase.from("departures").update(parsed.value).eq("id", String(formData.get("id")));
  if (error) return { error: frenchError(error) };

  catalogueChanged();
  return { message: "Départ enregistré." };
}

export async function deleteDeparture(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("departures").delete().eq("id", String(formData.get("id")));
  if (error) throw new Error(frenchError(error));
  catalogueChanged();
}

// --- Options -----------------------------------------------------------------

export async function addOption(_: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = parseOptionForm(fields(formData));
  if (!parsed.ok) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("options")
    .insert({ ...parsed.value, trip_id: String(formData.get("trip_id")) });
  if (error) return { error: frenchError(error) };

  catalogueChanged();
  return { message: "Option ajoutée." };
}

export async function updateOption(_: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = parseOptionForm(fields(formData));
  if (!parsed.ok) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase.from("options").update(parsed.value).eq("id", String(formData.get("id")));
  if (error) return { error: frenchError(error) };

  catalogueChanged();
  return { message: "Option enregistrée." };
}

export async function deleteOption(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("options").delete().eq("id", String(formData.get("id")));
  if (error) throw new Error(frenchError(error));
  catalogueChanged();
}

// --- Admins ------------------------------------------------------------------

export async function setUserRole(formData: FormData) {
  await requireAdmin();
  const role = formData.get("role") === "admin" ? "admin" : "client";
  const supabase = await createClient();
  // La fonction en base vérifie le rôle de l'appelant et refuse de modifier son propre compte.
  const { error } = await supabase.rpc("set_user_role", {
    p_user_id: String(formData.get("id")),
    p_role: role,
  });
  if (error) throw new Error(frenchError(error));
  refresh();
}
