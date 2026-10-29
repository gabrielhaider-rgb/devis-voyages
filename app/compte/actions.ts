"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { safeNext } from "@/lib/safe-next";
import { createClient } from "@/lib/supabase/server";

export type FormState = { error?: string; message?: string };

// Messages d'erreur de Supabase Auth traduits pour le client.
function frenchError(message: string) {
  if (/invalid login credentials/i.test(message)) return "Email ou mot de passe incorrect.";
  if (/already registered|already exists/i.test(message)) return "Un compte existe déjà avec cet email.";
  if (/password should be at least/i.test(message)) return "Le mot de passe doit contenir au moins 6 caractères.";
  if (/email not confirmed/i.test(message)) return "Confirmez d'abord votre email (voir votre boîte mail).";
  if (/rate limit|too many/i.test(message)) return "Trop de tentatives. Réessayez dans quelques minutes.";
  if (/same.*password|different from the old/i.test(message)) return "Choisissez un mot de passe différent de l'ancien.";
  if (/invalid.*email|unable to validate email/i.test(message)) return "Cette adresse email n'est pas valide.";
  return "Une erreur est survenue. Réessayez.";
}

async function siteOrigin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const protocol = h.get("x-forwarded-proto") ?? "http";
  return `${protocol}://${host}`;
}

export async function signIn(_: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });
  if (error) return { error: frenchError(error.message) };

  // Une page demandée (ex. le devis à enregistrer) passe en premier ; sinon,
  // l'admin arrive sur l'administration et le client sur ses devis.
  if (formData.get("next")) redirect(safeNext(formData.get("next")));
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
  redirect(profile?.role === "admin" ? "/admin" : "/mes-devis");
}

export async function signUp(_: FormState, formData: FormData): Promise<FormState> {
  const password = String(formData.get("password") ?? "");
  if (password !== String(formData.get("confirmation") ?? "")) {
    return { error: "Les deux mots de passe ne sont pas identiques." };
  }

  const next = safeNext(formData.get("next"));
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: String(formData.get("email") ?? ""),
    password,
    options: {
      emailRedirectTo: `${await siteOrigin()}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });
  if (error) return { error: frenchError(error.message) };

  // Confirmation par email désactivée : le client est connecté tout de suite.
  if (data.session) redirect(next);
  return { message: "Compte créé. Cliquez sur le lien reçu par email pour l'activer." };
}

export async function sendPasswordReset(_: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(String(formData.get("email") ?? ""), {
    redirectTo: `${await siteOrigin()}/auth/callback?next=/nouveau-mot-de-passe`,
  });
  if (error) return { error: frenchError(error.message) };
  // Même message que le compte existe ou non, pour ne pas révéler qui est inscrit.
  return { message: "Si un compte existe avec cet email, un lien de réinitialisation vient d'être envoyé." };
}

export async function updatePassword(_: FormState, formData: FormData): Promise<FormState> {
  const password = String(formData.get("password") ?? "");
  if (password !== String(formData.get("confirmation") ?? "")) {
    return { error: "Les deux mots de passe ne sont pas identiques." };
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return {
      error: /session|not authenticated|jwt/i.test(error.message)
        ? "Le lien a expiré. Demandez un nouveau lien de réinitialisation."
        : frenchError(error.message),
    };
  }
  redirect("/mes-devis");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
