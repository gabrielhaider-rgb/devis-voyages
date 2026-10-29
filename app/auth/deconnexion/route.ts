import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Déconnexion par un vrai envoi de formulaire (POST) puis un rechargement complet
// de l'accueil : la page quittée (ex. un devis privé) n'est jamais réaffichée,
// et le bandeau repart de zéro.
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/", request.url), { status: 303 });
}
