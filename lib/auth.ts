import { createClient } from "@/lib/supabase/server";

export type CurrentUser = { id: string; email: string | null };

// Lit la session (cookies) : à n'appeler que derrière un <Suspense>.
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims) return null;
  return { id: claims.sub, email: typeof claims.email === "string" ? claims.email : null };
}
