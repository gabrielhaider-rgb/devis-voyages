import { createClient } from "@/lib/supabase/server";

export type MyProfile = { email: string; firstName: string | null; lastName: string | null; phone: string | null };

// Profil du compte connecté (la RLS ne laisse lire que le sien).
export async function getMyProfile(userId: string): Promise<MyProfile | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("email, first_name, last_name, phone")
    .eq("id", userId)
    .maybeSingle();
  return data ? { email: data.email, firstName: data.first_name, lastName: data.last_name, phone: data.phone } : null;
}
